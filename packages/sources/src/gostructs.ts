/**
 * Go struct tags — xorm and GORM — → the declared schema.
 *
 * The last ecosystem with no reader, and the one where this tool has most to
 * say. Neither xorm nor GORM creates foreign key constraints by default, so a
 * Go application of this shape has its relationships *only* in its queries:
 * the schema declares columns and the joins declare everything else. That is
 * precisely the disagreement Ledgerline exists to report, and it was
 * unreadable until now (found running the Phase 4 gate on Woodpecker CI).
 *
 * Read as text, never compiled (ADR-0005). Three conventions are reproduced,
 * and each is reported rather than assumed when the file says otherwise:
 *
 * - **The table name** is `func (X) TableName() string { return "…" }` when
 *   the file defines one. Otherwise it is the ORM's mapper: xorm's default is
 *   the struct name in snake_case, GORM's is that pluralised. Which one was
 *   used is decided per file by the tags it carries, and a struct with
 *   neither a `TableName` nor a tag is left alone.
 * - **The column name** is the quoted name in an xorm tag — `xorm:"INDEX
 *   'user_id'"` — or `column:` in a GORM tag, or the field name in
 *   snake_case.
 * - **The type** is the tag's when it gives one (`varchar(500)`, `json`,
 *   `text`) and otherwise the Go type's.
 *
 * A field with no tag at all is still a column: both ORMs map exported fields
 * by default. A field tagged `-` is not.
 */

import type { Column, DeclaredSchema, Table } from '@ledgerline/model';

/** Go's types, spelled as PostgreSQL reports them (ADR-0002). */
const GO_TYPES: Readonly<Record<string, string>> = {
  int: 'bigint',
  int8: 'smallint',
  int16: 'smallint',
  int32: 'integer',
  int64: 'bigint',
  uint: 'bigint',
  uint8: 'smallint',
  uint16: 'integer',
  uint32: 'bigint',
  uint64: 'bigint',
  float32: 'real',
  float64: 'double precision',
  bool: 'boolean',
  string: 'text',
  'time.Time': 'timestamp with time zone',
  'sql.NullString': 'text',
  'sql.NullInt64': 'bigint',
  'sql.NullBool': 'boolean',
  'sql.NullTime': 'timestamp with time zone',
  'json.RawMessage': 'jsonb',
  'uuid.UUID': 'uuid',
  'decimal.Decimal': 'numeric',
};

/** Types an ORM tag can name outright. */
const TAG_TYPES: Readonly<Record<string, string>> = {
  text: 'text',
  longtext: 'text',
  json: 'jsonb',
  jsonb: 'jsonb',
  bool: 'boolean',
  boolean: 'boolean',
  int: 'integer',
  integer: 'integer',
  bigint: 'bigint',
  smallint: 'smallint',
  serial: 'integer',
  bigserial: 'bigint',
  timestamp: 'timestamp without time zone',
  timestamptz: 'timestamp with time zone',
  datetime: 'timestamp without time zone',
  date: 'date',
  time: 'time without time zone',
  blob: 'bytea',
  bytea: 'bytea',
  uuid: 'uuid',
  numeric: 'numeric',
  real: 'real',
  double: 'double precision',
};

/** xorm tag words that are directives, not names. */
const XORM_KEYWORDS = new Set([
  'pk', 'autoincr', 'index', 'unique', 'notnull', 'null', 'default', 'created', 'updated', 'deleted', 'version', 'extends', 'comment', 'cascade', 'not', '-', '<-', '->',
]);

export function snakeCase(name: string): string {
  return name
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

/** GORM's default mapper pluralises; xorm's does not. */
export function pluralizeSnake(name: string): string {
  const s = snakeCase(name);
  if (/[^aeiou]y$/.test(s)) return `${s.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(s)) return `${s}es`;
  return `${s}s`;
}

export interface GoStructSchema {
  readonly schema: DeclaredSchema;
  readonly unread: readonly { readonly reason: string; readonly line: number; readonly text: string }[];
}

interface Parsed {
  readonly column: string | null;
  readonly type: string | null;
  readonly primary: boolean;
  readonly unique: boolean;
  readonly skip: boolean;
  readonly notNull: boolean;
}

function parseXormTag(tag: string, field: string): Parsed {
  if (tag.trim() === '-') return { column: null, type: null, primary: false, unique: false, skip: true, notNull: false };
  const quoted = /'([^']+)'/.exec(tag)?.[1] ?? /"([^"]+)"/.exec(tag)?.[1];
  const words = tag.split(/\s+/).filter((w) => w.length > 0);
  let type: string | null = null;
  let column: string | null = quoted ?? null;
  for (const word of words) {
    const bare = word.replace(/\(.*\)$/, '').toLowerCase();
    if (bare === 'varchar' || bare === 'char') {
      const n = /\((\d+)\)/.exec(word)?.[1];
      type = n === undefined ? 'character varying' : `character varying(${n})`;
      continue;
    }
    if (TAG_TYPES[bare] !== undefined && type === null) {
      type = TAG_TYPES[bare]!;
      continue;
    }
    // A bare word that is neither a directive nor a type is the column name.
    if (column === null && !XORM_KEYWORDS.has(bare) && /^[a-z_][a-z0-9_]*$/.test(word) && !/\(/.test(word)) column = word;
  }
  return {
    column: column ?? snakeCase(field),
    type,
    primary: /\bpk\b/i.test(tag),
    unique: /\bUNIQUE\b/.test(tag),
    skip: false,
    notNull: /\bnotnull\b/i.test(tag),
  };
}

function parseGormTag(tag: string, field: string): Parsed {
  if (/(^|;)\s*-\s*($|;)/.test(tag)) return { column: null, type: null, primary: false, unique: false, skip: true, notNull: false };
  const named = /\bcolumn:([\w]+)/i.exec(tag)?.[1];
  const declared = /\btype:([^;]+)/i.exec(tag)?.[1]?.trim().toLowerCase();
  const size = /\bsize:(\d+)/i.exec(tag)?.[1];
  let type: string | null = null;
  if (declared !== undefined) {
    const bare = declared.replace(/\(.*\)$/, '');
    if (bare === 'varchar' || bare === 'char') {
      const n = /\((\d+)\)/.exec(declared)?.[1];
      type = n === undefined ? 'character varying' : `character varying(${n})`;
    } else type = TAG_TYPES[bare] ?? null;
  } else if (size !== undefined) type = `character varying(${size})`;
  return {
    column: named ?? snakeCase(field),
    type,
    primary: /\bprimary_?key\b/i.test(tag),
    unique: /\bunique\b/i.test(tag) && !/\bunique_?index\b/i.test(tag),
    skip: false,
    notNull: /\bnot\s*null\b/i.test(tag),
  };
}

/**
 * @param sources one entry per Go file. Every file is read before anything is
 *   resolved, because `TableName()` often lives in a different file from the
 *   struct it names.
 */
export function parseGoStructs(sources: readonly { readonly path: string; readonly text: string }[]): GoStructSchema {
  const unread: { reason: string; line: number; text: string }[] = [];
  interface Struct {
    readonly name: string;
    readonly columns: Column[];
    readonly uniques: string[][];
    readonly primaryKey: string[];
    /** `xorm`, `gorm`, or null when no field carried either tag. */
    orm: 'xorm' | 'gorm' | null;
    readonly file: string;
    readonly line: number;
  }
  const structs: Struct[] = [];
  const tableNames = new Map<string, string>();

  for (const file of sources) {
    const lines = file.text.split('\n');
    // `func (X) TableName() string { return "x" }`, on one line or two.
    for (let i = 0; i < lines.length; i++) {
      const m = /^func\s*\(\s*(?:\w+\s+)?\*?(\w+)\s*\)\s*TableName\s*\(\s*\)\s*string/.exec(lines[i]!.trim());
      if (m === null) continue;
      const window = lines.slice(i, i + 6).join(' ');
      const name = /return\s+"([^"]+)"/.exec(window)?.[1];
      if (name === undefined) unread.push({ reason: `${m[1]} has a TableName() this reader could not read`, line: i + 1, text: file.path });
      else tableNames.set(m[1]!, name);
    }

    let current: Struct | null = null;
    let depth = 0;
    let n = 0;
    for (const raw of lines) {
      n++;
      const line = raw.trim();
      if (line.length === 0 || line.startsWith('//')) continue;

      const open = /^type\s+(\w+)\s+struct\s*\{/.exec(line);
      if (open) {
        current = { name: open[1]!, columns: [], uniques: [], primaryKey: [], orm: null, file: file.path, line: n };
        structs.push(current);
        depth = 1;
        continue;
      }
      if (current === null) continue;
      depth += (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
      if (depth <= 0) {
        current = null;
        continue;
      }

      // `Name Type `tag``, with the tag optional.
      const field = /^([A-Z]\w*)\s+([\w.[\]*]+)(?:\s+`([^`]*)`)?\s*$/.exec(line);
      if (field === null) continue;
      const [, name, goType, tag] = field as unknown as [string, string, string, string | undefined];

      const xorm = tag === undefined ? undefined : /xorm:"([^"]*)"/.exec(tag)?.[1];
      const gorm = tag === undefined ? undefined : /gorm:"([^"]*)"/.exec(tag)?.[1];
      if (xorm !== undefined) current.orm = 'xorm';
      else if (gorm !== undefined) current.orm ??= 'gorm';

      const parsed = xorm !== undefined ? parseXormTag(xorm, name) : gorm !== undefined ? parseGormTag(gorm, name) : { column: snakeCase(name), type: null, primary: false, unique: false, skip: false, notNull: false };
      if (parsed.skip || parsed.column === null) continue;

      const bare = goType.replace(/^\*/, '').replace(/^\[\]byte$/, 'bytea');
      const type = parsed.type ?? (bare === 'bytea' ? 'bytea' : (GO_TYPES[bare] ?? null));
      if (type === null) {
        // A named type of the project's own — an enum, a wrapper. Its column
        // is real and its database type is not knowable from this file.
        unread.push({ reason: `a field whose type this reader cannot map: ${current.name}.${name} is ${goType}`, line: n, text: line.slice(0, 120) });
        continue;
      }
      current.columns.push({ name: parsed.column, type, nullable: !parsed.primary && !parsed.notNull });
      if (parsed.primary) current.primaryKey.push(parsed.column);
      if (parsed.unique) current.uniques.push([parsed.column]);
    }
  }

  const tables: Table[] = [];
  const seen = new Set<string>();
  for (const s of structs) {
    if (s.columns.length === 0) continue;
    const explicit = tableNames.get(s.name);
    if (explicit === undefined && s.orm === null) continue; // not a model: a request body, a config
    const name = explicit ?? (s.orm === 'gorm' ? pluralizeSnake(s.name) : snakeCase(s.name));
    if (explicit === undefined) {
      unread.push({ reason: `${s.name} has no TableName(), so its table is ${s.orm}'s default mapping: ${name}`, line: s.line, text: s.file });
    }
    if (seen.has(name)) continue;
    seen.add(name);
    tables.push({ schema: 'public', name, columns: s.columns, primaryKey: s.primaryKey, uniques: s.uniques });
  }

  const once = new Map(unread.map((u) => [u.reason, u]));
  return {
    // Neither ORM declares a foreign key, so there are none to read. That is
    // the point: in a repository of this shape every relationship lives in a
    // query, and the check's whole job is to say so.
    schema: { tables: tables.sort((a, b) => (a.name < b.name ? -1 : 1)), foreignKeys: [] },
    unread: [...once.values()],
  };
}
