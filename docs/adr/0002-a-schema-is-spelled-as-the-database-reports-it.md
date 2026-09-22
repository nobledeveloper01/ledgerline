# ADR-0002 — A schema is spelled as the database reports it

**Status:** accepted
**Date:** 2026-09-22

## Context

The declared schema has two sources that must agree: migrations read through
PostgreSQL's parser, and a live database read through `pg_catalog`. Phase 1's
gate is that they agree byte for byte, and the first run against a real
database failed on one word: the migration said `serial`, the database said
`integer`. `serial` is not a type — PostgreSQL stores an `integer` with a
sequence default and never reports `serial` back. `varchar(80)` is spelled
`character varying(80)`, `timestamptz` is `timestamp with time zone`, and
`int4` is `integer`.

The obvious choice is to keep what the migration wrote, because that is what
the engineer typed. It makes the diagram read like the migration and makes
the two sources disagree forever.

## Decision

Every type is spelled as `format_type()` spells it — the way PostgreSQL
reports the column back — in both readers. `serial` becomes `integer`,
`bigserial` becomes `bigint`, the internal names become their SQL names, and
the modifiers ride along in parentheses. The DDL reader carries the table of
spellings; the live reader gets them from the database for free.

## Consequences

The Phase 1 gate holds: the same schema read either way is the same bytes,
and a model file is stable across the two. What is lost is the `serial`
spelling on the diagram; it was never a type, and a column that is `integer`
with a sequence is drawn as `integer`, which is what it is. A later phase
may carry the default alongside the type; the type itself stays honest.
