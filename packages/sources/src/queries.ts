/**
 * Where the queries come from.
 *
 * Four kinds of source, all ending in the same `claimsFromSql`:
 *
 * - **SQL files** — `.sql` under a directory, statement by statement, with the
 *   file and line as evidence. A `reports/` folder, a `queries/` folder.
 * - **A query log** — plain text, one statement per line or `;`-separated; or a
 *   `pg_stat_statements` export as JSON (`[{query, calls}]`) or CSV with a
 *   `query` column. Literals are already masked by `claimsFromSql`; a log is
 *   the one source where a row's values would otherwise leak into evidence.
 * - **Source code** — string literals in `.ts .js .py .rb .go .cs .php .java
 *   .kt .rs` files that begin like SQL. Extracted by lexing the string
 *   syntaxes of those languages, not by regex over the file: a `--` inside a
 *   comment is not a query. Placeholders in each language's style are
 *   rewritten to `$n` before parsing; a literal the grammar refuses is
 *   skipped and counted.
 * - **Captured** — anything the caller already has as text.
 *
 * Nothing here decides what a relationship is; every claim is the parser's
 * and every rule is the model's.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { Claims, DeclaredSchema } from '@ledgerline/model';
import { claimsFromSql, type QueryClaims } from '@ledgerline/parse';

export interface Gathered extends Claims {
  readonly parsed: number;
  readonly unparsed: number;
  /** Files or entries read. */
  readonly sources: number;
}

const NONE: Gathered = { relationships: [], polymorphic: [], parsed: 0, unparsed: 0, sources: 0 };

function merge(a: Gathered, b: QueryClaims): Gathered {
  return {
    relationships: [...a.relationships, ...b.relationships],
    polymorphic: [...a.polymorphic, ...b.polymorphic],
    parsed: a.parsed + b.parsed,
    unparsed: a.unparsed + b.unparsed,
    sources: a.sources + 1,
  };
}

function walk(dir: string, keep: (name: string) => boolean, skip: RegExp = /(^|[\\/])(node_modules|\.git|dist|build|vendor|\.next|target)([\\/]|$)/): string[] {
  const out: string[] = [];
  const visit = (d: string): void => {
    for (const entry of readdirSync(d).sort()) {
      const full = join(d, entry);
      if (skip.test(full)) continue;
      if (statSync(full).isDirectory()) visit(full);
      else if (keep(entry)) out.push(full);
    }
  };
  visit(dir);
  return out;
}

/** `.sql` files under `dir`, each statement with its line. */
export async function claimsFromSqlFiles(dir: string, schema: DeclaredSchema | null = null, root = dir): Promise<Gathered> {
  let out = NONE;
  for (const file of walk(dir, (n) => n.toLowerCase().endsWith('.sql'))) {
    out = merge(out, await claimsFromSql(readFileSync(file, 'utf8'), { source: relative(root, file), line: 1 }, schema));
  }
  return out;
}

/** A query log: JSON `[{query}]`, CSV with a `query` column, or plain SQL text. */
export async function claimsFromLog(path: string, schema: DeclaredSchema | null = null, name = path): Promise<Gathered> {
  const text = readFileSync(path, 'utf8');
  const trimmed = text.trimStart();
  let statements: string[];
  if (trimmed.startsWith('[')) {
    const rows = JSON.parse(text) as { query?: string }[];
    statements = rows.map((r) => r.query ?? '').filter((q) => q.length > 0);
  } else if (/^[^\n]*\bquery\b[^\n]*\n/i.test(trimmed) && trimmed.includes(',')) {
    statements = csvColumn(text, 'query');
  } else {
    statements = text.split(/;\s*\n|\n(?=\s*(?:SELECT|INSERT|UPDATE|DELETE|WITH)\b)/i).map((s) => s.trim()).filter((s) => s.length > 0);
  }
  let out = NONE;
  for (const s of statements) out = merge(out, await claimsFromSql(s, { source: name }, schema));
  return { ...out, sources: 1 };
}

function csvColumn(text: string, column: string): string[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows[0] ?? [];
  const idx = header.findIndex((h) => h.trim().toLowerCase() === column);
  if (idx < 0) return [];
  return rows.slice(1).map((r) => r[idx] ?? '').filter((q) => q.trim().length > 0);
}

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.py', '.rb', '.go', '.cs', '.php', '.java', '.kt', '.rs', '.scala', '.ex', '.exs']);
const LOOKS_LIKE_SQL = /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b/i;

interface Literal {
  readonly text: string;
  readonly line: number;
}

/**
 * The string literals of a source file, with the line each starts on.
 *
 * A small lexer over the string syntaxes the supported languages share:
 * `'…'`, `"…"`, `` `…` `` (with `${…}` left in for the placeholder rewrite),
 * Python's triple-quoted strings, and line comments (`#`, `//`, `--`) and
 * block comments skipped so a query in a comment is not a query.
 * or implicit concatenation is not joined; a query built from three
 * fragments is three fragments, and only whole statements parse.
 */
export function stringLiterals(src: string): Literal[] {
  const out: Literal[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  const at = (k: number): string => src[k] ?? '';
  while (i < n) {
    const ch = at(i);
    if (ch === '\n') {
      line++;
      i++;
      continue;
    }
    // Comments.
    if (ch === '/' && at(i + 1) === '/') {
      while (i < n && at(i) !== '\n') i++;
      continue;
    }
    if (ch === '/' && at(i + 1) === '*') {
      i += 2;
      while (i < n && !(at(i) === '*' && at(i + 1) === '/')) {
        if (at(i) === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }
    if (ch === '#') {
      while (i < n && at(i) !== '\n') i++;
      continue;
    }
    if (ch === '-' && at(i + 1) === '-') {
      while (i < n && at(i) !== '\n') i++;
      continue;
    }
    // Strings.
    if (ch === '"' || ch === "'" || ch === '`') {
      const triple = ch !== '`' && at(i + 1) === ch && at(i + 2) === ch;
      const close = triple ? ch.repeat(3) : ch;
      const start = line;
      let j = i + close.length;
      let text = '';
      while (j < n && src.slice(j, j + close.length) !== close) {
        if (at(j) === '\\' && !triple) {
          text += at(j + 1);
          j += 2;
          continue;
        }
        if (at(j) === '\n') line++;
        text += at(j);
        j++;
      }
      i = j + close.length;
      out.push({ text, line: start });
      continue;
    }
    i++;
  }
  return out;
}

/** Queries found as string literals in source files under `dir`. */
export async function claimsFromSource(dir: string, schema: DeclaredSchema | null = null, root = dir): Promise<Gathered> {
  let out = NONE;
  for (const file of walk(dir, (nm) => SOURCE_EXT.has(nm.slice(nm.lastIndexOf('.')).toLowerCase()))) {
    const src = readFileSync(file, 'utf8');
    let any = false;
    for (const lit of stringLiterals(src)) {
      if (!LOOKS_LIKE_SQL.test(lit.text)) continue;
      any = true;
      const c = await claimsFromSql(lit.text, { source: relative(root, file), line: lit.line }, schema);
      out = { ...merge(out, c), sources: out.sources };
    }
    if (any) out = { ...out, sources: out.sources + 1 };
  }
  return out;
}

/** Everything under a repository: `.sql` files and source literals together. */
export async function claimsFromRepository(dir: string, schema: DeclaredSchema | null = null): Promise<Gathered> {
  const files = await claimsFromSqlFiles(dir, schema, dir);
  const code = await claimsFromSource(dir, schema, dir);
  return {
    relationships: [...files.relationships, ...code.relationships],
    polymorphic: [...files.polymorphic, ...code.polymorphic],
    parsed: files.parsed + code.parsed,
    unparsed: files.unparsed + code.unparsed,
    sources: files.sources + code.sources,
  };
}
