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
import { claimsFromSql, type QueryClaims, type QueryDialect } from '@ledgerline/parse';

export interface Gathered extends Claims {
  readonly parsed: number;
  readonly unparsed: number;
  /** Files or entries read. */
  readonly sources: number;
  /** Every `schema.table.column` (and `schema.table.*`) the window named; see `QueryClaims.mentions`. */
  readonly mentions: readonly string[];
}

const NONE: Gathered = { relationships: [], polymorphic: [], parsed: 0, unparsed: 0, sources: 0, mentions: [] };

function merge(a: Gathered, b: QueryClaims): Gathered {
  return {
    relationships: [...a.relationships, ...b.relationships],
    polymorphic: [...a.polymorphic, ...b.polymorphic],
    parsed: a.parsed + b.parsed,
    unparsed: a.unparsed + b.unparsed,
    sources: a.sources + 1,
    mentions: [...new Set([...a.mentions, ...b.mentions])],
  };
}

/**
 * Walking a repository, without trusting it to hold still.
 *
 * A dangling symlink, a file a build deleted between the listing and the
 * stat, a directory the user cannot read: every one of these is ordinary in a
 * real checkout, and none of them is a reason to abandon the run. An
 * unreadable entry is skipped, because the alternative — the whole command
 * exiting 70 on one broken link — is how a tool becomes something people stop
 * putting in their pipeline.
 */
function walk(dir: string, keep: (name: string) => boolean, skip: RegExp = /(^|[\\/])(node_modules|\.git|dist|build|vendor|\.next|target)([\\/]|$)/): string[] {
  const out: string[] = [];
  const visit = (d: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(d).sort();
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(d, entry);
      if (skip.test(full)) continue;
      let directory: boolean;
      try {
        directory = statSync(full).isDirectory();
      } catch {
        continue;
      }
      if (directory) visit(full);
      else if (keep(entry)) out.push(full);
    }
  };
  visit(dir);
  return out;
}

/**
 * Paths never descended into, on top of the built-in list: whatever the
 * configuration named, and — always — the migration directories, because a
 * migration is not a query the application runs.
 *
 * Reading Outline's `server/migrations` as a query source produced failing
 * findings about `collection_users`, a table that was real when that
 * migration was written and has since been renamed. The finding was true
 * about 2023 and useless about today. A migration's DDL is the schema; its
 * DML is history.
 */
export function skipPattern(ignore: readonly string[]): RegExp {
  const escaped = ignore
    .filter((p) => p.length > 0)
    .map((p) => p.replace(/^\.\//, '').replace(/\/+$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const extra = escaped.length === 0 ? '' : `|(^|[\\\\/])(${escaped.join('|')})([\\\\/]|$)`;
  return new RegExp(`(^|[\\\\/])(node_modules|\\.git|dist|build|vendor|\\.next|target)([\\\\/]|$)${extra}`);
}

/** A file that vanished or cannot be read is skipped, for the reason `walk` gives. */
function readOrSkip(file: string): string | null {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

/** `.sql` files under `dir`, each statement with its line. */
export async function claimsFromSqlFiles(dir: string, schema: DeclaredSchema | null = null, root = dir, dialect: QueryDialect = 'postgres', ignore: readonly string[] = []): Promise<Gathered> {
  let out = NONE;
  for (const file of walk(dir, (n) => n.toLowerCase().endsWith('.sql'), skipPattern(ignore))) {
    const text = readOrSkip(file);
    if (text === null) continue;
    out = merge(out, await claimsFromSql(text, { source: relative(root, file), line: 1 }, schema, dialect));
  }
  return out;
}

/** A query log: JSON `[{query}]`, CSV with a `query` column, or plain SQL text. */
export async function claimsFromLog(path: string, schema: DeclaredSchema | null = null, name = path, dialect: QueryDialect = 'postgres'): Promise<Gathered> {
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
  for (const s of statements) out = merge(out, await claimsFromSql(s, { source: name }, schema, dialect));
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
/**
 * Whether a string literal is worth handing to the parser.
 *
 * It used to be the first word, and the first word is also an English word.
 * On Mastodon that made 1947 "statements the parser refused", of which the
 * overwhelming majority were interface strings: `"delete"`, `"Delete &
 * re-draft"`, `"Select your favourite fruit or not. Up to you."`. The count
 * was honest and useless, and a user reading *1947 not parsed* concludes the
 * tool is broken.
 *
 * So the shape, not the verb: a SELECT with a FROM, an INSERT INTO, an UPDATE
 * with a SET, a DELETE FROM, a WITH that opens a subquery. A `SELECT 1`
 * health check no longer qualifies, which costs nothing — it names no table.
 */
const LOOKS_LIKE_SQL = /^\s*(?:SELECT\b[\s\S]*\bFROM\b|INSERT\s+INTO\b|UPDATE\b[\s\S]*\bSET\b|DELETE\b[\s\S]*\bFROM\b|WITH\b[\s\S]*\bAS\s*\()/i;

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
export async function claimsFromSource(dir: string, schema: DeclaredSchema | null = null, root = dir, dialect: QueryDialect = 'postgres', ignore: readonly string[] = []): Promise<Gathered> {
  let out = NONE;
  for (const file of walk(dir, (nm) => SOURCE_EXT.has(nm.slice(nm.lastIndexOf('.')).toLowerCase()), skipPattern(ignore))) {
    const src = readOrSkip(file);
    if (src === null) continue;
    let any = false;
    for (const lit of stringLiterals(src)) {
      if (!LOOKS_LIKE_SQL.test(lit.text)) continue;
      any = true;
      const c = await claimsFromSql(lit.text, { source: relative(root, file), line: lit.line }, schema, dialect);
      out = { ...merge(out, c), sources: out.sources };
    }
    if (any) out = { ...out, sources: out.sources + 1 };
  }
  return out;
}

/** Everything under a repository: `.sql` files and source literals together. */
export async function claimsFromRepository(dir: string, schema: DeclaredSchema | null = null, dialect: QueryDialect = 'postgres', ignore: readonly string[] = []): Promise<Gathered> {
  const files = await claimsFromSqlFiles(dir, schema, dir, dialect, ignore);
  const code = await claimsFromSource(dir, schema, dir, dialect, ignore);
  return {
    relationships: [...files.relationships, ...code.relationships],
    polymorphic: [...files.polymorphic, ...code.polymorphic],
    parsed: files.parsed + code.parsed,
    unparsed: files.unparsed + code.unparsed,
    sources: files.sources + code.sources,
    mentions: [...new Set([...files.mentions, ...code.mentions])],
  };
}
