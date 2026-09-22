# Changelog

What changed for someone *using* Ledgerline. Format follows Keep a Changelog.

## [Unreleased]

### Fixed

- `EMPTY_SCHEMA` and the baseline's format version were each spelled out a
  second time by hand in another package, which is two places for one fact to
  live and drift. Both now come from the one place that defines them.
- `check` prints the exact baseline key beside each failing finding, so a
  reviewer who has decided *this one* is debt can paste one line into
  `ledgerline.baseline.json` instead of running `ledgerline baseline`, which
  would accept everything else with it.

### Added

- **`make reach`** (ADR-0006): every rule the model exports must have a caller
  outside the model, or a written reason in `scripts/model-internal.txt` for
  why it does not. It exists because `ledgerline usage` below was a rule with
  a unit test and no command — green, covered, and not a feature. Like every
  gate here it proves itself, by planting an export nothing could call and
  requiring the check to fail.

- **`ledgerline usage`** — ADR-0003 #2, which was a rule in the model with no
  command behind it until now. Given a query log in `ledgerline.json`, it says
  which tables no query touched and which columns no query named **in that
  window**, and `report` draws them faded. Every sentence names the window,
  and the command ends by saying so out loud: a column nothing read here may
  be read by a job that did not run. It never tells anyone to drop anything.
  With no log configured there is no window, so nothing is faded — the
  repository's own SQL is not a usage sample.
- The query reader now records every column a statement *names*, not only the
  ones it joins on: select lists, `GROUP BY`, `ORDER BY`, `HAVING`, the columns
  an `INSERT` writes, and `SELECT *`, which reads every column of the tables in
  scope and is expanded once the schema is known.

- **MySQL and MariaDB.** Set `"dialect": "mysql"` in `ledgerline.json` and the
  DDL and the queries are read in MySQL's spelling: backtick identifiers,
  `int(11)`, `ENGINE=InnoDB`, `KEY` clauses inside `CREATE TABLE`, `MODIFY`
  and `CHANGE COLUMN`, `LIMIT n, m`. MySQL is normalised into the one grammar
  rather than parsed by a second one (ADR-0004), and a statement the rewrite
  has no rule for — a partition clause, a generated column, a fulltext or
  spatial index, a trigger or a routine — is **skipped and counted**, never
  half-read. A diagram that quietly dropped a table would look complete.
- **Five more places a schema can come from**, for repositories that contain
  no SQL at all: Rails `db/schema.rb`, Django `models.py`, SQLAlchemy models,
  TypeORM entities and an EF Core `…ModelSnapshot.cs`. All are read as text
  and **never executed** (ADR-0005): running a repository's code to draw its
  diagram is a liability, not a feature. Each is found by looking, so no
  configuration is needed — a `models.py` is read as Django's or SQLAlchemy's
  according to what the file says it is, not its name.
- Each reader reproduces the conventions its ORM relies on and says so:
  Django's `<app>_<model>` table name from the directory, Rails' singularised
  foreign key column, TypeORM's snake_case default and `@JoinColumn`, EF Core's
  `HasColumnName` and its second `Entity` block for relationships. A
  `ManyToManyField` becomes the join table Django would create.
- Where a convention cannot be reproduced — a Rails plural the inflector does
  not know, a relation to a class in a file the reader never saw, an EF Core
  `OwnsOne` — the line is **reported as unread** and no edge is drawn.
- Migrations are still read first. An ORM file is used only when a repository
  has no migrations directory: two answers to one question is the thing this
  tool exists to complain about.

- **The command.** `ledgerline check` on a repository with no configuration and
  no database: it finds the migrations where migration tools put them, reads the
  queries out of the whole repository, and prints one sentence per finding with
  the line in it. `model` writes `ledgerline.model.json`; a stale one fails the
  check, because a stale diagram is the thing this exists to stop. `report`
  writes the HTML, `mermaid` the README's diagram, `baseline` accepts today's
  debt so an old codebase can turn the gate on today and pay it down one pull
  request at a time (ADR-0003 #12), `explain` prints the evidence chain and the
  DDL that would close a finding — for a person to put in a migration, never run
  by the tool (#13), `blast` says what a change to a table reaches and where to
  look (#9), `history` says when each table and column arrived, from the
  migration files (#7), and `pr` writes the pull-request comment that leads with
  a sentence and puts the detail in a `<details>` (#11).
- **The GitHub Action**, which is the same CLI: one comment per pull request,
  edited in place rather than added to on every push. No database required.
- **The tool gates itself.** `make self-check` runs `ledgerline check` on the
  shop fixture, requires it to find the two undeclared joins and the ghost
  table, requires it to pass once the constraints are declared, and plants a new
  join to watch it fail. `make badge-check` fails when the README's undeclared
  count disagrees with what the check says (#15).

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
