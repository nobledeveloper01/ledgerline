# Ledgerline

The diagram of your database derived from what your code actually does, and a
build that fails when the two disagree. Read `docs/00-PRODUCT-STATEMENT.md`
first, then `docs/ROADMAP.md` for the phase and its exit gate, `docs/TOOLCHAIN.md`
for every dependency and why, and `docs/adr/` for what is decided. `PHASE` holds
the current phase.

For what the thing *does*: `docs/USAGE.md` (the commands),
`docs/CONFIGURATION.md` (`ledgerline.json`), `docs/FINDINGS.md` (every finding
and what to do about it), `docs/SOURCES.md` (the ten places a schema comes
from). **A change to a command, a config field or a finding is not done until
the matching page says so** — `make doc-check` requires the four to exist and
`make user-docs-check` requires every command and every finding to appear in
them.

The one sentence that decides most arguments:

> **A database diagram is a claim about the system, and a claim is only worth
> having if something checks it.**

## The things that are never traded

1. **The model imports nothing.** Every rule is pure data in, pure data out
   (ADR-0001); `make boundary` proves the lint fires.
2. **Every edge is traceable to a line.** A relationship inferred from a query
   carries the query, the file and the line; one declared by a constraint
   carries the constraint. No edge without evidence, no AI guessing.
3. **Inferred is labelled inferred.** The diagram says what it knows and what it
   worked out, on the diagram. A polymorphic association is drawn as one.
4. **Nothing leaves the machine.** No hosted tier, no credentials collected, no
   telemetry. The tool runs where the code runs.
5. **It is not an editor.** drawDB and dbdiagram.io are free and good. Ledgerline
   reads, reconciles and reports.

## Working on this repo

- `make ci` is the gate. `make gates` runs the blocking checks without the tests.
- **Prove a guard fires before trusting it.** Break it on purpose, watch it fail,
  put it back. `make boundary` does this for the import rule every run.
- ADRs live in `docs/adr/`. Write one for any non-obvious decision, before the
  code that depends on it.
- **`docs/JOURNAL.md` every working session.** What we did, and what surprised us.
- Fixtures are the corpus every gate runs on. A rule change without a fixture
  change is a red build (`fixtures-check`).
- Commit messages are one sentence.

## Definition of done

- [ ] Rule in `packages/model`, unit-tested, pure
- [ ] Every finding has evidence a user can click through to
- [ ] Fixture added or updated, and `fixtures-check` regenerated
- [ ] ADR written for any non-obvious decision; `CHANGELOG.md` updated
- [ ] `make ci` green
