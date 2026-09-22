# Journal

What we did, and what surprised us. One entry per working session, newest first.
The surprises are the point.

---

## 2026-09-22, night — Phase 2: the queries, and fifteen more things

**Did.** ADR-0003 (fifteen things, four refused) before any code. Then
`claimsFromSql` over the PostgreSQL AST, the polymorphic pass, literal
masking, placeholder rewriting; four query sources including a string lexer
for eleven languages; support counts, the orphan-side and naming-drift
findings in the model; the 200-world property test; a fixture with real
migrations and real queries whose expected findings were read by hand. Phase
2 cleared; Phase 3 opened.

### What surprised us

**A doc comment closed itself.** The lexer's own documentation listed the
comment syntaxes it skips — including `/* */` — inside a `/** */` block, which
ended the block early; the next backtick opened a template literal that ran
forty lines until the lexer's own `` '`' ``. TypeScript reported an
unterminated string on the wrong line. Found by bisecting with `tsc`; the
comment now describes block comments in words.

**The polymorphic shape lives across clauses.** The join is in `JOIN … ON`
and the discriminator in `WHERE`, and the first pass looked for both inside
one predicate. The pass runs once per statement over everything it saw.

**`continue` swallowed the scalar subquery.** `a.x = (SELECT …)` fell into
the literal-equality branch, which continued before the subquery check was
reached. The test that had `users.id=orders.user_id` in its expected list
was the one that noticed.

**Statement locations sit before the comment.** libpg_query's location for a
statement that follows `--` is the comment's first byte, so the line count
skipped comments and whitespace as one leading run. And a template literal
that starts with a newline puts its `SELECT` on the next line, which is the
right line to report.

**The CTE shadowed nothing.** `WITH recent AS (…) SELECT … FROM recent` was
registering `recent` as a table because the CTE was in the same scope the
lookup skipped. A derived name now shadows a table of the same name at any
depth.

### Still open

- Phase 3: one static HTML file, ELK at build time, three edge treatments,
  focus subgraphs in the URL hash, Mermaid export, the accessibility audit.
- No command line yet; the model is reachable only through the packages and
  the fixture emitter.

## 2026-09-22, evening — Phase 1: the declared side, and the one word that differed

**Did.** `@ledgerline/parse` (libpg_query through `@pgsql/parser`, a
`SchemaBuilder` that folds statements in order), `@ledgerline/sources`
(migrations directory, Prisma via `@mrleebo/prisma-ast`, live PostgreSQL over
`pg_catalog`, the model file), a generated 200-table corpus, a `live-check`
gate, CI with a Postgres 16 service. Phase 1 cleared; Phase 2 opened.

### What surprised us

**The two readers disagreed on exactly one word.** Tables, columns,
nullability, keys, uniques, 375 foreign keys across three schemas — all
identical — and `serial` versus `integer`. PostgreSQL never stores `serial`;
it stores `integer` with a sequence default and reports `integer` back.
ADR-0002: spell every type as the database does. The gate that asks for
byte-identical output is the only reason this was found today rather than on
the first user's first diff.

**`node --test` runs files in parallel, and two of them shared a database.**
The 200-table gate found the small test's `orders` and `users` inside its own
introspection — one extra foreign key, 376 against 375. Each live test now
creates its own database from the maintenance connection. Isolation that was
not needed until a second file reached for the same server.

**`@pgsql/parser`'s ESM entry does not load.** It re-exports `./types`, a
directory, which Node's ESM resolver refuses; the CommonJS entry resolves it.
`createRequire` in an ESM file, one line, and a comment saying why.

**`pg` returns `name[]` as the literal `{a,b}`.** Every array column is cast to
`text[]` in the introspection queries so the driver parses it. Found in the
first row of the first run.

**Prisma's parser wants the file laid out the way Prisma writes it.** A
one-line `model User { id Int @id ... }` fails with *expecting LineBreak*;
fields on their own lines parse. Fine for real files, worth knowing for tests.

**The corpus is generated, not copied.** The roadmap said *from a public
open-source project*; a 200-table DDL dump of a GPL project inside an
Apache-2.0 repository is a licence question with no upside, and a generator
with a fixed seed gives renames, alters, composite and unnamed keys and three
schemas on demand. Real repositories are the Phase 4 gate, where the point is
finding true undeclared relationships in them, not parsing them.

### Still open

- Drizzle as a source moved to Phase 5 with the other ORMs; Prisma is in.
- Phase 2: the queries — joins, cross-table `WHERE`, subqueries, polymorphic
  pairs — into claims with evidence, and the property test over generated
  schemas and query sets.

## 2026-09-22, later — Phase 0, and the rules ahead of their inputs

**Did.** The pnpm workspace, `@ledgerline/model` with schema, claims, reconcile,
diff and findings, eleven tests, three fixtures with expected models diffed on
every build, the boundary gate, the fixtures gate, the Makefile, CI on Node 22.
Phase 0's gate cleared and Phase 1 opened.

### What surprised us

**ESLint's `patterns.group` does not do what a gitignore reader expects.**
`['*', '!./*', '!../*']` flagged the model's own relative imports; the negations
did not carry. The rule is a `regex: '^[^.]'` now — anything that does not start
with a dot is a package or a built-in — and the boundary check proved it fires
on `node:fs` before anything trusted it.

**Orientation from uniqueness turned out to be the whole cardinality story.** A
join does not say which way it points; a constraint does. With no constraint,
the side whose columns are the primary key or a unique constraint is the one
being pointed at, and if both or neither are unique the edge stays undirected
and *unknown*. Writing that down as a rule, with a test that a self-join stays
unknown, removed the temptation to guess — which is what every ERD tool that
draws a crow's foot on an inferred edge is doing.

**The gate for this phase was smaller than the code.** Phase 0 asked for one
fixture; reconcile, diff and findings were written because the model is one
package and the boundaries between those three are the design. Phase 1 now
only has to produce the inputs.

### Still open

- Phase 1: the real PostgreSQL grammar, migrations folded in order, Prisma and
  Drizzle, optional live introspection, and the model file on disk.
- `self-check` — the tool run on its own fixtures with a planted drift — waits
  for a CLI to run.

## 2026-09-22 — Started

**Did.** Searched the free ERD tool landscape (drawDB, ChartDB, Azimutt, Liam
ERD, dbdiagram.io, DrawSQL, QuickDBD, DBeaver, pgModeler, DbSchema, and the
rest), found the editors solved and free, and found the gaps: diagrams that go
stale, relationships the DDL never declares, no diff between versions, nothing
derived from the queries an application actually runs. Wrote the product
statement for the tool that starts from queries and treats the diagram as a
claim to be checked. Chose the toolchain, wrote the roadmap with an exit gate
per phase, and opened the repository.

**What surprised us.** How uniformly the category ignores the queries. Every
tool — free or paid, editor or generator — starts from `CREATE TABLE` or a
live connection. The one place the true relationships are written down, the
SQL the application runs, is read by none of them.

**Still open.** Everything. Phase 0 is the workspace and the gates.
