import assert from 'node:assert/strict';
import { test } from 'node:test';

import { againstBaseline, blastRadius, explain, findingKey, makeBaseline, usage } from '../src/index.ts';
import { findings } from '../src/findings.ts';
import { reconcile } from '../src/reconcile.ts';
import type { DeclaredSchema } from '../src/schema.ts';

const col = (name: string, column: string) => ({ schema: 'public', name, column });
const t = (name: string, columns: string[], pk = ['id']) => ({ schema: 'public', name, columns: columns.map((c) => ({ name: c, type: 'integer', nullable: c !== 'id' })), primaryKey: pk, uniques: [] });
const schema: DeclaredSchema = { tables: [t('users', ['id']), t('orders', ['id', 'user_id']), t('invoices', ['id', 'order_id'])], foreignKeys: [] };
const ev = (source: string, line: number, text: string) => ({ kind: 'query' as const, source, line, text });
const join = (a: ReturnType<typeof col>, b: ReturnType<typeof col>, source: string, line: number, text: string) => ({ from: [a], to: [b], directed: false, evidence: ev(source, line, text) });

const model = reconcile(schema, {
  relationships: [
    join(col('orders', 'user_id'), col('users', 'id'), 'reports/summary.sql', 14, 'JOIN users ON orders.user_id = users.id'),
    join(col('orders', 'user_id'), col('users', 'id'), 'app/orders.ts', 3, 'JOIN users u ON u.id = o.user_id'),
    join(col('invoices', 'order_id'), col('orders', 'id'), 'app/billing.ts', 9, 'JOIN orders o ON o.id = i.order_id'),
  ],
  polymorphic: [],
});

test('a baseline accepts today’s debt, fails only what is new, and notices what was paid down', () => {
  const today = findings(model);
  const base = makeBaseline(today, '2026-09-23');
  const clean = againstBaseline(today, base);
  assert.equal(clean.fresh.length, 0, 'nothing is new against a baseline taken from the same run');
  assert.equal(clean.accepted.length, today.length);
  assert.deepEqual(clean.fixed, []);

  // The same code with one query moved down the file: the same debt, nothing new.
  const moved = reconcile(schema, {
    relationships: [
      join(col('orders', 'user_id'), col('users', 'id'), 'reports/summary.sql', 99, 'JOIN users ON orders.user_id = users.id'),
      join(col('orders', 'user_id'), col('users', 'id'), 'app/orders.ts', 3, 'JOIN users u ON u.id = o.user_id'),
      join(col('invoices', 'order_id'), col('orders', 'id'), 'app/billing.ts', 9, 'JOIN orders o ON o.id = i.order_id'),
    ],
    polymorphic: [],
  });
  assert.equal(againstBaseline(findings(moved), base).fresh.length, 0);

  // A new join nothing declared: new debt, and the old entries now count as fixed.
  const other = reconcile(schema, { relationships: [join(col('invoices', 'order_id'), col('users', 'id'), 'app/odd.ts', 1, 'JOIN users u ON u.id = i.order_id')], polymorphic: [] });
  const after = againstBaseline(findings(other), base);
  assert.ok(after.fresh.some((f) => f.code === 'used_undeclared'));
  assert.ok(after.fixed.length > 0);
  assert.ok(base.accepted.every((k, i) => i === 0 || base.accepted[i - 1]! <= k), 'the file is sorted');
  assert.equal(findingKey(today[0]!), findingKey({ ...today[0]!, sentence: today[0]!.sentence.replace(':9', ':2000') }));
  // Nor does a second call site: a join copied into another file is the same debt.
  const withMore = today.find((f) => f.sentence.includes('(and 1 more)'))!;
  assert.equal(findingKey(withMore), findingKey({ ...withMore, sentence: withMore.sentence.replace(' (and 1 more)', '') }));
});

test('explain prints the evidence, why the cardinality is what it is, and the DDL that would close it — and nothing runs', () => {
  const f = findings(model).find((x) => x.code === 'used_undeclared' && x.sentence.includes('orders.user_id'))!;
  const e = explain(model, f);
  assert.deepEqual(e.evidence.map((x) => x.at).sort(), ['app/orders.ts:3', 'reports/summary.sql:14']);
  assert.equal(e.cardinality, 'Many to one: public.users.id is unique, so many rows may point at one.');
  assert.equal(e.closingDdl.length, 1);
  assert.equal(
    e.closingDdl[0],
    'ALTER TABLE public.orders\n  ADD CONSTRAINT orders_user_id_fkey\n  FOREIGN KEY (user_id)\n  REFERENCES public.users (id);',
  );
  // A finding that is not about a missing constraint has no DDL to offer.
  const other = findings(model).find((x) => x.code === 'orphan_side')!;
  assert.equal(explain(model, other).evidence.length > 0, true);
  assert.deepEqual(explain(model, other).closingDdl, []);
});

test('the blast radius is what a change reaches: direct edges, one hop further, and every place to look', () => {
  const b = blastRadius(model, { schema: 'public', name: 'users' });
  assert.deepEqual(b.direct.map((e) => e.id.replace(/public\./g, '')), ['orders.user_id=users.id']);
  assert.deepEqual(b.indirect.map((e) => e.id.replace(/public\./g, '')), ['invoices.order_id=orders.id']);
  assert.deepEqual(b.places, ['reports/summary.sql:14', 'app/orders.ts:3', 'app/billing.ts:9']);
});

test('usage is a fact about a window: what nothing named in it, tables and columns', () => {
  const seen = new Set(['public.orders.id', 'public.orders.user_id', 'public.users.id']);
  const u = usage(model, seen, 'the last 30 days');
  assert.deepEqual(u.unusedTables.map((x) => x.name), ['invoices']);
  assert.deepEqual(u.unusedColumns.map((c) => `${c.name}.${c.column}`), []);
  const fewer = usage(model, new Set(['public.orders.id']), 'an hour');
  assert.deepEqual(fewer.unusedColumns.map((c) => `${c.name}.${c.column}`), ['orders.user_id']);
  assert.equal(fewer.window, 'an hour');
});
