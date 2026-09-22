/**
 * A live PostgreSQL → the declared schema, read-only, one query set.
 *
 * `name[]` arrays come back from `pg` as the literal `{a,b}`; every array is
 * cast to `text[]` so the driver parses it, which the first run against a
 * real database found in the first row.
 *
 * For the teams that can point at a database. `pg` is an optional peer
 * dependency loaded only here, so a project that never uses this pays
 * nothing for it. Everything read comes from `pg_catalog`; nothing is
 * written, and no row data is touched — only what the schema declares.
 *
 * The output is the same `DeclaredSchema` the migrations reader produces, in
 * the same canonical order, so the two can be compared byte for byte (the
 * Phase 1 gate). Types are spelled by `format_type`, which is how PostgreSQL
 * spells them back, matching the DDL reader's table of names.
 */

import type { Column, DeclaredSchema, ForeignKey, Table } from '@ledgerline/model';

interface Client {
  connect(): Promise<void>;
  end(): Promise<void>;
  query<R>(text: string, values?: unknown[]): Promise<{ rows: R[] }>;
}

async function client(url: string): Promise<Client> {
  let mod: { Client: new (o: { connectionString: string }) => Client };
  try {
    mod = (await import('pg')) as unknown as typeof mod;
  } catch {
    throw new Error('pg is not installed; add it to use --database-url');
  }
  return new mod.Client({ connectionString: url });
}

const USER_SCHEMAS = `n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast') AND n.nspname NOT LIKE 'pg_temp%'`;

export async function schemaFromDatabase(url: string): Promise<DeclaredSchema> {
  const c = await client(url);
  await c.connect();
  try {
    const cols = await c.query<{ schema: string; table: string; column: string; type: string; notnull: boolean; ord: number }>(`
      SELECT n.nspname AS schema, t.relname AS table, a.attname AS column,
             pg_catalog.format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS notnull, a.attnum AS ord
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class t ON t.oid = a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relkind IN ('r', 'p') AND a.attnum > 0 AND NOT a.attisdropped AND ${USER_SCHEMAS}
      ORDER BY n.nspname, t.relname, a.attnum`);
    const keys = await c.query<{ schema: string; table: string; name: string; contype: string; columns: string[]; fschema: string | null; ftable: string | null; fcolumns: string[] | null }>(`
      SELECT n.nspname AS schema, t.relname AS table, con.conname AS name, con.contype,
             ARRAY(SELECT a.attname FROM unnest(con.conkey) WITH ORDINALITY k(attnum, ord) JOIN pg_catalog.pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum ORDER BY k.ord)::text[] AS columns,
             fn.nspname AS fschema, ft.relname AS ftable,
             CASE WHEN con.contype = 'f' THEN ARRAY(SELECT a.attname FROM unnest(con.confkey) WITH ORDINALITY k(attnum, ord) JOIN pg_catalog.pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum ORDER BY k.ord)::text[] END AS fcolumns
      FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class t ON t.oid = con.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
      LEFT JOIN pg_catalog.pg_class ft ON ft.oid = con.confrelid
      LEFT JOIN pg_catalog.pg_namespace fn ON fn.oid = ft.relnamespace
      WHERE con.contype IN ('p', 'u', 'f') AND ${USER_SCHEMAS}
      ORDER BY n.nspname, t.relname, con.conname`);
    const uniqueIdx = await c.query<{ schema: string; table: string; columns: (string | null)[] }>(`
      SELECT n.nspname AS schema, t.relname AS table,
             ARRAY(SELECT CASE WHEN k.attnum = 0 THEN NULL ELSE a.attname END FROM unnest(i.indkey) WITH ORDINALITY k(attnum, ord) LEFT JOIN pg_catalog.pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum ORDER BY k.ord)::text[] AS columns
      FROM pg_catalog.pg_index i
      JOIN pg_catalog.pg_class t ON t.oid = i.indrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
      WHERE i.indisunique AND NOT i.indisprimary AND i.indpred IS NULL AND ${USER_SCHEMAS}
      ORDER BY n.nspname, t.relname`);

    const tables = new Map<string, { schema: string; name: string; columns: Column[]; primaryKey: string[]; uniques: string[][] }>();
    const key = (s: string, t: string): string => `${s}.${t}`;
    for (const r of cols.rows) {
      const t = tables.get(key(r.schema, r.table)) ?? { schema: r.schema, name: r.table, columns: [], primaryKey: [], uniques: [] };
      t.columns.push({ name: r.column, type: r.type, nullable: !r.notnull });
      tables.set(key(r.schema, r.table), t);
    }
    const foreignKeys: ForeignKey[] = [];
    for (const k of keys.rows) {
      const t = tables.get(key(k.schema, k.table));
      if (!t) continue;
      if (k.contype === 'p') t.primaryKey = k.columns;
      else if (k.contype === 'u') t.uniques.push(k.columns);
      else if (k.contype === 'f' && k.ftable && k.fschema && k.fcolumns) {
        foreignKeys.push({
          name: k.name,
          from: k.columns.map((column) => ({ schema: k.schema, name: k.table, column })),
          to: k.fcolumns.map((column) => ({ schema: k.fschema!, name: k.ftable!, column })),
        });
      }
    }
    for (const u of uniqueIdx.rows) {
      const t = tables.get(key(u.schema, u.table));
      if (!t || u.columns.some((c) => c === null)) continue; // an expression index is not a uniqueness the model can use
      const cols2 = u.columns as string[];
      if (!t.uniques.some((x) => x.join(',') === cols2.join(','))) t.uniques.push(cols2);
    }
    const out: Table[] = [...tables.values()].sort((a, b) => (key(a.schema, a.name) < key(b.schema, b.name) ? -1 : 1));
    return { tables: out, foreignKeys: foreignKeys.sort((a, b) => (a.name < b.name ? -1 : 1)) };
  } finally {
    await c.end();
  }
}
