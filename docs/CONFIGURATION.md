# `ledgerline.json`

**Every field is optional, and the file itself is optional.** The defaults are
what a repository that has never heard of this tool would want. The four
worked examples at the end are the real configurations used to run the check
on real repositories — they are short, and three of the six needed no file at
all.

Put it at the repository root. A malformed file is an error naming the parse
failure, never a silent fallback.

---

## Where the schema comes from

Read in this order, and **never two at once**: two answers to one question is
the thing this tool exists to complain about, not to produce.

1. `migrations` 2. `prisma` 3. `rails` 4. `efcore` 5. `typeorm`
6. `sequelize` 7. `gostructs` 8. `django` / `sqlalchemy`

A migrations directory that exists but yields **no table** is skipped, not
obeyed. Rails puts Ruby in `db/migrate`, so the directory matches and contains
nothing readable while `db/schema.rb` sits beside it.

### `migrations`

Directories of `.sql`, relative to the root, applied in name order.
`*.down.sql` and anything under `down/` is skipped.

Found by looking when absent, in this order:

```
migrations · db/migrate · db/migrations · database/migrations
prisma/migrations · drizzle · supabase/migrations
server/migrations · src/migrations · sql/migrations
```

An entry **may end in a filename glob** when one directory holds a file per
dialect. Ory Kratos keeps 3483 migration files in one place —
`…_identities.postgres.up.sql` beside `…_identities.mysql.up.sql` — and
folding all of them together produces a schema that is three schemas:

```json
{ "migrations": ["persistence/sql/migrations/sql/*.postgres.up.sql"] }
```

### `prisma`, `rails`, `efcore`

A single file each. Found by looking when absent:

| Field | Looked for |
|---|---|
| `prisma` | `prisma/schema.prisma`, `schema.prisma` |
| `rails` | `db/schema.rb`, `db/primary_schema.rb` |
| `efcore` | `**/Migrations/*ModelSnapshot.cs` |

### `django`, `sqlalchemy`, `typeorm`, `sequelize`, `gostructs`

Lists of files, because in each of these a model is spread over many of them
and a relationship reaches across. All the files are read before anything is
resolved.

| Field | Found by looking |
|---|---|
| `django` | `models.py`, and `.py` under a `models/` package — the file must name `models.Model` |
| `sqlalchemy` | the same search; the file must name `__tablename__` or a declarative base |
| `typeorm` | `*.entity.ts` |
| `sequelize` | `.ts` under a `models/` directory mentioning `sequelize-typescript` |
| `gostructs` | `.go` under a `model/` directory carrying an `xorm:` or `gorm:` tag |

`models.py` belongs to Django *or* SQLAlchemy and the **file's content**
decides which, never its name — otherwise one reader would get the other's
files.

See [`SOURCES.md`](SOURCES.md) for what each reader reads and what it declines
to guess.

---

## Where the queries come from

### `queries`

Directories to read for SQL. Default: `["."]` — the whole repository.

A `.sql` suffix on the entry means *these are SQL files*; anything else is
read as source code, and string literals that have the shape of a query are
parsed. Sixteen languages are read for literals: TypeScript, JavaScript,
Python, Ruby, Go, C#, PHP, Java, Kotlin, Rust, Scala, Elixir and their
variants.

**A string is offered to the parser only if it has the shape of a statement** —
a `SELECT` with a `FROM`, an `INSERT INTO`, an `UPDATE` with a `SET`, a
`DELETE FROM`, a `WITH` that opens a subquery. Testing the first word instead
meant Mastodon reported 1947 refused statements, of which the overwhelming
majority were interface strings like `"Delete & re-draft"`.

### `logs`

Query logs — plain SQL, a `pg_stat_statements` JSON export, or a CSV with a
`query` column. This is the real answer for an application that speaks to its
database through an ORM and leaves no SQL in the repository.

**Every literal is replaced with `?` at read time, before anything is kept**,
so the evidence on an edge is the shape of a query and never a row. A test
plants a fake email address in a log and asserts it appears nowhere in the
model or the HTML.

Configuring `logs` also turns on the faded drawing in `report` and gives
`usage` its window.

### `ignore`

Paths the readers never descend into, on top of the built-in list. The
built-in list is `node_modules`, `.git`, `dist`, `build`, `vendor`, `.next`,
`target`, and **any directory named `migrations`, `migration` or `migrate`**.

That last one matters. A migration's DDL is the schema; its DML is history.
Outline's 2023 migration mentions `collection_users`, a table that was real
then and has since been renamed, and reading it as a query failed the build
over it. Kratos vendors another tool's migration *test stubs*, whose
`.down.sql` files produced six failing findings about tables a down script
drops.

The directories named in `migrations` are always ignored for queries too.

---

## `dialect`

`"postgres"` (the default) or `"mysql"`. MySQL is normalised into the one
grammar rather than parsed by a second one ([ADR-0004](adr/0004-mysql-is-normalised-into-the-one-grammar-and-says-what-it-dropped.md)),
and a statement the rewrite has no rule for — a partition clause, a generated
column, a fulltext or spatial index, a trigger, a routine — is **skipped and
counted**, never half-read.

**One repository can hold more than one.** memos keeps `store/db/postgres`,
`store/db/mysql` and `store/db/sqlite` side by side, so `dialect` also takes a
map from path prefix to dialect, longest prefix winning, `""` as the default:

```json
{ "dialect": { "": "postgres", "store/db/mysql": "mysql" } }
```

If you do not set it and the repository has MySQL in it, the summary line will
tell you:

```
187 not parsed (68 of them in backticks — set "dialect" for those paths)
```

---

## `policy`

Which findings fail the build, which warn, which inform, which are silent.
Every key takes `"fail"`, `"warn"`, `"info"` or `"ignore"`. The defaults are
chosen for a pull request:

| Key | Default | Finding |
|---|---|---|
| `usedUndeclared` | `fail` | a query relies on a relationship no constraint declares |
| `undeclaredTable` | `fail` | a query names a table no schema declares |
| `declaredUnused` | `warn` | a constraint nothing that was read uses |
| `orphanSide` | `warn` | a nullable referencing column with nothing checking it |
| `edgeRemoved` | `warn` | a relationship the committed model had and this one does not |
| `tableRemoved` | `warn` | a table the committed model had and this one does not |
| `namingDrift` | `info` | a name that promises a relationship nothing declares |
| `sharedParent` | `info` | a join between two columns that both reference the same third table |

A policy silences a *class* of finding without touching the model — the
relationship is still on the diagram, still traceable to its line. Use the
baseline for debt you intend to pay down; use the policy for a class of
finding your team does not want to hear about at all.

```json
{ "policy": { "declaredUnused": "ignore", "namingDrift": "warn" } }
```

---

## Output paths

| Field | Default |
|---|---|
| `model` | `ledgerline.model.json` |
| `baseline` | `ledgerline.baseline.json` |
| `report` | `ledgerline.html` |

---

## Four real configurations

These are the files used to run the check on real public repositories. Three
other repositories — Mastodon, NetBox and Outline — needed **no file at all**.

### memos — Go, hand-written SQL, three dialects

```json
{
  "migrations": ["store/migration/postgres"],
  "dialect": { "": "postgres", "store/db/mysql": "mysql" },
  "ignore": ["store/migration", "store/seed", "store/db/sqlite", "proto", "web"]
}
```

Its migrations are not in one of the usual places, and it keeps a directory
per dialect. Result: 17 tables, 187 statements, four true undeclared
relationships.

### Ory Kratos — one migration file per dialect

```json
{
  "migrations": ["persistence/sql/migrations/sql/*.postgres.up.sql"],
  "ignore": ["test", "internal/testhelpers", "contrib", "docs"]
}
```

### An ORM application with a query log

The configuration for a repository whose relationships are real and whose SQL
is not in the repository. The log is what makes the check say anything:

```json
{
  "logs": ["tmp/pg_stat_statements.json"],
  "policy": { "declaredUnused": "ignore" }
}
```

`declaredUnused` is silenced because a log is a window, and a relationship
absent from one window is not an unused relationship.

### A monorepo with a service per directory

```json
{
  "migrations": ["services/billing/migrations", "services/identity/migrations"],
  "queries": ["services", "packages"],
  "ignore": ["packages/generated"]
}
```

Several migration directories are one schema — a monorepo with a service each.

---

## What has no setting, on purpose

- **No credentials.** `--database-url` is a flag or an environment variable,
  read once, never written anywhere.
- **No remote anything.** No hosted tier, no telemetry, no update check.
- **No "suggest" mode.** There is no flag that makes the tool guess a table or
  a column; that is refused in [ADR-0003](adr/0003-fifteen-more-things-and-the-rule-each-one-passed.md)
  and stays refused.
