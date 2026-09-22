import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { parseDjangoModels, parseRailsSchema, singularize } from '../src/index.ts';

const here = join(import.meta.dirname, 'orm');

test("Rails' schema.rb reads back as the schema Rails wrote it from", () => {
  const { schema, unread } = parseRailsSchema(readFileSync(join(here, 'schema.rb'), 'utf8'));
  assert.deepEqual(schema.tables.map((t) => t.name), ['audits', 'companies', 'line_items', 'orders', 'users']);

  const users = schema.tables.find((t) => t.name === 'users')!;
  assert.deepEqual(users.columns, [
    { name: 'id', type: 'bigint', nullable: false },
    { name: 'email', type: 'character varying(255)', nullable: false },
    { name: 'bio', type: 'text', nullable: true },
    { name: 'admin', type: 'boolean', nullable: false },
    { name: 'created_at', type: 'timestamp without time zone', nullable: false },
    { name: 'updated_at', type: 'timestamp without time zone', nullable: false },
  ]);
  assert.deepEqual(users.uniques, [['email']], 'a unique index is a unique constraint; a plain one is not');

  // `id: false` means no primary key at all, and `primary_key:` renames it.
  assert.deepEqual(schema.tables.find((t) => t.name === 'line_items')!.primaryKey, []);
  assert.deepEqual(schema.tables.find((t) => t.name === 'audits')!.primaryKey, ['uuid']);

  // `t.references :user` is the column `user_id`.
  const orders = schema.tables.find((t) => t.name === 'orders')!;
  assert.ok(orders.columns.some((c) => c.name === 'user_id' && c.type === 'bigint' && !c.nullable));
  assert.ok(orders.columns.some((c) => c.name === 'total' && c.type === 'numeric(12,2)'));

  // The derived column, the named column, and the one Rails' own convention gives it.
  const edges = schema.foreignKeys.map((fk) => `${fk.from[0]!.name}.${fk.from[0]!.column}→${fk.to[0]!.name}.${fk.to[0]!.column}`).sort();
  assert.deepEqual(edges, ['line_items.order_ref→orders.id', 'orders.company_id→companies.id', 'orders.user_id→users.id']);
  assert.equal(unread.length, 0, JSON.stringify(unread));
});

test("a foreign key whose column Rails derived and the reader cannot is reported, not invented", () => {
  const { schema, unread } = parseRailsSchema(`
ActiveRecord::Schema[7.1].define(version: 1) do
  create_table "mice", force: :cascade do |t|
    t.string "name"
  end
  create_table "traps", force: :cascade do |t|
    t.bigint "rodent_id"
  end
  add_foreign_key "traps", "mice"
end
`);
  assert.equal(schema.foreignKeys.length, 0, 'no edge is better than a wrong edge');
  assert.equal(unread.length, 1);
  assert.match(unread[0]!.reason, /cannot: no traps\.mouse_id/);
});

test('the inflector knows the regular rules and says nothing it does not know', () => {
  assert.equal(singularize('users'), 'user');
  assert.equal(singularize('companies'), 'company');
  assert.equal(singularize('addresses'), 'address');
  assert.equal(singularize('people'), 'person');
  assert.equal(singularize('status'), 'status');
  // Not an irregular it knows: it returns something, and the caller checks the column exists.
  assert.equal(singularize('geese'), 'goose');
});

test("Django's models.py reads back as the tables Django would create", () => {
  const path = join(here, 'shop', 'models.py');
  const { schema, unread } = parseDjangoModels(readFileSync(path, 'utf8'), path);

  // `<app>_<model>` from the directory, `db_table` when given, the join table
  // Django makes for a ManyToMany, and nothing for abstract or unmanaged.
  assert.deepEqual(schema.tables.map((t) => t.name), ['catalogue_product', 'shop_customer', 'shop_invoice', 'shop_order', 'shop_order_products']);

  const customer = schema.tables.find((t) => t.name === 'shop_customer')!;
  assert.deepEqual(customer.columns, [
    { name: 'id', type: 'bigint', nullable: false },
    { name: 'email', type: 'character varying(254)', nullable: false },
    { name: 'balance', type: 'numeric(12,2)', nullable: false },
    { name: 'notes', type: 'text', nullable: true },
  ]);
  assert.deepEqual(customer.uniques, [['email']]);

  const order = schema.tables.find((t) => t.name === 'shop_order')!;
  assert.ok(order.columns.some((c) => c.name === 'customer_id'), 'a ForeignKey named customer is the column customer_id');
  assert.ok(order.columns.some((c) => c.name === 'invoice_id' && c.nullable));
  assert.ok(!order.columns.some((c) => c.name === 'products_id'), 'a ManyToMany is a table, not a column');
  assert.ok(order.uniques.some((u) => u.join('+') === 'invoice_id'), 'OneToOne is unique');

  const edges = schema.foreignKeys.map((fk) => `${fk.from[0]!.name}.${fk.from[0]!.column}→${fk.to[0]!.name}.${fk.to[0]!.column}`).sort();
  assert.deepEqual(edges, [
    'shop_order.customer_id→shop_customer.id',
    'shop_order.invoice_id→shop_invoice.id',
    'shop_order_products.order_id→shop_order.id',
    'shop_order_products.product_id→catalogue_product.id',
  ]);

  // The one thing it could not resolve, said out loud rather than guessed.
  assert.equal(unread.length, 1);
  assert.match(unread[0]!.reason, /ForeignKey to auth\.User, which is not a model in this file/);
});
