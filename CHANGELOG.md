# Changelog

What changed for someone *using* Ledgerline. Format follows Keep a Changelog.

## [Unreleased]

### Added

- **The picture.** One static HTML file: ELK's layered layout computed at build
  time, inline SVG, and a few hundred lines of inline script for pan, zoom,
  search, focus at one or two hops with the focus in the URL hash (ADR-0003 #10),
  an evidence panel that shows every query behind an edge, and a theme toggle.
  Nothing fetched; opens from `file://`. The five kinds of thing are told apart
  without colour — solid, dashed, dotted with a warning mark, dash-dot with a
  diamond, dashed outline — and a crow's foot appears only where a key proved
  it. Every table and edge has a label and a tab stop; both palettes clear
  4.5:1 on every surface, asserted in a test.
- **Mermaid for the README.** The declared subset as an `erDiagram` — solid
  where used, dashed where not — and the badge line, *N undeclared joins*,
  counting what the picture could not honestly draw (#15).

- **The used side is read.** SQL the application runs becomes relationship
  claims with evidence: `JOIN … ON`, `JOIN … USING`, cross-table `WHERE`,
  `IN (SELECT …)`, scalar subqueries, `EXISTS`, `UPDATE … FROM`, `DELETE …
  USING`, `INSERT … SELECT`; CTEs and derived tables are not mistaken for
  tables; an unqualified column is resolved from the schema when unambiguous and
  skipped, never guessed, otherwise. The Rails/Laravel polymorphic shape —
  `owner_type = '…'` beside `owner_id = other.id`, same prefix — is one edge with
  its targets. Sources: `.sql` directories, query logs (plain, `pg_stat_statements`
  JSON, CSV), and string literals lexed out of source files in eleven languages
  with `?`, `:name`, `%s`, `%(name)s` and `${…}` placeholders rewritten; comments
  and vendored directories skipped.
- **Query-log privacy** (ADR-0003 #14). Every literal — strings, numbers,
  dollar-quoted blocks — is replaced by `?` before evidence is kept, and a test
  plants an email address in a log and asserts it appears nowhere.
- **Confidence per edge** (#3): how many distinct places support an inferred
  edge, and the finding says *(and 3 more)*. **Cardinality only from uniqueness**
  (#4): a crow's foot needs a key behind it. **The orphan side** (#5): a nullable
  referencing column with no constraint is its own warning. **Ghost tables**
  (#1): a table only the queries name is listed and fails. **Names that lie**
  (#8): a `<x>_id` column nothing relates, or one that relates to a table its
  name does not say, as information.

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
