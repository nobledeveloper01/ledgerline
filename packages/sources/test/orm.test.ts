import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { appLabelOf, parseDjangoModels, parseRailsSchema, singularize } from '../src/index.ts';

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
  assert.equal(singularize('statuses'), 'status');
  assert.equal(singularize('addresses'), 'address');
  assert.equal(singularize('classes'), 'class');
  assert.equal(singularize('buses'), 'bus');
  assert.equal(singularize('analyses'), 'analysis');
  // Mastodon has a `custom_emojis` table, and a rule saying *ends in `is`, so
  // already singular* made Rails' derived column `custom_emojis_id`. It is
  // `custom_emoji_id`, and this was a false finding on a real repository.
  assert.equal(singularize('custom_emojis'), 'custom_emoji');
  assert.equal(singularize('emojis'), 'emoji');
  // Not an irregular it knows: it returns something, and the caller checks the column exists.
  assert.equal(singularize('geese'), 'goose');
});

test("Django's models.py reads back as the tables Django would create", () => {
  const path = join(here, 'shop', 'models.py');
  const { schema, unread } = parseDjangoModels([{ path, text: readFileSync(path, 'utf8') }]);

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
  assert.match(unread[0]!.reason, /ForeignKey to auth\.User, which is not a model among the files read/);
});

test("a large Django project's models are a package, and the app label is the app", () => {
  // `netbox/dcim/models/devices.py` is the `dcim` app, not the `models` app —
  // and getting that wrong renames every table in the schema.
  assert.equal(appLabelOf('netbox/dcim/models/devices.py'), 'dcim');
  assert.equal(appLabelOf('netbox/dcim/models.py'), 'dcim');
  assert.equal(appLabelOf('shop/model/order.py'), 'shop');
});

test("a Django field spans as many lines as it likes, and reaches across files for its target", () => {
  // NetBox's real style: every ForeignKey across five or six lines, with the
  // other side named as `'app.Model'` in another file entirely.
  const cables = `
from django.db import models


class Cable(models.Model):
    tenant = models.ForeignKey(
        to='tenancy.Tenant',
        on_delete=models.PROTECT,
        related_name='cables',
        blank=True,
        null=True
    )
    label = models.CharField(
        verbose_name=_('label'),
        max_length=100,
        blank=True
    )


class CableTermination(models.Model):
    cable = models.ForeignKey(
        to='dcim.Cable',
        on_delete=models.CASCADE,
        related_name='terminations'
    )
    termination_type = models.ForeignKey(
        to='contenttypes.ContentType',
        on_delete=models.PROTECT,
        related_name='+'
    )
    termination = GenericForeignKey(
        ct_field='termination_type',
        fk_field='termination_id'
    )
`;
  const tenancy = `
from django.db import models


class Tenant(models.Model):
    name = models.CharField(max_length=100)
`;
  const { schema, unread } = parseDjangoModels([
    { path: 'netbox/dcim/models/cables.py', text: cables },
    { path: 'netbox/tenancy/models/tenants.py', text: tenancy },
  ]);

  assert.deepEqual(schema.tables.map((t) => t.name), ['dcim_cable', 'dcim_cabletermination', 'tenancy_tenant']);
  const cable = schema.tables.find((t) => t.name === 'dcim_cable')!;
  assert.ok(cable.columns.some((c) => c.name === 'tenant_id' && c.nullable), 'a five-line ForeignKey is still a column');
  assert.ok(cable.columns.some((c) => c.name === 'label' && c.type === 'character varying(100)'), 'and max_length is found however far down it is');

  assert.deepEqual(
    schema.foreignKeys.map((fk) => `${fk.from[0]!.name}.${fk.from[0]!.column}→${fk.to[0]!.name}`).sort(),
    ['dcim_cable.tenant_id→tenancy_tenant', 'dcim_cabletermination.cable_id→dcim_cable'],
  );

  // A GenericForeignKey is a real relationship and is not a foreign key;
  // ContentType lives in Django itself and is not among the files.
  const reasons = unread.map((u) => u.reason).sort();
  assert.ok(reasons.some((r) => /GenericForeignKey/.test(r)), reasons.join(' | '));
  assert.ok(reasons.some((r) => /contenttypes\.ContentType, which is not a model among the files read/.test(r)));
});
