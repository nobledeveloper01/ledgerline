import assert from 'node:assert/strict';
import { test } from 'node:test';

import fc from 'fast-check';

import { reconcile, type DeclaredSchema } from '@ledgerline/model';

import { claimsFromSql } from '../src/index.ts';

/**
 * Phase 2's gate, as a property: over generated schemas and query sets, no
 * relationship that appears in a query is missing from the used model, and
 * no relationship in the used model lacks a line of evidence. Seeded in CI so
 * a failure reproduces.
 */

const NAMES = ['users', 'orders', 'invoices', 'items', 'shipments', 'notes', 'plans', 'events'];

const schemaArb = fc
  .uniqueArray(fc.constantFrom(...NAMES), { minLength: 2, maxLength: 6 })
  .chain((names) =>
    fc
      .tuple(
        ...names.map((name) =>
          fc.record({
            name: fc.constant(name),
            // Every table has id; some have a few reference-shaped columns.
            refs: fc.uniqueArray(fc.constantFrom(...names.filter((n) => n !== name)), { maxLength: 3 }),
            nullable: fc.boolean(),
          }),
        ),
      )
      .map((tables): DeclaredSchema => ({
        tables: tables.map((t) => ({
          schema: 'public',
          name: t.name,
          columns: [{ name: 'id', type: 'integer', nullable: false }, ...t.refs.map((r) => ({ name: `${r}_id`, type: 'integer', nullable: t.nullable }))],
          primaryKey: ['id'],
          uniques: [],
        })),
        foreignKeys: [],
      })),
  );

interface Join {
  readonly from: string;
  readonly fromCol: string;
  readonly to: string;
  readonly kind: 'on' | 'where' | 'in';
}

function joinsArb(schema: DeclaredSchema): fc.Arbitrary<Join[]> {
  const candidates: Join[] = [];
  for (const t of schema.tables) {
    for (const c of t.columns) {
      if (c.name === 'id') continue;
      const target = c.name.slice(0, -3);
      if (schema.tables.some((x) => x.name === target)) {
        candidates.push({ from: t.name, fromCol: c.name, to: target, kind: 'on' }, { from: t.name, fromCol: c.name, to: target, kind: 'where' }, { from: t.name, fromCol: c.name, to: target, kind: 'in' });
      }
    }
  }
  return candidates.length === 0 ? fc.constant([]) : fc.uniqueArray(fc.constantFrom(...candidates), { minLength: 1, maxLength: 8 });
}

function sqlFor(j: Join, i: number): string {
  const a = `a${i}`;
  const b = `b${i}`;
  switch (j.kind) {
    case 'on':
      return `SELECT ${a}.id FROM ${j.from} ${a} JOIN ${j.to} ${b} ON ${b}.id = ${a}.${j.fromCol} WHERE ${a}.id > ${i}`;
    case 'where':
      return `SELECT 1 FROM ${j.from} ${a}, ${j.to} ${b} WHERE ${a}.${j.fromCol} = ${b}.id AND ${b}.id <> ${i}`;
    case 'in':
      return `SELECT 1 FROM ${j.from} ${a} WHERE ${a}.${j.fromCol} IN (SELECT id FROM ${j.to} WHERE id > ${i})`;
  }
}

test('every join in a query is in the used model, and every used edge has a line of evidence', async () => {
  await fc.assert(
    fc.asyncProperty(schemaArb.chain((s) => fc.tuple(fc.constant(s), joinsArb(s))), async ([schema, joins]) => {
      const sql = joins.map(sqlFor).join(';\n');
      const claims = await claimsFromSql(sql, { source: 'gen.sql', line: 1 }, schema);
      assert.equal(claims.unparsed, 0);
      const model = reconcile(schema, claims);
      for (const j of joins) {
        const found = model.edges.find((e) => {
          const ends = [...e.from, ...e.to].map((c) => `${c.name}.${c.column}`).sort().join('|');
          return ends === [`${j.from}.${j.fromCol}`, `${j.to}.id`].sort().join('|');
        });
        assert.ok(found, `${j.from}.${j.fromCol} = ${j.to}.id from a ${j.kind} query is missing`);
        assert.equal(found.state, 'used_undeclared');
        // Oriented from uniqueness: the target's id is the primary key, so the edge points at it.
        assert.equal(found.to[0]!.name, j.to);
        assert.equal(found.cardinality, 'many_to_one');
      }
      for (const e of model.edges) {
        assert.ok(e.evidence.length > 0 && e.evidence.every((v) => v.text.length > 0 && v.source === 'gen.sql' && v.line !== undefined));
        assert.ok(!/\d{2,}/.test(e.evidence[0]!.text.replace(/a\d+|b\d+|\$\d+/g, '')), 'no literal survives in the evidence');
      }
      // Nothing invented: every edge corresponds to a generated join.
      assert.equal(model.edges.length, new Set(joins.map((j) => `${j.from}.${j.fromCol}=${j.to}`)).size);
    }),
    { numRuns: 200, seed: 20260922 },
  );
});
