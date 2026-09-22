.DEFAULT_GOAL := help
SHELL := /bin/bash

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

ci: gates test ## Everything CI runs

gates: doc-check ## The blocking checks alone (typecheck, lint, boundary and fixtures-check join in Phase 0)

doc-check: ## The documentation gate
	@./scripts/doc-check.sh

test: ## The tests (Phase 0 wires them)
	@echo "no packages yet — Phase 0"

hooks: ## Install the git hooks
	@git config core.hooksPath .githooks && echo "hooks installed"

.PHONY: help ci gates doc-check test hooks
