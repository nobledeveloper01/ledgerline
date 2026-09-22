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

<!-- ledgerline:start -->

**3 undeclared joins** in the example schema below — counted by `ledgerline check`, not by anyone's say-so.

```mermaid
erDiagram
  public_comments {
    bigint id PK
    text owner_type
    bigint owner_id
    text body
  }
  public_invoices {
    integer id PK
    integer order_id
    boolean paid
  }
  public_orders {
    integer id PK
    integer user_id
    numeric total
    timestamp_with_time_zone created_at
  }
  public_photos {
    bigint id PK
    text url
  }
  public_posts {
    bigint id PK
    text title
  }
  public_refunds {
    integer id PK
    integer invoice_id
    numeric amount
  }
  public_users {
    integer id PK
    text email UK
  }
  public_refunds }o..|| public_invoices : "invoice_id"
  public_invoices }o--|| public_orders : "order_id"
```

<!-- ledgerline:end -->

## Status

**Phase 5 of 5 — breadth. MySQL is in; two of the five ORM sources are.**
`ledgerline check` runs on a repository with no configuration and no database,
finds the relationships the queries rely on that no migration declares, and
exits non-zero. There is a baseline for old codebases, `explain` with the DDL
that would close a finding, `blast` for what a change reaches, `history` from
the migration files, a static HTML report, a Mermaid diagram, and a GitHub
Action that posts one pull-request comment and edits it in place. The tool
gates itself: `make self-check` plants a drift in its own fixture and requires
the check to fail.

**MySQL** is normalised into the one grammar (ADR-0004) and says what it
dropped rather than drawing a diagram that looks complete. The proof is a
second 200-table corpus: the same generated schema as the PostgreSQL one, from
the same seed, written the way MySQL writes it, asserted to reconcile to the
same tables, columns, nullability, keys and all 375 foreign keys.

**Rails `db/schema.rb` and Django `models.py`** are read as text and never run
(ADR-0005), for the repositories that contain no SQL at all.

**What is not done, in order of how much it matters:**

1. Running the check against three real public repositories and reading every
   finding by hand to confirm it is true — Phase 4's gate, and Phase 5 repeats
   it for MySQL. Until that afternoon happens this is code that works on its
   own corpus, which is not the same claim.
2. **EF Core model snapshots, TypeORM entities and SQLAlchemy.** Three more
   readers of the same shape as the two that exist. Not started.

```
npx ledgerline check
```

**The numbers.** 69 tests across five packages, two against a real PostgreSQL,
three of them 200-world properties · 6 fixtures diffed on every build, two of
them 200 tables — the same schema in PostgreSQL and in MySQL · 9 gates, three
of them — the boundary, the fixtures and the tool itself — broken on purpose
every run · 5 ADRs.

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
