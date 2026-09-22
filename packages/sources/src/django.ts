/**
 * Django's models → the declared schema.
 *
 * Django teams often have no SQL in the repository at all: the migrations are
 * Python, and the schema exists only in the models. Read line by line, never
 * by importing the module — importing a `models.py` runs it, and running a
 * repository's code to draw its diagram is a liability, not a feature
 * (ADR-0005).
 *
 * Three of Django's conventions are naming rules this reader has to
 * reproduce, and each was corrected by a real repository rather than guessed:
 *
 * - **The table name is `<app label>_<model lowercased>`** unless `db_table`
 *   says otherwise, and the app label is the *app's* directory. A large
 *   Django project splits its models into a package — `netbox/dcim/models/
 *   devices.py` — so the directory holding the file is `models` and the app
 *   label is the one above it.
 * - **A field spans as many lines as it likes.** NetBox writes every
 *   `ForeignKey` across five or six, so a reader that works a line at a time
 *   sees none of them.
 * - **A `ForeignKey` names its target as `'app.Model'`, `'Model'` or a class**,
 *   and the first form reaches across files — which is why every file is read
 *   before anything is resolved.
 *
 * A target this reader cannot resolve is reported, not invented. So is a
 * `GenericForeignKey`: it is Django's polymorphic association, it is a real
 * relationship, and it is not a foreign key — drawing it as one would be a
 * claim the database does not make.
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
  readonly app: string;
  readonly model: string;
  readonly field: string;
  readonly kind: 'ForeignKey' | 'OneToOneField' | 'ManyToManyField';
  readonly target: string;
  readonly nullable: boolean;
  readonly line: number;
  readonly text: string;
}

function typeOf(field: string, args: string): string {
  const base = FIELDS[field]!;
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
 * The app label for a file: the directory it is in, or the one above when the
 * models are a package. `dcim/models/devices.py` is the `dcim` app, not the
 * `models` app — and getting that wrong renames every table in the schema.
 */
export function appLabelOf(path: string): string {
  const dir = basename(dirname(path));
  return dir === 'models' || dir === 'model' ? basename(dirname(dirname(path))) : dir;
}

function balanced(text: string): boolean {
  let n = 0;
  let quote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quote !== null) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') n++;
    else if (ch === ')' || ch === ']' || ch === '}') n--;
  }
  return n <= 0;
}

interface Model {
  readonly app: string;
  readonly cls: string;
  table: string | null;
  abstract: boolean;
  managed: boolean;
  readonly columns: Column[];
  readonly uniques: string[][];
  readonly indent: number;
}

/**
 * @param sources one entry per model file, with its path — the path is half of
 *   every default table name. Every file is read before anything is resolved,
 *   because a `ForeignKey('dcim.Cable')` reaches across them.
 */
export function parseDjangoModels(sources: readonly { readonly path: string; readonly text: string }[]): DjangoSchema {
  const unread: { reason: string; line: number; text: string }[] = [];
  const pending: Pending[] = [];
  const models: Model[] = [];

  for (const file of sources) {
    const app = appLabelOf(file.path);
    const lines = file.text.split('\n');
    let current: Model | null = null;
    /** A statement being accumulated, because a Django field spans as many lines as it likes. */
    let building: { text: string; line: number } | null = null;
    /** True while inside the `class Meta:` of the current model. */
    let inMeta = false;

    const readField = (text: string, n: number): void => {
      if (current === null) return;
      const field = /^(\w+)\s*=\s*(?:[\w.]*\.)?(\w+)\s*\(([\s\S]*)\)\s*$/.exec(text.trim());
      if (field === null) return;
      const [, name, kind, args] = field as unknown as [string, string, string, string];

      if (kind === 'GenericForeignKey') {
        unread.push({ reason: `${current.cls}.${name} is a GenericForeignKey — a polymorphic association, which is a real relationship and not a foreign key`, line: n, text: text.slice(0, 120) });
        return;
      }
      if (RELATIONS.has(kind)) {
        const target = /\bto\s*=\s*["']([\w.]+)["']/.exec(args)?.[1] ?? /^\s*["']([\w.]+)["']/.exec(args)?.[1] ?? /^\s*(?:to\s*=\s*)?([A-Z]\w*)/.exec(args)?.[1];
        if (target === undefined) {
          unread.push({ reason: `a ${kind} on ${current.cls}.${name} whose other side this reader could not read`, line: n, text: text.slice(0, 120) });
          return;
        }
        const nullable = /\bnull\s*=\s*True\b/.test(args);
        if (kind !== 'ManyToManyField') {
          current.columns.push({ name: `${name}_id`, type: 'bigint', nullable });
          if (kind === 'OneToOneField' || /\bunique\s*=\s*True\b/.test(args)) current.uniques.push([`${name}_id`]);
        }
        pending.push({ app, model: current.cls, field: name, kind: kind as Pending['kind'], target, nullable, line: n, text: text.slice(0, 120) });
        return;
      }
      if (FIELDS[kind] === undefined) {
        // A field class from a library or the project's own; its column is real and its type is not knowable here.
        unread.push({ reason: `a field class this reader has no type for: ${kind} on ${current.cls}.${name}`, line: n, text: text.slice(0, 120) });
        return;
      }
      const primary = /\bprimary_key\s*=\s*True\b/.test(args);
      const column = /\bdb_column\s*=\s*["']([^"']+)["']/.exec(args)?.[1] ?? (primary ? 'id' : name);
      current.columns.push({ name: column, type: typeOf(kind, args), nullable: /\bnull\s*=\s*True\b/.test(args) && !primary });
      if (!primary && /\bunique\s*=\s*True\b/.test(args)) current.uniques.push([column]);
    };

    let n = 0;
    for (const raw of lines) {
      n++;
      const line = raw.trim();
      if (line.length === 0 || line.startsWith('#')) continue;
      const indent = raw.length - raw.trimStart().length;

      if (building !== null) {
        building = { text: `${building.text}\n${raw}`, line: building.line };
        if (balanced(building.text)) {
          readField(building.text, building.line);
          building = null;
        }
        continue;
      }

      const cls = /^class\s+(\w+)\s*(?:\(([^)]*)\))?\s*:/.exec(line);
      if (cls) {
        const [, name, bases] = cls as unknown as [string, string, string | undefined];
        if (name === 'Meta') {
          inMeta = current !== null;
          continue;
        }
        inMeta = false;
        // A model, or something that will lend fields to one. Either way its
        // fields are read; only a model becomes a table.
        current = { app, cls: name, table: null, abstract: false, managed: true, columns: [], uniques: [], indent };
        if (bases !== undefined && /\bModel\b|\bmodels\.Model\b/.test(bases)) models.push(current);
        else if (bases !== undefined && bases.trim().length > 0) models.push(current);
        continue;
      }
      if (current === null) continue;
      // Dedented back past the class: out of it.
      if (indent <= current.indent && !line.startsWith(')')) {
        current = null;
        inMeta = false;
        continue;
      }

      if (inMeta) {
        const dbTable = /^db_table\s*=\s*["']([^"']+)["']/.exec(line);
        if (dbTable) current.table = dbTable[1]!;
        else if (/^managed\s*=\s*False\b/.test(line)) current.managed = false;
        else if (/^abstract\s*=\s*True\b/.test(line)) current.abstract = true;
        else {
          const unique = /^unique_together\s*=\s*\(?\s*[[(]([^)\]]*)[)\]]/.exec(line);
          if (unique) {
            const cols = [...unique[1]!.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!);
            if (cols.length > 0) current.uniques.push(cols);
          }
        }
        continue;
      }

      if (/^\w+\s*=\s*(?:[\w.]*\.)?\w+\s*\(/.test(line)) {
        if (balanced(raw)) readField(raw, n);
        else building = { text: raw, line: n };
      }
    }
  }

  // Now every file has been read, so a table name and a target can be resolved.
  const tableOf = new Map<string, string>();
  for (const m of models) {
    if (m.abstract || !m.managed || m.columns.length === 0) continue;
    const table = m.table ?? `${m.app}_${m.cls.toLowerCase()}`;
    tableOf.set(`${m.app}.${m.cls}`, table);
  }
  const resolve = (app: string, target: string): string | undefined => {
    if (target.includes('.')) {
      const [a, model] = target.split('.') as [string, string];
      return tableOf.get(`${a}.${model}`);
    }
    return tableOf.get(`${app}.${target}`) ?? [...tableOf.entries()].find(([k]) => k.endsWith(`.${target}`))?.[1];
  };

  const tables: Table[] = [];
  for (const m of models) {
    const table = tableOf.get(`${m.app}.${m.cls}`);
    if (table === undefined) continue;
    // Django adds an implicit `id` unless a field declared itself the key.
    const columns = m.columns.some((c) => c.name === 'id') ? m.columns : [{ name: 'id', type: 'bigint', nullable: false }, ...m.columns];
    tables.push({ schema: 'public', name: table, columns, primaryKey: ['id'], uniques: m.uniques });
  }

  const foreignKeys: ForeignKey[] = [];
  for (const p of pending) {
    const from = tableOf.get(`${p.app}.${p.model}`);
    if (from === undefined) continue; // an abstract base's field; it belongs to whatever inherits it
    const to = resolve(p.app, p.target);
    if (to === undefined) {
      unread.push({ reason: `a ${p.kind} to ${p.target}, which is not a model among the files read`, line: p.line, text: p.text });
      continue;
    }
    if (p.kind === 'ManyToManyField') {
      // Django's own join table: `<from table>_<field>`, a column per side.
      const through = `${from}_${p.field}`;
      const leftColumn = `${from.slice(p.app.length + 1)}_id`;
      const rightColumn = `${to.includes('_') ? to.slice(to.indexOf('_') + 1) : to}_id`;
      if (tables.some((t) => t.name === through)) continue;
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

  // One fact once: a missing target reported per model, not per field.
  const once = new Map(unread.map((u) => [`${u.reason}`, u]));
  return {
    schema: {
      tables: tables.sort((a, b) => (a.name < b.name ? -1 : 1)),
      foreignKeys: foreignKeys.sort((a, b) => (a.name < b.name ? -1 : 1)),
    },
    unread: [...once.values()],
  };
}
