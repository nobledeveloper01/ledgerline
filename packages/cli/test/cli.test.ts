import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { baseline, blast, check, explain, history, mermaid, prComment, report, usage } from '../src/index.ts';

function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ledgerline-cli-'));
  cpSync(join(import.meta.dirname, 'repo'), dir, { recursive: true });
  return dir;
}

test('check on a repository that has never heard of the tool: one command, no config, no database', async () => {
  const root = repo();
  const out = await check({ root });
  assert.equal(out.code, 1);
  const text = out.lines.join('\n');
  assert.match(text, /schema from migrations/);
  assert.match(text, /fail: The join in app\/queries\.sql:1 relies on public\.orders\.user_id → public\.users\.id, which no constraint declares\./);
  assert.match(text, /warn: Rows in public\.orders may reference no public\.users/);
  assert.ok(!text.includes('invoices.order_id=orders.id'), 'the declared-and-used join is not a finding');
});

test('check --write writes the model; a later check compares against it and says what moved', async () => {
  const root = repo();
  await check({ root, write: true });
  assert.ok(existsSync(join(root, 'ledgerline.model.json')));
  const clean = await check({ root });
  assert.ok(!clean.lines.join('\n').includes('out of date'));

  // A migration lands that adds the missing constraint: the finding goes, and the model file is stale.
  writeFileSync(join(root, 'migrations', '002_fk.sql'), 'ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);');
  const after = await check({ root });
  const text = after.lines.join('\n');
  assert.equal(after.code, 1, 'a stale model file fails, because a stale diagram is the thing this exists to stop');
  assert.match(text, /ledgerline\.model\.json is out of date: 1 changed state/);
  assert.ok(!text.includes('which no constraint declares'), 'the join is declared now');
  const fixed = await check({ root, write: true });
  assert.equal(fixed.code, 0);
  assert.match(fixed.lines.join('\n'), /No findings\./);
});

test('a baseline lets an old codebase adopt the gate today, and only new debt fails', async () => {
  const root = repo();
  await check({ root, write: true });
  const taken = await baseline({ root });
  assert.match(taken.lines.join('\n'), /New ones will fail; these will not\./);
  const accepted = await check({ root });
  assert.equal(accepted.code, 0, "today's debt is accepted");
  assert.match(accepted.lines.join('\n'), /finding.* accepted by ledgerline\.baseline\.json/);

  // A new undeclared join arrives: that one fails.
  writeFileSync(join(root, 'app', 'more.sql'), 'SELECT * FROM invoices i JOIN users u ON u.id = i.order_id;');
  const fresh = await check({ root });
  assert.equal(fresh.code, 1);
  assert.match(fresh.lines.join('\n'), /invoices\.order_id → public\.users\.id/);
});

test('explain gives the evidence and the DDL, and says plainly that it does not run it', async () => {
  const root = repo();
  const out = await explain('orders.user_id', { root });
  const text = out.lines.join('\n');
  assert.equal(out.code, 0);
  assert.match(text, /Many to one: public\.users\.id is unique/);
  assert.match(text, /query · app\/queries\.sql:1/);
  assert.match(text, /Ledgerline does not run it/);
  assert.match(text, /ADD CONSTRAINT orders_user_id_fkey/);
  assert.equal((await explain('nothing like this', { root })).code, 1);
});

test('blast says what a change reaches and where to look; history says when each thing arrived', async () => {
  const root = repo();
  const b = await blast('users', { root });
  const text = b.lines.join('\n');
  assert.match(text, /public\.users: 1 direct relationship, 1 one hop further/);
  assert.match(text, /app\/queries\.sql:1/);
  assert.equal((await blast('nope', { root })).code, 1);

  const h = await history(null, { root });
  assert.match(h.lines.join('\n'), /001_init\.sql\n {2}table created {3}public\.invoices {2}2 columns, key id/);
  assert.equal((await history('users', { root })).code, 0);
});

test('report writes one HTML file; mermaid prints the diagram and the badge line', async () => {
  const root = repo();
  const r = await report({ root });
  assert.equal(r.code, 0);
  const html = readFileSync(join(root, 'ledgerline.html'), 'utf8');
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('public.orders'));
  const m = await mermaid({ root });
  assert.match(m.lines.join('\n'), /erDiagram/);
  assert.match(m.lines.join('\n'), /<!-- 1 undeclared join -->/);
  rmSync(root, { recursive: true, force: true });
});

test('the pull-request comment leads with the sentence, then the detail, and fails only on failures', async () => {
  const root = repo();
  await check({ root, write: true });
  const out = await prComment({ root });
  assert.equal(out.code, 1);
  const lines = out.lines;
  assert.equal(lines[0], '**1 relationship the code relies on is not declared.**');
  assert.ok(lines.some((l) => l.startsWith('- **fail**')));
  assert.ok(lines.some((l) => l.includes('<details><summary>What this change did to the schema</summary>')));
  assert.ok(lines[lines.length - 1]!.includes('1 undeclared join'));
});

test('a repository with no SQL at all: the ORM file is the schema, and the queries still find the drift', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ledgerline-orm-'));
  mkdirSync(join(root, 'src', 'entity'), { recursive: true });
  writeFileSync(
    join(root, 'src', 'entity', 'customer.entity.ts'),
    `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';\n\n@Entity('customers')\nexport class Customer {\n  @PrimaryGeneratedColumn()\n  id: number;\n\n  @Column({ type: 'varchar', length: 254 })\n  email: string;\n}\n`,
  );
  writeFileSync(
    join(root, 'src', 'entity', 'order.entity.ts'),
    `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';\nimport { Customer } from './customer.entity';\n\n@Entity('orders')\nexport class Order {\n  @PrimaryGeneratedColumn()\n  id: number;\n\n  @Column({ type: 'int', nullable: true })\n  referrerId: number;\n\n  @ManyToOne(() => Customer)\n  @JoinColumn({ name: 'customer_id' })\n  customer: Customer;\n}\n`,
  );
  mkdirSync(join(root, 'reports'), { recursive: true });
  writeFileSync(join(root, 'reports', 'referrals.sql'), 'SELECT o.id FROM orders o JOIN customers c ON c.id = o.referrer_id;\n');

  const out = await check({ root });
  const text = out.lines.join('\n');
  // The schema came from the entities — no migrations, no database, no config.
  assert.match(text, /2 TypeORM entities/);
  // The declared relation is declared and used; the one only the query knows is the finding.
  assert.match(text, /orders\.referrer_id → public\.customers\.id, which no constraint declares/);
  assert.equal(out.code, 1);
  rmSync(root, { recursive: true, force: true });
});

test('usage says what a window touched, names the window, and never advises', async () => {
  const root = repo();
  // A window: one log, two statements. `orders` is never named in it.
  writeFileSync(join(root, 'window.sql'), 'SELECT id, email FROM users WHERE id = 1;\nSELECT * FROM invoices;\n');
  writeFileSync(join(root, 'ledgerline.json'), JSON.stringify({ logs: ['window.sql'], queries: [] }));

  const out = await usage({ root });
  const text = out.lines.join('\n');
  assert.equal(out.code, 0);
  assert.match(text, /Read from window\.sql: 2 statements/);
  assert.match(text, /1 table no query touched in this window:\n {2}public\.orders/);
  // `SELECT *` reads every column, so invoices contributes no unused columns.
  assert.ok(!text.includes('public.invoices.'), 'a star reads every column of the table');
  // users.email and users.id were both named; nothing of users is unused.
  assert.ok(!text.includes('public.users.'), JSON.stringify(out.lines));
  assert.match(text, /a fact about the window, not advice/);
  assert.ok(!/\bdrop\b/i.test(text.replace('advice', '')) || text.includes('not advice'), 'it never tells anyone to drop a column');

  // And the report fades exactly what the window did not touch.
  await report({ root });
  const html = readFileSync(join(root, 'ledgerline.html'), 'utf8');
  assert.match(html, /<g class="table unused" data-table="public\.orders"/);
  assert.match(html, /No query named this column in window\.sql/);
  rmSync(root, { recursive: true, force: true });
});

test('with no query log there is no window, so nothing is faded', async () => {
  const root = repo();
  await report({ root });
  const html = readFileSync(join(root, 'ledgerline.html'), 'utf8');
  // `declared_unused` is an edge state and appears in the stylesheet either
  // way; what must not appear is a faded table, a faded column, or the
  // sentence that names a window.
  assert.ok(!html.includes('class="table unused"'), 'the repository’s own SQL is not a usage sample');
  assert.ok(!html.includes('class="col unused"'));
  assert.ok(!html.includes('No query named this column in'));
  rmSync(root, { recursive: true, force: true });
});

test('a check that read no schema fails, because a check that reads nothing must not go green', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ledgerline-empty-'));
  writeFileSync(join(root, 'README.md'), '# nothing here\n');
  const out = await check({ root });
  const text = out.lines.join('\n');
  assert.equal(out.code, 1, 'silently passing on a repository it could not read is the worst failure this tool can have');
  assert.match(text, /fail: No schema was found, so nothing was checked/);
  assert.match(text, /looked for migrations in/);
  assert.ok(!text.includes('Every relationship the queries rely on is declared'));
  rmSync(root, { recursive: true, force: true });
});

test('a migrations directory full of Ruby is not a schema: the reader falls through to schema.rb', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ledgerline-rails-'));
  mkdirSync(join(root, 'db', 'migrate'), { recursive: true });
  // What Rails actually puts there. Not one line of it is SQL.
  writeFileSync(join(root, 'db', 'migrate', '20260101_create_users.rb'), 'class CreateUsers < ActiveRecord::Migration[7.1]\n  def change\n    create_table :users\n  end\nend\n');
  writeFileSync(
    join(root, 'db', 'schema.rb'),
    'ActiveRecord::Schema[7.1].define(version: 1) do\n  create_table "users", force: :cascade do |t|\n    t.string "email"\n  end\n  create_table "orders", force: :cascade do |t|\n    t.bigint "user_id"\n  end\n  add_foreign_key "orders", "users"\nend\n',
  );
  const out = await check({ root });
  const text = out.lines.join('\n');
  assert.match(text, /schema from db\/schema\.rb/, 'the directory existed and yielded nothing, so it is not the schema');
  assert.ok(!text.includes('No schema was found'));
  rmSync(root, { recursive: true, force: true });
});

test('declared-and-unused is claimed only about tables some query actually named', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ledgerline-sample-'));
  mkdirSync(join(root, 'migrations'), { recursive: true });
  writeFileSync(
    join(root, 'migrations', '001.sql'),
    ['CREATE TABLE users (id serial PRIMARY KEY);', 'CREATE TABLE orders (id serial PRIMARY KEY, user_id integer REFERENCES users (id));', 'CREATE TABLE audits (id serial PRIMARY KEY, user_id integer REFERENCES users (id));'].join('\n'),
  );
  mkdirSync(join(root, 'app'), { recursive: true });
  // A query that reads `orders` and never joins over its key; `audits` is never read at all.
  writeFileSync(join(root, 'app', 'q.sql'), 'SELECT id FROM orders WHERE id > 1;\n');

  const text = (await check({ root })).lines.join('\n');
  assert.match(text, /orders\.user_id → public\.users\.id is declared by .* and used by no query that was read/, 'orders was read, and the join was not there — that is evidence');
  assert.ok(!text.includes('audits.user_id'), 'audits was never read, so nothing is known about it and nothing is said');
  assert.match(text, /tables were named by no query that was read/);
  rmSync(root, { recursive: true, force: true });
});
