# Using Ledgerline

Every example on this page is real output from a real repository. Where a
number appears it was produced by the run, not written by hand.

---

## Install

Node 22 or later. Nothing else — no database, no account, no daemon.

```
npx ledgerline check
```

That is the whole of the first run. It looks for migrations where migration
tools put them, falls back to whatever ORM file the repository has, reads the
SQL out of the repository, and prints one sentence per finding.

## What it does, in one paragraph

Ledgerline reads two things that are supposed to agree and tells you where
they do not. The **declared schema** is what your migrations or your ORM say
exists. The **claims** are the relationships your queries actually rely on —
every join, every `IN (SELECT …)`, every `EXISTS`. Reconciling the two gives a
model where every relationship has a state, and every state has evidence
behind it: a file and a line you can open.

Three states, and the whole product is about the third:

| State | Meaning |
|---|---|
| `declared_and_used` | A constraint declares it and a query uses it. Nothing to say. |
| `declared_unused` | A constraint declares it; no query that was read uses it. A fact about your sample. |
| `used_undeclared` | **A query relies on it and no constraint declares it.** The thing that pages somebody at 2am. |

## The commands

```
ledgerline check [--write] [--database-url URL]   recompute and fail on drift
ledgerline model [--database-url URL]             write ledgerline.model.json
ledgerline report [--out FILE]                    write the HTML report
ledgerline mermaid                                print an erDiagram for the README
ledgerline baseline                               accept today's findings so the gate can go on today
ledgerline explain <text>                         the evidence, and the DDL that would close it
ledgerline blast <table>                          what a change to it reaches
ledgerline history [table]                        when each table and column arrived
ledgerline usage                                  what the window touched, and what it did not
ledgerline pr                                     the pull-request comment, a sentence first
```

Options, on every command:

| | |
|---|---|
| `--root DIR` | the repository root (default: the working directory) |
| `--database-url URL` | read the declared schema from a live database instead of the files. Also `LEDGERLINE_DATABASE_URL` |
| `--no-color` | plain output |
| `--help`, `--version` | |

### `check` — the one that goes in CI

Exit code **1** on any `fail` finding, or when `ledgerline.model.json` is out
of date. Exit **0** otherwise.

Run on [memos](https://github.com/usememos/memos), a Go application with 17
tables and exactly one `FOREIGN KEY` in its whole schema:

```
schema from store/migration/postgres · 187 statements in 64 sources · 120 not parsed
fail: The join in store/db/postgres/attachment.go:147 relies on public.attachment.memo_id → public.memo.id, which no constraint declares.
    store/db/postgres/attachment.go:147
warn: Rows in public.attachment may reference no public.memo: memo_id is nullable and no constraint checks it.
info: public.reaction.memo_id is named like a reference to memo and no constraint or query relates them.
```

The first line is the receipt. **Read it before the findings.** *187 statements
in 64 sources* means the tool had something to work with; *3 statements in 6
sources* means it did not, and a clean run says so rather than claiming
everything agrees.

A check that reads **no schema at all** fails, and says where it looked. A
green tick on a repository the tool could not read is the worst thing this
tool could do.

### `model` — the file that reads as a diff

`ledgerline.model.json` is canonical and sorted, so `git diff` on it is a
readable list of what changed — tables, columns, relationships — without
running anything. Commit it. `check` fails when it is stale, because a stale
diagram is the thing this exists to stop.

```
ledgerline model          # write it
ledgerline check --write  # check, then write it in the same pass
```

### `explain` — the evidence chain, and the DDL

Give it any text from a finding. Real output from memos:

```
$ ledgerline explain "attachment.memo_id"

fail: The join in store/db/postgres/attachment.go:147 relies on
      public.attachment.memo_id → public.memo.id, which no constraint declares.
  Many to one: public.memo.id is unique, so many rows may point at one.
  Evidence (1):
    query · store/db/postgres/attachment.go:147
      SELECT $? FROM attachment LEFT JOIN memo ON attachment.memo_id = memo.id
      LEFT JOIN space AS attachment_space ON memo.space_id = attachment_space.id
      WHERE $? ORDER BY attachment.updated_ts DESC
  This would close it. Put it in a migration; Ledgerline does not run it:
    ALTER TABLE public.attachment
      ADD CONSTRAINT attachment_memo_id_fkey
      FOREIGN KEY (memo_id)
      REFERENCES public.memo (id);
```

Three things worth noticing. The cardinality is **derived from uniqueness**,
never from the column's name. The query's literals are `$?` — they were masked
at read time, before anything was kept. And the DDL is printed for you to put
in a migration: Ledgerline never runs it, and never holds a connection that
could.

### `blast` — what a change reaches

The impact analysis a reviewer does by hand before touching a hot table.

```
$ ledgerline blast memo

public.memo: 3 direct relationships, 1 one hop further
  direct   public.attachment.memo_id=public.memo.id (used undeclared)
  direct   public.memo.id=public.memo_share.memo_id (declared unused)
  direct   public.memo.space_id=public.space.id (used undeclared)
  one hop  public.space.id=public.space_member.space_id (used undeclared)
Places to look (3):
  store/db/postgres/attachment.go:147
  store/db/mysql/user.go:107
  store/db/postgres/user.go:94
```

### `usage` — what a window touched

With `logs` configured, this is the first honest answer to *can we drop this
column*. It is never advice. Every sentence names the window, and the command
ends by saying so out loud:

```
Read from the queries in .: 187 statements across 64 sources.
Every table was touched in this window.
20 columns no query named in this window:
  public.attachment.uid
  public.attachment.filename
  …

This is a fact about the window, not advice. A column nothing read here may
be read by a job that did not run, a report nobody ran, or a human at a psql
prompt. Widen the window before you believe it.
```

`report` draws the same thing: anything the window did not touch is faded.
With no log configured nothing is faded, because the repository's own SQL is
not a usage sample.

### `report`, `mermaid` — the picture

`report` writes one self-contained HTML file. No network, no fonts, no
images — everything is inline, so it opens from a file:// URL and can be
attached to a ticket. Click a table and the diagram narrows to its
neighbourhood; the URL hash carries the focus, so a link to a subgraph is
shareable without a server.

`mermaid` prints an `erDiagram` of the declared-and-used core for a README,
with a badge line counting what it left out. `make badge-check` in this
repository fails when the README's number disagrees with what the check says —
a badge nobody can award themselves.

### `baseline` — adopting the gate on a codebase that has debt

A repository with forty undeclared joins can turn the gate on **today**.

```
ledgerline baseline      # records today's findings
```

`ledgerline.baseline.json` is committed and reviewed like any other file.
After that only *new* findings fail. The key strips line numbers and support
counts, so moving a query down a file, or copying it into a second one, does
not resurrect debt somebody already accepted.

When a finding fails and a baseline exists, `check` prints the exact line to
paste, so you can accept **one** finding by hand instead of re-baselining
everything:

```
fail: The join in reports/summary.sql:14 relies on …
    to accept just this one, add to ledgerline.baseline.json: "used_undeclared The join in reports/summary.sql: relies on …"
```

### `history` — schema archaeology

Walks the migration files in order and says when each table and column
arrived, and when a constraint was added or dropped. From the files, never
from the database.

### `pr` — the comment, a sentence first

The pull-request comment leads with the finding, because a reviewer on a phone
reads the first line and the diagram is for the reviewer at a desk:

```
**4 relationships the code relies on are not declared.**

- **fail**: The join in store/db/postgres/attachment.go:147 relies on public.attachment.memo_id → public.memo.id, which no constraint declares.
- warn: Rows in public.attachment may reference no public.memo: memo_id is nullable and no constraint checks it.
- info: public.reaction.memo_id is named like a reference to memo and no constraint or query relates them.
- …and 1 more
```

## In CI

Everything the GitHub Action does is also one CLI command, so nothing is
locked inside it.

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22 }
- run: npx ledgerline check
```

That is enough to fail a pull request on drift. To post the comment as well,
give the job `pull-requests: write` and run `npx ledgerline pr`; the Action
edits one comment in place rather than adding a new one each push.

## What it will not do

- **It will not connect to your database** unless you hand it a URL, and then
  only to read `pg_catalog`. There is no hosted tier and no telemetry.
- **It will not run the DDL it prints.** A diagram tool with write access to a
  database is a liability wearing a feature's clothes.
- **It will not suggest a table or a column.** It reports what the queries do
  and stops. No edge appears on the diagram without a line of SQL behind it.
- **It is not an editor.** drawDB and dbdiagram.io are free and good.

## Reading further

| | |
|---|---|
| Every `ledgerline.json` field | [`CONFIGURATION.md`](CONFIGURATION.md) |
| Every finding, and what to do about it | [`FINDINGS.md`](FINDINGS.md) |
| The nine places a schema can come from | [`SOURCES.md`](SOURCES.md) |
| Why it exists, and what it refuses to be | [`00-PRODUCT-STATEMENT.md`](00-PRODUCT-STATEMENT.md) |
