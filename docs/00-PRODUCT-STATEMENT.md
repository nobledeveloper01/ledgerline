# Ledgerline — Product Statement

**The diagram of your database that is derived from what your code actually does, and that fails the build when the two disagree.**

> **Read this section first.** Every ER diagram tool on the market starts from the `CREATE TABLE`
> statements or a live connection, draws a picture, and stops. The picture is wrong within a week,
> and nobody notices until an outage. Ledgerline starts from the other end — the queries and the
> models the application runs — and treats the diagram as a claim that has to be checked, not a
> drawing that has to be admired.

---

## The Problem

A team keeps a database diagram for three reasons: to onboard the next engineer, to reason about a
change before making it, and to answer "what talks to what" during an incident. In practice the
diagram fails at all three, for the same underlying cause: **it is a copy of the schema, and copies
drift.**

The failure has four specific shapes, and the free tools on the market address none of them:

1. **The diagram is stale.** A migration lands, the diagram in the wiki does not move. drawDB,
   dbdiagram.io, ChartDB and every visual editor produce an artefact that is true on the day it is
   exported. Liam ERD regenerates in CI, which is better, but it regenerates *from the DDL* — so it
   is always as true as the DDL and never checks anything against anything.
2. **The DDL lies by omission.** The relationships a codebase relies on are often not declared as
   foreign keys at all — Rails, Laravel, Django and most hand-grown PostgreSQL schemas carry
   `user_id` columns with no constraint, polymorphic `owner_type`/`owner_id` pairs, and join
   tables the ORM knows about and the database does not. A diagram generated from constraints
   shows a set of islands. The relationships exist; they exist in the queries.
3. **Nobody can see what changed.** "What did release 14 do to the schema" is a `git diff` of a
   migration file, read by one person. There is no free tool that shows two versions of a schema
   as one diagram with the difference marked, and the one paid tool that comes close (DbSchema)
   locks it behind Pro.
4. **The diagram cannot say what is *unused*.** A table nobody has queried in a year, a column no
   code reads, an index nothing hits — these are invisible on every ERD, because every ERD is
   drawn from what exists, not from what is used.

The result is that engineering teams treat the ERD as documentation theatre: produced for the
audit, ignored for the work.

---

## The Product

Ledgerline is a command-line tool and a static report that a repository runs in CI.

1. **Queries → ERD.** Ledgerline reads the SQL the application actually issues — from a query log,
   from a `pg_stat_statements` dump, from an ORM's generated SQL captured in a test run, or from
   the SQL literals and ORM model files in the repository — and derives the entity-relationship
   model from the **joins**. `JOIN orders ON orders.user_id = users.id` is a relationship whether or
   not a foreign key declares it. A `WHERE owner_type = 'Post' AND owner_id = ...` pattern is a
   polymorphic relationship, and it is drawn as one, with the discriminator named.
2. **Schema → ERD, held to the queries.** The declared schema (migrations, DDL, or a live
   connection) is read alongside, and the two are reconciled into one diagram with three kinds of
   edge: **declared and used**, **declared and never used**, **used and never declared**. The last
   kind is the one that bites in production, and it is drawn in a colour nobody can miss.
3. **Drift as a gate.** The reconciled model is written to a file in the repository. On every CI
   run Ledgerline recomputes it and diffs. A new relationship the queries rely on that no
   migration added, a column the code reads that the schema dropped, a foreign key that was
   removed while a join still depends on it — each is a failing check with a sentence a reviewer
   can act on. The diagram cannot go stale, because a stale diagram is a red build.
4. **Change as a diagram.** For a pull request, Ledgerline renders the schema *before and after* as
   one diagram with additions, removals and altered columns marked, and posts it as a comment.
   The reviewer sees the shape of the change, not a migration file.
5. **Usage on the diagram.** Where a query log is provided, every table and column carries how
   often it was read or written in the window. Unused tables are drawn faded. The ERD becomes the
   first honest answer to "can we drop this".
6. **A single static HTML file** as the output, with pan, zoom, search and focus-on-table, that
   works from a `file://` URL with no server, checked into the repo or published to Pages. And a
   Mermaid `erDiagram` export for the README, because the README is where people look.

---

## What Ledgerline Deliberately Refuses To Do

- **It does not edit the schema.** No drag-and-drop, no "generate migration from diagram". drawDB
  and dbdiagram.io do that well and for free; a third editor is not a product. Ledgerline reads,
  reconciles and reports; the migration is written by the engineer, in the migration tool the
  team already has.
- **It does not hold your data.** Ledgerline runs where the code runs. A query log, a schema and a
  diagram never leave the repository or the CI runner. There is no hosted tier that asks for a
  database connection string, because a diagramming tool with production credentials is a
  liability wearing a feature's clothes.
- **It does not guess silently.** A relationship inferred from a join is labelled *inferred from
  queries*; one declared by a constraint is labelled *declared*. A polymorphic association is
  drawn as a polymorphic association, never flattened into three ordinary edges. The diagram
  distinguishes what it knows from what it worked out, on the diagram.
- **It does not "AI" the schema.** No prompt-to-diagram, no generated table suggestions. Every
  edge on the diagram is traceable to a line of SQL or a line of DDL, and clicking it shows the
  line.
- **It does not require a database.** The repository alone — migrations plus code — is enough to
  produce a diagram and a drift check. A live connection and a query log make it richer; neither
  is required, so the tool works on the first day on any project, including one whose production
  database no engineer is allowed to touch.

---

## The Insight

**A database diagram is a claim about the system, and a claim is only worth having if something
checks it.**

Every existing tool treats the ERD as an *output* — the last step, the thing you export. Ledgerline
treats it as an *assertion* that sits between two things that can disagree: what the schema
declares and what the code does. Held between them and recomputed on every commit, the diagram
stops being documentation and becomes a test — the same move that makes a parity fixture between a
domain package and its server mirror worth more than either side's unit tests alone.

The queries are the part nobody uses, and they are the part that is true. A schema says what a
database *permits*; the queries say what the application *does*. The relationships that matter in
an incident are the ones in the second set.

---

## The Wedge

**`ledgerline check` on a repository with migrations and no query log.**

One command, no database, no account. It reads the migrations, reads the ORM models and SQL
literals in the code, draws the diagram, and prints every relationship the code relies on that the
schema does not declare. On most real codebases older than a year, that list is not empty, and the
first time an engineer sees it they understand the product.

It works with zero other users. It carries no data-handling risk because nothing leaves the
machine. And it produces the artefact — the reconciled model file — that the drift gate and the
pull-request diagram build on, so the second command is free once the first is run.

---

## Target User

**Primary — the backend engineer on a team of two to twenty, on a codebase old enough to have
drifted.** Django, Rails, Laravel, NestJS/Prisma, EF Core, or hand-written SQL; PostgreSQL first,
MySQL second. They have a diagram somewhere and do not trust it. They review pull requests that
touch migrations and want to see the change, not read it.

**Secondary — the engineer inheriting a system.** The first week on a legacy codebase is spent
working out what talks to what. Ledgerline's first run is that week, compressed.

**Not the target:** the data analyst modelling a warehouse from scratch, the student drawing an ERD
for a course, the enterprise architect with a Vertabelo licence. They are served, and they do not
have this problem.

---

## Why Now

- **The free editors have won their category.** drawDB (38k stars) and ChartDB (22k) are good and
  free; dbdiagram.io is the paid reference. There is no room for another editor, and no need for
  one. The open ground is everything that happens *after* the diagram exists.
- **Liam ERD proved the shape.** An Apache-2.0 CLI that regenerates a diagram in CI has 5k stars
  in under two years. Teams want the diagram to live in the pipeline. Nobody has yet made the
  pipeline *check* it.
- **Query logs are cheap now.** `pg_stat_statements` ships with every PostgreSQL; every ORM can
  log its SQL; every test suite can capture it. The raw material for queries → ERD exists on every
  project and is used by nobody for this.
- **Pull-request review is where schema mistakes are caught or missed**, and the tools that live
  there — linters, coverage, bundle-size bots — are the model. A schema bot that posts a before-
  and-after diagram is a shape reviewers already know how to read.

---

## Explicitly Not

- Not a hosted SaaS, not a database client, not a migration tool, not a schema designer.
- Not a data catalogue. Ledgerline knows tables, columns and relationships; it does not know
  lineage, owners, PII classification or freshness.
- Not multi-database in v1. PostgreSQL is the first and only target until the query-to-ERD
  inference is right; MySQL follows; NoSQL never, because an ERD is the wrong picture of a document
  store and drawing one would be a lie.
- Not a paid product at launch. Open source, Apache-2.0, in the same shape as Liam ERD. If there
  is ever a paid tier it is for the pull-request bot as a hosted GitHub App, which is convenience,
  not capability — everything it does must remain runnable from the CLI for free.
