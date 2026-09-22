/**
 * Django's `models.py` → the declared schema.
 *
 * Django teams often have no SQL in the repository at all: the migrations are
 * Python, and the schema exists only in the models. Read line by line, never
 * by importing the module — importing a `models.py` runs it, and running a
 * repository's code to draw its diagram is a liability, not a feature.
 *
 * Two of Django's conventions are naming rules this reader has to reproduce:
 *
 * - **The table name is `<app>_<model lowercased>`** unless `db_table` says
 *   otherwise, and the app label is the directory the `models.py` lives in.
 *   That is Django's rule, and it is why the reader takes the path.
 * - **A `ForeignKey` field named `owner` is a column named `owner_id`**, and
 *   `ManyToManyField` is a table of its own — created here, because Django
 *   creates it, and a diagram that omits it is a diagram missing a table.
 *
 * A model this reader cannot resolve the other side of — a foreign key to a
 * string it never saw a class for, or to `settings.AUTH_USER_MODEL` — is
 * reported, not invented.
 */

import { basename, dirname } from 'node:path';

import type { Column, DeclaredSchema, ForeignKey, Table } from '@ledgerline/model';

/** Django's field classes, spelled as PostgreSQL reports the type (ADR-0002). */
const FIELDS: Readonly<Record<string, string>> = {
  AutoField: 'integer',
  BigAutoField: 'bigint',
  SmallAutoField: 'smallint',
  BigIntegerField: 'bigint',
  BinaryField: 'bytea',
  BooleanField: 'boolean',
  CharField: 'character varying',
  DateField: 'date',
  DateTimeField: 'timestamp with time zone',
  DecimalField: 'numeric',
  DurationField: 'interval',
  EmailField: 'character varying',
  FileField: 'character varying',
  FilePathField: 'character varying',
  FloatField: 'double precision',
  GenericIPAddressField: 'inet',
  ImageField: 'character varying',
  IntegerField: 'integer',
  JSONField: 'jsonb',
  PositiveBigIntegerField: 'bigint',
  PositiveIntegerField: 'integer',
  PositiveSmallIntegerField: 'smallint',
  SlugField: 'character varying',
  SmallIntegerField: 'smallint',
  TextField: 'text',
  TimeField: 'time without time zone',
  URLField: 'character varying',
  UUIDField: 'uuid',
};

const RELATIONS = new Set(['ForeignKey', 'OneToOneField', 'ManyToManyField']);

export interface DjangoSchema {
  readonly schema: DeclaredSchema;
  readonly unread: readonly { readonly reason: string; readonly line: number; readonly text: string }[];
}

interface Pending {
  readonly model: string;
  readonly field: string;
  readonly kind: 'ForeignKey' | 'OneToOneField' | 'ManyToManyField';
  readonly target: string;
  readonly nullable: boolean;
  readonly line: number;
  readonly text: string;
}

function typeOf(field: string, args: string): string {
  const base = FIELDS[field];
  if (base === undefined) return 'text';
  if (base === 'character varying') {
    const max = /\bmax_length\s*=\s*(\d+)/.exec(args)?.[1];
    return max === undefined ? 'character varying' : `character varying(${max})`;
  }
  if (base === 'numeric') {
    const digits = /\bmax_digits\s*=\s*(\d+)/.exec(args)?.[1];
    const places = /\bdecimal_places\s*=\s*(\d+)/.exec(args)?.[1];
    return digits === undefined ? 'numeric' : `numeric(${digits},${places ?? '0'})`;
  }
  return base;
}

/**
 * @param source the file's text
 * @param path its path; the directory's name is Django's app label, which is
 *   half of every default table name
 */
export function parseDjangoModels(source: string, path: string): DjangoSchema {
  const app = basename(dirname(path));
  const lines = source.split('\n');
  const tables: Table[] = [];
  const foreignKeys: ForeignKey[] = [];
  const unread: { reason: string; line: number; text: string }[] = [];
  const pending: Pending[] = [];
  /** Model class name → table name, filled as the file is read and used to resolve targets after. */
  const named = new Map<string, string>();

  let current: { model: string; columns: Column[]; uniques: string[][]; dbTable: string | null; managed: boolean; abstract: boolean } | null = null;
  const finish = (): void => {
    if (current === null) return;
    const table = current.dbTable ?? `${app}_${current.model.toLowerCase()}`;
    if (current.abstract || !current.managed) {
      current = null;
      return;
    }
    named.set(current.model, table);
    // Django adds an implicit `id` unless a field declares primary_key=True.
    const columns = current.columns.some((c) => c.name === 'id') ? current.columns : [{ name: 'id', type: 'bigint', nullable: false }, ...current.columns];
    tables.push({ schema: 'public', name: table, columns, primaryKey: ['id'], uniques: current.uniques });
    current = null;
  };

  let n = 0;
  for (const raw of lines) {
    n++;
    const line = raw.trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    const cls = /^class\s+(\w+)\s*\(([^)]*)\)\s*:/.exec(line);
    if (cls) {
      const [, name, bases] = cls as unknown as [string, string, string];
      if (/\bMeta\b/.test(name)) continue;
      finish();
      if (!/\bModel\b|\bmodels\.Model\b/.test(bases)) {
        // A mixin or a plain class; not a table.
        continue;
      }
      current = { model: name, columns: [], uniques: [], dbTable: null, managed: true, abstract: false };
      continue;
    }
    if (current === null) continue;

    const dbTable = /^db_table\s*=\s*["']([^"']+)["']/.exec(line);
    if (dbTable) {
      current = { ...current, dbTable: dbTable[1]! };
      continue;
    }
    if (/^managed\s*=\s*False\b/.test(line)) {
      current = { ...current, managed: false };
      continue;
    }
    if (/^abstract\s*=\s*True\b/.test(line)) {
      current = { ...current, abstract: true };
      continue;
    }
    const unique = /^unique_together\s*=\s*\(?\s*[[(]([^)\]]*)[)\]]/.exec(line);
    if (unique) {
      const cols = [...unique[1]!.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!);
      if (cols.length > 0) current.uniques.push(cols);
      continue;
    }

    const field = /^(\w+)\s*=\s*(?:models|django\.db\.models)\.(\w+)\s*\(([\s\S]*?)\)?\s*$/.exec(line);
    if (field === null) continue;
    const [, name, kind, args] = field as unknown as [string, string, string, string];

    if (RELATIONS.has(kind)) {
      const target = /^\s*(?:to\s*=\s*)?["']([\w.]+)["']/.exec(args)?.[1] ?? /^\s*(?:to\s*=\s*)?(\w+)/.exec(args)?.[1];
      if (target === undefined) {
        unread.push({ reason: `a ${kind} whose other side this reader could not read`, line: n, text: line.slice(0, 120) });
        continue;
      }
      const nullable = /\bnull\s*=\s*True\b/.test(args);
      if (kind !== 'ManyToManyField') {
        current.columns.push({ name: `${name}_id`, type: 'bigint', nullable });
        if (kind === 'OneToOneField' || /\bunique\s*=\s*True\b/.test(args)) current.uniques.push([`${name}_id`]);
      }
      pending.push({ model: current.model, field: name, kind: kind as Pending['kind'], target, nullable, line: n, text: line.slice(0, 120) });
      continue;
    }

    if (FIELDS[kind] === undefined) {
      unread.push({ reason: `a field class this reader has no type for: ${kind}`, line: n, text: line.slice(0, 120) });
      continue;
    }
    const primary = /\bprimary_key\s*=\s*True\b/.test(args);
    current.columns.push({ name: primary ? 'id' : name, type: typeOf(kind, args), nullable: /\bnull\s*=\s*True\b/.test(args) && !primary });
    if (!primary && /\bunique\s*=\s*True\b/.test(args)) current.uniques.push([name]);
  }
  finish();

  // Resolve the relations now that every model in the file has a table name.
  for (const p of pending) {
    const bare = p.target.includes('.') ? p.target.split('.').pop()! : p.target;
    const to = named.get(bare) ?? named.get(p.target);
    if (to === undefined) {
      unread.push({ reason: `a ${p.kind} to ${p.target}, which is not a model in this file`, line: p.line, text: p.text });
      continue;
    }
    const from = named.get(p.model);
    if (from === undefined) continue;
    if (p.kind === 'ManyToManyField') {
      // Django's own join table: `<from table>_<field>`, a column per side.
      const through = `${from}_${p.field}`;
      const leftColumn = `${from.slice(app.length + 1)}_id`;
      const rightColumn = `${bare.toLowerCase()}_id`;
      tables.push({
        schema: 'public',
        name: through,
        columns: [
          { name: 'id', type: 'bigint', nullable: false },
          { name: leftColumn, type: 'bigint', nullable: false },
          { name: rightColumn, type: 'bigint', nullable: false },
        ],
        primaryKey: ['id'],
        uniques: [[leftColumn, rightColumn]],
      });
      foreignKeys.push(
        { name: `${through}_${leftColumn}_fk`, from: [{ schema: 'public', name: through, column: leftColumn }], to: [{ schema: 'public', name: from, column: 'id' }] },
        { name: `${through}_${rightColumn}_fk`, from: [{ schema: 'public', name: through, column: rightColumn }], to: [{ schema: 'public', name: to, column: 'id' }] },
      );
      continue;
    }
    foreignKeys.push({
      name: `${from}_${p.field}_id_fk`,
      from: [{ schema: 'public', name: from, column: `${p.field}_id` }],
      to: [{ schema: 'public', name: to, column: 'id' }],
    });
  }

  return {
    schema: {
      tables: tables.sort((a, b) => (a.name < b.name ? -1 : 1)),
      foreignKeys: foreignKeys.sort((a, b) => (a.name < b.name ? -1 : 1)),
    },
    unread,
  };
}
