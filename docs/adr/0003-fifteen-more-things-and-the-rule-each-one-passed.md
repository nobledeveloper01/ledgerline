# ADR-0003 — Fifteen more things, and the rule each one passed

**Status:** accepted
**Date:** 2026-09-22

## Context

The product statement says what Ledgerline is and, at more length, what it
refuses to be. The user asked for fifteen more things to make it hard to copy.
The obvious response is to add fifteen features and let the roadmap grow until
nobody can ship; the other obvious response is to refuse on principle.

Neither is right. Each thing below was checked against the five refusals —
not an editor, nothing leaves the machine, every edge traceable to a line,
inferred is labelled inferred, no AI guessing — and against the one insight:
the diagram is a claim, and a claim is worth having only if something checks
it. A thing that follows from the queries, the diff or the evidence, and
passes the refusals, is not scope creep. One that fails any of them is,
however small.

## Decision

| # | Thing | Follows from | Phase |
|---|---|---|---|
| 1 | **Ghost tables.** A table the queries name and no migration declares is drawn as a dashed outline with the queries that touch it, and is a failing finding. A join to a table that does not exist is the drift that pages someone at 2am. | Used-and-undeclared, for tables | 2 |
| 2 | **Dead columns.** With a query log, a column nothing reads or writes in the window is drawn faded and listed — the first honest answer to *can we drop this*. Never a suggestion to drop it; a fact about the window. | Usage on the diagram | 4 |
| 3 | **Confidence per edge.** An inferred edge carries how many distinct queries support it. One join in one report is a weaker claim than a join in forty; the diagram draws the line weight from the count and the finding says the number. | Evidence, counted | 2 |
| 4 | **Cardinality from uniqueness, never guessed.** A crow's foot appears only when a primary key or unique constraint proves it; otherwise the end is a plain line marked *unknown*. Every other tool draws the foot from the column name. | Inferred is labelled | 2 |
| 5 | **The orphan-side report.** A join whose column is nullable on the referencing side and has no constraint is the classic source of orphaned rows; it is a distinct finding — *rows in `orders` may reference no `user`* — with the query as evidence. | Findings from the model | 2 |
| 6 | **A model file that reads as a diff.** `ledgerline.model.json` is canonical and sorted so `git diff` on it is a list of tables and edges that changed, readable in a pull request without the tool. | Canonical output | 1 (done) |
| 7 | **Schema archaeology.** `ledgerline history` walks the migration files in order and shows, per table, when it was created, when each column arrived, and when a constraint was added or dropped — from the files, not from the database. | Migrations folded in order | 4 |
| 8 | **Naming drift.** A column named `user_id` that no join relates to `users` — and one named `customer` that a join relates to `users` — are listed under *names that lie*. Naming is evidence; where it disagrees with the queries, say so. | Claims versus names | 2 |
| 9 | **The blast radius.** Given a table name, `ledgerline blast users` lists every query, file and line that would be affected by a change to it, direct and through one join. The impact analysis a reviewer does by hand before touching a hot table. | Evidence on every edge | 4 |
| 10 | **Focus subgraphs.** In the HTML, click a table and the diagram narrows to it and its neighbours at one or two hops; for a 200-table schema this is the difference between a diagram and a hairball. The URL hash carries the focus, so a link to a subgraph is shareable without a server. | Static HTML, large schemas | 3 |
| 11 | **The pull-request comment is a sentence first.** Before any picture, the comment leads with the findings — *one join now has no constraint behind it* — because a reviewer on a phone reads the first line. The diagram follows for the reviewer at a desk. | Drift as a gate | 4 |
| 12 | **A baseline, not a big bang.** `ledgerline check --baseline` records today's findings and fails only on new ones, so a codebase with forty undeclared joins can adopt the gate on day one and pay the debt down one pull request at a time. The baseline file is committed and reviewed like the model. | Adoption on old codebases | 4 |
| 13 | **Explain a finding.** `ledgerline explain <finding>` prints the evidence chain in full: every query that supports the edge, the constraint that is or is not there, the uniqueness that decided the cardinality, and the exact migration that would close it — as DDL the engineer copies, never runs by the tool. | Every edge traceable; not an editor | 4 |
| 14 | **Query-log privacy.** Query logs carry literals — emails, ids, amounts. The log reader replaces every literal with `?` at read time, before anything is kept, so the evidence on an edge is the shape of the query and never a row. A test plants a fake email in a log and asserts it appears nowhere in the model or the HTML. | Nothing leaves the machine; nothing kept that need not be | 2 |
| 15 | **The README badge that is a claim.** A one-line Mermaid `erDiagram` of the declared-and-used core, regenerated by CI, with the count of undeclared relationships beside it — *0 undeclared joins* — as a badge in the README. A badge nobody can award themselves, because the number comes from the check. | Mermaid export; drift as a gate | 4 |

### Refused

- **Suggesting a table or a column.** *This join suggests `orders.user_id` should exist* is an AI guessing the schema; the tool reports what the queries do and stops.
- **Running the migration that closes a finding.** Explain prints DDL; the migration tool runs it. A diagram tool with write access to a database is a liability wearing a feature's clothes.
- **A hosted "connect your database" onboarding.** Refused by the product statement; still refused.
- **Row counts on the diagram.** They need a live database and a `COUNT(*)` on every table, they change by the minute, and they are not a fact about the schema. Usage from a query log is a fact about the window; row counts are a fact about Tuesday.

## Consequences

Fifteen things across Phases 2, 3 and 4; none in Phase 5, which stays breadth.
Each carries its rule in the changelog entry when it lands. The four refused
stay refused; a request for one is a request to amend this ADR.
