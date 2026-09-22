/**
 * Where to look, and how loudly to complain.
 *
 * `ledgerline.json` at the repository root, every field optional, every
 * default the thing a repository with no configuration would want: migrations
 * wherever a migration tool puts them, queries everywhere in the repository,
 * the pull-request policy. A missing file is not an error — the wedge is one
 * command on a repository that has never heard of this tool.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { PULL_REQUEST_POLICY, type Policy, type Severity } from '@ledgerline/model';

export const CONFIG_FILE = 'ledgerline.json';

/** The places migration tools put their SQL, in the order a repository is likely to have them. */
export const MIGRATION_DIRS = [
  'migrations',
  'db/migrate',
  'db/migrations',
  'database/migrations',
  'prisma/migrations',
  'drizzle',
  'supabase/migrations',
  'server/migrations',
  'src/migrations',
  'sql/migrations',
];

export const PRISMA_FILES = ['prisma/schema.prisma', 'schema.prisma'];

/** Where Rails puts the file that *is* the schema for a Rails team. */
export const RAILS_FILES = ['db/schema.rb', 'db/primary_schema.rb'];

/** Directories that are never descended into when looking for an ORM's files. */
const SKIP = new Set(['node_modules', 'vendor', 'bin', 'obj', 'dist', 'build', 'target', '__pycache__', 'venv', '.venv', 'site-packages']);

export interface Config {
  /** `postgres` (default) or `mysql`; MySQL DDL is normalised into the one grammar (ADR-0004). */
  readonly dialect?: 'postgres' | 'mysql';
  /** Migration directories, relative to the root. Found by looking when absent. */
  readonly migrations?: readonly string[];
  /** A `schema.prisma`. Found by looking when absent. */
  readonly prisma?: string;
  /** A Rails `db/schema.rb`. Found by looking when absent. */
  readonly rails?: string;
  /** Django `models.py` files; the directory of each is its app label. Found by looking when absent. */
  readonly django?: readonly string[];
  /** SQLAlchemy model files. Found by looking when absent — a `models.py` that names a declarative base. */
  readonly sqlalchemy?: readonly string[];
  /** TypeORM entity files. Found by looking when absent — `*.entity.ts`. */
  readonly typeorm?: readonly string[];
  /** sequelize-typescript model files. Found by looking when absent — `.ts` under a `models/` directory that mentions Sequelize. */
  readonly sequelize?: readonly string[];
  /** An EF Core `…ModelSnapshot.cs`. Found by looking when absent. */
  readonly efcore?: string;
  /** Where the queries are: directories of `.sql` and of source files. The whole repository when absent. */
  readonly queries?: readonly string[];
  /** Query logs: plain SQL, `pg_stat_statements` JSON, or CSV with a `query` column. */
  readonly logs?: readonly string[];
  /** Paths the readers never descend into, beside the built-in list. */
  readonly ignore?: readonly string[];
  readonly policy?: Partial<Record<keyof Policy, Severity>>;
  /** Where the model file lives, relative to the root. */
  readonly model?: string;
  readonly baseline?: string;
  readonly report?: string;
}

export interface Resolved {
  readonly root: string;
  readonly dialect: 'postgres' | 'mysql';
  readonly migrations: readonly string[];
  readonly prisma: string | null;
  readonly rails: string | null;
  readonly django: readonly string[];
  readonly sqlalchemy: readonly string[];
  readonly typeorm: readonly string[];
  readonly sequelize: readonly string[];
  readonly efcore: string | null;
  readonly queries: readonly string[];
  readonly logs: readonly string[];
  readonly ignore: readonly string[];
  readonly policy: Policy;
  readonly model: string;
  readonly baseline: string;
  readonly report: string;
}

/**
 * Files an ORM's schema lives in, found by looking — bounded in depth, because
 * a default that walks a whole monorepo to draw one diagram is a default
 * nobody leaves on.
 */
export function findFiles(root: string, matches: (name: string, dir: string) => boolean, maxDepth = 4): string[] {
  const out: string[] = [];
  const walk = (relative: string, depth: number): void => {
    let entries;
    try {
      entries = readdirSync(join(root, relative) || root, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = relative === '' ? entry.name : `${relative}/${entry.name}`;
      if (entry.isDirectory()) {
        if (depth >= maxDepth || entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
        walk(path, depth + 1);
      } else if (matches(entry.name, relative)) {
        out.push(path);
      }
    }
  };
  walk('', 0);
  return out.sort();
}

/**
 * `models.py` belongs to Django or to SQLAlchemy, and the file says which:
 * SQLAlchemy writes `__tablename__` and a declarative base, Django subclasses
 * `models.Model`. Guessing from the filename would give one reader the other's
 * files, so the content decides.
 */
export function ormKindOf(text: string): 'django' | 'sqlalchemy' | null {
  if (/__tablename__|declarative_base|DeclarativeBase|sqlalchemy/.test(text)) return 'sqlalchemy';
  if (/models\.Model|from\s+django/.test(text)) return 'django';
  return null;
}

/**
 * A Sequelize repository has no one file that is the schema, so the models
 * are it: `.ts` under a `models/` directory, filtered by what the file says.
 * `@Table` belongs to `sequelize-typescript` and `@Entity` to TypeORM, so a
 * directory of models is never mistaken for the other kind.
 */
export function findSequelizeModels(root: string): string[] {
  return findFiles(root, (name, dir) => name.endsWith('.ts') && !name.endsWith('.test.ts') && /(^|\/)models?(\/|$)/.test(dir), 6).filter((f) => {
    try {
      const text = readFileSync(join(root, f), 'utf8');
      return /sequelize-typescript|@Table\s*\(/.test(text) && !/@Entity\s*\(/.test(text);
    } catch {
      return false;
    }
  });
}

export function readConfig(root: string): Config {
  const path = join(root, CONFIG_FILE);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Config;
  } catch (e) {
    throw new Error(`${CONFIG_FILE}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function resolveConfig(root: string, config: Config = readConfig(root)): Resolved {
  const migrations = config.migrations ?? MIGRATION_DIRS.filter((d) => existsSync(join(root, d)));
  const prisma = config.prisma ?? PRISMA_FILES.find((f) => existsSync(join(root, f))) ?? null;
  const rails = config.rails ?? RAILS_FILES.find((f) => existsSync(join(root, f))) ?? null;
  // One list of `models.py`, split by what each file actually says it is.
  const pythonModels = config.django === undefined || config.sqlalchemy === undefined ? findFiles(root, (name) => name === 'models.py' || name === 'model.py') : [];
  const kinds = new Map(pythonModels.map((f) => [f, ormKindOf(readFileSync(join(root, f), 'utf8'))]));
  return {
    root,
    dialect: config.dialect ?? 'postgres',
    migrations,
    prisma,
    rails,
    django: config.django ?? pythonModels.filter((f) => kinds.get(f) === 'django'),
    sqlalchemy: config.sqlalchemy ?? pythonModels.filter((f) => kinds.get(f) === 'sqlalchemy'),
    typeorm: config.typeorm ?? findFiles(root, (name) => name.endsWith('.entity.ts')),
    sequelize: config.sequelize ?? findSequelizeModels(root),
    efcore: config.efcore ?? findFiles(root, (name, dir) => name.endsWith('ModelSnapshot.cs') && /(^|\/)Migrations$/i.test(dir))[0] ?? null,
    queries: config.queries ?? ['.'],
    logs: config.logs ?? [],
    ignore: config.ignore ?? [],
    policy: { ...PULL_REQUEST_POLICY, ...(config.policy ?? {}) },
    model: config.model ?? 'ledgerline.model.json',
    baseline: config.baseline ?? 'ledgerline.baseline.json',
    report: config.report ?? 'ledgerline.html',
  };
}
