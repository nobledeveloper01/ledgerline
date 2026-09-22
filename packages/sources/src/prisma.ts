/**
 * `schema.prisma` → the declared schema.
 *
 * Prisma's file is the source of truth for teams that use it, and its
 * `@relation(fields:, references:)` is a foreign key the migrations will
 * carry. Read here without running Prisma's engine — `@mrleebo/prisma-ast`
 * parses the grammar and nothing else — so no binary and no network.
 *
 * Names follow Prisma's own mapping to the database: `@@map` renames a table,
 * `@map` a column, and the model name is the table name otherwise. Types are
 * the database types Prisma would emit for PostgreSQL, because the model
 * compares this schema to what a live database reports.
 */

import { createRequire } from 'node:module';

import type { Column, DeclaredSchema, ForeignKey, Table } from '@ledgerline/model';

const require = createRequire(import.meta.url);

interface Attribute {
  readonly type: 'attribute';
  readonly name: string;
  readonly kind: 'field' | 'object';
  readonly args?: readonly { readonly value: unknown }[];
}

interface Field {
  readonly type: 'field';
  readonly name: string;
  readonly fieldType: string;
  readonly array: boolean;
  readonly optional: boolean;
  readonly attributes?: readonly Attribute[];
}

interface Model {
  readonly type: 'model';
  readonly name: string;
  readonly properties: readonly (Field | Attribute | { readonly type: string })[];
}

interface Enum {
  readonly type: 'enum';
  readonly name: string;
}

interface PrismaSchema {
  readonly list: readonly (Model | Enum | { readonly type: string })[];
}

/** Prisma scalar → PostgreSQL type as `prisma migrate` writes it, absent a native-type attribute. */
const SCALARS: Readonly<Record<string, string>> = {
  String: 'text',
  Boolean: 'boolean',
  Int: 'integer',
  BigInt: 'bigint',
  Float: 'double precision',
  Decimal: 'numeric(65,30)',
  DateTime: 'timestamp(3) without time zone',
  Json: 'jsonb',
  Bytes: 'bytea',
};

function argArray(a: unknown): string[] {
  const v = a as { type?: string; args?: unknown[] } | undefined;
  return v?.type === 'array' && Array.isArray(v.args) ? v.args.map(String) : [];
}

function keyValue(attr: Attribute, k: string): unknown {
  for (const arg of attr.args ?? []) {
    const v = arg.value as { type?: string; key?: string; value?: unknown } | undefined;
    if (v?.type === 'keyValue' && v.key === k) return v.value;
  }
  return undefined;
}

function unquote(v: unknown): string {
  return String(v).replace(/^"(.*)"$/, '$1');
}

function mapName(attrs: readonly Attribute[] | undefined, own: string): string {
  const m = attrs?.find((a) => a.name === 'map');
  const first = m?.args?.[0]?.value;
  return first !== undefined && typeof first === 'string' ? unquote(first) : own;
}

export function parsePrisma(text: string, schema = 'public'): DeclaredSchema {
  const { getSchema } = require('@mrleebo/prisma-ast') as { getSchema: (s: string) => PrismaSchema };
  const ast = getSchema(text);
  const models = ast.list.filter((x): x is Model => x.type === 'model');
  const enums = new Set(ast.list.filter((x): x is Enum => x.type === 'enum').map((e) => e.name));
  const tableNameOf = new Map<string, string>();
  for (const m of models) {
    const map = m.properties.find((p): p is Attribute => p.type === 'attribute' && (p as Attribute).name === 'map' && (p as Attribute).kind === 'object');
    tableNameOf.set(m.name, map ? unquote(map.args?.[0]?.value) : m.name);
  }
  const modelByName = new Map(models.map((m) => [m.name, m]));

  const tables: Table[] = [];
  const foreignKeys: ForeignKey[] = [];
  for (const m of models) {
    const tname = tableNameOf.get(m.name)!;
    const fields = m.properties.filter((p): p is Field => p.type === 'field');
    const columnName = (f: Field): string => mapName(f.attributes, f.name);
    const columns: Column[] = [];
    let primaryKey: string[] = [];
    const uniques: string[][] = [];

    for (const f of fields) {
      const isRelation = modelByName.has(f.fieldType);
      if (isRelation) {
        const rel = f.attributes?.find((a) => a.name === 'relation');
        const from = argArray(rel ? keyValue(rel, 'fields') : undefined);
        const to = argArray(rel ? keyValue(rel, 'references') : undefined);
        if (from.length > 0 && to.length > 0) {
          const target = modelByName.get(f.fieldType)!;
          const targetTable = tableNameOf.get(target.name)!;
          const targetCol = (n: string): string => {
            const tf = target.properties.find((p): p is Field => p.type === 'field' && (p as Field).name === n);
            return tf ? columnName(tf) : n;
          };
          const fromCols = from.map((n) => {
            const ff = fields.find((x) => x.name === n);
            return ff ? columnName(ff) : n;
          });
          foreignKeys.push({
            name: `${tname}_${fromCols.join('_')}_fkey`,
            from: fromCols.map((column) => ({ schema, name: tname, column })),
            to: to.map((n) => ({ schema, name: targetTable, column: targetCol(n) })),
          });
        }
        continue; // A relation field is not a column.
      }
      const base = enums.has(f.fieldType) ? `"${f.fieldType}"` : (SCALARS[f.fieldType] ?? f.fieldType.toLowerCase());
      const name = columnName(f);
      const isId = f.attributes?.some((a) => a.name === 'id') ?? false;
      columns.push({ name, type: f.array ? `${base}[]` : base, nullable: f.optional && !isId });
      if (isId) primaryKey = [name];
      if (f.attributes?.some((a) => a.name === 'unique')) uniques.push([name]);
    }
    for (const p of m.properties) {
      if (p.type !== 'attribute') continue;
      const a = p as Attribute;
      if (a.kind !== 'object') continue;
      const cols = argArray(a.args?.[0]?.value).map((n) => {
        const ff = fields.find((x) => x.name === n);
        return ff ? columnName(ff) : n;
      });
      if (a.name === 'id') primaryKey = cols;
      if (a.name === 'unique') uniques.push(cols);
    }
    tables.push({ schema, name: tname, columns, primaryKey, uniques });
  }
  const key = (t: { schema: string; name: string }): string => `${t.schema}.${t.name}`;
  return {
    tables: tables.sort((a, b) => (key(a) < key(b) ? -1 : 1)),
    foreignKeys: foreignKeys.sort((a, b) => (a.name < b.name ? -1 : 1)),
  };
}
