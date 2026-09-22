/**
 * `sequelize-typescript` models → the declared schema.
 *
 * Read as text, never imported (ADR-0005). Sequelize is the source this
 * reader exists for least gracefully and most necessarily: a Sequelize
 * repository has no `schema.rb` and no `models.py`, its migrations are
 * *JavaScript* calling `queryInterface.createTable`, and its models are
 * decorated TypeScript classes. Outline — 30 MB of it, with 56 real SQL
 * statements in its own source — was unreadable to this tool for exactly that
 * reason, which is what prompted this file.
 *
 * Four conventions have to be reproduced, and each is reported when it cannot
 * be:
 *
 * - **The table name** is `@Table({ tableName })` when given, and otherwise
 *   the class name pluralised, which is Sequelize's own default.
 * - **The columns of a base class belong to every model that extends it.**
 *   `IdModel` carries `id`, `createdAt` and `updatedAt`; `ParanoidModel` adds
 *   `deletedAt`. A model whose base is not among the files read is reported,
 *   because its primary key would otherwise silently vanish.
 * - **`@ForeignKey(() => User)` on a property makes that property the key**,
 *   pointing at `User`'s table and its primary key.
 * - **Column names are the property names.** Sequelize does not snake_case
 *   unless told to, so `userId` is a column called `userId`.
 */

import type { Column, DeclaredSchema, ForeignKey, Table } from '@ledgerline/model';

/** `DataType.X`, spelled as PostgreSQL reports it (ADR-0002). */
const TYPES: Readonly<Record<string, string>> = {
  STRING: 'character varying',
  TEXT: 'text',
  CITEXT: 'citext',
  INTEGER: 'integer',
  BIGINT: 'bigint',
  SMALLINT: 'smallint',
  FLOAT: 'double precision',
  REAL: 'real',
  DOUBLE: 'double precision',
  DECIMAL: 'numeric',
  NUMBER: 'numeric',
  BOOLEAN: 'boolean',
  DATE: 'timestamp with time zone',
  DATEONLY: 'date',
  TIME: 'time without time zone',
  UUID: 'uuid',
  UUIDV4: 'uuid',
  JSON: 'json',
  JSONB: 'jsonb',
  BLOB: 'bytea',
  ARRAY: 'ARRAY',
  INET: 'inet',
  RANGE: 'tstzrange',
  ENUM: 'text',
};

/** Sequelize's own pluraliser, to the depth a table name needs. */
export function pluralize(name: string): string {
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  if (/[^aeiou]y$/.test(lower)) return `${lower.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(lower)) return `${lower}es`;
  return `${lower}s`;
}

export interface SequelizeSchema {
  readonly schema: DeclaredSchema;
  readonly unread: readonly { readonly reason: string; readonly line: number; readonly text: string }[];
}

interface Model {
  readonly cls: string;
  readonly base: string | null;
  /** The table it declares, or null when it carries no `@Table` and is only a base. */
  readonly table: string | null;
  readonly columns: Column[];
  readonly primaryKey: string[];
  readonly uniques: string[][];
  /** Property → the class it points at, from `@ForeignKey(() => X)`. */
  readonly keys: Map<string, string>;
  readonly file: string;
  readonly line: number;
}

/**
 * The class this one extends, read at angle-bracket depth zero.
 *
 * `class IdModel<T extends object = any> extends Model<T>` contains two
 * `extends`, and the first one is a constraint on a type parameter. Taking
 * the first gave every model in Outline the base class `object`, which
 * silently cost all 54 tables their primary key — the kind of wrong answer
 * that looks like a schema.
 */
export function baseClassOf(header: string): string | null {
  let depth = 0;
  for (let i = 0; i < header.length; i++) {
    const ch = header[i]!;
    if (ch === '<') depth++;
    else if (ch === '>') depth--;
    else if (depth === 0 && header.startsWith('extends', i) && !/\w/.test(header[i - 1] ?? ' ')) {
      const name = /^extends\s+(\w+)/.exec(header.slice(i))?.[1];
      if (name !== undefined) return name;
    }
  }
  return null;
}

function typeOf(decorators: readonly string[], declared: string): string | null {
  const column = decorators.find((d) => /^@Column\b/.test(d)) ?? '';
  const named = /DataType\.(\w+)/.exec(column)?.[1];
  const base = named === undefined ? undefined : TYPES[named];
  if (base === 'character varying') {
    const n = /DataType\.STRING\s*\(\s*(\d+)/.exec(column)?.[1];
    return n === undefined ? 'character varying' : `character varying(${n})`;
  }
  if (base !== undefined) return base;
  // The dateful decorators carry their own type.
  if (decorators.some((d) => /^@(CreatedAt|UpdatedAt|DeletedAt)\b/.test(d))) return 'timestamp with time zone';
  if (named !== undefined) return null;
  // No DataType at all: fall back to what TypeScript says, as Sequelize would.
  const bare = declared.replace(/\s*\|\s*null/, '').trim();
  if (bare === 'string') return 'character varying';
  if (bare === 'number') return 'integer';
  if (bare === 'boolean') return 'boolean';
  if (bare === 'Date') return 'timestamp with time zone';
  return null;
}

/**
 * @param sources one entry per model file. Every file is read before anything
 *   is resolved, because a base class and a foreign key's target both live in
 *   other files.
 */
export function parseSequelizeModels(sources: readonly { readonly path: string; readonly text: string }[]): SequelizeSchema {
  const models: Model[] = [];
  const unread: { reason: string; line: number; text: string }[] = [];

  for (const file of sources) {
    const lines = file.text.split('\n');
    /** Decorators seen since the last statement, each joined across the lines it spans. */
    let pending: string[] = [];
    /** A decorator being accumulated, because `@Column({` opens on one line and closes on another. */
    let building: string | null = null;
    let current: Model | null = null;
    /** True between `class X` and the `{` that opens its body, which the type parameters often push several lines down. */
    let inHeader = false;
    /** Nesting inside the class body: a property is at zero, a method's insides are not. */
    let depth = 0;

    const balanced = (text: string): boolean => {
      let n = 0;
      for (const ch of text) {
        if (ch === '(' || ch === '{' || ch === '[') n++;
        else if (ch === ')' || ch === '}' || ch === ']') n--;
      }
      return n <= 0;
    };

    let n = 0;
    for (const raw of lines) {
      n++;
      const line = raw.trim();
      if (line.length === 0 || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;

      if (building !== null) {
        building = `${building} ${line}`;
        if (balanced(building)) {
          pending.push(building);
          building = null;
        }
        continue;
      }
      if (line.startsWith('@')) {
        if (balanced(line)) pending.push(line);
        else building = line;
        continue;
      }

      const cls = /^(?:export\s+(?:default\s+)?)?(?:abstract\s+)?class\s+(\w+)/.exec(line);
      if (cls) {
        // The header runs from `class` to the `{` that opens the body.
        const from = lines.slice(n - 1).join('\n');
        const brace = from.indexOf('{');
        const header = from.slice(0, brace < 0 ? 400 : brace);
        const base = baseClassOf(header);
        // Only a `@Table` class is a table. Everything else — a base class, a
        // helper, a bag of static methods — is read for what it lends and is
        // not itself a thing in the database.
        const decorated = pending.find((d) => /^@Table\b/.test(d));
        const table = decorated === undefined ? null : (/\btableName\s*:\s*["']([^"']+)["']/.exec(decorated)?.[1] ?? pluralize(cls[1]!));
        current = { cls: cls[1]!, base, table, columns: [], primaryKey: [], uniques: [], keys: new Map(), file: file.path, line: n };
        models.push(current);
        pending = [];
        inHeader = !line.includes('{');
        depth = 0;
        continue;
      }
      if (current === null) {
        pending = [];
        continue;
      }
      if (inHeader) {
        if (line.includes('{')) inHeader = false;
        continue;
      }

      const property = /^(?:public\s+|readonly\s+|declare\s+)*(\w+)[!?]?\s*:\s*([^;=]+)/.exec(line);
      const opens = (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
      // A property is read only at the class's own level; then the line's own
      // braces are counted, so a method body is skipped from its next line on.
      if (depth > 0 || property === null) {
        depth = Math.max(0, depth + opens);
        pending = [];
        continue;
      }
      depth = Math.max(0, depth + opens);
      const [, name, declared] = property as unknown as [string, string, string];
      const decorators = pending;
      pending = [];
      if (decorators.length === 0) continue;

      const foreign = decorators.find((d) => /^@ForeignKey\b/.test(d));
      const hasColumn = decorators.some((d) => /^@(Column|CreatedAt|UpdatedAt|DeletedAt)\b/.test(d));
      // `@BelongsTo`/`@HasMany` without a column is navigation, not a column.
      if (!hasColumn) {
        if (foreign !== undefined) unread.push({ reason: `a @ForeignKey on ${current.cls}.${name} with no @Column beside it`, line: n, text: line.slice(0, 120) });
        continue;
      }

      const type = typeOf(decorators, declared);
      if (type === null) {
        unread.push({ reason: `a column this reader has no type for: ${current.cls}.${name}`, line: n, text: line.slice(0, 120) });
        continue;
      }
      const all = decorators.join(' ');
      const column = /\bfield\s*:\s*["']([^"']+)["']/.exec(all)?.[1] ?? name;
      const primary = decorators.some((d) => /^@PrimaryKey\b/.test(d));
      const allowNull = /@AllowNull\s*\(\s*(true|false)\s*\)/.exec(all)?.[1];
      const inColumn = /\ballowNull\s*:\s*(true|false)\b/.exec(all)?.[1];
      const nullable = primary ? false : allowNull !== undefined ? allowNull === 'true' : inColumn !== undefined ? inColumn === 'true' : /\|\s*null/.test(declared);
      current.columns.push({ name: column, type, nullable });
      if (primary) current.primaryKey.push(column);
      if (decorators.some((d) => /^@Unique\b/.test(d)) || /\bunique\s*:\s*true\b/.test(all)) current.uniques.push([column]);

      if (foreign !== undefined) {
        const target = /\(\s*\(\)\s*=>\s*(\w+)/.exec(foreign)?.[1];
        if (target === undefined) unread.push({ reason: `a @ForeignKey on ${current.cls}.${name} whose target this reader could not read`, line: n, text: line.slice(0, 120) });
        else current.keys.set(column, target);
      }
    }
  }

  const byClass = new Map(models.map((m) => [m.cls, m]));

  /** Every column a model has, its base classes' included. */
  function inherited(m: Model, seen = new Set<string>()): { columns: Column[]; primaryKey: string[]; uniques: string[][] } {
    if (m.base === null || seen.has(m.base)) return { columns: [...m.columns], primaryKey: [...m.primaryKey], uniques: [...m.uniques] };
    seen.add(m.base);
    const base = byClass.get(m.base);
    if (base === undefined) {
      // A base outside the files read would take its primary key with it.
      unread.push({ reason: `${m.cls} extends ${m.base}, which is not among the files read, so its columns are missing`, line: m.line, text: m.file });
      return { columns: [...m.columns], primaryKey: [...m.primaryKey], uniques: [...m.uniques] };
    }
    const up = inherited(base, seen);
    return {
      columns: [...up.columns, ...m.columns.filter((c) => !up.columns.some((x) => x.name === c.name))],
      primaryKey: m.primaryKey.length > 0 ? m.primaryKey : up.primaryKey,
      uniques: [...up.uniques, ...m.uniques],
    };
  }

  const tables: Table[] = [];
  const foreignKeys: ForeignKey[] = [];
  const seen = new Set<string>();
  for (const m of models) {
    if (m.table === null) continue;
    if (seen.has(m.table)) {
      unread.push({ reason: `${m.cls} declares the table ${m.table}, which another model already declared`, line: m.line, text: m.file });
      continue;
    }
    seen.add(m.table);
    const shape = inherited(m);
    tables.push({ schema: 'public', name: m.table, columns: shape.columns, primaryKey: shape.primaryKey, uniques: shape.uniques });
  }
  for (const m of models) {
    if (m.table === null) continue;
    for (const [column, targetClass] of m.keys) {
      const target = byClass.get(targetClass);
      if (target === undefined || target.table === null) {
        unread.push({ reason: `a @ForeignKey to ${targetClass}, which is not a @Table model among the files read`, line: m.line, text: `${m.file}: ${m.cls}.${column}` });
        continue;
      }
      const targetKey = inherited(target).primaryKey[0] ?? 'id';
      foreignKeys.push({
        name: `${m.table}_${column}_fkey`,
        from: [{ schema: 'public', name: m.table, column }],
        to: [{ schema: 'public', name: target.table, column: targetKey }],
      });
    }
  }

  // A base class outside the files read is reported once, not once per model
  // that inherits through it — `Model extends SequelizeModel` is one fact
  // about this repository, not one per table.
  const once = new Map(unread.map((u) => [`${u.reason}|${u.text}`, u]));

  return {
    schema: {
      tables: tables.sort((a, b) => (a.name < b.name ? -1 : 1)),
      foreignKeys: foreignKeys.sort((a, b) => (a.name < b.name ? -1 : 1)),
    },
    unread: [...once.values()],
  };
}
