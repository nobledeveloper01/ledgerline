/**
 * `@ledgerline/parse`: PostgreSQL DDL → the declared schema, through
 * PostgreSQL's own grammar. An adapter; every rule stays in `@ledgerline/model`.
 */
export { parseDdl, foldMigrations, foldMigrationsReporting, SchemaBuilder, type Dialect, type FoldResult } from './ddl.ts';
export { mysqlToPostgres, type Rewritten } from './mysql.ts';
export { DdlSyntaxError } from './pg.ts';
export { claimsFromSql, maskLiterals, normalisePlaceholders, mysqlQueryToPostgres, type QueryClaims, type QuerySource, type QueryDialect } from './queries.ts';
