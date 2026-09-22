import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { parseEfCoreSnapshot, parseSqlAlchemyModels, parseTypeOrmEntities, snakeCase } from '../src/index.ts';

const here = join(import.meta.dirname, 'orm');
const read = (...parts: string[]): string => readFileSync(join(here, ...parts), 'utf8');

test('SQLAlchemy models read back as the tables SQLAlchemy would create', () => {
  const { schema, unread } = parseSqlAlchemyModels(read('sqlalchemy_models.py'));
  assert.deepEqual(schema.tables.map((t) => t.name), ['customers', 'orders', 'shipments']);

  const customers = schema.tables.find((t) => t.name === 'customers')!;
  assert.deepEqual(customers.columns, [
    { name: 'id', type: 'integer', nullable: false },
    { name: 'email', type: 'character varying(254)', nullable: false },
    { name: 'balance', type: 'numeric(12,2)', nullable: true },
  ]);
  assert.deepEqual(customers.primaryKey, ['id']);
  assert.deepEqual(customers.uniques, [['email']]);

  const orders = schema.tables.find((t) => t.name === 'orders')!;
  // `Mapped[str]` with no Optional is NOT NULL; `nullable=True` overrides the annotation.
  assert.deepEqual(orders.columns, [
    { name: 'id', type: 'integer', nullable: false },
    { name: 'customer_id', type: 'integer', nullable: false },
    { name: 'reference', type: 'character varying(32)', nullable: false },
    { name: 'cancelled', type: 'boolean', nullable: true },
    { name: 'order_note', type: 'character varying(120)', nullable: true },
  ]);
  assert.deepEqual(orders.uniques, [['customer_id', 'reference']], 'the constraint name is not a column');

  // `relationship()` is navigation, not a column; only ForeignKey makes an edge.
  assert.deepEqual(
    schema.foreignKeys.map((fk) => `${fk.from[0]!.name}.${fk.from[0]!.column}→${fk.to[0]!.name}.${fk.to[0]!.column}`).sort(),
    ['orders.customer_id→customers.id', 'shipments.order_id→orders.id'],
  );
  assert.equal(unread.length, 0, JSON.stringify(unread));
});

test('a TypeORM entity set reads back as the tables TypeORM would create', () => {
  const { schema, unread } = parseTypeOrmEntities([
    { path: 'customer.entity.ts', text: read('typeorm', 'customer.entity.ts') },
    { path: 'order.entity.ts', text: read('typeorm', 'order.entity.ts') },
    { path: 'invoice.entity.ts', text: read('typeorm', 'invoice.entity.ts') },
  ]);
  // `@Entity()` is the class name in snake_case; `@Entity('sales_orders')` is not.
  assert.deepEqual(schema.tables.map((t) => t.name), ['customer', 'invoice', 'sales_orders']);

  const customer = schema.tables.find((t) => t.name === 'customer')!;
  assert.deepEqual(customer.columns, [
    { name: 'id', type: 'integer', nullable: false },
    { name: 'email', type: 'character varying(254)', nullable: false },
    { name: 'is_active', type: 'boolean', nullable: false },
  ]);
  assert.deepEqual(customer.uniques, [['email']]);

  const order = schema.tables.find((t) => t.name === 'sales_orders')!;
  assert.ok(order.columns.some((c) => c.name === 'id' && c.type === 'uuid'), "PrimaryGeneratedColumn('uuid') is a uuid");
  assert.ok(order.columns.some((c) => c.name === 'total' && c.type === 'numeric(12,2)'));
  assert.ok(order.columns.some((c) => c.name === 'placed_at' && c.type === 'timestamp with time zone' && c.nullable));
  // `@JoinColumn({ name })` names the column; without it the convention does.
  assert.ok(order.columns.some((c) => c.name === 'customer_ref'), '@JoinColumn names the column');
  assert.ok(order.columns.some((c) => c.name === 'invoice_id'), 'without @JoinColumn the convention names it');
  assert.ok(order.uniques.some((u) => u.join('+') === 'invoice_id'), 'a OneToOne is unique');

  assert.deepEqual(
    schema.foreignKeys.map((fk) => `${fk.from[0]!.name}.${fk.from[0]!.column}→${fk.to[0]!.name}.${fk.to[0]!.column}`).sort(),
    ['sales_orders.customer_ref→customer.id', 'sales_orders.invoice_id→invoice.id'],
  );

  // The relation to a class no file declared is reported, not invented.
  assert.equal(unread.length, 1);
  assert.match(unread[0]!.reason, /ManyToOne to Warehouse, which is not an entity this reader saw/);
});

test("TypeORM's default naming strategy is snake_case, and this is the one it uses", () => {
  assert.equal(snakeCase('Order'), 'order');
  assert.equal(snakeCase('placedAt'), 'placed_at');
  assert.equal(snakeCase('SalesOrderLine'), 'sales_order_line');
  assert.equal(snakeCase('HTTPRequestLog'), 'http_request_log');
});

test('an EF Core model snapshot reads back as the tables the migration would create', () => {
  const { schema, unread } = parseEfCoreSnapshot(read('AppDbContextModelSnapshot.cs'));
  assert.deepEqual(schema.tables.map((t) => `${t.schema}.${t.name}`), ['public.customers', 'sales.orders']);

  const customers = schema.tables.find((t) => t.name === 'customers')!;
  // `HasColumnType` is already the database's own spelling, and is taken verbatim.
  assert.deepEqual(customers.columns, [
    { name: 'Id', type: 'integer', nullable: false },
    { name: 'Email', type: 'character varying(254)', nullable: false },
    { name: 'Balance', type: 'numeric(12,2)', nullable: true },
  ]);
  assert.deepEqual(customers.primaryKey, ['Id']);
  assert.deepEqual(customers.uniques, [['Email']], '.IsUnique() on its own line still makes a unique index');

  const orders = schema.tables.find((t) => t.name === 'orders')!;
  assert.equal(orders.schema, 'sales', 'the second argument to ToTable is the schema');
  // `HasColumnName` renames, and the rename follows the property into the key.
  assert.ok(orders.columns.some((c) => c.name === 'placed_at' && c.type === 'timestamp with time zone'));

  // A relationship declared in a later block for the same entity is still read.
  assert.deepEqual(
    schema.foreignKeys.map((fk) => `${fk.from[0]!.schema}.${fk.from[0]!.name}.${fk.from[0]!.column}→${fk.to[0]!.schema}.${fk.to[0]!.name}.${fk.to[0]!.column}`),
    ['sales.orders.CustomerId→public.customers.Id'],
  );
  // The other one points at an entity this snapshot never declares.
  assert.equal(unread.length, 1);
  assert.match(unread[0]!.reason, /relationship to Warehouse, which this snapshot does not declare/);
});
