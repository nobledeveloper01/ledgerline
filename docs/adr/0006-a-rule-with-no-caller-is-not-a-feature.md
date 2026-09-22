# ADR-0006 — A rule with no caller is not a feature

**Status.** Accepted, 2026-09-23. Phase 5.

## Context

`usage()` — ADR-0003 #2, *dead columns from a query log* — was written, unit
tested, pure, documented, and called by nothing at all. The roadmap said the
feature was built. `make ci` was green. The rule existed; the product did not.

Nothing in this repository could have caught it. The boundary gate proves the
model imports nothing. The fixtures gate proves the rules produce what the
corpus says. The self-check proves the tool finds a planted drift. All three
are about *rules that run*. None of them can see a rule that never runs,
because a unit test is a caller, and a unit test is enough to make a rule look
alive.

Finding it took `grep -rn usage packages/cli packages/render`, printing
nothing. That is not a process.

## Decision

**Every value the model package exports must be named somewhere outside
`packages/model`, or be listed in `scripts/model-internal.txt` with a written
reason.** `make reach` checks it and is part of `make ci`.

The list is the point. Three kinds of thing end up on it — a helper two model
files share, a lookup a caller has no use for, an input to a rule rather than
a rule — and each entry makes somebody write down which it is. A new export
with no caller fails the build until that sentence exists.

Two limits, both deliberate:

- **Values only, not types.** A type is used by inference far more often than
  by name: a caller that writes `const m = reconcile(…)` uses `Model` without
  ever spelling it. A name-based check would report every well-inferred type
  as dead. A function cannot be called without being named, which is what
  makes the check on values exact.
- **The model package only.** It is where the rules live, and where a rule
  with no caller is a lie about the product rather than ordinary dead code
  that `tsc` and the linter already complain about.

  Widening it to every package was tried and is wrong. `@ledgerline/parse`,
  `@ledgerline/sources` and `@ledgerline/render` are libraries with published
  surfaces: `parseDdl`, `svgFor`, `layoutModel`, `PALETTE` and thirty-five
  others are called by their own tests and by whoever installs the package,
  and by nothing else in this repository. Requiring a caller here would mean
  thirty-nine allow-list entries all saying *this is the public API*, which
  is a list that teaches nobody anything and that people would stop reading.
  The model is different because it is not published for anyone: every rule
  in it exists to be reached by this tool, so *nothing reaches it* is always
  a finding.

The same script also refuses a source file containing a **raw NUL byte**,
because writing this gate turned one up: `schema.ts` held two, where the
escape '\u0000' was meant, from a `join()` separator that had been
written as the byte itself. It made the file binary, `grep` skipped it
silently, and seven of the model's exports were invisible to the gate that had
just been written to find them. A gate that cannot read a file has to say so
rather than pass.

## Consequences

Five exports had no caller when the gate first ran. One was a missing feature
(`usage`), two were duplication the constant existed to prevent
(`BASELINE_VERSION` and `EMPTY_SCHEMA`, each spelled out by hand somewhere
else), one was genuinely dead (`EMPTY_BASELINE`, deleted), and one was a
public contract with no way to reach it (`findingKey`, now printed by `check`
so a reviewer can accept one finding by hand instead of all of them).

That ratio is the argument for the gate: of five, one was a hole in the
product, two were bugs waiting to happen, one was litter, and one was a
feature nobody could use.

## Alternatives rejected

- **Coverage.** It measures whether tests run a line, and a unit test on a
  rule nobody calls runs every line of it. It would have said `usage()` was
  perfectly covered, which it was.
- **`ts-prune` or a dead-export linter.** Would report the same names, without
  forcing a written reason for each, and would count the model's own tests as
  callers — which is exactly the green that hid this.
- **Just be careful.** Every gate in this repository exists because being
  careful is not a control.
