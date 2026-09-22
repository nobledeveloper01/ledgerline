/**
 * Where to look, and how loudly to complain.
 *
 * `ledgerline.json` at the repository root, every field optional, every
 * default the thing a repository with no configuration would want: migrations
 * wherever a migration tool puts them, queries everywhere in the repository,
 * the pull-request policy. A missing file is not an error — the wedge is one
 * command on a repository that has never heard of this tool.
 */

import { existsSync, readFileSync } from 'node:fs';
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

export interface Config {
  /** Migration directories, relative to the root. Found by looking when absent. */
  readonly migrations?: readonly string[];
  /** A `schema.prisma`. Found by looking when absent. */
  readonly prisma?: string;
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
  readonly migrations: readonly string[];
  readonly prisma: string | null;
  readonly queries: readonly string[];
  readonly logs: readonly string[];
  readonly ignore: readonly string[];
  readonly policy: Policy;
  readonly model: string;
  readonly baseline: string;
  readonly report: string;
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
  return {
    root,
    migrations,
    prisma,
    queries: config.queries ?? ['.'],
    logs: config.logs ?? [],
    ignore: config.ignore ?? [],
    policy: { ...PULL_REQUEST_POLICY, ...(config.policy ?? {}) },
    model: config.model ?? 'ledgerline.model.json',
    baseline: config.baseline ?? 'ledgerline.baseline.json',
    report: config.report ?? 'ledgerline.html',
  };
}
