import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DeclaredSchema } from '@ledgerline/model';

import { claimsFromSql, maskLiterals, normalisePlaceholders, parseDdl } from '../src/index.ts';

const col = (name: string, column: string, schema = 'public') => ({ schema, name, column });

let schema: DeclaredSchema;
test.before(async () => {
  schema = await parseDdl(`
    CREATE TABLE users (id integer PRIMARY KEY, email text);
    CREATE TABLE orders (id integer PRIMARY KEY, user_id integer, total numeric);
    CREATE TABLE invoices (id integer PRIMARY KEY, order_id integer);
    CREATE TABLE shipments (id integer PRIMARY KEY, order_id integer);
    CREATE TABLE posts (id bigint PRIMARY KEY);
    CREATE TABLE photos (id bigint PRIMARY KEY);
    CREATE TABLE comments (id bigint PRIMARY KEY, owner_type text, owner_id bigint, status text);
  `);
});

test('a JOIN … ON, a JOIN … USING and a cross-table WHERE are each one claim, through the query’s aliases', async () => {
  const c = await claimsFromSql(
    `SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN invoices i ON i.order_id = o.id LEFT JOIN shipments USING (order_id) WHERE o.total > 5;
     SELECT * FROM orders, users WHERE users.id = orders.user_id AND orders.total > 100`,
    { source: 'reports/summary.sql', line: 10 },
    schema,
  );
  assert.equal(c.parsed, 2);
  assert.equal(c.unparsed, 0);
  assert.equal(c.relationships.length, 4);
  assert.equal(c.relationships[0]?.evidence.source, 'reports/summary.sql');
  assert.equal(c.relationships[0]?.evidence.line, 10);
  assert.equal(c.relationships[3]?.evidence.line, 11, 'the second statement is on the next line');
  assert.deepEqual([c.relationships[0]?.from[0], c.relationships[0]?.to[0]], [col('users', 'id'), col('orders', 'user_id')]);
  assert.deepEqual([c.relationships[1]!.from[0], c.relationships[1]!.to[0]], [col('invoices', 'order_id'), col('orders', 'id')]);
  // USING joins the table on each side that has the column — invoices on the left, not users.
  assert.deepEqual([c.relationships[2]!.from[0], c.relationships[2]!.to[0]], [col('invoices', 'order_id'), col('shipments', 'order_id')]);
  assert.deepEqual([c.relationships[3]?.from[0], c.relationships[3]?.to[0]], [col('users', 'id'), col('orders', 'user_id')]);
});

test('every literal is gone from the evidence before it is kept', async () => {
  const c = await claimsFromSql(
    `SELECT * FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'ada@example.com' AND o.total > 4200 AND o.note = $$secret$$`,
    { source: 'log' },
    schema,
  );
  const text = c.relationships[0]!.evidence.text;
  assert.ok(!text.includes('ada@example.com'));
  assert.ok(!text.includes('4200'));
  assert.ok(!text.includes('secret'));
  assert.ok(text.includes('u.id = o.user_id'));
  assert.equal(maskLiterals("WHERE a = 'it''s' AND b = 12.5 AND c = $q$x$q$"), 'WHERE a = ? AND b = ? AND c = ?');
});

test('IN (SELECT …) and a scalar subquery relate the outer column to the inner one; EXISTS keeps the inner joins', async () => {
  const c = await claimsFromSql(
    `SELECT * FROM orders WHERE orders.id IN (SELECT order_id FROM invoices WHERE invoices.id > 3);
     SELECT * FROM users u WHERE u.id = (SELECT user_id FROM orders WHERE orders.total > 1 LIMIT 1);
     SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o JOIN invoices i ON i.order_id = o.id WHERE o.user_id = u.id)`,
    { source: 'q.sql', line: 1 },
    schema,
  );
  const pairs = c.relationships.map((r) => `${r.from[0]!.name}.${r.from[0]!.column}=${r.to[0]!.name}.${r.to[0]!.column}`);
  assert.deepEqual(pairs, ['orders.id=invoices.order_id', 'users.id=orders.user_id', 'invoices.order_id=orders.id', 'orders.user_id=users.id']);
});

test('the polymorphic shape is one claim with its discriminator and target — and a status column beside a join is not one', async () => {
  const c = await claimsFromSql(
    `SELECT * FROM comments c JOIN posts p ON c.owner_id = p.id WHERE c.owner_type = 'Post';
     SELECT * FROM comments c JOIN users u ON c.owner_id = u.id WHERE c.status = 'live'`,
    { source: 'feed.sql' },
    schema,
  );
  assert.equal(c.polymorphic.length, 1);
  assert.deepEqual(c.polymorphic[0]!.discriminator, col('comments', 'owner_type'));
  assert.deepEqual(c.polymorphic[0]!.targets, { Post: { schema: 'public', name: 'posts' } });
  // The polymorphic pair is not also an ordinary claim; the status query's join is.
  assert.deepEqual(c.relationships.map((r) => `${r.from[0]!.name}.${r.from[0]!.column}=${r.to[0]!.name}.${r.to[0]!.column}`), ['comments.owner_id=users.id']);
});

test('UPDATE … FROM and DELETE … USING carry joins; INSERT … SELECT carries the select’s; CTEs and derived tables are not tables', async () => {
  const c = await claimsFromSql(
    `UPDATE orders SET total = 0 FROM users WHERE users.id = orders.user_id AND users.email IS NULL;
     DELETE FROM invoices USING orders WHERE orders.id = invoices.order_id;
     INSERT INTO invoices (order_id) SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id;
     WITH recent AS (SELECT * FROM orders WHERE total > 1) SELECT * FROM recent r JOIN users u ON u.id = r.user_id;
     SELECT * FROM (SELECT user_id FROM orders) d JOIN users u ON u.id = d.user_id`,
    { source: 'w.sql' },
    schema,
  );
  const pairs = c.relationships.map((r) => `${r.from[0]!.name}.${r.from[0]!.column}=${r.to[0]!.name}.${r.to[0]!.column}`);
  assert.deepEqual(pairs, ['users.id=orders.user_id', 'orders.id=invoices.order_id', 'users.id=orders.user_id']);
});

test('an unqualified column is resolved from the schema when it is unambiguous, and skipped when it is not', async () => {
  const c = await claimsFromSql(`SELECT * FROM orders JOIN users ON user_id = users.id; SELECT * FROM orders JOIN invoices ON id = order_id`, { source: 'u.sql' }, schema);
  const pairs = c.relationships.map((r) => `${r.from[0]!.name}.${r.from[0]!.column}=${r.to[0]!.name}.${r.to[0]!.column}`);
  // `user_id` exists only on orders → resolved. `id` exists on both → skipped, never guessed.
  assert.deepEqual(pairs, ['orders.user_id=users.id']);
});

test('other drivers’ placeholders are rewritten so the statement parses, and a statement the grammar refuses is counted', async () => {
  assert.equal(normalisePlaceholders('WHERE a = ? AND b = :name AND c = %s AND d = %(x)s AND e = ${e}'), 'WHERE a = $5 AND b = $4 AND c = $3 AND d = $2 AND e = $1');
  const c = await claimsFromSql(`SELECT * FROM orders o JOIN users u ON u.id = o.user_id WHERE u.id = ?; SELEC nonsense;`, { source: 'log' }, schema);
  assert.equal(c.relationships.length, 1);
  assert.equal(c.unparsed, 1);
});

test('a CTE in front of an UPDATE or a DELETE is a name, not a table', async () => {
  const schema = await parseDdl('CREATE TABLE documents (id uuid PRIMARY KEY, "popularityScore" double precision);', 'ddl.sql');
  // Outline's real statement, shortened: `lockable` exists only inside it.
  const sql = `
    WITH lockable AS (SELECT id FROM documents WHERE id = $1 FOR UPDATE SKIP LOCKED)
    UPDATE documents AS d SET "popularityScore" = 1
    WHERE d.id IN (SELECT id FROM lockable)
  `;
  const c = await claimsFromSql(sql, { source: 'task.ts', line: 1 }, schema);
  assert.equal(c.unparsed, 0);
  const named = new Set(c.relationships.flatMap((r) => [...r.from, ...r.to]).map((x) => x.name));
  assert.ok(!named.has('lockable'), 'a CTE name is not a table the queries use');
  assert.ok(!c.mentions.some((m) => m.includes('lockable')), 'and it is not something the window touched either');
});

test('an unqualified column in a subquery belongs to the outer query when the inner one has no such column', async () => {
  const schema = await parseDdl('CREATE TABLE stars (id uuid PRIMARY KEY, "documentId" uuid); CREATE TABLE documents (id uuid PRIMARY KEY);', 'ddl.sql');
  // Outline's real statement: `"documentId"` is stars', not documents'.
  const sql = 'DELETE FROM stars WHERE NOT EXISTS (SELECT NULL FROM documents doc WHERE doc.id = "documentId")';
  const c = await claimsFromSql(sql, { source: 'migration.js', line: 1 }, schema);
  assert.equal(c.relationships.length, 1);
  const r = c.relationships[0]!;
  const ends = [...r.from, ...r.to].map((x) => `${x.name}.${x.column}`).sort();
  assert.deepEqual(ends, ['documents.id', 'stars.documentId'], 'resolving it against the inner scope invented documents.documentId and a self-join');
});
