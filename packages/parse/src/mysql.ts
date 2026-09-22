/**
 * MySQL DDL → PostgreSQL DDL, so one parser reads both (ADR-0004).
 *
 * A bounded rewrite, not a grammar: identifiers, the decorations MySQL puts
 * on a table, the index clauses it allows inside `CREATE TABLE`, and the
 * type names that differ. Anything it does not recognise is reported and the
 * statement is skipped — a half-read `CREATE TABLE` is worse than a missing
 * one, because the diagram would look complete.
 */

const TYPES: readonly (readonly [RegExp, string])[] = [
  [/\btinyint\s*\(\s*1\s*\)/gi, 'boolean'],
  [/\b(tiny|small)int\b(\s*\(\s*\d+\s*\))?/gi, 'smallint'],
  [/\bmediumint\b(\s*\(\s*\d+\s*\))?/gi, 'integer'],
  [/\bbigint\b(\s*\(\s*\d+\s*\))?/gi, 'bigint'],
  [/\bint(eger)?\b(\s*\(\s*\d+\s*\))?/gi, 'integer'],
  [/\b(tiny|medium|long)?text\b/gi, 'text'],
  [/\b(tiny|medium|long)?blob\b/gi, 'bytea'],
  [/\bdatetime\b(\s*\(\s*\d+\s*\))?/gi, 'timestamp without time zone'],
  [/\btimestamp\b(\s*\(\s*\d+\s*\))?/gi, 'timestamp with time zone'],
  [/\bdouble\b(\s+precision)?/gi, 'double precision'],
  [/\bfloat\b(\s*\(\s*[\d,\s]+\s*\))?/gi, 'real'],
  [/\bjson\b/gi, 'jsonb'],
  [/\bunsigned\b/gi, ''],
  [/\bzerofill\b/gi, ''],
];

/** Decorations that carry no structure and are removed wholesale. */
const NOISE: readonly RegExp[] = [
  /\bauto_increment\s*(=\s*\d+)?/gi,
  /\bengine\s*=\s*\w+/gi,
  /\bdefault\s+charset\s*=\s*[\w]+/gi,
  /\bcharacter\s+set\s+\w+/gi,
  /\bcollate\s*=?\s*[\w]+/gi,
  /\brow_format\s*=\s*\w+/gi,
  /\bcomment\s+'(?:[^']|'')*'/gi,
  /\bon\s+update\s+current_timestamp(\s*\(\s*\d*\s*\))?/gi,
  /\block\s*=\s*\w+/gi,
  /\balgorithm\s*=\s*\w+/gi,
];

/** What the rewrite has no rule for; a statement containing one is skipped, not guessed at. */
const UNSUPPORTED: readonly (readonly [RegExp, string])[] = [
  [/\bpartition\s+by\b/i, 'a partition clause'],
  [/\bgenerated\s+always\s+as\b/i, 'a generated column'],
  [/\bfulltext\b/i, 'a fulltext index'],
  [/\bspatial\b/i, 'a spatial index'],
  [/\bcreate\s+(or\s+replace\s+)?(definer\s*=\s*\S+\s+)?(procedure|function|trigger|event)\b/i, 'a routine'],
];

export interface Rewritten {
  readonly sql: string;
  /** Statements skipped, with why, so the CLI can print a count rather than show a small diagram. */
  readonly skipped: readonly { readonly reason: string; readonly statement: string }[];
}

function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]!;
    current += ch;
    if (quote) {
      if (ch === quote && sql[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      out.push(current);
      current = '';
    }
  }
  if (current.trim().length > 0) out.push(current);
  return out;
}

/**
 * Index clauses MySQL allows inside `CREATE TABLE`, lifted out.
 *
 * `UNIQUE KEY u (a, b)` is a unique constraint and stays inline; a plain
 * `KEY idx (a)` is an index, which PostgreSQL writes as its own statement,
 * and the schema model only cares that it is not unique — so it is dropped,
 * exactly as a non-unique `CREATE INDEX` is dropped on the PostgreSQL side.
 */
function rewriteTableBody(body: string): string {
  return body
    .split(/,(?![^(]*\))/)
    .map((part) => {
      const p = part.trim();
      if (/^(unique\s+)?(key|index)\s/i.test(p)) {
        const unique = /^unique\s/i.test(p);
        const cols = /\(([^)]*)\)\s*$/.exec(p)?.[1];
        return unique && cols ? `UNIQUE (${cols})` : null;
      }
      if (/^(constraint\s+\S+\s+)?unique\s*\(/i.test(p)) return p;
      return p;
    })
    .filter((p): p is string => p !== null && p.length > 0)
    .join(',\n  ');
}

/**
 * `ALTER TABLE` clauses MySQL spells its own way.
 *
 * `MODIFY COLUMN c bigint NOT NULL` restates the whole column, which
 * PostgreSQL splits into a type change and a nullability change; `CHANGE
 * COLUMN old new type` is that plus a rename. `ADD KEY` is an index and is
 * dropped for the same reason a non-unique index is dropped everywhere else.
 * Returned as a list because one MySQL statement can be two PostgreSQL ones.
 */
function rewriteAlter(statement: string): string[] | null {
  const m = /^\s*alter\s+table\s+((?:"[^"]*"|[\w.]+))\s+([\s\S]*?);?\s*$/i.exec(statement);
  if (!m) return null;
  const [, table, rest] = m as unknown as [string, string, string];
  const change = /^(modify|change)\s+(?:column\s+)?("[^"]*"|\w+)\s+(?:("[^"]*"|\w+)\s+)?([\s\S]+)$/i.exec(rest.trim());
  if (change) {
    const [, verb, first, second, tail] = change as unknown as [string, string, string, string | undefined, string];
    const isChange = verb.toLowerCase() === 'change';
    const column = first;
    const renamed = isChange ? (second ?? first) : null;
    // CHANGE names the new column before the type; MODIFY does not, so a
    // second word there is the head of the type and belongs to the tail.
    const type = isChange ? tail : `${second === undefined ? '' : `${second} `}${tail}`;
    const notNull = /\bnot\s+null\b/i.test(type);
    const bare = type.replace(/\bnot\s+null\b/gi, '').replace(/\bnull\b/gi, '').replace(/\bdefault\s+\S+/gi, '').trim();
    const out: string[] = [];
    if (bare.length > 0) out.push(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${bare};`);
    out.push(`ALTER TABLE ${table} ALTER COLUMN ${column} ${notNull ? 'SET' : 'DROP'} NOT NULL;`);
    if (renamed !== null && renamed !== column) out.push(`ALTER TABLE ${table} RENAME COLUMN ${column} TO ${renamed};`);
    return out;
  }
  const addUnique = /^add\s+(?:constraint\s+(?:"[^"]*"|\w+)\s+)?unique\s+(?:key|index)\s+(?:"[^"]*"|\w+)?\s*\(([^)]*)\)/i.exec(rest.trim());
  if (addUnique) return [`ALTER TABLE ${table} ADD UNIQUE (${addUnique[1]});`];
  if (/^add\s+(key|index)\b/i.test(rest.trim())) return [];
  if (/^drop\s+(key|index)\b/i.test(rest.trim())) return [];
  return null;
}

export function mysqlToPostgres(sql: string): Rewritten {
  const skipped: { reason: string; statement: string }[] = [];
  const out: string[] = [];
  for (const raw of splitStatements(sql)) {
    const statement = raw.trim();
    if (statement.length === 0) continue;
    const unsupported = UNSUPPORTED.find(([re]) => re.test(statement));
    if (unsupported) {
      skipped.push({ reason: unsupported[1], statement: statement.slice(0, 120) });
      continue;
    }
    let s = statement;
    // Identifiers: `x` → "x". Done before anything else so a keyword inside backticks survives.
    s = s.replace(/`([^`]*)`/g, (_, name: string) => `"${name.replace(/"/g, '""')}"`);
    for (const re of NOISE) s = s.replace(re, '');
    // The table body, where MySQL puts its index clauses.
    s = s.replace(/^(\s*create\s+table\s+(?:if\s+not\s+exists\s+)?[^(]+\()([\s\S]*)(\)[^)]*)$/i, (_, head: string, body: string, tail: string) => `${head}\n  ${rewriteTableBody(body)}\n${tail.replace(/\)[^)]*$/, ')')}`);
    // One pass with sentinels: replacing in sequence let `datetime` become
    // `timestamp without time zone` and the next rule find `timestamp` inside it.
    const swapped: string[] = [];
    for (const [re, to] of TYPES) {
      s = s.replace(re, () => {
        if (to === '') return '';
        swapped.push(to);
        return `\u0000${swapped.length - 1}\u0000`;
      });
    }
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i: string) => swapped[Number(i)] ?? '');
    s = s.replace(/[ \t]+/g, ' ').replace(/ ,/g, ',').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
    const altered = /^\s*alter\s+table\b/i.test(s) ? rewriteAlter(s) : null;
    if (altered !== null) {
      out.push(...altered);
      continue;
    }
    out.push(s.trim().endsWith(';') ? s.trim() : `${s.trim()};`);
  }
  return { sql: out.join('\n'), skipped };
}
