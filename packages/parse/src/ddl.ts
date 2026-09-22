/**
 * DDL → the declared schema.
 *
 * A `SchemaBuilder` applies statements in order, so a directory of migrations
 * folds into one schema the same way the database would fold it: `CREATE
 * TABLE`, `ALTER TABLE … ADD/DROP COLUMN`, `ADD/DROP CONSTRAINT`, `SET/DROP NOT
 * NULL`, `ALTER COLUMN … TYPE`, `RENAME`, `CREATE UNIQUE INDEX`, `DROP TABLE`.
 * Anything else — functions, triggers, grants, data — is skipped, because it
 * does not change what the schema *declares*.
 *
 * Unqualified names resolve to `public`; the `search_path` a migration might
 * set is not honoured, deliberately — a schema that depends on session state
 * is a schema two people read differently.
 */

import type { Column, DeclaredSchema, ForeignKey, Table } from '@ledgerline/model';

import { parseSql, type Node, type RawStmt } from './pg.ts';

const DEFAULT_SCHEMA = 'public';

/** Internal type names as PostgreSQL spells them back to a person. */
const TYPE_NAMES: Readonly<Record<string, string>> = {
  int2: 'smallint',
  int4: 'integer',
  int8: 'bigint',
  bool: 'boolean',
  float4: 'real',
  float8: 'double precision',
  varchar: 'character varying',
  bpchar: 'character',
  timestamptz: 'timestamp with time zone',
  timetz: 'time with time zone',
  // `serial` is not a type; PostgreSQL stores `integer` with a sequence default, and
  // reports `integer` back. Spelling it as the database does is what lets a schema
  // read from migrations and one read from a live database compare byte for byte.
  serial: 'integer',
  serial4: 'integer',
  smallserial: 'smallint',
  serial2: 'smallint',
  bigserial: 'bigint',
  serial8: 'bigint',
};

function str(node: unknown): string {
  const n = node as { String?: { sval?: string } } | undefined;
  return n?.String?.sval ?? '';
}

function strings(nodes: unknown): string[] {
  return Array.isArray(nodes) ? nodes.map(str) : [];
}

interface RangeVar {
  schemaname?: string;
  relname: string;
}

function ref(rel: RangeVar | undefined): { schema: string; name: string } {
  return { schema: rel?.schemaname ?? DEFAULT_SCHEMA, name: rel?.relname ?? '' };
}

interface TypeName {
  names?: unknown[];
  typmods?: unknown[];
  arrayBounds?: unknown[];
}

function typeText(t: TypeName | undefined): string {
  if (!t) return 'unknown';
  const parts = strings(t.names).filter((p) => p !== 'pg_catalog');
  const base = parts.join('.').toLowerCase();
  const spelled = TYPE_NAMES[base] ?? base;
  const mods = (t.typmods ?? [])
    .map((m) => {
      const c = m as { A_Const?: { ival?: { ival?: number }; sval?: { sval?: string } } };
      return c.A_Const?.ival?.ival ?? c.A_Const?.sval?.sval ?? null;
    })
    .filter((v): v is number | string => v !== null);
  const withMods = mods.length > 0 ? `${spelled}(${mods.join(',')})` : spelled;
  return (t.arrayBounds?.length ?? 0) > 0 ? `${withMods}[]` : withMods;
}

interface Constraint {
  contype: string;
  conname?: string;
  keys?: unknown[];
  fk_attrs?: unknown[];
  pk_attrs?: unknown[];
  pktable?: RangeVar;
}

interface ColumnDef {
  colname: string;
  typeName?: TypeName;
  is_not_null?: boolean;
  constraints?: { Constraint?: Constraint }[];
}

interface MutableTable {
  schema: string;
  name: string;
  columns: Column[];
  primaryKey: string[];
  uniques: string[][];
}

const key = (r: { schema: string; name: string }): string => `${r.schema}.${r.name}`;

export class SchemaBuilder {
  private readonly tables = new Map<string, MutableTable>();
  private readonly foreignKeys = new Map<string, ForeignKey>();

  async apply(sql: string, source: string): Promise<void> {
    const parsed = await parseSql(sql, source);
    for (const raw of parsed.stmts) this.statement(raw);
  }

  build(): DeclaredSchema {
    const tables: Table[] = [...this.tables.values()]
      .map((t) => ({ schema: t.schema, name: t.name, columns: [...t.columns], primaryKey: [...t.primaryKey], uniques: t.uniques.map((u) => [...u]) }))
      .sort((a, b) => (key(a) < key(b) ? -1 : 1));
    const foreignKeys = [...this.foreignKeys.values()].sort((a, b) => (a.name < b.name ? -1 : 1));
    return { tables, foreignKeys };
  }

  private statement(raw: RawStmt): void {
    const s = raw.stmt;
    if (s['CreateStmt']) this.create(s['CreateStmt'] as { relation: RangeVar; tableElts?: Node[]; if_not_exists?: boolean });
    else if (s['AlterTableStmt']) this.alter(s['AlterTableStmt'] as { relation: RangeVar; cmds?: Node[]; objtype?: string });
    else if (s['DropStmt']) this.drop(s['DropStmt'] as { removeType: string; objects?: unknown[] });
    else if (s['IndexStmt']) this.index(s['IndexStmt'] as { unique?: boolean; relation: RangeVar; indexParams?: Node[] });
    else if (s['RenameStmt']) this.rename(s['RenameStmt'] as { renameType: string; relation?: RangeVar; subname?: string; newname: string });
  }

  private table(r: { schema: string; name: string }): MutableTable | undefined {
    return this.tables.get(key(r));
  }

  private create(c: { relation: RangeVar; tableElts?: Node[]; if_not_exists?: boolean }): void {
    const r = ref(c.relation);
    if (c.if_not_exists && this.tables.has(key(r))) return;
    const t: MutableTable = { schema: r.schema, name: r.name, columns: [], primaryKey: [], uniques: [] };
    this.tables.set(key(r), t);
    for (const el of c.tableElts ?? []) {
      if (el['ColumnDef']) this.addColumn(t, el['ColumnDef'] as ColumnDef);
      else if (el['Constraint']) this.constraint(t, el['Constraint'] as Constraint);
    }
  }

  private addColumn(t: MutableTable, d: ColumnDef): void {
    const inline = (d.constraints ?? []).map((c) => c.Constraint).filter((c): c is Constraint => c !== undefined);
    const notNull = d.is_not_null === true || inline.some((c) => c.contype === 'CONSTR_NOTNULL' || c.contype === 'CONSTR_PRIMARY');
    const typeName = strings(d.typeName?.names).at(-1)?.toLowerCase();
    const isSerial = typeName === 'serial' || typeName === 'bigserial' || typeName === 'smallserial';
    t.columns = t.columns.filter((c) => c.name !== d.colname);
    t.columns.push({ name: d.colname, type: typeText(d.typeName), nullable: !notNull && !isSerial });
    for (const c of inline) this.constraint(t, c, [d.colname]);
  }

  private constraint(t: MutableTable, c: Constraint, own: string[] = []): void {
    const cols = own.length > 0 ? own : strings(c.keys);
    switch (c.contype) {
      case 'CONSTR_PRIMARY':
        t.primaryKey = cols;
        t.columns = t.columns.map((col) => (cols.includes(col.name) ? { ...col, nullable: false } : col));
        return;
      case 'CONSTR_UNIQUE':
        if (!t.uniques.some((u) => u.join(',') === cols.join(','))) t.uniques.push(cols);
        return;
      case 'CONSTR_FOREIGN': {
        const from = own.length > 0 ? own : strings(c.fk_attrs);
        const target = ref(c.pktable);
        // Referencing the target's primary key when the columns are not spelled out, as PostgreSQL does.
        const to = c.pk_attrs && c.pk_attrs.length > 0 ? strings(c.pk_attrs) : (this.table(target)?.primaryKey ?? []);
        const name = c.conname ?? `${t.name}_${from.join('_')}_fkey`;
        this.foreignKeys.set(`${key(t)}:${name}`, {
          name,
          from: from.map((column) => ({ schema: t.schema, name: t.name, column })),
          to: to.map((column) => ({ schema: target.schema, name: target.name, column })),
        });
        return;
      }
      default:
        return;
    }
  }

  private alter(a: { relation: RangeVar; cmds?: Node[]; objtype?: string }): void {
    if (a.objtype && a.objtype !== 'OBJECT_TABLE') return;
    const t = this.table(ref(a.relation));
    if (!t) return;
    for (const c of a.cmds ?? []) {
      const cmd = c['AlterTableCmd'] as { subtype: string; name?: string; def?: Node } | undefined;
      if (!cmd) continue;
      switch (cmd.subtype) {
        case 'AT_AddColumn':
          if (cmd.def?.['ColumnDef']) this.addColumn(t, cmd.def['ColumnDef'] as ColumnDef);
          break;
        case 'AT_DropColumn':
          t.columns = t.columns.filter((col) => col.name !== cmd.name);
          t.primaryKey = t.primaryKey.filter((n) => n !== cmd.name);
          t.uniques = t.uniques.filter((u) => !u.includes(cmd.name ?? ''));
          for (const [k, fk] of this.foreignKeys) if (fk.from.some((x) => x.name === t.name && x.column === cmd.name)) this.foreignKeys.delete(k);
          break;
        case 'AT_AddConstraint':
          if (cmd.def?.['Constraint']) this.constraint(t, cmd.def['Constraint'] as Constraint);
          break;
        case 'AT_DropConstraint':
          this.foreignKeys.delete(`${key(t)}:${cmd.name ?? ''}`);
          if (cmd.name === `${t.name}_pkey`) t.primaryKey = [];
          break;
        case 'AT_SetNotNull':
          t.columns = t.columns.map((col) => (col.name === cmd.name ? { ...col, nullable: false } : col));
          break;
        case 'AT_DropNotNull':
          t.columns = t.columns.map((col) => (col.name === cmd.name && !t.primaryKey.includes(col.name) ? { ...col, nullable: true } : col));
          break;
        case 'AT_AlterColumnType': {
          const d = cmd.def?.['ColumnDef'] as ColumnDef | undefined;
          if (d) t.columns = t.columns.map((col) => (col.name === cmd.name ? { ...col, type: typeText(d.typeName) } : col));
          break;
        }
        default:
          break;
      }
    }
  }

  private drop(d: { removeType: string; objects?: unknown[] }): void {
    if (d.removeType !== 'OBJECT_TABLE') return;
    for (const o of d.objects ?? []) {
      const names = (o as { List?: { items?: unknown[] } }).List?.items ?? [];
      const parts = strings(names);
      const r = parts.length === 2 ? { schema: parts[0]!, name: parts[1]! } : { schema: DEFAULT_SCHEMA, name: parts[0] ?? '' };
      this.tables.delete(key(r));
      for (const [k, fk] of this.foreignKeys) {
        if (fk.from.some((x) => x.schema === r.schema && x.name === r.name) || fk.to.some((x) => x.schema === r.schema && x.name === r.name)) this.foreignKeys.delete(k);
      }
    }
  }

  private index(i: { unique?: boolean; relation: RangeVar; indexParams?: Node[] }): void {
    if (!i.unique) return;
    const t = this.table(ref(i.relation));
    if (!t) return;
    const cols = (i.indexParams ?? []).map((p) => (p['IndexElem'] as { name?: string } | undefined)?.name ?? '').filter((n) => n.length > 0);
    // An expression index has no plain column and is not a uniqueness the model can use.
    if (cols.length !== (i.indexParams ?? []).length) return;
    if (!t.uniques.some((u) => u.join(',') === cols.join(','))) t.uniques.push(cols);
  }

  private rename(r: { renameType: string; relation?: RangeVar; subname?: string; newname: string }): void {
    if (!r.relation) return;
    const from = ref(r.relation);
    const t = this.table(from);
    if (!t) return;
    if (r.renameType === 'OBJECT_TABLE') {
      this.tables.delete(key(from));
      t.name = r.newname;
      this.tables.set(key(t), t);
      for (const [k, fk] of this.foreignKeys) {
        const fix = (cols: readonly { schema: string; name: string; column: string }[]) => cols.map((c) => (c.schema === from.schema && c.name === from.name ? { ...c, name: r.newname } : c));
        this.foreignKeys.set(k, { ...fk, from: fix(fk.from), to: fix(fk.to) });
      }
    } else if (r.renameType === 'OBJECT_COLUMN' && r.subname) {
      const old = r.subname;
      t.columns = t.columns.map((c) => (c.name === old ? { ...c, name: r.newname } : c));
      t.primaryKey = t.primaryKey.map((n) => (n === old ? r.newname : n));
      t.uniques = t.uniques.map((u) => u.map((n) => (n === old ? r.newname : n)));
      for (const [k, fk] of this.foreignKeys) {
        const fix = (cols: readonly { schema: string; name: string; column: string }[]) => cols.map((c) => (c.schema === t.schema && c.name === t.name && c.column === old ? { ...c, column: r.newname } : c));
        this.foreignKeys.set(k, { ...fk, from: fix(fk.from), to: fix(fk.to) });
      }
    }
  }
}

/** One DDL text → a schema. */
export async function parseDdl(sql: string, source = 'ddl'): Promise<DeclaredSchema> {
  const b = new SchemaBuilder();
  await b.apply(sql, source);
  return b.build();
}

/** Migrations, applied in the order given — the caller sorts, because "in order" is the caller's convention. */
export async function foldMigrations(files: readonly { readonly name: string; readonly sql: string }[]): Promise<DeclaredSchema> {
  const b = new SchemaBuilder();
  for (const f of files) await b.apply(f.sql, f.name);
  return b.build();
}
