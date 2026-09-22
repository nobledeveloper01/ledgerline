# Journal

What we did, and what surprised us. One entry per working session, newest first.
The surprises are the point.

---

## 2026-09-23, later — Phase 5: MySQL, and two ORMs read without running them

**Did.** The MySQL rewrite (ADR-0004) grew `MODIFY`/`CHANGE COLUMN` and the
`ADD KEY` forms; a second 200-table corpus generated from the *same seed* as
the PostgreSQL one and written the way MySQL writes it; a test that asserts
the two corpora are the same schema; the Phase 2 property test repeated in
MySQL's spelling; Rails `schema.rb` and Django `models.py` readers (ADR-0005)
wired into the CLI behind migrations. 69 tests, 6 fixtures, 5 ADRs.

### What surprised us

**MySQL and PostgreSQL disagree about what an alter that omits something
means.** `ALTER TABLE t ALTER COLUMN c TYPE text` in PostgreSQL changes the
type and leaves the nullability alone. `ALTER TABLE t MODIFY COLUMN c text` in
MySQL restates the *whole column*, so a column that was `NOT NULL` becomes
nullable — the omission is the instruction. The rewrite had this right and the
corpus generator had it wrong, so four of two hundred tables came out with a
column nullable on one side and required on the other. The diff that found it
compared the two corpora table by table; no single-dialect test could have.

**A property test asserted something true for the wrong reason.** The MySQL
query property passed on the first run — and would have passed just as green
if the dialect switch had been a no-op, because PostgreSQL's parser is
forgiving enough to be worth checking against. The test now asserts the
*negative* as well: the same SQL read as PostgreSQL must fail to parse. That
caught the empty-query-set case immediately, which is the generator's way of
saying the assertion needed a guard, not that the idea was wrong.

**The honest part of an ORM reader is the list of what it did not read.**
Rails derives `user_id` from `"users"` by singularising, which means this
repository now contains an inflector, which means there are plurals it will
get wrong. The reader does not draw an edge whose column the table does not
have — it reports the line instead. Writing that rule was easier than writing
the inflector, and it is the rule that makes the inflector's gaps harmless.

### Still open

- Phase 4's gate, and Phase 5's repetition of it for MySQL: three real public
  repositories, every finding read by a person. Still an afternoon of reading,
  still not done, still not claimed.
- EF Core, TypeORM and SQLAlchemy readers. Three more of the same shape.

## 2026-09-23 — Phase 4's code: the command, the gate, and what is not cleared

**Did.** The baseline, explain, blast and usage rules in the model; schema
archaeology in sources; the CLI with nine commands; the Action; `self-check`
and `badge-check` as gates. 55 tests, 9 gates, `make ci` green.

### What surprised us

**The baseline stopped recognising its own debt.** The finding sentence
carries the support count — *(and 1 more)* — so copying a query into a second
file changed the sentence, changed the key, and resurrected debt somebody had
already accepted. The key strips the count and the line numbers now. The test
that caught it was the one that moved a query down a file.

**A test told me the truth about a test.** I asserted that a model with one
query, checked against a baseline from a model with three, had nothing new —
and it did have something new: with the other queries gone, a column that had
related to something now related to nothing, and naming drift fired. The rule
was right and my scenario was wrong.

**`explain` could not explain half its own findings.** It found the edge by
reading the arrow out of the sentence, and the orphan-side sentence has no
arrow. It reads that shape too now. A finding the tool cannot explain is a
finding a person cannot act on.

**The phase gate is not the code.** Everything in Phase 4's list is built and
tested, and the gate says *three public repositories, zero false findings,
read by a person*. That is not something I can do by writing more tests, and
the roadmap now says the code is ready to be tested against reality rather
than pretending the phase is cleared. This is the same discipline as the
handset gates in the mobile portfolio.

### Still open

- The Phase 4 gate itself: three real repositories, read by hand.
- Phase 5: MySQL, and the other ORM sources.

## 2026-09-23, small hours — Phase 3: the picture

**Did.** `@ledgerline/render`: ELK at build time, the SVG, the HTML with its
inline script, Mermaid and the badge line, seven tests including the contrast
assertion and a 200-table timing. Looked at the shop fixture in a browser:
the dotted undeclared joins with their marks, the ghost `audit_log` in a
dashed box, the polymorphic diamonds, focus dimming the rest and writing the
hash, the evidence panel showing the masked query. Phase 3 cleared; Phase 4
opened.

### What surprised us

**The evidence carried the comment above the query.** `-- The audit table
exists only in the queries.` was the first thing in the panel, because the
statement's location starts where the previous one ended. The evidence text
now skips leading comments the way the line count already did.

**A grey that passed on white failed on the header.** The ghost colour was
4.34:1 against the table-header fill; the test that composites every ink on
every surface caught it, and the ghost is a shade darker.

**`url(` is also a marker reference.** The no-network test forbade `url(` and
the SVG's own `marker-end="url(#crow)"` tripped it; the test now forbids
`url(` that is not `url(#`.

**What "accessibility audit" can mean in a test.** Labels, tab stops, a live
region, a role on the diagram, and contrast — those a test holds. A person
with a screen reader walking the diagram is not something this repository can
do, and the roadmap says so rather than claiming it.

### Still open

- Phase 4: the command, the gate, the Action, the pull-request comment, and
  the eight remaining things from ADR-0003.

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
