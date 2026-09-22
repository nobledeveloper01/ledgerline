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

**Phase 2 of 5 — queries → model, the technical core.** The rules exist and
are tested, and the declared side is read: PostgreSQL DDL through PostgreSQL's
own grammar, migrations folded in order, `schema.prisma`, and a live database —
with migrations and the live database proven to agree byte for byte on a
200-table corpus, on every CI run. What nothing reads yet is the queries; that
is this phase. Nothing is usable from the command line yet.

**The numbers.** 22 tests across three packages, two of them against a real
PostgreSQL · 4 fixtures diffed on every build, one of 200 tables · 7 gates, the
boundary gate broken on purpose every run · 2 ADRs.

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
