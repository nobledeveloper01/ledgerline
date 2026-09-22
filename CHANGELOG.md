# Changelog

What changed for someone *using* Ledgerline. Format follows Keep a Changelog.

## [Unreleased]

### Added

- **The declared side is read.** PostgreSQL DDL through PostgreSQL's own grammar
  (libpg_query as WebAssembly, no native build): `CREATE TABLE` with inline and
  table-level constraints, `ALTER TABLE` add/drop column, add/drop constraint,
  set/drop not null, alter type, `RENAME` of tables and columns, `CREATE UNIQUE
  INDEX`, `DROP TABLE`; functions, triggers, data and grants skipped. A migrations
  directory folds in name order, up scripts only. A `schema.prisma` becomes the
  schema Prisma would migrate to, `@map` and `@@map` honoured. A live PostgreSQL
  is read over `pg_catalog`, read-only, one query set, with `pg` an optional
  dependency loaded only then. Types are spelled as the database reports them
  (ADR-0002), which is what lets migrations and a live database produce the same
  bytes — proven on a 200-table corpus against PostgreSQL 16 on every CI run.
- **The model file.** `ledgerline.model.json`: sorted keys, stable ids, versioned,
  refused with a sentence when the format is not the one this tool writes.

- **The rules, with nothing else in them.** `@ledgerline/model`: a declared schema
  and a set of relationship claims — each with the query, file and line it came
  from — reconcile into one model whose every edge is *declared and used*,
  *declared and never used*, or *used and never declared*. Direction comes from a
  constraint when there is one and from uniqueness otherwise; a join between two
  non-unique sides stays undirected and its cardinality stays *unknown* rather than
  guessed. A polymorphic association is one edge with its targets, never three
  flat ones. A table only the queries know about is a ghost, listed, never
  invented. A claim without evidence is not a claim.
- **The diff and the findings.** Two models diff into tables, columns and edges
  added, removed and changed state, so adding the constraint a join relied on reads
  as *used-and-undeclared became declared-and-used*. Each finding is one sentence
  with the line in it — *The join in reports/summary.sql:14 relies on
  orders.user_id → users.id, which no constraint declares.* — under a policy whose
  pull-request default fails on that and warns on the rest.
- **The gates.** Typecheck, lint, the boundary gate that plants a `node:fs` import
  in the model and asserts the lint fails, the documentation gate, and the fixtures
  gate that regenerates every expected model and refuses a rule change with no
  fixture change. The same `make ci` runs locally, in the pre-push hook and on CI.
