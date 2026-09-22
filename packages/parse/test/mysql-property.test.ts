import assert from 'node:assert/strict';
import { test } from 'node:test';

import fc from 'fast-check';

import { reconcile, type DeclaredSchema } from '@ledgerline/model';

import { claimsFromSql, mysqlToPostgres, parseDdl } from '../src/index.ts';

/**
 * Phase 5's half of Phase 2's gate: the same property, over the same shapes,
 * written the way MySQL writes them. Backtick identifiers, `int(11)`,
 * `ENGINE=InnoDB`, `LIMIT n, m` — the schema read back must be the schema,
 * and every join in a query must still be in the used model with a line of
 * evidence behind it. Seeded, so a failure reproduces.
 */

const NAMES = ['users', 'orders', 'invoices', 'items', 'shipments', 'notes', 'plans', 'events'];

const tablesArb = fc.uniqueArray(fc.constantFrom(...NAMES), { minLength: 2, maxLength: 6 }).chain((names) =>
  fc.tuple(
    ...names.map((name) =>
      fc.record({
        name: fc.constant(name),
        refs: fc.uniqueArray(fc.constantFrom(...names.filter((n) => n !== name)), { maxLength: 3 }),
        nullable: fc.boolean(),
      }),
    ),
  ),
);

type Spec = { readonly name: string; readonly refs: readonly string[]; readonly nullable: boolean };

function mysqlDdl(tables: readonly Spec[]): string {
  return tables
    .map((t) => {
      const cols = ['`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY', ...t.refs.map((r) => `\`${r}_id\` int(11)${t.nullable ? ' DEFAULT NULL' : ' NOT NULL'}`), ...t.refs.map((r) => `KEY \`${t.name}_${r}_idx\` (\`${r}_id\`)`)];
      return `CREATE TABLE \`${t.name}\` (\n  ${cols.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    })
    .join('\n');
}

function expected(tables: readonly Spec[]): DeclaredSchema {
  return {
    tables: tables.map((t) => ({
      schema: 'public',
      name: t.name,
      columns: [{ name: 'id', type: 'integer', nullable: false }, ...t.refs.map((r) => ({ name: `${r}_id`, type: 'integer', nullable: t.nullable }))],
      primaryKey: ['id'],
      uniques: [],
    })),
    foreignKeys: [],
  };
}

test('MySQL DDL for a schema reads back as that schema', async () => {
  await fc.assert(
    fc.asyncProperty(tablesArb, async (tables) => {
      const { sql, skipped } = mysqlToPostgres(mysqlDdl(tables));
      assert.equal(skipped.length, 0, 'nothing in this shape is beyond the rewrite');
      const read = await parseDdl(sql, 'gen.sql');
      const want = expected(tables);
      assert.equal(read.tables.length, want.tables.length);
      for (const t of want.tables) {
        const got = read.tables.find((x) => x.name === t.name);
        assert.ok(got, `${t.name} is missing`);
        assert.deepEqual(got.columns, t.columns, `${t.name} columns`);
        assert.deepEqual(got.primaryKey, t.primaryKey);
        // The `KEY` clauses are indexes, not constraints; none of them is unique.
        assert.deepEqual(got.uniques, []);
      }
    }),
    { numRuns: 200, seed: 20260922 },
  );
});

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

/** The same three query shapes, in MySQL's spelling: backticks throughout, and `LIMIT n, m`. */
function mysqlSql(j: Join, i: number): string {
  const a = `a${i}`;
  const b = `b${i}`;
  switch (j.kind) {
    case 'on':
      return `SELECT \`${a}\`.\`id\` FROM \`${j.from}\` \`${a}\` JOIN \`${j.to}\` \`${b}\` ON \`${b}\`.\`id\` = \`${a}\`.\`${j.fromCol}\` WHERE \`${a}\`.\`id\` > ${i} LIMIT ${i}, 10`;
    case 'where':
      return `SELECT 1 FROM \`${j.from}\` \`${a}\`, \`${j.to}\` \`${b}\` WHERE \`${a}\`.\`${j.fromCol}\` = \`${b}\`.\`id\` AND \`${b}\`.\`id\` <> ${i}`;
    case 'in':
      return `SELECT 1 FROM \`${j.from}\` \`${a}\` WHERE \`${a}\`.\`${j.fromCol}\` IN (SELECT \`id\` FROM \`${j.to}\` WHERE \`id\` > ${i})`;
  }
}

test('every join in a MySQL query is in the used model, and every used edge has a line of evidence', async () => {
  await fc.assert(
    fc.asyncProperty(
      tablesArb.map(expected).chain((s) => fc.tuple(fc.constant(s), joinsArb(s))),
      async ([schema, joins]) => {
        const sql = joins.map(mysqlSql).join(';\n');
        // The dialect is doing the work, and this is the proof: the same SQL
        // read as PostgreSQL does not parse. If it ever does, the MySQL pass
        // is a no-op and this test would be green for the wrong reason.
        if (joins.length > 0) {
          const asPostgres = await claimsFromSql(sql, { source: 'gen.sql', line: 1 }, schema);
          assert.equal(asPostgres.relationships.length, 0, 'MySQL query syntax must not read as PostgreSQL');
          assert.ok(asPostgres.unparsed > 0, 'the backtick rewrite is what makes this parse');
        }
        const claims = await claimsFromSql(sql, { source: 'gen.sql', line: 1 }, schema, 'mysql');
        assert.equal(claims.unparsed, 0);
        const model = reconcile(schema, claims);
        for (const j of joins) {
          const found = model.edges.find((e) => {
            const ends = [...e.from, ...e.to].map((c) => `${c.name}.${c.column}`).sort().join('|');
            return ends === [`${j.from}.${j.fromCol}`, `${j.to}.id`].sort().join('|');
          });
          assert.ok(found, `${j.from}.${j.fromCol} = ${j.to}.id from a ${j.kind} query is missing`);
          assert.equal(found.state, 'used_undeclared');
          assert.equal(found.to[0]!.name, j.to);
          assert.equal(found.cardinality, 'many_to_one');
        }
        for (const e of model.edges) {
          assert.ok(e.evidence.length > 0 && e.evidence.every((v) => v.text.length > 0 && v.source === 'gen.sql' && v.line !== undefined));
          assert.ok(!/\d{2,}/.test(e.evidence[0]!.text.replace(/a\d+|b\d+|\$\d+/g, '')), 'no literal survives in the evidence');
        }
        assert.equal(model.edges.length, new Set(joins.map((j) => `${j.from}.${j.fromCol}=${j.to}`)).size);
      },
    ),
    { numRuns: 200, seed: 20260922 },
  );
});
