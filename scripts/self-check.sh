#!/usr/bin/env bash
# The product is its own first user, and its own first gate.
#
# Runs `ledgerline check` against the shop fixture, asserts it finds what the
# fixture's expected.json says it should, then plants a drift — a join no
# migration declares — and asserts the exit code goes non-zero. A gate that
# has never been watched fail is not a gate.
set -uo pipefail
cd "$(dirname "$0")/.."
RED=$'\033[0;31m'; GRN=$'\033[0;32m'; OFF=$'\033[0m'
CLI="node --conditions=source packages/cli/src/bin.ts"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cp -R fixtures/shop-with-queries/migrations "$WORK/migrations"
cp -R fixtures/shop-with-queries/queries "$WORK/queries"

out=$($CLI check --root "$WORK" --no-color 2>&1); code=$?
if [ "$code" -eq 0 ]; then
  printf '%s✗%s the fixture has two undeclared joins and check passed\n' "$RED" "$OFF"; echo "$out"; exit 1
fi
grep -q 'public.orders.user_id → public.users.id' <<<"$out" || { printf '%s✗%s check did not find the undeclared join\n' "$RED" "$OFF"; echo "$out"; exit 1; }
grep -q 'public.audit_log is queried' <<<"$out" || { printf '%s✗%s check did not find the ghost table\n' "$RED" "$OFF"; echo "$out"; exit 1; }

# With every relationship declared, it passes.
cat >> "$WORK/migrations/002_declare.sql" <<'SQL'
CREATE TABLE audit_log (id bigserial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders (id), actor text);
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
SQL
$CLI check --root "$WORK" --no-color >/dev/null 2>&1 || {
  printf '%s✗%s every relationship is declared and check still fails\n' "$RED" "$OFF"; $CLI check --root "$WORK" --no-color; exit 1; }

# Now plant a drift: a query relying on a join nothing declares.
$CLI check --root "$WORK" --write --no-color >/dev/null 2>&1
echo "SELECT * FROM refunds r JOIN users u ON u.id = r.invoice_id;" > "$WORK/queries/planted.sql"
if $CLI check --root "$WORK" --no-color >/dev/null 2>&1; then
  printf '%s✗%s a planted undeclared join did not fail the check\n' "$RED" "$OFF"; exit 1
fi
printf '%s✓%s ledgerline check finds its own fixture'"'"'s drift, passes when it is declared, and fails on a planted join\n' "$GRN" "$OFF"
