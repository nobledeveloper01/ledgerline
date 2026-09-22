import assert from 'node:assert/strict';
import { test } from 'node:test';

import { diff, isEmptyDiff } from '../src/diff.ts';
import { changeFindings, fails, findings } from '../src/findings.ts';
import { reconcile } from '../src/reconcile.ts';
import type { DeclaredSchema } from '../src/schema.ts';

const col = (name: string, column: string) => ({ schema: 'public', name, column });
const users = { schema: 'public', name: 'users', columns: [{ name: 'id', type: 'integer', nullable: false }], primaryKey: ['id'], uniques: [] };
const orders = { schema: 'public', name: 'orders', columns: [{ name: 'id', type: 'integer', nullable: false }, { name: 'user_id', type: 'integer', nullable: true }], primaryKey: ['id'], uniques: [] };
const before: DeclaredSchema = { tables: [users, orders], foreignKeys: [] };
const after: DeclaredSchema = { ...before, foreignKeys: [{ name: 'orders_user_id_fkey', from: [col('orders', 'user_id')], to: [col('users', 'id')] }] };
const theJoin = { from: [col('orders', 'user_id')], to: [col('users', 'id')], directed: false, evidence: { kind: 'query' as const, source: 'reports/summary.sql', line: 14, text: 'JOIN users ON orders.user_id = users.id' } };

test('the finding is one sentence with the line in it, and it fails the build', () => {
  const m = reconcile(before, { relationships: [theJoin], polymorphic: [] });
  const f = findings(m);
  assert.equal(f.length, 1);
  assert.equal(f[0]!.sentence, 'The join in reports/summary.sql:14 relies on public.orders.user_id → public.users.id, which no constraint declares.');
  assert.deepEqual(f[0]!.where, ['reports/summary.sql:14']);
  assert.equal(fails(f), true);
});

test('adding the constraint the code relied on shows as the edge changing state, and the finding goes away', () => {
  const b = reconcile(before, { relationships: [theJoin], polymorphic: [] });
  const a = reconcile(after, { relationships: [theJoin], polymorphic: [] });
  const d = diff(b, a);
  assert.equal(d.edgesAdded.length, 0);
  assert.equal(d.edgesRemoved.length, 0);
  assert.equal(d.edgesChanged.length, 1);
  assert.deepEqual([d.edgesChanged[0]!.before, d.edgesChanged[0]!.after], ['used_undeclared', 'declared_and_used']);
  assert.equal(findings(a).length, 0);
  assert.equal(isEmptyDiff(diff(a, a)), true);
});

test('a dropped column and a removed table are in the diff, and the removal is a warning not a failure', () => {
  const shrunk: DeclaredSchema = { tables: [{ ...orders, columns: [orders.columns[0]!] }], foreignKeys: [] };
  const d = diff(reconcile(after, { relationships: [theJoin], polymorphic: [] }), reconcile(shrunk, { relationships: [], polymorphic: [] }));
  assert.deepEqual(d.tablesRemoved.map((t) => t.name), ['users']);
  assert.deepEqual(d.columnsChanged.map((c) => [c.column, c.after]), [['user_id', null]]);
  assert.equal(d.edgesRemoved.length, 1);
  const f = changeFindings(d);
  assert.deepEqual(f.map((x) => x.severity), ['warn', 'warn']);
  assert.equal(fails(f), false);
});

test('a policy can silence a class of finding without touching the model', () => {
  const m = reconcile(before, { relationships: [theJoin], polymorphic: [] });
  assert.equal(findings(m, { usedUndeclared: 'ignore', declaredUnused: 'warn', undeclaredTable: 'fail', edgeRemoved: 'warn', tableRemoved: 'warn' }).length, 0);
});
