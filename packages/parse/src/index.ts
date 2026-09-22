/**
 * `@ledgerline/parse`: PostgreSQL DDL → the declared schema, through
 * PostgreSQL's own grammar. An adapter; every rule stays in `@ledgerline/model`.
 */
export { parseDdl, foldMigrations, SchemaBuilder } from './ddl.ts';
export { DdlSyntaxError } from './pg.ts';
