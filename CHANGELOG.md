# Changelog

What changed for someone *using* Ledgerline. Format follows Keep a Changelog.

## [Unreleased]

### Fixed

Everything in this group was found by running `ledgerline check` on real
repositories — Mastodon (Rails, 116 tables), Outline (Sequelize, 41) and
NetBox (Django, 91) — which is Phase 4's exit gate being done rather than
described.

- **The Django reader now reads Django as it is actually written.** A large
  project splits its models into a *package*, so the app label — which is half
  of every default table name — is the directory above `models/`, not
  `models`; every field spans five or six lines, so a reader that worked a
  line at a time saw none of them; and a `ForeignKey('dcim.Cable')` reaches
  into another file, so every file is read before anything is resolved. On
  NetBox this is the difference between no schema at all and 91 tables.
- A Django `GenericForeignKey` is reported, not drawn. It is a polymorphic
  association — a real relationship, and not a foreign key.

- **A CTE in front of an UPDATE or a DELETE was read as a table.** `WITH
  lockable AS (…) UPDATE documents …` reported `lockable` as a table the
  queries use and no schema declares: a failing finding about a name that
  exists only inside that one statement. `WITH` was read for `SELECT` and
  nowhere else.
- **An unqualified column in a subquery was resolved against the wrong
  query.** `DELETE FROM stars WHERE NOT EXISTS (SELECT NULL FROM documents doc
  WHERE doc.id = "documentId")` reads `documentId` from the outer `stars`;
  resolving it against the inner scope invented a `documents.documentId` and
  a self-join that does not exist. An unqualified column now walks out through
  the enclosing scopes, which is what a correlated reference is.
- **A join through a shared parent is no longer a failure** (ADR-0007). Ory
  Kratos is multi-tenant: every table carries an `nid` with a declared foreign
  key to `networks.id`, and every query joins on it. The check failed the
  build over `identities.nid → identity_credentials.nid` — true, and the
  worst kind of false positive, because it fires on every query in the
  repository. When both ends of an inferred edge already reference the same
  table the finding is `shared_parent`, it is an `info`, and its sentence says
  what the join actually is.
- **An empty migration file no longer ends the run.** Kratos ships several
  placeholder `.sql` files, and one of them stopped `check` with *Query cannot
  be empty* before a single finding was printed.
- **A `migrations` entry may end in a filename glob.** Kratos keeps 3483
  migration files in one directory, one per dialect —
  `…_identities.postgres.up.sql` beside `…_identities.mysql.up.sql` — and
  folding all of them together produces a schema that is three schemas.
  `"migrations": ["persistence/sql/migrations/sql/*.postgres.up.sql"]` now
  works.
- **Any directory named `migrations` or `migrate` is skipped by the query
  scan**, not only the configured ones. Kratos vendors another tool's
  migration *test stubs*, and reading their `.down.sql` files as queries
  produced six failing findings about tables that a down script drops.
- **One repository can hold more than one dialect.** memos keeps
  `store/db/postgres`, `store/db/mysql` and `store/db/sqlite` side by side,
  and `dialect` was one setting for a whole repository — an assumption, not a
  fact. It now also takes a map from path prefix to dialect, longest prefix
  winning. And a bare *187 not parsed* is not a useful thing to tell someone:
  the summary now says how many of the refusals were written in backticks,
  and that `dialect` takes a path.
- **`DELETE FROM` is the only legal spelling**, and the *looks like SQL* test
  allowed anything between the two words, so `"delete member from nested
  name"` was still being handed to the parser.
- **A named parameter with a cast on it is a parameter.** The rewrite of
  `:name` to `$n` refused any name followed by `::`, so `:startUuid::uuid` —
  which is what a Sequelize query looks like — was left for the parser to
  choke on. On Outline this one lookahead was the single biggest reason real
  SQL went unread: with it gone the statements read went from 12 to 22 and
  the ones refused from 12 to 2.
- **An interpolation where a table name goes is read as a name.** `SELECT
  "documentId" FROM ${this.workingTable}` is a real Outline statement, and
  `${…}` there is a table, not a value. A statement that fails to parse as a
  value is now retried as a name. Nothing is claimed about the table itself —
  a table named at run time is not one this tool can speak about — but the
  rest of the statement is read, and it is no longer counted as a failure.
- **A cast in a join condition is read through.** `ON u.id = o.user_id::integer`
  is an ordinary join and was not seen as one.
- **Migration directories are no longer read as queries.** They are the
  schema; their DML is history. Outline's 2023 migration mentions
  `collection_users`, a table that was real then and has since been renamed,
  and the tool failed the build over it. The `ignore` setting — which was
  read from the config file and never used — now works too, and the migration
  directories join it.

- **"No findings. Every relationship the queries rely on is declared" is a
  claim about the queries**, and there is none to make when the queries
  touched none of the declared tables. NetBox reads three statements and names
  not one of its 91 tables in them; the check now says so instead.
- **A check that read no schema now fails.** It used to print *No findings.
  Every relationship the queries rely on is declared.* and exit 0 for a
  repository it had not read a single table of. In a pipeline that is the
  worst failure this tool can have: the migrations move, the tool finds none,
  and the build is green for ever after. It now fails and prints where it
  looked.
- **A migrations directory that yields no table is not a schema.** Rails puts
  *Ruby* in `db/migrate`, so the directory existed, matched, and contained
  nothing this tool could read — while `db/schema.rb` sat beside it. The
  fallback to an ORM file now turns on emptiness, not existence.
- **Declared-and-unused is only claimed about a table some query named.**
  Mastodon produced 148 warnings that a relationship was *used by no query
  that was read*; every one was true and none was worth reading, because no
  query touching those tables was read either — an ActiveRecord application
  leaves almost no SQL to find. Absence of a query is not evidence of an
  unused relationship when the sample is empty. The count of tables nothing
  read is now stated once, as a fact about the sample. On Mastodon that turns
  148 warnings into 34, all of them about tables the queries really did read.
- **"1947 not parsed" was 1947 English sentences.** A string was offered to
  the parser if its first word was `SELECT`, `INSERT`, `UPDATE`, `DELETE` or
  `WITH` — which is also how a great many interface strings begin:
  `"delete"`, `"Delete & re-draft"`, `"Select your favourite fruit or not. Up
  to you."`. The test is now the *shape* — a SELECT with a FROM, an INSERT
  INTO, an UPDATE with a SET — and on Mastodon the count of statements the
  parser refused went from 1947 to 2, with the same findings. The sources
  reported went from 613 to 36, which is the number of files that really do
  contain SQL.
- **Ruby's `#{…}` is a placeholder**, like `${…}`, `?`, `:name` and `%s`
  already were. Both of the two statements still unread on Mastodon after the
  change above were queries with Ruby interpolation in them; one of them now
  parses, and the other interpolates its own FROM clause and is honestly
  beyond reading.
- **A repository that does not hold still is still read.** A dangling symlink
  crashed the whole run with exit 70. An unreadable directory, a vanished
  file and a broken link are now skipped, because one broken link is not a
  reason to abandon the other six hundred files.

- `EMPTY_SCHEMA` and the baseline's format version were each spelled out a
  second time by hand in another package, which is two places for one fact to
  live and drift. Both now come from the one place that defines them.
- `check` prints the exact baseline key beside each failing finding, so a
  reviewer who has decided *this one* is debt can paste one line into
  `ledgerline.baseline.json` instead of running `ledgerline baseline`, which
  would accept everything else with it.

### Added

- **The README is the documentation now.** It was a pitch with a status
  section: what the tool was for, and nothing about how to use it. It carries
  quick start, what it reads, the commands with real output, the
  configuration that covers almost every case, the findings table, the CI
  snippet and what it refuses to be — enough to land on the repository and be
  running in a minute, with the four reference pages behind it for the detail.
- **User documentation, which did not exist.** The repository was thoroughly
  documented for whoever *builds* it — a product statement, a roadmap, seven
  ADRs, a journal — and had nothing for whoever *uses* it: no command
  reference, no configuration reference, no explanation of what a finding
  means. Four pages now: [`docs/USAGE.md`](docs/USAGE.md) (install and every
  command, with real output from real repositories),
  [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) (every `ledgerline.json`
  field and four working configurations),
  [`docs/FINDINGS.md`](docs/FINDINGS.md) (every finding, what it means, what
  it does *not* mean, and what to do) and
  [`docs/SOURCES.md`](docs/SOURCES.md) (the ten places a schema can come
  from).
- **`make user-docs-check`** keeps them true. It derives the command list from
  the CLI dispatcher, the findings from the model, and the settings from the
  `Config` interface, and fails when any of them is missing from its page — so
  an eleventh command cannot ship undocumented. Like every gate here it proves
  itself, by planting a command the documentation cannot mention and requiring
  the check to fail.

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
- **Go struct tags — xorm and GORM — as a schema source**, which was the last
  large ecosystem with no reader. It is also the one this tool has most to say
  about: neither ORM creates a foreign key constraint, so a Go application of
  that shape has its relationships *only* in its queries. Woodpecker CI reads
  as 19 tables and **29 columns whose names promise a relationship that
  nothing declares**. `TableName()` names the table when the repository
  defines one — often in another file, so every file is read first — and where
  it does not, the ORM's own default mapper is used and the assumption is
  reported.
- **sequelize-typescript models as a schema source.** A Sequelize repository
  has no file that is the schema: its migrations are *JavaScript* calling
  `queryInterface.createTable` and its models are decorated TypeScript
  classes. Outline was unreadable to this tool for exactly that reason, and
  is now read as 41 tables and 128 foreign keys. `@Table({ tableName })` names
  the table, a class no `@Table` decorates is a base or a helper and not a
  table, and a base class lends its columns to everything that extends it —
  which is where the primary key lives in every Sequelize repository worth
  reading.
- **Seven more places a schema can come from**, for repositories that contain
  no SQL at all: Rails `db/schema.rb`, Django `models.py`, SQLAlchemy models,
  TypeORM entities, sequelize-typescript models, Go structs with xorm or GORM
  tags, and an EF Core `…ModelSnapshot.cs`. All are read as text
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
