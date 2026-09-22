# Journal

What we did, and what surprised us. One entry per working session, newest first.
The surprises are the point.

---

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
