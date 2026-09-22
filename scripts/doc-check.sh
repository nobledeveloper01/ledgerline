#!/usr/bin/env bash
# The documentation gate: the required documents exist and are tracked, every
# ADR referenced exists, the phase file and the roadmap agree, and the journal
# is newer than the last change to code.
set -uo pipefail
cd "$(dirname "$0")/.."
RED=$'\033[0;31m'; YEL=$'\033[0;33m'; GRN=$'\033[0;32m'; OFF=$'\033[0m'
fail=0
err()  { printf '%s✗%s %s\n' "$RED" "$OFF" "$1"; fail=$((fail+1)); }
note() { printf '%s!%s %s\n' "$YEL" "$OFF" "$1"; }
ok()   { printf '%s✓%s %s\n' "$GRN" "$OFF" "$1"; }

REQUIRED="README.md CLAUDE.md CHANGELOG.md PHASE LICENSE docs/00-PRODUCT-STATEMENT.md docs/ROADMAP.md docs/TOOLCHAIN.md docs/JOURNAL.md docs/GATE-PHASE-4.md docs/USAGE.md docs/CONFIGURATION.md docs/FINDINGS.md docs/SOURCES.md"
for f in $REQUIRED; do [ -f "$f" ] || err "missing $f"; done
[ "$fail" -eq 0 ] && ok "all required documents present"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ -n "$(git rev-list -n1 HEAD 2>/dev/null)" ]; then
  untracked=""
  for f in $REQUIRED docs/adr/*.md; do
    [ -f "$f" ] && ! git ls-files --error-unmatch "$f" >/dev/null 2>&1 && untracked="$untracked $f"
  done
  [ -n "$untracked" ] && err "present but not tracked by git:$untracked" || ok "every required document is tracked"
fi

phase=$(tr -d '[:space:]' < PHASE)
grep -qE "^## Phase $phase .*current" docs/ROADMAP.md && ok "PHASE $phase is the phase the roadmap calls current" || err "docs/ROADMAP.md does not mark Phase $phase as current"
grep -q "Phase $phase of" README.md && ok "README.md names the phase" || err "README.md does not say 'Phase $phase of'"

n=0; for a in docs/adr/[0-9]*.md; do n=$((n+1)); printf '%s' "$a" | grep -q "^docs/adr/$(printf '%04d' $n)-" || err "$a is out of sequence"; done
[ "$n" -gt 0 ] && ok "$n ADRs, numbered consecutively"
for ref in $(grep -rhoE 'ADR-[0-9]{4}' README.md CLAUDE.md docs | sort -u); do
  ls docs/adr/${ref#ADR-}-*.md >/dev/null 2>&1 || err "$ref is referenced but no such ADR exists"
done

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ -n "$(git rev-list -n1 HEAD 2>/dev/null)" ]; then
  last_code=$(git log -1 --format=%ct -- packages scripts Makefile 2>/dev/null || echo 0)
  last_journal=$(git log -1 --format=%ct -- docs/JOURNAL.md 2>/dev/null || echo 0)
  if [ "${last_code:-0}" -gt "${last_journal:-0}" ] 2>/dev/null; then note "code has moved since the last journal entry"; else ok "the journal is current with the code"; fi
fi

if [ "$fail" -gt 0 ]; then printf '\n%sdocumentation gate failed%s\n' "$RED" "$OFF"; exit 1; fi
printf '\n%sdocumentation gate passed%s\n' "$GRN" "$OFF"
