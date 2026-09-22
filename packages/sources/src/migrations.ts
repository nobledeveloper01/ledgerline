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

export function listMigrations(dir: string): MigrationFile[] {
  const out: MigrationFile[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d).sort()) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.toLowerCase().endsWith('.sql')) continue;
      const name = relative(dir, full);
      if (DOWN.test(name)) continue;
      out.push({ name, sql: readFileSync(full, 'utf8') });
    }
  };
  walk(dir);
  return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

export async function schemaFromMigrations(dir: string, dialect: Dialect = 'postgres'): Promise<DeclaredSchema> {
  return foldMigrations(listMigrations(dir), dialect);
}

/** The same, and what a MySQL rewrite could not read (ADR-0004). */
export async function schemaFromMigrationsReporting(dir: string, dialect: Dialect = 'postgres'): Promise<FoldResult> {
  return foldMigrationsReporting(listMigrations(dir), dialect);
}
