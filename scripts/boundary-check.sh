#!/usr/bin/env bash
# Proves the model's import rule fires (ADR-0001): plant a Node built-in
# import in the model package, run the lint, assert it fails, put it back.
# A guard nobody has watched fail is a guard nobody knows works.
set -uo pipefail
cd "$(dirname "$0")/.."
RED=$'\033[0;31m'; GRN=$'\033[0;32m'; OFF=$'\033[0m'
TARGET=$(ls packages/model/src/*.ts | grep -v index.ts | sort | head -1)
BACKUP=$(mktemp)
cp "$TARGET" "$BACKUP"
restore() { cp "$BACKUP" "$TARGET"; rm -f "$BACKUP"; }
trap restore EXIT
{ echo ""; echo "import { readFileSync } from 'node:fs';"; echo "export const _planted = readFileSync;"; } >> "$TARGET"
out=$(node_modules/.bin/eslint "$TARGET" 2>&1 || true)
if grep -q 'no-restricted-imports' <<<"$out"; then
  printf '%s✓%s the model boundary fires on a planted node:fs import\n' "$GRN" "$OFF"; exit 0
fi
printf '%s✗%s the model boundary did NOT fire on a planted import — the lint rule is broken\n' "$RED" "$OFF"
echo "$out" | head -5; exit 1
