# Every finding, and what to do about it

Nine findings. Each one is a sentence with a file and a line in it, and each
one is here with what it means, what it does **not** mean, and what a
reasonable person does next.

Every sentence in this file was produced by a real run against a real
repository.

| Code | Default | One line |
|---|---|---|
| [`used_undeclared`](#used_undeclared) | `fail` | a query relies on a relationship no constraint declares |
| [`undeclared_table`](#undeclared_table) | `fail` | a query names a table no schema declares |
| [`declared_unused`](#declared_unused) | `warn` | a constraint nothing that was read uses |
| [`orphan_side`](#orphan_side) | `warn` | a nullable referencing column with nothing checking it |
| [`edge_removed`](#edge_removed) | `warn` | a relationship the committed model had and this one does not |
| [`table_removed`](#table_removed) | `warn` | a table the committed model had and this one does not |
| [`name_without_join`](#name_without_join) | `info` | a `<x>_id` column that relates to nothing |
| [`name_disagrees`](#name_disagrees) | `info` | a column whose name says one table and whose join says another |
| [`shared_parent`](#shared_parent) | `info` | a join between two columns that both reference the same third table |

Change any of them in `policy` — see [`CONFIGURATION.md`](CONFIGURATION.md).

---

## `used_undeclared`

**The reason the product exists.**

> fail: The join in `store/db/postgres/attachment.go:147` relies on
> `public.attachment.memo_id → public.memo.id`, which no constraint declares.

A query joins two columns. The database does not know they are related, so it
will not stop a row pointing at nothing, will not cascade, and will not use
the index it would have created.

**What to do.** `ledgerline explain "attachment.memo_id"` prints the evidence
chain and the exact DDL:

```sql
ALTER TABLE public.attachment
  ADD CONSTRAINT attachment_memo_id_fkey
  FOREIGN KEY (memo_id)
  REFERENCES public.memo (id);
```

Put that in a migration. Ledgerline will not run it.

**When it is not a bug.** Some teams deliberately have no foreign keys —
sharded tables, a table written by another service, a soft-delete scheme that
cascades would break. That is a decision, and it belongs in the baseline or in
`policy`, said out loud, rather than in everyone's head.

**Cardinality comes from uniqueness, never from the name.** A crow's foot
appears only when a primary key or unique constraint proves it; otherwise the
end is a plain line marked *unknown*. Every other tool draws the foot from the
column's name.

---

## `undeclared_table`

> fail: `public.collection_users` is queried (`public.collections`) and no
> schema declares it.

A query names a table that is not in the schema at all. Drawn on the diagram
as a dashed ghost, with the queries that touch it.

**What to do.** One of three things is true, and they are easy to tell apart:

1. **The table is real and the schema source is wrong** — a migrations
   directory the tool did not find, or one that yielded nothing. Check the
   first line of `check` output: it names where the schema came from.
2. **The table was renamed.** Old migrations and old code reference names that
   no longer exist; see `ignore` in [`CONFIGURATION.md`](CONFIGURATION.md).
3. **The query is wrong** and would fail at run time. That is the case worth
   catching.

---

## `declared_unused`

> warn: `public.memo_share.memo_id → public.memo.id` is declared by
> `memo_share_memo_id_fkey` and used by no query that was read.

A constraint exists and nothing in the queries that were read joins over it.

**This is a fact about your sample, not about your database.** It is only ever
claimed about a table some query actually named — if no query touched the
table, the tool says nothing about it and reports the size of the blind spot
once:

> info: 102 of 116 tables were named by no query that was read, so nothing is
> said about what their relationships are for.

**What to do.** Usually nothing. An application that speaks to its database
through an ORM leaves almost no SQL to find: Mastodon has 22 statements for
116 tables. Point `logs` at a query log if you want an answer worth acting on,
or set `declaredUnused: "ignore"` and stop reading them.

---

## `orphan_side`

> warn: Rows in `public.attachment` may reference no `public.memo`:
> `memo_id` is nullable and no constraint checks it.

The classic source of orphaned rows. A query treats the column as a reference,
the column can be null, and nothing checks what a non-null value points at —
so a deleted parent leaves children pointing at an id that no longer exists.

**What to do.** Decide whether null means *not yet* or *never*. If the former,
add the constraint and keep the column nullable. If the latter, add the
constraint and `NOT NULL` — and expect the migration to find rows that are
already orphaned.

---

## `edge_removed` · `table_removed`

> warn: `ledgerline.model.json` is out of date: 1 relationship removed

These come from the **diff** between the committed `ledgerline.model.json` and
what the code says now. They are the drift half of the tool: something that
was in the model is not any more.

**What to do.** If the removal is intended, `ledgerline check --write` and
commit the new model — the diff in the pull request is the review. If it is
not intended, something was deleted that should not have been.

A stale model file fails the check on its own, because a stale diagram is the
thing this exists to stop.

---

## `name_without_join`

> info: `public.statuses.conversation_id` is named like a reference to
> `conversations` and no constraint or query relates them.

A column named `<table>_id` where `<table>` exists, and nothing — no
constraint, no query that was read — relates them. **Names that lie.**

This is the finding that says most about a Go or Rails codebase, because
neither xorm nor GORM creates a foreign key: Woodpecker CI produced 29 of
these and every one was true by construction.

**What to do.** Read three or four of them. Each is one of:

- a real relationship nobody declared — add the constraint;
- a column that means something else — rename it, because the next person will
  read it the way this tool did;
- a relationship used only by code paths the tool could not read — point
  `logs` at a query log.

**What it is not.** It is not a claim that the relationship exists. It is a
claim that the *name* promises one.

---

## `name_disagrees`

> info: `public.orders.customer_id` is named like a reference to `customers`,
> and the join in `reports/summary.sql:14` relates it to `public.users`.

The stronger half of naming drift: the name says one table, the queries say
another. One of the two is wrong and it is worth knowing which.

**What to do.** Usually the name is stale — a table was renamed and the
columns pointing at it were not. Occasionally the join is the bug.

---

## `shared_parent`

> info: `public.identities.nid` and `public.identity_credentials.nid` are
> joined, and both already reference `public.networks`. That is a correlation
> through a shared parent, not a missing relationship.

**This never fails, by design.** A multi-tenant application joins on its
tenant column in every query it has. Ory Kratos joins
`identities.nid = identity_credentials.nid`, and both of those columns have a
declared foreign key to `networks.id`. No constraint relates the two of them
to each other, and none should: they are not related to each other, they are
both related to `networks`.

Before [ADR-0007](adr/0007-a-join-through-a-shared-parent-is-not-a-missing-relationship.md)
this was a `used_undeclared` failure, firing on *every query in the
repository* — the false positive that makes a team turn a gate off and never
turn it back on.

**What to do.** Nothing, usually. It is worth reading once, because it tells
you which column is your partition key whether or not anybody wrote that down.

**The rule is deliberately narrow:** single-column joins only, and only when
both sides have a declared target in common. A composite join, or a column
with no declared target, is left alone — the evidence for the conclusion is
not there.

---

## Severities, and what they do

| | |
|---|---|
| `fail` | exit code 1. The build stops. |
| `warn` | printed, exit code unaffected. |
| `info` | printed dim, exit code unaffected. |
| `ignore` | not computed and not printed. |

## Three ways to make a finding go away

They are not interchangeable, and choosing the wrong one is how a gate becomes
noise:

1. **Fix it.** Add the constraint. `explain` prints the DDL.
2. **Baseline it** — `ledgerline baseline`. For debt you have decided to pay
   down later. It is committed, reviewed, and only *new* findings fail after
   it. `check` prints the exact line to paste when you want to accept one
   finding rather than all of them.
3. **Policy it** — `"policy": { "declaredUnused": "ignore" }`. For a class of
   finding your team does not want to hear about at all.

Use the baseline for debt and the policy for a decision. Filling a baseline
with findings the tool should never have made teaches everybody that the
findings are noise.
