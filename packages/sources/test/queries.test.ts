import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

import { parseDdl } from '@ledgerline/parse';

import { claimsFromLog, claimsFromRepository, claimsFromSource, claimsFromSqlFiles, stringLiterals } from '../src/index.ts';

const repo = join(import.meta.dirname, 'repo');
const pair = (r: { from: readonly { name: string; column: string }[]; to: readonly { name: string; column: string }[] }) => `${r.from[0]!.name}.${r.from[0]!.column}=${r.to[0]!.name}.${r.to[0]!.column}`;

test('.sql files under a directory: each statement with its file and line', async () => {
  const g = await claimsFromSqlFiles(join(repo, 'reports'), null, repo);
  assert.equal(g.sources, 1);
  assert.deepEqual(g.relationships.map(pair), ['users.id=orders.user_id']);
  assert.equal(g.relationships[0]!.evidence.source, 'reports/summary.sql');
  assert.equal(g.relationships[0]!.evidence.line, 2, 'the statement starts after the comment line');
  assert.ok(!g.relationships[0]!.evidence.text.includes('2026-01-01'), 'the literal is masked');
});

test('string literals are lexed, not regexed: comments are skipped, template placeholders survive, Python triple quotes work', () => {
  const lits = stringLiterals(`const a = "x"; // "not this"\n/* 'nor this' */ const b = 'it\\'s'; const c = \`multi\nline\`; d = """tri\nple"""`);
  assert.deepEqual(lits.map((l) => [l.text, l.line]), [['x', 1], ["it's", 2], ['multi\nline', 2], ['tri\nple', 3]]);
});

test('source files: queries in TypeScript, Python and JavaScript, with their lines; comments and vendored code ignored', async () => {
  const g = await claimsFromSource(join(repo, 'app'), null, repo);
  assert.equal(g.sources, 2);
  const seen = g.relationships.map((r) => `${pair(r)} @ ${r.evidence.source}:${r.evidence.line}`);
  assert.deepEqual(seen.sort(), ['orders.id=audit_log.order_id @ app/orders.ts:7', 'users.id=orders.user_id @ app/orders.ts:3']);
  assert.equal(g.polymorphic.length, 1, 'the Python query is the polymorphic shape');
  assert.equal(g.polymorphic[0]!.evidence.source, 'app/feed.py');
  assert.ok(!g.relationships.some((r) => r.evidence.text.includes('ada@example.com')));
  const whole = await claimsFromRepository(repo);
  assert.ok(!whole.relationships.some((r) => r.evidence.source.includes('node_modules')));
});

test('a log: plain SQL, a pg_stat_statements JSON export, and a CSV with a query column', async () => {
  const plain = await claimsFromLog(join(repo, 'queries.log'));
  assert.deepEqual(plain.relationships.map(pair), ['users.id=orders.user_id', 'orders.id=invoices.order_id']);
  assert.ok(!plain.relationships[0]!.evidence.text.includes('ada@'));
  const json = await claimsFromLog(join(repo, 'stats.json'));
  assert.deepEqual(json.relationships.map(pair), ['users.id=orders.user_id']);
  assert.equal(json.parsed, 2);
  const csv = await claimsFromLog(join(repo, 'stats.csv'));
  assert.deepEqual(csv.relationships.map(pair), ['orders.id=invoices.order_id']);
});

test('with a schema, unqualified columns resolve; the whole repository reconciles to the three edge states', async () => {
  const schema = await parseDdl('CREATE TABLE users (id integer PRIMARY KEY, email text); CREATE TABLE orders (id integer PRIMARY KEY, user_id integer, total numeric, created_at timestamptz); CREATE TABLE invoices (id integer PRIMARY KEY, order_id integer REFERENCES orders);');
  const g = await claimsFromRepository(repo, schema);
  const { reconcile } = await import('@ledgerline/model');
  const m = reconcile(schema, g);
  const states = Object.fromEntries(m.edges.map((e) => [e.id.replace(/public\./g, ''), e.state]));
  assert.equal(states['orders.user_id=users.id'], 'used_undeclared');
  assert.equal(states['audit_log.order_id=orders.id'], 'used_undeclared');
  assert.deepEqual(m.undeclaredTables.map((t) => t.name), ['audit_log', 'comments', 'posts']);
  assert.ok(m.edges.find((e) => e.id.includes('orders.user_id'))!.support >= 2, 'the same join in the report and the service is one edge with two places');
});
