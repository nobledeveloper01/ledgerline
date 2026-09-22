/**
 * TypeORM entities → the declared schema.
 *
 * Read as text, never imported (ADR-0005) — and for TypeORM that matters more
 * than for the others, because an entity file imports the rest of the
 * application, so importing one to read it runs a great deal of somebody
 * else's code.
 *
 * TypeORM's decorators are the grammar: `@Entity`, `@Column`,
 * `@PrimaryColumn`, `@PrimaryGeneratedColumn`, `@CreateDateColumn`,
 * `@ManyToOne`, `@OneToOne`, `@JoinColumn`, `@Index`, `@Unique`. Two
 * conventions have to be reproduced, and both are reported when they cannot
 * be:
 *
 * - **The table name** is the class name in snake_case unless `@Entity('x')`
 *   says otherwise — TypeORM's default naming strategy.
 * - **A relation's column** is `<property>Id` unless `@JoinColumn({ name })`
 *   says otherwise, and the other side is a class, which is resolved only if
 *   that class is an entity the reader has seen.
 */

import type { Column, DeclaredSchema, ForeignKey, Table } from '@ledgerline/model';

/** TypeORM's column types, spelled as PostgreSQL reports them (ADR-0002). */
const TYPES: Readonly<Record<string, string>> = {
  int: 'integer',
  integer: 'integer',
  int4: 'integer',
  smallint: 'smallint',
  int2: 'smallint',
  bigint: 'bigint',
  int8: 'bigint',
  boolean: 'boolean',
  bool: 'boolean',
  text: 'text',
  varchar: 'character varying',
  'character varying': 'character varying',
  char: 'character',
  uuid: 'uuid',
  json: 'json',
  jsonb: 'jsonb',
  date: 'date',
  time: 'time without time zone',
  timestamp: 'timestamp without time zone',
  timestamptz: 'timestamp with time zone',
  'timestamp with time zone': 'timestamp with time zone',
  decimal: 'numeric',
  numeric: 'numeric',
  float: 'double precision',
  double: 'double precision',
  'double precision': 'double precision',
  real: 'real',
  bytea: 'bytea',
  inet: 'inet',
};

/** The TypeScript types TypeORM infers a column type from when none is given. */
const INFERRED: Readonly<Record<string, string>> = {
  number: 'integer',
  string: 'character varying',
  boolean: 'boolean',
  Date: 'timestamp without time zone',
};

export function snakeCase(name: string): string {
  return name
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

export interface TypeOrmSchema {
  readonly schema: DeclaredSchema;
  readonly unread: readonly { readonly reason: string; readonly line: number; readonly text: string }[];
}

interface Relation {
  readonly owner: string;
  readonly property: string;
  readonly target: string;
  readonly column: string | null;
  readonly kind: 'ManyToOne' | 'OneToOne';
  readonly nullable: boolean;
  readonly line: number;
  readonly text: string;
}

function optionOf(args: string, key: string): string | null {
  return new RegExp(`\\b${key}\\s*:\\s*["']([^"']+)["']`).exec(args)?.[1] ?? null;
}

/**
 * @param sources one entry per entity file: its text. Every file is read
 *   before any relation is resolved, because a relation names a class that
 *   may live in another file.
 */
export function parseTypeOrmEntities(sources: readonly { readonly path: string; readonly text: string }[]): TypeOrmSchema {
  // Mutable while reading, because a relation declared in one file adds a
  // column to a table declared in another; frozen into `Table`s at the end.
  const tables: { name: string; columns: Column[]; primaryKey: string[]; uniques: string[][] }[] = [];
  const foreignKeys: ForeignKey[] = [];
  const unread: { reason: string; line: number; text: string }[] = [];
  const relations: Relation[] = [];
  /** Class name → table name. */
  const named = new Map<string, string>();

  for (const file of sources) {
    const lines = file.text.split('\n');
    let pending: string[] = [];
    let entity: { cls: string; table: string; columns: Column[]; primaryKey: string[]; uniques: string[][] } | null = null;
    const finish = (): void => {
      if (entity === null) return;
      tables.push({ name: entity.table, columns: entity.columns, primaryKey: entity.primaryKey, uniques: entity.uniques });
      entity = null;
    };

    let n = 0;
    for (const raw of lines) {
      n++;
      const line = raw.trim();
      if (line.length === 0 || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;

      if (line.startsWith('@')) {
        pending.push(line);
        continue;
      }

      const cls = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/.exec(line);
      if (cls) {
        finish();
        const decorator = pending.find((d) => /^@Entity\b/.test(d));
        if (decorator === undefined) {
          pending = [];
          continue;
        }
        const explicit = /@Entity\s*\(\s*["']([^"']+)["']/.exec(decorator)?.[1] ?? optionOf(decorator, 'name');
        const table = explicit ?? snakeCase(cls[1]!);
        named.set(cls[1]!, table);
        entity = { cls: cls[1]!, table, columns: [], primaryKey: [], uniques: [] };
        for (const d of pending) {
          const u = /@Unique\s*\(\s*(?:["'][^"']*["']\s*,\s*)?\[([^\]]*)\]/.exec(d);
          if (u) entity.uniques.push([...u[1]!.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!));
        }
        pending = [];
        continue;
      }

      if (entity === null) {
        pending = [];
        continue;
      }

      const property = /^(?:readonly\s+)?(\w+)[!?]?\s*:\s*([^;=]+)/.exec(line);
      if (property === null) {
        pending = [];
        continue;
      }
      const [, name, declared] = property as unknown as [string, string, string];
      const decorators = pending;
      pending = [];
      if (decorators.length === 0) continue;

      const relation = decorators.find((d) => /^@(ManyToOne|OneToOne)\b/.test(d));
      if (relation !== undefined) {
        const kind = /^@(\w+)/.exec(relation)![1] as 'ManyToOne' | 'OneToOne';
        const target = /\(\s*\(\)\s*=>\s*(\w+)/.exec(relation)?.[1] ?? /\(\s*["'](\w+)["']/.exec(relation)?.[1];
        const join = decorators.find((d) => /^@JoinColumn\b/.test(d));
        if (target === undefined) {
          unread.push({ reason: `a ${kind} whose other side this reader could not read`, line: n, text: line.slice(0, 120) });
          continue;
        }
        const nullable = /\bnullable\s*:\s*true\b/.test(relation) || declared.includes('null');
        relations.push({ owner: entity.cls, property: name, target, column: join === undefined ? null : optionOf(join, 'name'), kind, nullable, line: n, text: line.slice(0, 120) });
        continue;
      }
      // A relation with no foreign key on this side is navigation, not a column.
      if (decorators.some((d) => /^@(OneToMany|ManyToMany|RelationId)\b/.test(d))) continue;

      const column = decorators.find((d) => /^@(Column|PrimaryColumn|PrimaryGeneratedColumn|CreateDateColumn|UpdateDateColumn|DeleteDateColumn|VersionColumn)\b/.test(d));
      if (column === undefined) continue;
      const decorator = /^@(\w+)/.exec(column)![1]!;
      const generated = decorator === 'PrimaryGeneratedColumn';
      const primary = generated || decorator === 'PrimaryColumn';
      const spelled = /\(\s*["']([\w ]+)["']/.exec(column)?.[1] ?? optionOf(column, 'type');
      const inferred = INFERRED[declared.trim().replace(/\s*\|.*$/, '')];
      let type = spelled === undefined || spelled === null ? undefined : TYPES[spelled];
      if (type === undefined && generated) type = spelled === 'uuid' ? 'uuid' : 'integer';
      if (type === undefined) type = inferred;
      if (type === undefined) {
        unread.push({ reason: `a column this reader has no type for: ${name}`, line: n, text: line.slice(0, 120) });
        continue;
      }
      const length = /\blength\s*:\s*(\d+)/.exec(column)?.[1];
      const precision = /\bprecision\s*:\s*(\d+)/.exec(column)?.[1];
      const scale = /\bscale\s*:\s*(\d+)/.exec(column)?.[1];
      if (type === 'character varying' && length !== undefined) type = `character varying(${length})`;
      if (type === 'numeric' && precision !== undefined) type = `numeric(${precision},${scale ?? '0'})`;
      const columnName = optionOf(column, 'name') ?? snakeCase(name);
      entity.columns.push({ name: columnName, type, nullable: primary ? false : /\bnullable\s*:\s*true\b/.test(column) });
      if (primary) entity.primaryKey.push(columnName);
      if (!primary && /\bunique\s*:\s*true\b/.test(column)) entity.uniques.push([columnName]);
    }
    finish();
  }

  for (const r of relations) {
    const from = named.get(r.owner);
    const to = named.get(r.target);
    if (from === undefined) continue;
    if (to === undefined) {
      unread.push({ reason: `a ${r.kind} to ${r.target}, which is not an entity this reader saw`, line: r.line, text: r.text });
      continue;
    }
    const column = r.column ?? `${snakeCase(r.property)}_id`;
    const owner = tables.find((t) => t.name === from)!;
    // TypeORM creates the column; the entity does not declare it.
    if (!owner.columns.some((c) => c.name === column)) owner.columns.push({ name: column, type: 'integer', nullable: r.nullable });
    if (r.kind === 'OneToOne' && !owner.uniques.some((u) => u.join('+') === column)) owner.uniques.push([column]);
    foreignKeys.push({
      name: `FK_${from}_${column}`,
      from: [{ schema: 'public', name: from, column }],
      to: [{ schema: 'public', name: to, column: tables.find((t) => t.name === to)?.primaryKey[0] ?? 'id' }],
    });
  }

  const frozen: Table[] = tables
    .map((t): Table => ({ schema: 'public', name: t.name, columns: t.columns, primaryKey: t.primaryKey, uniques: t.uniques }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  return {
    schema: { tables: frozen, foreignKeys: foreignKeys.sort((a, b) => (a.name < b.name ? -1 : 1)) },
    unread,
  };
}
