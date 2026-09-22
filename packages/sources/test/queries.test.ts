import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

test('a repository that does not hold still is still read: a dangling symlink, an unreadable directory, a file that vanished', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledgerline-walk-'));
  mkdirSync(join(dir, 'sql'));
  writeFileSync(join(dir, 'sql', 'good.sql'), 'SELECT 1 FROM orders o JOIN users u ON u.id = o.user_id;');
  symlinkSync(join(dir, 'sql', 'gone.sql'), join(dir, 'sql', 'dangling.sql'));
  mkdirSync(join(dir, 'sql', 'locked'));
  writeFileSync(join(dir, 'sql', 'locked', 'hidden.sql'), 'SELECT 1;');
  chmodSync(join(dir, 'sql', 'locked'), 0o000);

  const g = await claimsFromSqlFiles(join(dir, 'sql'));
  // The one readable file was read; nothing threw.
  assert.equal(g.relationships.length, 1);

  chmodSync(join(dir, 'sql', 'locked'), 0o755);
  rmSync(dir, { recursive: true, force: true });
});

test('an English sentence that starts with a SQL verb is not a query, and Ruby interpolation is a value', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledgerline-heur-'));
  writeFileSync(
    join(dir, 'ui.rb'),
    [
      '# The strings a real application holds that begin with a SQL verb.',
      'BUTTONS = ["delete", "Delete & re-draft", "Update your profile", "Select your favourite fruit or not. Up to you.", "Insert text with emoji"]',
      '# And a real query, with Ruby interpolation in it.',
      'SQL = "SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE o.total > #{threshold}"',
    ].join('\n'),
  );
  const g = await claimsFromSource(dir);
  assert.equal(g.unparsed, 0, 'not one of the interface strings was offered to the parser');
  assert.equal(g.relationships.length, 1, 'the query with #{…} in it parsed');
  assert.equal(g.relationships[0]!.evidence.text.includes('#{'), false, 'the interpolation became a placeholder');
  rmSync(dir, { recursive: true, force: true });
});

test('DELETE FROM is the only legal spelling, so an English sentence with both words is not a query', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ledgerline-delete-'));
  writeFileSync(
    join(dir, 'ui.go'),
    ['// memos has this string, and it matched a shape that allowed anything between the two words.', 'const label = "delete member from nested name"', 'const real = `DELETE FROM stars WHERE id = $1`'].join('\n'),
  );
  const g = await claimsFromSource(dir);
  assert.equal(g.unparsed, 0, 'the sentence was never offered to the parser');
  assert.equal(g.parsed, 1, 'and the real statement still was');
  rmSync(dir, { recursive: true, force: true });
});
