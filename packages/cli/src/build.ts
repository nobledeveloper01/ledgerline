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
import { claimsFromLog, claimsFromRepository, claimsFromSqlFiles, parseDjangoModels, parseEfCoreSnapshot, parsePrisma, parseRailsSchema, parseSqlAlchemyModels, parseTypeOrmEntities, schemaFromDatabase, schemaFromMigrations, type Gathered } from '@ledgerline/sources';
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
  /** What the queries named, for `usage` (ADR-0003 #2). Stars are not expanded here. */
  readonly mentions: readonly string[];
}

export interface BuildOptions {
  /** Read the declared schema from a live database instead of the files. */
  readonly databaseUrl?: string;
}

const NONE: Gathered = { relationships: [], polymorphic: [], parsed: 0, unparsed: 0, sources: 0, mentions: [] };

function join2(a: Gathered, b: Gathered): Gathered {
  return {
    relationships: [...a.relationships, ...b.relationships],
    polymorphic: [...a.polymorphic, ...b.polymorphic],
    parsed: a.parsed + b.parsed,
    unparsed: a.unparsed + b.unparsed,
    sources: a.sources + b.sources,
    mentions: [...new Set([...a.mentions, ...b.mentions])],
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
    parts.push(await schemaFromMigrations(full, config.dialect));
    names.push(dir);
  }
  // A repository has one declared schema; migrations are the truth when they
  // exist, and the ORM file is the truth when they do not. Read in that order,
  // and never both — two answers to one question is the thing this tool exists
  // to complain about, not to do.
  if (parts.length === 0 && config.prisma && existsSync(join(config.root, config.prisma))) {
    parts.push(parsePrisma(readFileSync(join(config.root, config.prisma), 'utf8')));
    names.push(config.prisma);
  }
  if (parts.length === 0 && config.rails && existsSync(join(config.root, config.rails))) {
    parts.push(parseRailsSchema(readFileSync(join(config.root, config.rails), 'utf8')).schema);
    names.push(config.rails);
  }
  if (parts.length === 0 && config.efcore && existsSync(join(config.root, config.efcore))) {
    parts.push(parseEfCoreSnapshot(readFileSync(join(config.root, config.efcore), 'utf8')).schema);
    names.push(config.efcore);
  }
  if (parts.length === 0 && config.typeorm.length > 0) {
    // Every entity file at once: a relation names a class in another file.
    const files = config.typeorm.filter((f) => existsSync(join(config.root, f))).map((f) => ({ path: f, text: readFileSync(join(config.root, f), 'utf8') }));
    if (files.length > 0) {
      parts.push(parseTypeOrmEntities(files).schema);
      names.push(`${files.length} TypeORM ${files.length === 1 ? 'entity' : 'entities'}`);
    }
  }
  if (parts.length === 0) {
    for (const models of config.django) {
      const full = join(config.root, models);
      if (!existsSync(full)) continue;
      parts.push(parseDjangoModels(readFileSync(full, 'utf8'), full).schema);
      names.push(models);
    }
    for (const models of config.sqlalchemy) {
      const full = join(config.root, models);
      if (!existsSync(full)) continue;
      parts.push(parseSqlAlchemyModels(readFileSync(full, 'utf8')).schema);
      names.push(models);
    }
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
    gathered = join2(gathered, q.endsWith('.sql') ? await claimsFromSqlFiles(full, schema, config.root, config.dialect) : await claimsFromRepository(full, schema, config.dialect));
  }
  for (const log of config.logs) {
    const full = join(config.root, log);
    if (existsSync(full)) gathered = join2(gathered, await claimsFromLog(full, schema, log, config.dialect));
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
    mentions: gathered.mentions,
  };
}
