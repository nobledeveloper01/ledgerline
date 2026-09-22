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

## Phase 1 — Schema → model · **current**

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

**Exit gate.** *Every schema in `fixtures/` — including one with 200 tables from a
public open-source project — parses to the model its fixture declares; the same
schema read from migrations and from a live database produces byte-identical model
files.*

## Phase 2 — Queries → model — **the technical core**

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

**Exit gate.** *A property test over generated schemas and query sets: no
relationship that appears in a query is missing from the used model, and no
relationship in the used model lacks a line of evidence. On the fixture corpus, the
"used and never declared" list matches what a person found by hand, with zero false
edges.*

## Phase 3 — The report

The diagram people look at.

- One static HTML file: layout computed at build time with ELK, rendered as
  SVG, with pan, zoom, search, focus-on-table and the three edge states in three
  unmistakable treatments. Works from `file://`; no server; no runtime fetch.
- Click an edge: the evidence. Click a table: its columns, indexes, and every
  query that touched it.
- Mermaid `erDiagram` export for READMEs; the declared subset only, because
  Mermaid cannot draw the three states.
- Dark and light, 200% text, keyboard-navigable, contrast asserted in a test.

**Exit gate.** *The 200-table fixture renders in under two seconds and is
navigable; every edge state is distinguishable without colour (a shape or a dash,
not only a hue); an accessibility audit of the HTML passes.*

## Phase 4 — Drift as a gate → **v1.0**

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

**Exit gate.** *Run against three public open-source repositories with real
histories, `ledgerline check` finds at least one true undeclared relationship in
each and reports zero false ones; the pull-request comment renders on a real PR in
this repository.*

## Phase 5 — Breadth · v1.1

- MySQL/MariaDB DDL and query dialect.
- More ORM sources: EF Core model snapshots, Django `models.py`, Rails
  `schema.rb`, TypeORM entities, SQLAlchemy.
- A hosted GitHub App for the PR comment, if anyone asks — convenience only;
  the CLI stays the product.

**Exit gate.** *The Phase 2 property test and the Phase 4 gate hold on a MySQL
fixture corpus of the same size as the PostgreSQL one.*

---

## What is never on this roadmap

A schema editor. A hosted database connection. A NoSQL diagram. An AI that
suggests tables. Each is refused in the product statement, with the reason.
