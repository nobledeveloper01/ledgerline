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

/** Where Rails and Django put the file that *is* the schema for those teams. */
export const RAILS_FILES = ['db/schema.rb', 'db/primary_schema.rb'];
export const DJANGO_GLOB_ROOTS = ['.', 'src', 'apps'];

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
  readonly queries: readonly string[];
  readonly logs: readonly string[];
  readonly ignore: readonly string[];
  readonly policy: Policy;
  readonly model: string;
  readonly baseline: string;
  readonly report: string;
}

/**
 * Django's models live wherever the apps live, so the only honest default is
 * to look — two directories deep from a small set of roots, which covers the
 * layout `django-admin startproject` makes and the `src/` and `apps/` variants
 * without walking a whole repository looking for Python.
 */
export function findDjangoModels(root: string): string[] {
  const out: string[] = [];
  for (const base of DJANGO_GLOB_ROOTS) {
    const dir = join(root, base);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const candidate = join(base, entry.name, 'models.py');
      if (existsSync(join(root, candidate))) out.push(candidate);
    }
  }
  return out.sort();
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
  return {
    root,
    dialect: config.dialect ?? 'postgres',
    migrations,
    prisma,
    rails,
    django: config.django ?? findDjangoModels(root),
    queries: config.queries ?? ['.'],
    logs: config.logs ?? [],
    ignore: config.ignore ?? [],
    policy: { ...PULL_REQUEST_POLICY, ...(config.policy ?? {}) },
    model: config.model ?? 'ledgerline.model.json',
    baseline: config.baseline ?? 'ledgerline.baseline.json',
    report: config.report ?? 'ledgerline.html',
  };
}
