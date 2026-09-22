import assert from 'node:assert/strict';
import { test } from 'node:test';

import { reconcile } from '../src/reconcile.ts';
import type { Claims, RelationshipClaim } from '../src/claims.ts';
import type { DeclaredSchema } from '../src/schema.ts';

const col = (name: string, column: string) => ({ schema: 'public', name, column });

const schema: DeclaredSchema = {
  tables: [
    { schema: 'public', name: 'users', columns: [{ name: 'id', type: 'integer', nullable: false }], primaryKey: ['id'], uniques: [] },
    { schema: 'public', name: 'orders', columns: [{ name: 'id', type: 'integer', nullable: false }, { name: 'user_id', type: 'integer', nullable: true }], primaryKey: ['id'], uniques: [] },
    { schema: 'public', name: 'invoices', columns: [{ name: 'id', type: 'integer', nullable: false }, { name: 'order_id', type: 'integer', nullable: true }], primaryKey: ['id'], uniques: [] },
  ],
  foreignKeys: [{ name: 'invoices_order_id_fkey', from: [col('invoices', 'order_id')], to: [col('orders', 'id')] }],
};

const join = (text: string, from: ReturnType<typeof col>, to: ReturnType<typeof col>, line = 1): RelationshipClaim => ({
  from: [from],
  to: [to],
  directed: false,
  evidence: { kind: 'query', source: 'reports/summary.sql', line, text },
});

test('a join the schema never declared is an edge in the state that bites, with its line on it', () => {
  const claims: Claims = { relationships: [join('JOIN users ON orders.user_id = users.id', col('orders', 'user_id'), col('users', 'id'), 14)], polymorphic: [] };
  const m = reconcile(schema, claims);
  const e = m.edges.find((x) => x.state === 'used_undeclared');
  assert.ok(e);
  // Oriented from uniqueness: users.id is the primary key, so the join points at it.
  assert.deepEqual(e.from, [col('orders', 'user_id')]);
  assert.deepEqual(e.to, [col('users', 'id')]);
  assert.equal(e.cardinality, 'many_to_one');
  assert.equal(e.directed, true);
  assert.equal(e.evidence[0]?.line, 14);
});

test('a constraint nobody queries is declared and unused; one a query uses is declared and used, with both pieces of evidence', () => {
  const unused = reconcile(schema, { relationships: [], polymorphic: [] });
  assert.equal(unused.edges.length, 1);
  assert.equal(unused.edges[0]?.state, 'declared_unused');
  assert.equal(unused.edges[0]?.evidence[0]?.kind, 'constraint');

  // The same pair seen from the other direction in a query still meets the constraint as one edge.
  const used = reconcile(schema, { relationships: [join('JOIN orders ON orders.id = invoices.order_id', col('orders', 'id'), col('invoices', 'order_id'))], polymorphic: [] });
  assert.equal(used.edges.length, 1);
  const e = used.edges[0]!;
  assert.equal(e.state, 'declared_and_used');
  assert.deepEqual(e.evidence.map((v) => v.kind), ['constraint', 'query']);
  // The constraint's orientation wins.
  assert.deepEqual(e.from, [col('invoices', 'order_id')]);
});

test('a join between two non-unique sides stays undirected and unknown rather than guessed', () => {
  const claims: Claims = { relationships: [join('JOIN orders o2 ON o1.user_id = o2.user_id', col('orders', 'user_id'), col('orders', 'user_id'))], polymorphic: [] };
  const m = reconcile(schema, claims);
  const e = m.edges.find((x) => x.state === 'used_undeclared')!;
  assert.equal(e.directed, false);
  assert.equal(e.cardinality, 'unknown');
});

test('a table only the queries know about is a ghost, listed, and never invented into the schema', () => {
  const claims: Claims = { relationships: [join('JOIN audit_log a ON a.order_id = orders.id', col('audit_log', 'order_id'), col('orders', 'id'))], polymorphic: [] };
  const m = reconcile(schema, claims);
  assert.deepEqual(m.undeclaredTables, [{ schema: 'public', name: 'audit_log' }]);
  assert.equal(m.tables.length, 3);
});

test('a polymorphic association is one edge with its targets, never three flat ones', () => {
  const claims: Claims = {
    relationships: [],
    polymorphic: [
      { from: [col('comments', 'owner_id')], discriminator: col('comments', 'owner_type'), targets: { Post: { schema: 'public', name: 'posts' } }, evidence: { kind: 'query', source: 'a.sql', line: 3, text: "owner_type = 'Post' AND owner_id = posts.id" } },
      { from: [col('comments', 'owner_id')], discriminator: col('comments', 'owner_type'), targets: { Photo: { schema: 'public', name: 'photos' } }, evidence: { kind: 'query', source: 'b.sql', line: 9, text: "owner_type = 'Photo' AND owner_id = photos.id" } },
    ],
  };
  const m = reconcile(schema, claims);
  assert.equal(m.edges.length, 1, 'the declared constraint only; the polymorphic pair is not an ordinary edge');
  assert.equal(m.polymorphic.length, 1);
  assert.deepEqual(Object.keys(m.polymorphic[0]!.targets).sort(), ['Photo', 'Post']);
  assert.equal(m.polymorphic[0]!.evidence.length, 2);
});

test('a claim without evidence is not a claim', () => {
  const bad: RelationshipClaim = { from: [col('orders', 'user_id')], to: [col('users', 'id')], directed: false, evidence: { kind: 'query', source: '', text: '' } };
  const m = reconcile(schema, { relationships: [bad], polymorphic: [] });
  assert.equal(m.edges.filter((e) => e.state === 'used_undeclared').length, 0);
});

test('the model is canonical: the same inputs in any order give the same ids in the same order', () => {
  const a = join('x', col('orders', 'user_id'), col('users', 'id'));
  const b = join('y', col('audit_log', 'order_id'), col('orders', 'id'));
  const one = reconcile(schema, { relationships: [a, b], polymorphic: [] });
  const two = reconcile(schema, { relationships: [b, a], polymorphic: [] });
  assert.deepEqual(one.edges.map((e) => e.id), two.edges.map((e) => e.id));
  assert.deepEqual(one.tables.map((t) => t.name), ['invoices', 'orders', 'users']);
});
