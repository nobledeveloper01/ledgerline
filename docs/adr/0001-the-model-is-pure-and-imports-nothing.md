# ADR-0001 — The model is pure TypeScript and imports nothing

**Status:** accepted
**Date:** 2026-09-22

## Context

Ledgerline's value is a set of rules: what a relationship is, when a join in a
query counts as evidence for one, how a declared schema and a used schema
reconcile, what counts as drift, and what a diff between two models means. The
obvious place to write those rules is beside the parser that produces the
input and the renderer that consumes the output. That is where every schema
tool puts them, and it is why none of them can be tested without a database
or explained without a screenshot.

## Decision

Every rule lives in `packages/model`, which imports nothing — not the parser,
not `node:fs`, not a clock, not randomness. Its inputs are plain data: a
declared schema, a list of relationship claims with their evidence, a previous
model. Its outputs are plain data: a reconciled model, a list of findings, a
diff.

The rule is enforced by an ESLint `no-restricted-imports` configuration scoped
to the package, and `make boundary` proves the rule fires by planting a
forbidden import and asserting the lint fails. A rule nobody has watched fail
is a rule nobody knows works.

## Consequences

The parser, the sources and the renderer are adapters; they can be wrong, slow
or replaced without touching a rule. The Phase 2 property tests run in
milliseconds over generated data. And every finding the CLI prints can be
reproduced from a JSON file a user attaches to a bug report, because the model
never needed anything else.
