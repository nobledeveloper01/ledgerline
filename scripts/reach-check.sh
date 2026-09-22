#!/usr/bin/env bash
# Every rule the model exports has a caller outside the model.
#
# The bug this exists for: `usage()` — ADR-0003 #2 — was written, unit-tested,
# pure, and called by nothing. The roadmap said the feature was built; `make ci`
# was green; the rule existed and the product did not. A unit test on a rule
# nobody calls is exactly the kind of green that means nothing.
#
# So: collect every value and type `packages/model/src` exports, and require
# each to appear in some file outside `packages/model`. A rule with no caller
# is either a feature that was never finished or a rule that should be deleted;
# either way somebody has to say which, which is what this gate forces.
#
# Then it proves itself, the way `boundary-check` does: it plants an export
# nothing could possibly call, runs its own check, and requires it to fail.
set -uo pipefail
cd "$(dirname "$0")/.."
RED=$'\033[0;31m'; GRN=$'\033[0;32m'; OFF=$'\033[0m'

# The *values* the model exports: functions, constants, classes. Internal
# helpers are not `export`ed and so are never asked about.
#
# Types are deliberately not checked. A type is used by inference far more
# often than by name — a caller that writes `const m = reconcile(...)` uses
# `Model` without ever spelling it — so a name-based check would report every
# well-inferred type as dead. A function, by contrast, cannot be called
# without being named, which is what makes this check exact.
exported() {
  grep -hoE '^export (async )?(function|const|class) [A-Za-z_][A-Za-z0-9_]*' packages/model/src/*.ts |
    awk '{print $NF}' | sort -u
}

# Everywhere a caller could be: the other packages, the scripts, the Action.
callers() {
  grep -rhoE '[A-Za-z_][A-Za-z0-9_]*' \
    --include='*.ts' --include='*.tsx' --include='*.yml' \
    packages/cli/src packages/render/src packages/sources/src packages/parse/src scripts .github 2>/dev/null |
    sort -u
}

# Names allowed to have no caller outside the model, each with a written
# reason. An entry here is a decision somebody made on purpose, which is the
# whole point: a new uncalled rule fails the build until somebody says why.
allowed() {
  grep -vE '^\s*(#|$)' scripts/model-internal.txt | awk '{print $1}' | sort -u
}

check() {
  local unreached="" name
  local seen skip names
  seen=$(callers)
  skip=$(allowed)
  names=$(exported)
  # Identifiers never contain a space, so word splitting is the whole parse.
  for name in $names; do
    grep -qx "$name" <<<"$skip" && continue
    grep -qx "$name" <<<"$seen" || unreached="$unreached $name"
  done
  printf '%s' "$unreached"
}

# A source file that is not text is a file every text tool silently skips —
# including this one. `schema.ts` held two raw NUL bytes where `'\u0000'` was
# meant, which made grep treat it as binary and quietly excluded seven exports
# from this very gate. A gate that cannot read a file must say so.
# A shell string cannot hold a NUL, so the test is done where one can be
# written down. `cmp` against the same bytes with NULs stripped is exact.
binary=""
for f in $(git ls-files 'packages/*/src/*.ts' 'scripts/*.ts' 2>/dev/null); do
  LC_ALL=C tr -d '\000' < "$f" | cmp -s - "$f" || binary="$binary $f"
done
if [ -n "$binary" ]; then
  printf '%s✗%s source files hold a raw NUL and are invisible to every text tool:%s\n' "$RED" "$OFF" "$binary"
  printf '  Write the escape, not the byte.\n'
  exit 1
fi

missing=$(check)
if [ -n "$missing" ]; then
  printf '%s✗%s the model exports rules nothing outside it calls:%s\n' "$RED" "$OFF" "$missing"
  printf '  A rule with no caller is an unfinished feature or dead weight. Wire it or delete it.\n'
  exit 1
fi

# Prove the gate fires.
TARGET=packages/model/src/schema.ts
BACKUP=$(mktemp)
cp "$TARGET" "$BACKUP"
restore() { cp "$BACKUP" "$TARGET"; rm -f "$BACKUP"; }
trap restore EXIT
{ echo ""; echo "export const plantedRuleNobodyCalls = 1;"; } >> "$TARGET"
planted=$(check)
restore
trap - EXIT
if ! grep -q 'plantedRuleNobodyCalls' <<<"$planted"; then
  printf '%s✗%s the reachability gate did NOT fire on a planted uncalled export — the gate is broken\n' "$RED" "$OFF"
  exit 1
fi

n=$(exported | wc -l | tr -d ' ')
printf '%s✓%s all %s model exports have a caller outside the model, and the gate fires on a planted one\n' "$GRN" "$OFF" "$n"
