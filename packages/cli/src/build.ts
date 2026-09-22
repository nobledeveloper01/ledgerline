/**
 * Reading a repository into a model.
 *
 * The one path every command shares: find the declared schema (migrations,
 * a Prisma file, or a live database), gather the claims (SQL files, source
 * literals, query logs), reconcile, and say what was read so a person can
 * tell an empty result from a result of nothing.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { reconcile, type Claims, type DeclaredSchema, type Model } from '@ledgerline/model';
import { claimsFromLog, claimsFromRepository, claimsFromSqlFiles, parsePrisma, schemaFromDatabase, schemaFromMigrations, type Gathered } from '@ledgerline/sources';
import { readFileSync } from 'node:fs';

import type { Resolved } from './config.ts';

export interface BuildReport {
  readonly model: Model;
  readonly schema: DeclaredSchema;
  readonly from: string;
  readonly queriesRead: number;
  readonly statementsParsed: number;
  readonly statementsUnparsed: number;
  readonly sources: number;
}

export interface BuildOptions {
  /** Read the declared schema from a live database instead of the files. */
  readonly databaseUrl?: string;
}

const NONE: Gathered = { relationships: [], polymorphic: [], parsed: 0, unparsed: 0, sources: 0 };

function join2(a: Gathered, b: Gathered): Gathered {
  return {
    relationships: [...a.relationships, ...b.relationships],
    polymorphic: [...a.polymorphic, ...b.polymorphic],
    parsed: a.parsed + b.parsed,
    unparsed: a.unparsed + b.unparsed,
    sources: a.sources + b.sources,
  };
}

export async function declaredSchema(config: Resolved, options: BuildOptions = {}): Promise<{ schema: DeclaredSchema; from: string }> {
  if (options.databaseUrl) {
    return { schema: await schemaFromDatabase(options.databaseUrl), from: 'the database' };
  }
  const parts: DeclaredSchema[] = [];
  const names: string[] = [];
  for (const dir of config.migrations) {
    const full = join(config.root, dir);
    if (!existsSync(full)) continue;
    parts.push(await schemaFromMigrations(full));
    names.push(dir);
  }
  if (parts.length === 0 && config.prisma && existsSync(join(config.root, config.prisma))) {
    parts.push(parsePrisma(readFileSync(join(config.root, config.prisma), 'utf8')));
    names.push(config.prisma);
  }
  if (parts.length === 0) return { schema: { tables: [], foreignKeys: [] }, from: 'nothing' };
  // Several migration directories — a monorepo with a service each — are one schema.
  const schema: DeclaredSchema = {
    tables: parts.flatMap((p) => p.tables).sort((a, b) => (`${a.schema}.${a.name}` < `${b.schema}.${b.name}` ? -1 : 1)),
    foreignKeys: parts.flatMap((p) => p.foreignKeys).sort((a, b) => (a.name < b.name ? -1 : 1)),
  };
  return { schema, from: names.join(', ') };
}

export async function buildModel(config: Resolved, options: BuildOptions = {}): Promise<BuildReport> {
  const { schema, from } = await declaredSchema(config, options);
  let gathered = NONE;
  for (const q of config.queries) {
    const full = join(config.root, q);
    if (!existsSync(full)) continue;
    gathered = join2(gathered, q.endsWith('.sql') ? await claimsFromSqlFiles(full, schema, config.root) : await claimsFromRepository(full, schema));
  }
  for (const log of config.logs) {
    const full = join(config.root, log);
    if (existsSync(full)) gathered = join2(gathered, await claimsFromLog(full, schema, log));
  }
  const claims: Claims = { relationships: gathered.relationships, polymorphic: gathered.polymorphic };
  return {
    model: reconcile(schema, claims),
    schema,
    from,
    queriesRead: gathered.relationships.length + gathered.polymorphic.length,
    statementsParsed: gathered.parsed,
    statementsUnparsed: gathered.unparsed,
    sources: gathered.sources,
  };
}
