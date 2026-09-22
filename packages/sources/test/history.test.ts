import assert from 'node:assert/strict';
import { test } from 'node:test';

import { historyOf } from '../src/index.ts';

test('the history is what each migration did, in order, from the files', async () => {
  const events = await historyOf([
    { name: '001_users.sql', sql: 'CREATE TABLE users (id integer PRIMARY KEY, email text);' },
    { name: '002_orders.sql', sql: 'CREATE TABLE orders (id integer PRIMARY KEY, user_id integer REFERENCES users (id));' },
    { name: '003_note.sql', sql: 'ALTER TABLE orders ADD COLUMN note text; ALTER TABLE users ALTER COLUMN email TYPE varchar(120); ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);' },
    { name: '004_tidy.sql', sql: 'ALTER TABLE orders DROP COLUMN note; ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;' },
    { name: '005_gone.sql', sql: 'DROP TABLE orders;' },
  ]);
  assert.deepEqual(
    events.map((e) => `${e.migration} ${e.kind} ${e.table}${e.detail ? ` (${e.detail})` : ''}`),
    [
      '001_users.sql table_created public.users (2 columns, key id)',
      '002_orders.sql table_created public.orders (2 columns, key id)',
      '002_orders.sql fk_added public.orders (orders_user_id_fkey: user_id → public.users.id)',
      // Tables in name order within a migration, which is how the schema is built.
      '003_note.sql column_added public.orders (note text)',
      '003_note.sql column_retyped public.users (email: text → character varying(120))',
      '003_note.sql unique_added public.users (email)',
      '004_tidy.sql column_dropped public.orders (note)',
      '004_tidy.sql fk_dropped public.orders (orders_user_id_fkey: user_id → public.users.id)',
      '005_gone.sql table_dropped public.orders',
    ],
  );
});
