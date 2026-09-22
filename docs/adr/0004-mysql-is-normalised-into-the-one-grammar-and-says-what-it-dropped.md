# ADR-0004 — MySQL is normalised into the one grammar, and says what it dropped

**Status:** accepted
**Date:** 2026-09-23

## Context

Phase 5 adds MySQL. The declared side is read today by PostgreSQL's own
parser, compiled from the server's source, which is the reason a join is
never misread. MySQL's DDL is a different grammar: backticks quote
identifiers, `AUTO_INCREMENT` and `ENGINE=` decorate a table, `KEY idx (c)`
declares an index inside `CREATE TABLE`, and a dozen types have different
names.

Three ways to read it. **Add a MySQL parser**: a second dependency, a second
AST, and two code paths for every rule that reads one. **Write one**: the
thing the toolchain refuses by name — a reimplemented grammar that disagrees
with the server on the edge cases, which for an ERD tool means misreading a
join. **Normalise the DDL into PostgreSQL's grammar** and reuse everything.

## Decision

**MySQL DDL is rewritten into PostgreSQL DDL, then parsed by the same
parser.** The rewrite is small and bounded: backticks become double quotes,
`AUTO_INCREMENT` and table options are removed, inline `KEY`/`INDEX` clauses
become the `CREATE INDEX` statements they are, `UNIQUE KEY name (cols)`
becomes a unique constraint, and the type names that differ are mapped.

**It refuses rather than guesses.** Anything the rewrite does not recognise —
a partition clause, a generated column, a storage engine hint it has no rule
for — is reported with the line, and the statement is skipped and counted,
never silently half-read. `ledgerline check` prints the count, so a MySQL
repository whose DDL this cannot read says so instead of showing a small
diagram.

**The model does not learn about MySQL.** No dialect flag reaches the rules;
by the time a schema exists it is the same `DeclaredSchema` PostgreSQL
produces, and every test in `packages/model` stays dialect-free.

## Consequences

One parser, one AST, one set of rules, and a rewrite that is a hundred lines
of string work with its own fixture corpus and the same property test. The
cost is that a MySQL feature with no PostgreSQL spelling cannot be
represented — and the honest answer there is the count of what was skipped,
printed where a person will see it.

What this does **not** do is make Ledgerline a MySQL tool of the same quality:
the live introspection is PostgreSQL's `pg_catalog`, and a MySQL
`information_schema` reader is a separate piece of work that is not in this
phase. Reading MySQL migrations is; reading a live MySQL database is not, and
the roadmap says so.
