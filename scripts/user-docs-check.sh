#!/usr/bin/env bash
# The user documentation covers everything the tool actually has.
#
# Derived, never listed: the commands come from the dispatcher in `bin.ts`,
# the findings from the `code:` literals in the model, and the settings from
# the `Config` interface. A gate that carries its own copy of the list goes
# stale the day somebody adds an eleventh command — see the note in this
# repository about gates that do not know their own scope.
#
# Then it proves itself the way `boundary-check` and `reach-check` do: it
# plants a command the docs cannot mention and requires the check to fail.
set -uo pipefail
cd "$(dirname "$0")/.."
RED=$'\033[0;31m'; GRN=$'\033[0;32m'; OFF=$'\033[0m'

commands() {
  grep -oE "^      case '[a-z]+':" packages/cli/src/bin.ts | grep -oE "'[a-z]+'" | tr -d "'" | sort -u
}

findings() {
  grep -hoE "code: '[a-z_]+'" packages/model/src/findings.ts | grep -oE "'[a-z_]+'" | tr -d "'" | sort -u
}

settings() {
  sed -n '/^export interface Config {/,/^}/p' packages/cli/src/config.ts |
    grep -oE '^  readonly [a-zA-Z]+\??:' | grep -oE '[a-zA-Z]+' | grep -v readonly | sort -u
}

check() {
  local missing="" name
  for name in $(commands); do
    grep -q "ledgerline $name" docs/USAGE.md || missing="$missing USAGE.md:command:$name"
  done
  for name in $(findings); do
    grep -q "\`$name\`" docs/FINDINGS.md || missing="$missing FINDINGS.md:finding:$name"
  done
  for name in $(settings); do
    grep -qE "\`$name\`|^### .*\b$name\b" docs/CONFIGURATION.md || missing="$missing CONFIGURATION.md:setting:$name"
  done
  printf '%s' "$missing"
}

gaps=$(check)
if [ -n "$gaps" ]; then
  printf '%s✗%s the user documentation does not cover:%s\n' "$RED" "$OFF" "$gaps"
  printf '  A command, a finding or a setting that nobody wrote down is one nobody can use.\n'
  exit 1
fi

# Prove the gate fires.
TARGET=packages/cli/src/bin.ts
BACKUP=$(mktemp)
cp "$TARGET" "$BACKUP"
restore() { cp "$BACKUP" "$TARGET"; rm -f "$BACKUP"; }
trap restore EXIT
# Planted with the same indentation the dispatcher uses, so `commands` sees it.
perl -0pi -e "s/(\n      case 'pr':)/\n      case 'plantedundocumented':\n        break;\1/" "$TARGET"
planted=$(check)
restore
trap - EXIT
if ! grep -q 'plantedundocumented' <<<"$planted"; then
  printf '%s✗%s the documentation gate did NOT fire on a planted undocumented command — the gate is broken\n' "$RED" "$OFF"
  exit 1
fi

printf '%s✓%s %s commands, %s findings and %s settings are all documented, and the gate fires on a planted one\n' \
  "$GRN" "$OFF" "$(commands | wc -l | tr -d ' ')" "$(findings | wc -l | tr -d ' ')" "$(settings | wc -l | tr -d ' ')"
