import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DdlSyntaxError, foldMigrations, parseDdl } from '../src/index.ts';

test('CREATE TABLE with inline and table-level constraints becomes the declared schema, types spelled as PostgreSQL spells them', async () => {
  const s = await parseDdl(`
    CREATE TABLE users (id serial PRIMARY KEY, email varchar(80) NOT NULL UNIQUE, joined timestamptz, tags text[]);
    CREATE TABLE orders (
      id bigint NOT NULL,
      user_id integer REFERENCES users,
      sku text,
      CONSTRAINT orders_pkey PRIMARY KEY (id),
      UNIQUE (user_id, sku)
    );
  `);
  const users = s.tables.find((t) => t.name === 'users')!;
  assert.deepEqual(users.columns, [
    { name: 'id', type: 'integer', nullable: false },
    { name: 'email', type: 'character varying(80)', nullable: false },
    { name: 'joined', type: 'timestamp with time zone', nullable: true },
    { name: 'tags', type: 'text[]', nullable: true },
  ]);
  assert.deepEqual(users.primaryKey, ['id']);
  assert.deepEqual(users.uniques, [['email']]);
  const orders = s.tables.find((t) => t.name === 'orders')!;
  assert.deepEqual(orders.primaryKey, ['id']);
  assert.deepEqual(orders.uniques, [['user_id', 'sku']]);
  // `REFERENCES users` with no column list means the target's primary key, as PostgreSQL resolves it.
  assert.deepEqual(s.foreignKeys, [
    { name: 'orders_user_id_fkey', from: [{ schema: 'public', name: 'orders', column: 'user_id' }], to: [{ schema: 'public', name: 'users', column: 'id' }] },
  ]);
});

test('migrations fold in order: add, alter, rename, drop, and the constraints follow the columns', async () => {
  const s = await foldMigrations([
    { name: '001_users.sql', sql: 'CREATE TABLE users (id integer PRIMARY KEY);' },
    { name: '002_orders.sql', sql: 'CREATE TABLE orders (id integer PRIMARY KEY, customer integer, note text);' },
    { name: '003_fk.sql', sql: 'ALTER TABLE orders ADD CONSTRAINT orders_customer_fkey FOREIGN KEY (customer) REFERENCES users (id);' },
    { name: '004_rename.sql', sql: 'ALTER TABLE orders RENAME COLUMN customer TO user_id; ALTER TABLE users RENAME TO customers;' },
    { name: '005_alter.sql', sql: 'ALTER TABLE orders ALTER COLUMN note TYPE varchar(200); ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL; ALTER TABLE orders DROP COLUMN note;' },
    { name: '006_index.sql', sql: 'CREATE UNIQUE INDEX orders_user_id_key ON orders (user_id); CREATE INDEX orders_user_idx ON orders (user_id);' },
    { name: '007_audit.sql', sql: 'CREATE TABLE audit (id integer PRIMARY KEY); DROP TABLE audit;' },
  ]);
  assert.deepEqual(s.tables.map((t) => t.name), ['customers', 'orders']);
  const orders = s.tables.find((t) => t.name === 'orders')!;
  assert.deepEqual(orders.columns, [
    { name: 'id', type: 'integer', nullable: false },
    { name: 'user_id', type: 'integer', nullable: false },
  ]);
  assert.deepEqual(orders.uniques, [['user_id']], 'the unique index counts; the plain index does not');
  assert.deepEqual(s.foreignKeys, [
    { name: 'orders_customer_fkey', from: [{ schema: 'public', name: 'orders', column: 'user_id' }], to: [{ schema: 'public', name: 'customers', column: 'id' }] },
  ]);
});

test('dropping a column or a table takes its constraints with it; a schema-qualified name keeps its schema', async () => {
  const s = await foldMigrations([
    { name: '1.sql', sql: 'CREATE SCHEMA billing; CREATE TABLE billing.plans (id integer PRIMARY KEY); CREATE TABLE subs (id integer PRIMARY KEY, plan_id integer REFERENCES billing.plans (id), legacy integer REFERENCES billing.plans (id));' },
    { name: '2.sql', sql: 'ALTER TABLE subs DROP COLUMN legacy;' },
  ]);
  assert.deepEqual(s.tables.map((t) => `${t.schema}.${t.name}`), ['billing.plans', 'public.subs']);
  assert.deepEqual(s.foreignKeys.map((f) => f.name), ['subs_plan_id_fkey']);
  const gone = await foldMigrations([{ name: '1.sql', sql: 'CREATE TABLE a (id integer PRIMARY KEY); CREATE TABLE b (a_id integer REFERENCES a (id)); DROP TABLE a;' }]);
  assert.deepEqual(gone.tables.map((t) => t.name), ['b']);
  assert.deepEqual(gone.foreignKeys, []);
});

test('functions, triggers, inserts and grants are skipped; a syntax error names the file', async () => {
  const s = await parseDdl(`
    CREATE TABLE t (id integer PRIMARY KEY);
    CREATE FUNCTION f() RETURNS trigger AS $$ BEGIN RETURN NEW; END $$ LANGUAGE plpgsql;
    CREATE TRIGGER tr BEFORE INSERT ON t FOR EACH ROW EXECUTE FUNCTION f();
    INSERT INTO t VALUES (1);
    GRANT SELECT ON t TO PUBLIC;
  `);
  assert.equal(s.tables.length, 1);
  await assert.rejects(parseDdl('CREATE TABLE (', 'migrations/009_broken.sql'), (e: unknown) => e instanceof DdlSyntaxError && e.message.startsWith('migrations/009_broken.sql:'));
});

test('the same schema written two ways produces byte-identical output', async () => {
  const a = await parseDdl('CREATE TABLE b (id integer PRIMARY KEY); CREATE TABLE a (id integer PRIMARY KEY, b_id integer NOT NULL, CONSTRAINT a_b_id_fkey FOREIGN KEY (b_id) REFERENCES b (id));');
  const b = await foldMigrations([
    { name: '1', sql: 'CREATE TABLE a (id integer, b_id integer); CREATE TABLE b (id integer);' },
    { name: '2', sql: 'ALTER TABLE a ADD PRIMARY KEY (id); ALTER TABLE b ADD PRIMARY KEY (id); ALTER TABLE a ALTER COLUMN b_id SET NOT NULL; ALTER TABLE a ADD CONSTRAINT a_b_id_fkey FOREIGN KEY (b_id) REFERENCES b (id);' },
  ]);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
