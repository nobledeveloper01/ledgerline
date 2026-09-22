# Phase 4's exit gate: the run, the findings, and what a person still has to say

**Status: not cleared.** This is the evidence, not the verdict. The gate says
*run against three public open-source repositories with real histories,
`ledgerline check` finds at least one true undeclared relationship in each and
reports zero false ones*. Three repositories were run on 2026-09-23 and every
finding was checked against the repository's own schema file. What is written
below is what was found and how it was verified; **nobody has signed it off**,
and the roadmap still says the phase is open.

Read this with the repositories open beside it. Disagreeing with any line is
the point.

---

## The three

| | Mastodon | Outline | NetBox |
|---|---|---|---|
| Stack | Rails 7.1 | Sequelize (TypeScript) | Django 5 |
| Schema read from | `db/schema.rb` | 57 model files | 38 model files |
| Tables | 116 | 41 | 91 |
| SQL statements found in the repository | 22 in 17 files | 22 in 14 files | 3 in 6 files |
| Statements the parser refused | 2 | 2 | 4 |
| `fail` findings | 0 | 0 | 0 |
| `warn` findings | 13 | 38 | 0 |
| `info` findings | 9 | 0 | 0 |
| Exit code | 0 | 0 | 0 |

All three were shallow clones of `main` on 2026-09-23. The NetBox tree was
partially materialised at the time of the run, so its 91 tables are a subset
of the whole; the others are complete.

## What the gate asks for, and what actually happened

**The gate is not met, and the reason is worth more than the gate.**

It asks for *at least one true undeclared relationship in each*. An undeclared
relationship is one a **query** relies on and no constraint declares. All three
repositories speak to their databases through an ORM, so there is almost no
SQL in them to read: 22 statements for Mastodon's 116 tables, 3 for NetBox's
91. With no queries there are no query-versus-constraint disagreements, and
the tool correctly found none and said so:

> info: 102 of 116 tables were named by no query that was read, so nothing is
> said about what their relationships are for.

That sentence is the honest output and it is also the gate's problem. **The
gate as written can only be met by repositories that contain raw SQL.** Three
ORM-first repositories cannot meet it, however good the tool is, and reading
that as a pass would be exactly the kind of green this repository exists to
refuse.

Two things follow, and both are for you to decide:

1. **Re-run the gate against repositories with real SQL** — a Go or Java
   service with `.sql` files, or any repository with a `pg_stat_statements`
   export. That is the population the product is for.
2. **Or point the tool at a query log** for one of these three, which is what
   `logs` in `ledgerline.json` is for, and what the output tells the user to
   do. A day of Mastodon's queries would answer the question the repository
   cannot.

Neither is a thing a script can do tonight.

## The findings that *were* made, and whether they are true

### Mastodon — 9 naming-drift findings, 9 confirmed true, 0 false

Each says: a column is named like a reference to a table, and no constraint
and no query relates them. Verified by reading `db/schema.rb` — the table
exists, the column exists, the target table exists, and no `add_foreign_key`
line covers that column.

| Finding | Confirmed |
|---|---|
| `accounts_tags.account_id` → `accounts` | true — `accounts_tags` has **no foreign keys at all** |
| `accounts_tags.tag_id` → `tags` | true — same table |
| `annual_report_statuses_per_account_counts.account_id` → `accounts` | true |
| `preview_cards_statuses.preview_card_id` → `preview_cards` | true |
| `preview_cards_statuses.status_id` → `statuses` | true |
| `session_activations.web_push_subscription_id` → `web_push_subscriptions` | true |
| `status_edits.quote_id` → `quotes` | true |
| `statuses.conversation_id` → `conversations` | true |
| `statuses.poll_id` → `polls` | true |

Two of these are join tables with no referential integrity declared at all,
which is a real thing to know about a database.

**A tenth finding was false, and is the most useful result in this document.**
`announcement_reactions.custom_emoji_id → custom_emojis` was reported as
undeclared, and `schema.rb` declares it on line 1509. The cause: Rails derives
that foreign key's column by singularising `custom_emojis`, and this
repository's inflector had a rule saying *a word ending in `is` is already
singular* — true of `analysis`, false of `custom_emojis`. So the derived
column was `custom_emojis_id`, the table has no such column, and the
constraint was dropped. Fixed, with a test; the count above is after the fix.

Worth noting what did **not** happen: the reader did not invent a
`custom_emojis_id` column. It reported the line as unread, exactly as
ADR-0005 says it should. The safety rule worked; the inflector was still
wrong.

### Outline — 38 declared-and-unused warnings, all true and none actionable

Each says a declared foreign key was used by no query that was read. All 38
are true statements about a 22-statement sample of a repository with 41
tables. None of them means the relationship is unused. This is a fact about
the sample, and the check says so in its own output.

Outline's run started at **7 failing findings, all seven of them the tool's
fault.** Each was traced to the SQL it named and fixed:

- `WITH lockable AS (…) UPDATE documents …` — a CTE read as a table, because
  `WITH` was read for `SELECT` and nowhere else.
- `WITH rows AS (…) UPDATE …` — the same bug.
- `DELETE FROM stars WHERE NOT EXISTS (SELECT NULL FROM documents doc WHERE
  doc.id = "documentId")` — a correlated column resolved against the inner
  query, inventing `documents.documentId` and a self-join.
- Two findings about `collection_users`, a table that was real in April 2023
  and has since been renamed — the tool was reading `server/migrations` as a
  source of *queries*. A migration's DDL is the schema; its DML is history.

### NetBox — nothing, correctly

91 tables, 3 SQL statements in the whole repository, none of them naming a
declared table. The check reports exactly that and claims nothing:

> No findings — but no query that was read named any of the 91 declared
> tables, so this says only that the schema disagrees with nothing.

Before this run that sentence read *No findings. Every relationship the
queries rely on is declared*, which was a claim about queries that did not
exist.

## What the three repositories changed in the tool

Thirteen fixes, none of which the 200-table fixture corpus had ever provoked.
The full list is in `CHANGELOG.md`; the ones that mattered most:

1. **A check that read no schema went green.** Exit 0 and *No findings* for a
   repository it had read not one table of. In a pipeline: move the
   migrations, and the build passes for ever.
2. **A `models/` package is how real Django projects are written**, and the
   app label — half of every table name — is the directory *above* it. NetBox
   went from no schema at all to 91 tables.
3. **Sequelize was unreadable**, so Outline was unreadable. A sixth ORM reader
   now exists that the roadmap never listed.
4. **`:startUuid::uuid` is a parameter**, and a lookahead refusing any `:name`
   followed by `::` was the single biggest reason real SQL went unread.
5. **1947 "statements the parser refused" on Mastodon were English sentences**
   beginning with a SQL verb — `"delete"`, `"Delete & re-draft"`. Now 2.

## What a person still has to do

- Decide whether the gate should be re-pointed at repositories with raw SQL,
  or at a query log, and say which in `docs/ROADMAP.md`.
- Read the nine Mastodon findings above against `db/schema.rb` and disagree
  with any of them. The verification here was mechanical; mechanical is not
  the same as read.
- Look at the 38 Outline warnings and confirm they are the noise this document
  says they are.

Until that happens Phase 4 is open, and `README.md` and `docs/ROADMAP.md` say
so.
