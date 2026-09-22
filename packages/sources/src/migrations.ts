/**
 * A migrations directory → the declared schema.
 *
 * Files are applied in name order, which is every migration tool's own
 * convention (a timestamp or a sequence number leads the name). Only `.sql`
 * files count; a tool's own bookkeeping — `meta/`, `.md`, snapshots — is
 * skipped. Files named `*.down.sql` or living under `down/` are the undo
 * scripts and are skipped too: folding an undo into the schema would drop
 * what the up script created.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { DeclaredSchema } from '@ledgerline/model';
import { foldMigrations, foldMigrationsReporting, type Dialect, type FoldResult } from '@ledgerline/parse';

export interface MigrationFile {
  readonly name: string;
  readonly sql: string;
}

const DOWN = /(^|[\\/])down[\\/]|\.down\.sql$|_down\.sql$/i;

/** `*.postgres.up.sql` → a regular expression over the file's own name. */
export function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Splits `a/b/*.postgres.up.sql` into the directory and the pattern. A path
 * with no `*` is a directory and every `.sql` under it counts.
 */
export function splitGlob(entry: string): { readonly dir: string; readonly match: RegExp | null } {
  const slash = entry.lastIndexOf('/');
  const last = slash < 0 ? entry : entry.slice(slash + 1);
  if (!last.includes('*') && !last.includes('?')) return { dir: entry, match: null };
  return { dir: slash < 0 ? '.' : entry.slice(0, slash), match: globToRegExp(last) };
}

export function listMigrations(dir: string, match: RegExp | null = null): MigrationFile[] {
  const out: MigrationFile[] = [];
  const walk = (d: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(d).sort();
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(d, entry);
      let directory: boolean;
      try {
        directory = statSync(full).isDirectory();
      } catch {
        continue;
      }
      if (directory) {
        walk(full);
        continue;
      }
      if (!entry.toLowerCase().endsWith('.sql')) continue;
      if (match !== null && !match.test(entry)) continue;
      const name = relative(dir, full);
      if (DOWN.test(name)) continue;
      out.push({ name, sql: readFileSync(full, 'utf8') });
    }
  };
  walk(dir);
  return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

export async function schemaFromMigrations(dir: string, dialect: Dialect = 'postgres', match: RegExp | null = null): Promise<DeclaredSchema> {
  return foldMigrations(listMigrations(dir, match), dialect);
}

/** The same, and what a MySQL rewrite could not read (ADR-0004). */
export async function schemaFromMigrationsReporting(dir: string, dialect: Dialect = 'postgres', match: RegExp | null = null): Promise<FoldResult> {
  return foldMigrationsReporting(listMigrations(dir, match), dialect);
}
