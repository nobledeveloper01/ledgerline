# Fixtures

The corpus every gate runs on. Each directory is one case:

- `input.json` — a `DeclaredSchema` and `Claims`, as an adapter would hand them to the model.
- `expected.json` — the `Model` the rules produce, and the findings, written by `make fixtures` and **diffed on every CI run** by `fixtures-check`.

A rule change without an expected change is a red build; that is the point.
Regenerate deliberately with `make fixtures`, read the diff, and commit it
with the rule. From Phase 1 the inputs are also derived from real DDL and SQL
in the same directory, so the parser is held to the same corpus.
