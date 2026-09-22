# Ledgerline

**The diagram of your database, derived from what your code actually does — and a
build that fails when the two disagree.**

Every ER diagram tool starts from `CREATE TABLE` or a live connection, draws a
picture, and stops. The picture is stale within a week, and the relationships a
codebase really relies on — the `user_id` with no foreign key, the
`owner_type`/`owner_id` pair, the join table only the ORM knows about — never
appear on it.

Ledgerline starts from the other end. It reads the SQL your application runs and
the schema it declares, reconciles them into one model, draws it as a single
static HTML file, and runs in CI: a relationship the code uses that no migration
declares is a red build, and a pull request that touches the schema gets a
before-and-after diagram as a comment.

```
npx ledgerline check          # one command, no database, no account
```

## Status

**Phase 4 of 5 — drift as a gate.** The model, the readers and the picture
exist: the declared side (DDL through PostgreSQL's own grammar, migrations,
Prisma, a live database) and the used side (joins, subqueries and the
polymorphic shape read out of `.sql` files, query logs and source literals in
eleven languages, every literal masked) reconcile into one model, held by a
200-world property test, and render as one static HTML file with pan, zoom,
search, focus subgraphs and an evidence panel. What does not exist yet is the
command and the gate — `ledgerline check` failing a build — which is this phase.

**The numbers.** 43 tests across four packages, two of them against a real
PostgreSQL, one a 200-world property · 5 fixtures diffed on every build, one of
200 tables · 7 gates, the boundary gate broken on purpose every run · 3 ADRs,
one of them fifteen more things.

| | |
|---|---|
| Read first | [`docs/00-PRODUCT-STATEMENT.md`](docs/00-PRODUCT-STATEMENT.md) |
| The phases and their exit gates | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Every dependency, and why | [`docs/TOOLCHAIN.md`](docs/TOOLCHAIN.md) |
| Decisions | [`docs/adr/`](docs/adr/) |
| Working notes | [`docs/JOURNAL.md`](docs/JOURNAL.md) |

## What it refuses to be

Not a schema editor (drawDB and dbdiagram.io are free and good). Not a hosted
service that holds a connection string. Not an AI that suggests tables. Every
edge on the diagram is traceable to a line of SQL or DDL, and the tool runs
where the code runs.

## Licence

Apache-2.0.
