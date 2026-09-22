/**
 * SQLAlchemy models → the declared schema.
 *
 * Read as text, never imported (ADR-0005). SQLAlchemy is the friendliest of
 * the ORM sources to read this way, because it hides nothing: the table name
 * is written down in `__tablename__`, the column names are written down, and
 * a foreign key names its target as a string — `ForeignKey('customers.id')` —
 * so no convention has to be reproduced and no inflector is involved.
 *
 * Both spellings are read: the classic `Column(...)` and the 2.0
 * `mapped_column(...)`, including `Mapped[int]` annotations, which carry the
 * nullability that `Optional[...]` implies. `relationship()` is deliberately
 * *not* read: it is the Python-side navigation, not a column, and the column
 * it travels over is already read from its `ForeignKey`.
 */

import type { Column, DeclaredSchema, ForeignKey, Table } from '@ledgerline/model';

/** SQLAlchemy's types, spelled as PostgreSQL reports them (ADR-0002). */
const TYPES: Readonly<Record<string, string>> = {
  BigInteger: 'bigint',
  Boolean: 'boolean',
  Date: 'date',
  DateTime: 'timestamp without time zone',
  Enum: 'text',
  Float: 'double precision',
  Integer: 'integer',
  Interval: 'interval',
  JSON: 'json',
  JSONB: 'jsonb',
  LargeBinary: 'bytea',
  Numeric: 'numeric',
  SmallInteger: 'smallint',
  String: 'character varying',
  Text: 'text',
  Time: 'time without time zone',
  Unicode: 'character varying',
  UnicodeText: 'text',
  UUID: 'uuid',
  ARRAY: 'ARRAY',
  INET: 'inet',
  TIMESTAMP: 'timestamp without time zone',
};

/** `Mapped[int]` and friends: the Python type, when no SQLAlchemy type is given. */
const ANNOTATIONS: Readonly<Record<string, string>> = {
  int: 'integer',
  str: 'character varying',
  bool: 'boolean',
  float: 'double precision',
  bytes: 'bytea',
  datetime: 'timestamp without time zone',
  date: 'date',
  Decimal: 'numeric',
  dict: 'jsonb',
  UUID: 'uuid',
};

export interface SqlAlchemySchema {
  readonly schema: DeclaredSchema;
  readonly unread: readonly { readonly reason: string; readonly line: number; readonly text: string }[];
}

function typeFrom(args: string, annotation: string | null): string | null {
  const named = /^\s*(?:[\w.]*\.)?(\w+)\s*(\(([^()]*)\))?/.exec(args);
  const base = named === null ? undefined : TYPES[named[1]!];
  if (base !== undefined) {
    const inner = named?.[3] ?? '';
    if (base === 'character varying') {
      const n = /^\s*(\d+)/.exec(inner)?.[1] ?? /\blength\s*=\s*(\d+)/.exec(inner)?.[1];
      return n === undefined ? 'character varying' : `character varying(${n})`;
    }
    if (base === 'numeric') {
      const nums = [...inner.matchAll(/(\d+)/g)].map((m) => m[1]!);
      return nums.length >= 2 ? `numeric(${nums[0]},${nums[1]})` : 'numeric';
    }
    return base;
  }
  if (annotation !== null) {
    const bare = /(\w+)\]*\s*$/.exec(annotation.replace(/Optional\[|\|\s*None/g, ''))?.[1];
    if (bare !== undefined && ANNOTATIONS[bare] !== undefined) return ANNOTATIONS[bare];
  }
  return null;
}

/** Unlike Django's, this reader needs no path: SQLAlchemy writes the table name down. */
export function parseSqlAlchemyModels(source: string): SqlAlchemySchema {
  const lines = source.split('\n');
  const tables: Table[] = [];
  const foreignKeys: ForeignKey[] = [];
  const unread: { reason: string; line: number; text: string }[] = [];

  let current: { model: string; table: string | null; columns: Column[]; primaryKey: string[]; uniques: string[][] } | null = null;
  const finish = (): void => {
    if (current === null) return;
    if (current.table !== null) tables.push({ schema: 'public', name: current.table, columns: current.columns, primaryKey: current.primaryKey, uniques: current.uniques });
    current = null;
  };

  let n = 0;
  for (const raw of lines) {
    n++;
    const line = raw.trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    const cls = /^class\s+(\w+)\s*\(([^)]*)\)\s*:/.exec(line);
    if (cls) {
      finish();
      current = { model: cls[1]!, table: null, columns: [], primaryKey: [], uniques: [] };
      continue;
    }
    if (current === null) continue;

    const tableName = /^__tablename__\s*=\s*["']([^"']+)["']/.exec(line);
    if (tableName) {
      current = { ...current, table: tableName[1]! };
      continue;
    }
    // `__table_args__ = (UniqueConstraint('a', 'b'), …)` — one per line is what formatters produce.
    const unique = /UniqueConstraint\s*\(([^)]*)\)/.exec(line);
    if (unique) {
      const cols = [...unique[1]!.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!).filter((c) => !c.startsWith('uq_') && !c.startsWith('ix_'));
      if (cols.length > 0) current.uniques.push(cols);
      continue;
    }

    const field = /^(\w+)\s*(?::\s*([^=]+?))?\s*=\s*(?:[\w.]*\.)?(Column|mapped_column)\s*\(([\s\S]*?)\)?\s*$/.exec(line);
    if (field === null) {
      if (/\b(Column|mapped_column)\s*\(/.test(line)) unread.push({ reason: 'a column this reader could not read on one line', line: n, text: line.slice(0, 120) });
      continue;
    }
    const [, name, annotation, , args] = field as unknown as [string, string, string | undefined, string, string];

    // `Column('other_name', Integer, …)` renames the column.
    const renamed = /^\s*["']([^"']+)["']\s*,/.exec(args)?.[1];
    const column = renamed ?? name;
    const rest = renamed === undefined ? args : args.slice(args.indexOf(',') + 1);

    const type = typeFrom(rest, annotation ?? null);
    if (type === null) {
      unread.push({ reason: `a column this reader has no type for: ${name}`, line: n, text: line.slice(0, 120) });
      continue;
    }
    const primary = /\bprimary_key\s*=\s*True\b/.test(rest);
    // SQLAlchemy's default is nullable, except on a primary key; `Mapped[int]`
    // without Optional is NOT NULL, `Mapped[Optional[int]]` is not.
    const explicit = /\bnullable\s*=\s*(True|False)\b/.exec(rest)?.[1];
    const optional = annotation === undefined ? null : /Optional\[|\|\s*None/.test(annotation);
    const nullable = primary ? false : explicit !== undefined ? explicit === 'True' : optional !== null ? optional : true;
    current.columns.push({ name: column, type, nullable });
    if (primary) current.primaryKey.push(column);
    if (!primary && /\bunique\s*=\s*True\b/.test(rest)) current.uniques.push([column]);

    // `ForeignKey('customers.id')` — the one place a target is written down.
    const fk = /ForeignKey\s*\(\s*["']([^"']+)["']/.exec(rest);
    if (fk) {
      const [target, targetColumn] = fk[1]!.split('.');
      if (target === undefined || targetColumn === undefined) {
        unread.push({ reason: `a ForeignKey whose target is not table.column: ${fk[1]}`, line: n, text: line.slice(0, 120) });
        continue;
      }
      foreignKeys.push({
        name: /\bname\s*=\s*["']([^"']+)["']/.exec(rest)?.[1] ?? `${current.table ?? current.model}_${column}_fkey`,
        from: [{ schema: 'public', name: current.table ?? current.model, column }],
        to: [{ schema: 'public', name: target, column: targetColumn }],
      });
    }
  }
  finish();

  // A class with no `__tablename__` is a mixin or an abstract base; its
  // columns went nowhere, so any key that left with them is reported.
  const known = new Set(tables.map((t) => t.name));
  const kept: ForeignKey[] = [];
  for (const fk of foreignKeys) {
    if (!known.has(fk.from[0]!.name)) {
      unread.push({ reason: `a ForeignKey on ${fk.from[0]!.name}, which declares no __tablename__`, line: 0, text: fk.name });
      continue;
    }
    kept.push(fk);
  }

  return {
    schema: {
      tables: tables.sort((a, b) => (a.name < b.name ? -1 : 1)),
      foreignKeys: kept.sort((a, b) => (a.name < b.name ? -1 : 1)),
    },
    unread,
  };
}
