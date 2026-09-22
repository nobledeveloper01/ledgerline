# Toolchain

Everything Ledgerline is built with, and why each thing rather than the obvious
alternative. A dependency is a decision; this page is where the decisions are.

## The language: TypeScript on Node 22

**Why not Go**, which the portfolio's other CLIs use? Because the sources
Ledgerline reads are TypeScript: Prisma schemas, Drizzle model files, TypeORM
entities, NestJS repositories. Reading those faithfully means running the
TypeScript compiler's own parser, and that is a TypeScript program. The
PostgreSQL parser is WebAssembly and works from either language; the ORM sources
decide it.

**Why Node 22.** The current LTS; native `node:test`, native `--experimental-strip-types`
so tests run on source with no build step; `fetch` built in. CI and local run
the same version, pinned in `.nvmrc` and in the workflow.

**Distribution.** One npm package, `ledgerline`, run as `npx ledgerline check`.
No global install needed, no binary to sign, works on every CI runner that has
Node — which is all of them.

## The layout: a pnpm workspace with a pure package at the centre

```
packages/model/     the schema model, the relationship model, reconciliation, diff
                    — pure TypeScript, imports nothing, tested in milliseconds
packages/parse/     PostgreSQL DDL and SQL → model claims (libpg_query WASM)
packages/sources/   migrations directories, Prisma, Drizzle, query logs, pg_stat_statements
packages/render/    the model → one static HTML file, and Mermaid
packages/cli/       `ledgerline` — the commands, and nothing else
action/             the GitHub Action, a thin wrapper over the CLI
fixtures/           schemas and query sets with their expected models, the corpus every gate runs on
```

The model package **imports nothing** — not the parser, not Node's `fs`, not a
clock. Every rule about what a relationship is, how two models reconcile, and
what counts as drift lives there and is tested without a database or a file. A
lint rule forbids imports into it, and a test breaks the rule on purpose to prove
the lint fires (ADR-0001).

## Dependencies, with reasons

### Runtime

| Package | Why | Why not the alternative |
|---|---|---|
| **`@pgsql/parser`** (libpg_query as WebAssembly) | The real PostgreSQL grammar, compiled from the server's own source. Parses every statement PostgreSQL parses, including the ones a hand-written parser gets wrong. No native build. | `pgsql-ast-parser` is pure TS and pleasant but is a reimplementation; it disagrees with PostgreSQL on edge cases, and an ERD tool that misreads a `JOIN` is worse than none. `node-sql-parser` covers many dialects shallowly. |
| **`typescript`** (the compiler API) | Reading Drizzle, TypeORM and Prisma-adjacent TypeScript for models and for SQL literals. | A regex over source files finds strings; it cannot tell a query from a comment. |
| **`@prisma/internals`** or the `.prisma` grammar via `@mrleebo/prisma-ast` | Parsing `schema.prisma` without running Prisma's engine. | Running `prisma generate` needs the engine binary and a network. |
| **`elkjs`** | Layered graph layout for the diagram, computed at build time and baked into the HTML, so the page does no layout work. | `dagre` is smaller but unmaintained and handles 200-table graphs poorly. |
| **`pg`** (optional peer) | Live introspection for teams that can point at a database. Loaded only when `--database-url` is given. | Making it a hard dependency would drag a driver into every install for a feature most runs do not use. |
| **`commander`** | Argument parsing for the CLI. Small, boring, correct. | Hand-rolled argv parsing is where CLIs grow their first bug. |
| **`picocolors`** | Colour in terminal output; zero dependencies. | `chalk` is fine and heavier. |

Nothing in the browser. The HTML report is self-contained: the SVG is written
by `render` at build time; the pan, zoom, search and focus are a few hundred lines
of inline vanilla JavaScript with no framework, because the file must open from
`file://` on a machine with no network and no build.

### Development

| Package | Why |
|---|---|
| **`node:test`** + `node:assert` | The test runner that ships with Node; no config, no transform, runs `.ts` directly. |
| **`fast-check`** | Property tests for Phase 2's gate: generated schemas and query sets, and the invariant that no relationship in a query goes missing. |
| **`eslint`** + `typescript-eslint` + `eslint-plugin-import` | Lint, and the `no-restricted-imports` rule that is the boundary gate. |
| **`prettier`** | Formatting, so reviews are about the change. |
| **`tsx`** | Runs TypeScript scripts (the fixture emitter, the release script) where `--strip-types` is not enough. |
| **`changesets`** | Versioning and the changelog entry per change, so the npm release is not a hand-written step. |

### Not used, on purpose

- **No ORM in the tool itself.** Ledgerline reads ORMs; it does not use one.
- **No bundler.** `tsc` emits ESM; Node runs it. A bundler is a build step between a
  reviewer and the code.
- **No LLM.** Every edge is traceable to a line; an inferred edge with no line is a
  bug, not a feature.
- **No telemetry.** The tool runs on private codebases; it phones nobody.

## Gates in `make ci`

| Gate | What it proves |
|---|---|
| `typecheck` | `tsc --noEmit` across the workspace. |
| `lint` | ESLint, including the boundary rule on `packages/model`. |
| `boundary` | Plants a `node:fs` import in the model package, runs the lint, asserts it fails, removes the import. A gate that has never failed is not a gate. |
| `doc-check` | The required documents exist and are tracked; every ADR referenced exists; the journal is newer than the last code change. |
| `fixtures-check` | Every fixture's expected model is regenerated and diffed — a rule change without a fixture change is a red build. |
| `test` | `node --test` across every package; the property tests with a fixed seed in CI. |
| `self-check` | `ledgerline check` run against this repository's own fixtures, with a planted drift, must exit non-zero. The product is its own first user. |

## Local setup

```
nvm use          # .nvmrc → 22
corepack enable  # pnpm, pinned in package.json
pnpm install
make ci
```

No database, no Docker, no services. A live PostgreSQL is needed only for the
optional introspection tests, which skip with a yellow line when
`LEDGERLINE_TEST_DATABASE_URL` is unset — allowed while building, blocking for
the Phase 1 gate.
