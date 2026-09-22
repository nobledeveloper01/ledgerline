.DEFAULT_GOAL := help
SHELL := /bin/bash
BIN := node_modules/.bin

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

ci: gates test ## Everything CI runs

gates: typecheck lint boundary doc-check fixtures-check ## The blocking checks alone

typecheck: ## tsc across the workspace, and the scripts
	@pnpm -r typecheck
	@$(BIN)/tsc -p scripts/tsconfig.json

lint: ## eslint across the workspace, including the model's import rule
	@$(BIN)/eslint .

boundary: ## Prove the model's import rule fires: plant a node:fs import, watch the lint fail, put it back
	@./scripts/boundary-check.sh

doc-check: ## The documentation gate
	@./scripts/doc-check.sh

fixtures: ## Regenerate every fixture's expected.json from the rules — deliberately, then read the diff
	@node scripts/emit-fixtures.ts

fixtures-check: ## Fail if a rule changed and no fixture changed with it
	@node scripts/emit-fixtures.ts --check

test: ## Every package's tests
	@pnpm -r test

hooks: ## Install the git hooks
	@git config core.hooksPath .githooks && echo "hooks installed"

.PHONY: help ci gates typecheck lint boundary doc-check fixtures fixtures-check test hooks
