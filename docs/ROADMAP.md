# Roadmap

Six phases. Each has an **exit gate** that is a thing you can run, not a feeling.
`PHASE` at the repository root holds the number of the current phase. A phase does
not advance until its gate is green in CI.

The product statement is `docs/00-PRODUCT-STATEMENT.md`; read it first. The
toolchain and every dependency, with the reason for each, is `docs/TOOLCHAIN.md`.

---

## Phase 0 — Foundation · **cleared 2026-09-22**

The repository, the gates, and the one decision the whole product rests on: the
model is a pure package that imports nothing.

- pnpm workspace: `packages/model` (pure TypeScript: the schema model, the
  relationship model, reconciliation, diff — no I/O, no parser, no platform),
  `packages/cli`, `packages/render`.
- Gates in `make ci`: typecheck, lint, the **boundary gate** (the model package may
  import nothing but itself, proved by a test that plants a forbidden import and
  watches the lint fail), the doc gate, tests.
- CI on GitHub Actions, Node 22, Ubuntu.
- The fixture corpus started: `fixtures/` holds small real-world-shaped
  PostgreSQL schemas and query sets, each with the expected model written down.

**Exit gate.** *`make ci` is green on a fresh clone with an empty model; the boundary
gate has been broken on purpose and seen to fail; a fixture with two tables and one
join produces the model the fixture file says it should.*

**Cleared.** `make ci` green locally and on CI; `make boundary` plants a `node:fs`
import in the model and asserts the lint fails, every run; `fixtures-check` was
broken by changing one line number in a fixture and refused, then restored. The
model went further than the gate asked: reconcile, diff and findings are all
written and tested, so Phase 1 has only to produce their inputs.

## Phase 1 — Schema → model · **cleared 2026-09-22**

Reading what the database declares.

- PostgreSQL DDL parsed with the real PostgreSQL grammar (`libpg_query` via
  `@pgsql/parser`, WebAssembly, no native build): `CREATE TABLE`, `ALTER TABLE …
  ADD CONSTRAINT`, `CREATE INDEX`, enums, schemas, `DROP`.
- **Migrations folded in order** — a directory of `.sql` files, or a Prisma
  `schema.prisma`, or Drizzle TypeScript files — into one declared schema, so
  a repository with no database still produces a model.
- Optional live introspection over `pg` for the teams that can point at a
  database: `information_schema` and `pg_catalog`, read-only, one query set.
- The model file: `ledgerline.model.json`, canonical ordering, stable ids,
  diff-friendly.

**Exit gate.** *Every schema in `fixtures/` — including one with 200 tables —
parses to the model its fixture declares; the same schema read from migrations and
from a live database produces byte-identical model files.*

**Cleared.** `@ledgerline/parse` reads DDL through libpg_query (PostgreSQL's own
grammar as WebAssembly) and folds migrations in order — create, alter, rename,
drop, unique indexes; `@ledgerline/sources` reads a migrations directory, a
`schema.prisma`, and a live PostgreSQL over `pg_catalog`. The 200-table corpus
is generated (`make large`) rather than copied from a public project, so it is
licence-free and deterministic; real repositories are Phase 4's gate. Migrations
and a live PostgreSQL 16 agree byte for byte on every corpus, locally and on CI
(`make live-check`, with a Postgres service). Drizzle sources move to Phase 5
with the other ORMs; Prisma is in.

## Phase 2 — Queries → model — **the technical core** · **cleared 2026-09-22**

Reading what the application does.

- Query sources: a plain SQL log, a `pg_stat_statements` export, a `.sql` corpus
  captured from a test run, and SQL literals found in source files.
- Join inference: every `JOIN … ON a.x = b.y`, every `WHERE a.x = b.y` across
  tables, every `IN (SELECT …)` becomes a **relationship claim** with its
  evidence — the query, the file, the line.
- Polymorphic inference: the `owner_type = '…' AND owner_id = …` shape and the
  `CASE`/`WHERE type IN` shapes become a polymorphic relationship with its
  discriminator and its target set, never three flat edges.
- Cardinality inferred from uniqueness on the joined columns; unknown stays
  unknown and is drawn as unknown.
- Reconciliation: the declared model and the used model become one, with every
  edge in one of three states — **declared and used**, **declared and never used**,
  **used and never declared**.
- From ADR-0003: ghost tables (#1), confidence per edge from the count of
  distinct queries (#3), cardinality only from uniqueness (#4), the orphan-side
  finding (#5), naming drift (#8), and query-log privacy — every literal replaced
  before anything is kept (#14).

**Exit gate.** *A property test over generated schemas and query sets: no
relationship that appears in a query is missing from the used model, and no
relationship in the used model lacks a line of evidence. On the fixture corpus, the
"used and never declared" list matches what a person found by hand, with zero false
edges.*

**Cleared.** `claimsFromSql` walks the PostgreSQL AST — joins, `USING`,
cross-table `WHERE`, `IN (SELECT …)`, scalar subqueries, `EXISTS`, `UPDATE …
FROM`, `DELETE … USING`, `INSERT … SELECT`, CTEs and derived tables kept out of
the table set — and the polymorphic shape by prefix. The property test runs 200
generated worlds under a fixed seed. Sources: `.sql` directories, query logs
(plain, `pg_stat_statements` JSON, CSV), and string literals lexed out of
source files in eleven languages with each driver's placeholders rewritten;
every literal masked before evidence is kept, and a test asserts a planted
email appears nowhere. The `shop-with-queries` fixture holds the hand-checked
list: two undeclared joins, one unused constraint, one ghost table, one
polymorphic edge with two targets, zero false edges.

## Phase 3 — The report · **cleared 2026-09-22**

The diagram people look at.

- One static HTML file: layout computed at build time with ELK, rendered as
  SVG, with pan, zoom, search, focus-on-table and the three edge states in three
  unmistakable treatments. Works from `file://`; no server; no runtime fetch.
- Click an edge: the evidence. Click a table: its columns, indexes, and every
  query that touched it.
- Mermaid `erDiagram` export for READMEs; the declared subset only, because
  Mermaid cannot draw the three states.
- Dark and light, 200% text, keyboard-navigable, contrast asserted in a test.
- From ADR-0003: focus subgraphs at one or two hops, with the focus in the URL
  hash so a link to a subgraph needs no server (#10).

**Exit gate.** *The 200-table fixture renders in under two seconds and is
navigable; every edge state is distinguishable without colour (a shape or a dash,
not only a hue); an accessibility audit of the HTML passes.*

**Cleared.** ELK's layered layout at build time; one HTML file with inline SVG
and a few hundred lines of inline script — pan, zoom, search, focus at one or
two hops with the focus in the URL hash, an evidence panel, a theme toggle,
keyboard for every table and edge. The 200-table fixture lays out and renders
in well under two seconds and the file fetches nothing. Solid / dashed / dotted
with a mark / dash-dot with a diamond / dashed outline for the five kinds of
thing; a crow's foot only where a key proved it. Both palettes clear 4.5:1 on
every surface, asserted. What "an accessibility audit" meant here is what a
test can hold: a label and a tab stop on every table and edge, a live region for
the panel, `role="img"` on the diagram, and contrast; a screen-reader pass by a
person is not a thing a test does, and is noted in the journal.

## Phase 4 — Drift as a gate → **v1.0** — the code is built, the gate is not cleared

The reason the product exists.

- `ledgerline check`: recompute the model, diff against the committed one, exit
  non-zero on any drift, with one sentence per finding a reviewer can act on —
  *the join in `reports/summary.sql:14` relies on `orders.customer_id → customers.id`,
  which no migration declares.*
- Severities, with defaults chosen for the pull request: a used-and-undeclared
  relationship fails; a declared-and-unused one warns; an unused table informs.
- The GitHub Action: runs `check`, and on a pull request renders **before and
  after** as one diagram with additions, removals and altered columns marked,
  posted as a comment. Everything the Action does is also one CLI command.
- Usage on the diagram when a query log is provided: reads and writes per table
  and column in the window; unused drawn faded.
- From ADR-0003: dead columns (#2), schema archaeology from the migration files
  (#7), the blast radius of a table (#9), the pull-request comment that is a
  sentence first (#11), the baseline for adopting the gate on an old codebase
  (#12), explaining a finding with the DDL that would close it (#13), and the
  README badge whose number comes from the check (#15).

**Exit gate.** *Run against three public open-source repositories with real
histories, `ledgerline check` finds at least one true undeclared relationship in
each and reports zero false ones; the pull-request comment renders on a real PR in
this repository.*

**The gate has been run against three repositories, and is still not
cleared** — read `docs/GATE-PHASE-4.md`, which is the evidence and not the
verdict. Mastodon, Outline, NetBox, memos, Kratos and Woodpecker CI were run on
2026-09-23;
every finding was checked against the repository's own schema file; nine
findings on Mastodon and four on memos were confirmed true, and one false one
was found and fixed. Twenty-three bugs in this tool came out of it, including a
check that went green on a repository it could not read, and a false positive
on Kratos that fired on every query in the repository (ADR-0007).

**A fourth repository does meet it.** memos — a Go application that writes its
own SQL — produced four failing findings, each a real join in real source that
no constraint declares, and all four verified against a schema with exactly
one foreign key in it. What the gate needs now is two more repositories of
that kind, which is a search, not a script.

**The gate as written cannot be met by the first three**, and that is the most
useful thing the run produced. It asks for a true *undeclared relationship* —
one a query relies on and no constraint declares — and all three speak to
their databases through an ORM, so there is almost no SQL in them to read: 22
statements for Mastodon's 116 tables, 3 for NetBox's 91. Meeting it needs
either repositories that contain raw SQL, or a query log pointed at one of
these. Which of those the gate should ask for is a decision, not a script, and
it is written down at the end of `docs/GATE-PHASE-4.md`.

**The code is built; the gate is not cleared, and will not be claimed.** The
command exists — `check`, `model`, `report`, `mermaid`, `baseline`, `explain`,
`blast`, `history`, `pr` — with a config file that is optional, a stale model
file failing the build, and the Action that posts one comment and edits it in
place. `make self-check` runs the tool on its own fixture, watches it find the
drift, watches it pass once the constraints are declared, and watches a planted
join fail it. `make badge-check` fails when the README's number disagrees with
what the check says.

What is **not** done is the gate itself: three public repositories, run by hand,
with a person reading every finding to say whether it is true. That is an
afternoon of reading, not a script, and until somebody does it the honest state
of this phase is *the code is ready to be tested against reality*. Nothing in the
README or the changelog says otherwise.

## Phase 5 — Breadth · v1.1 · **current** — the MySQL half is cleared, the ORM half is built

- MySQL/MariaDB DDL and query dialect.
- More ORM sources: EF Core model snapshots, Django `models.py`, Rails
  `schema.rb`, TypeORM entities, SQLAlchemy.
- A hosted GitHub App for the PR comment, if anyone asks — convenience only;
  the CLI stays the product.

**Exit gate.** *The Phase 2 property test and the Phase 4 gate hold on a MySQL
fixture corpus of the same size as the PostgreSQL one.*

**The MySQL half of the gate is cleared.** `fixtures/large-200-mysql` is the
*same* 200-table schema as `fixtures/large-200`, generated from the same seed
and written the way MySQL writes it — backticks, `int(11)`, `ENGINE=InnoDB`,
`KEY` clauses inside the table body, `MODIFY COLUMN`. A test asserts the two
corpora reconcile to the same tables, the same columns, the same nullability,
the same keys and the same 375 foreign keys, and that the only two types that
differ are the two MySQL has no word for. The Phase 2 property test is
repeated in MySQL's spelling, and asserts that the same SQL read as PostgreSQL
does *not* parse — so the dialect is proved to be doing the work rather than
being a no-op that happens to be green.

**All the ORM sources are built, and one more the roadmap never listed.**
Rails `db/schema.rb`, Django `models.py`, SQLAlchemy models, TypeORM entities
and EF Core model snapshots are read as text and never executed (ADR-0005),
wired into the CLI behind migrations, and tested against real-shaped files —
including, in every one of them, the case where the reader *declines to guess*
and reports the line instead. A CLI test runs `check` on a repository whose
only schema is two TypeORM entity files and watches it find a drift, so none
of this is a reader nobody calls.

**Go structs with xorm or GORM tags** were added for the same reason, and are
the reader with the most to say: neither ORM creates a foreign key, so a Go
application of that shape keeps every relationship in its queries. Woodpecker
CI reads as 19 tables and 29 columns whose names promise a relationship that
nothing declares.

**sequelize-typescript** was added because running the check on a real
repository demanded it: Outline has 30 MB of TypeScript, 56 real SQL
statements in its own source, and no file this tool could read as a schema,
because Sequelize migrations are JavaScript and Sequelize models are decorated
classes. It is now read as 41 tables and 128 foreign keys. That is the
argument for the exit gate being a real repository rather than a corpus.

**What the gate still waits on** is the Phase 4 half of it: the same
three-real-repositories reading, done against MySQL repositories. That is the
same afternoon of human reading Phase 4 waits on, and it is not claimed here
either.

---

## What is never on this roadmap

A schema editor. A hosted database connection. A NoSQL diagram. An AI that
suggests tables. Each is refused in the product statement, with the reason.
