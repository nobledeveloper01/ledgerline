.DEFAULT_GOAL := help
SHELL := /bin/bash
BIN := node_modules/.bin

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

ci: gates test ## Everything CI runs

gates: typecheck lint boundary reach doc-check fixtures-check self-check badge-check ## The blocking checks alone

typecheck: ## tsc across the workspace, and the scripts
	@pnpm -r typecheck
	@$(BIN)/tsc -p scripts/tsconfig.json

lint: ## eslint across the workspace, including the model's import rule
	@$(BIN)/eslint .

boundary: ## Prove the model's import rule fires: plant a node:fs import, watch the lint fail, put it back
	@./scripts/boundary-check.sh

doc-check: ## The documentation gate
	@./scripts/doc-check.sh

reach: ## Every rule the model exports has a caller outside the model, and no source file is binary
	@./scripts/reach-check.sh

fixtures: ## Regenerate every fixture's expected.json from the rules — deliberately, then read the diff
	@node --conditions=source scripts/emit-fixtures.ts

fixtures-check: ## Fail if a rule changed and no fixture changed with it
	@node --conditions=source scripts/emit-fixtures.ts --check

self-check: ## Run the tool on its own fixtures, with a planted drift, and require it to fail
	@./scripts/self-check.sh

badge: ## Refresh the README's Mermaid diagram and its undeclared-join count from the check itself
	@node --conditions=source scripts/badge.ts

badge-check: ## Fail if the README's badge does not match what the check says
	@node --conditions=source scripts/badge.ts --check

test: ## Every package's tests; the live-database tests skip yellow unless LEDGERLINE_TEST_DATABASE_URL is set
	@pnpm -r test

live-check: ## Fail if the live-database tests were skipped — the Phase 1 gate, run where a PostgreSQL is
	@test -n "$$LEDGERLINE_TEST_DATABASE_URL" || (echo "LEDGERLINE_TEST_DATABASE_URL is not set — the migrations-vs-live gate did not run"; exit 1)
	@# `node --test` prints the spec reporter on a TTY (ℹ skipped 0) and TAP elsewhere (# skipped 0); CI is the latter.
	@cd packages/sources && pnpm test 2>&1 | tee /tmp/ledgerline-live.log | grep -qE "^(ℹ|#) skipped 0$$" || (echo "a live-database test was skipped"; exit 1)
	@echo "migrations and a live PostgreSQL agree byte for byte on every corpus"

large: ## Regenerate the 200-table migrations fixtures, PostgreSQL and MySQL
	@node --conditions=source scripts/emit-large-schema.ts
	@node --conditions=source scripts/emit-large-mysql.ts

hooks: ## Install the git hooks
	@git config core.hooksPath .githooks && echo "hooks installed"

.PHONY: help ci gates typecheck lint boundary reach doc-check fixtures fixtures-check self-check badge badge-check test live-check large hooks
