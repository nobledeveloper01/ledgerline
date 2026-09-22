import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { baseClassOf, parseEfCoreSnapshot, parseGoStructs, parseSequelizeModels, parseSqlAlchemyModels, parseTypeOrmEntities, snakeCase } from '../src/index.ts';

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

test('sequelize-typescript models read back as the tables Sequelize would create', () => {
  const dir = join(here, 'sequelize');
  const files = ['Base.ts', 'User.ts', 'Star.ts'].map((f) => ({ path: join(dir, f), text: read('sequelize', f) }));
  const { schema, unread } = parseSequelizeModels(files);

  // Only a @Table class is a table: `Model` and `IdModel` are bases.
  assert.deepEqual(schema.tables.map((t) => t.name), ['stars', 'users']);

  const users = schema.tables.find((t) => t.name === 'users')!;
  // The base class's columns come first, and `field:` renames.
  assert.deepEqual(users.columns, [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'createdAt', type: 'timestamp with time zone', nullable: false },
    { name: 'updatedAt', type: 'timestamp with time zone', nullable: false },
    { name: 'email', type: 'character varying(254)', nullable: false },
    { name: 'is_admin', type: 'boolean', nullable: false },
  ]);
  assert.deepEqual(users.primaryKey, ['id'], 'the primary key is inherited, and losing it would be a schema that looks right');
  assert.deepEqual(users.uniques, [['email']]);
  assert.ok(!users.columns.some((c) => c.name === 'label' || c.name === 'name'), 'a getter body is not a column');

  const stars = schema.tables.find((t) => t.name === 'stars')!;
  assert.ok(stars.columns.some((c) => c.name === 'userId' && !c.nullable));
  assert.ok(stars.columns.some((c) => c.name === 'widgetId' && c.nullable), '`| null` is allowNull');
  assert.ok(!stars.columns.some((c) => c.name === 'user'), '@BelongsTo with no @Column is navigation');

  assert.deepEqual(
    schema.foreignKeys.map((fk) => `${fk.from[0]!.name}.${fk.from[0]!.column}→${fk.to[0]!.name}.${fk.to[0]!.column}`),
    ['stars.userId→users.id'],
  );
  // What it could not resolve is named, not invented — and each fact once:
  // the library's own base class is one fact about the repository, not one
  // per model that inherits through it.
  assert.deepEqual(unread.map((u) => u.reason).sort(), [
    'Model extends SequelizeModel, which is not among the files read, so its columns are missing',
    'a @ForeignKey to Widget, which is not a @Table model among the files read',
  ]);
});

test('the base class is read past the type parameters, not from the first `extends` in sight', () => {
  // `class X<T extends object = any> extends Base<T>` has two `extends`, and
  // taking the first gave every Outline model the base class `object` — which
  // silently cost all 54 tables their primary key.
  assert.equal(baseClassOf('class IdModel<\n  T extends object = any,\n> extends Model<T> '), 'Model');
  assert.equal(baseClassOf('class Plain extends Base '), 'Base');
  assert.equal(baseClassOf('class Alone '), null);
});

test('Go struct tags read back as the tables xorm and GORM would create', () => {
  const dir = join(here, 'go');
  const files = ['repo.go', 'names.go', 'gorm.go'].map((f) => ({ path: join(dir, f), text: read('go', f) }));
  const { schema, unread } = parseGoStructs(files);

  // `TableName()` lives in another file and still names the table; GORM's
  // default mapper pluralises where xorm's does not.
  assert.deepEqual(schema.tables.map((t) => t.name), ['invoices', 'repos']);
  assert.ok(!schema.tables.some((t) => t.name === 'search_requests'), 'a struct with no ORM tag is not a table');

  const repos = schema.tables.find((t) => t.name === 'repos')!;
  assert.deepEqual(repos.columns, [
    { name: 'id', type: 'bigint', nullable: false },
    { name: 'user_id', type: 'bigint', nullable: true },
    { name: 'org_id', type: 'bigint', nullable: true },
    { name: 'owner', type: 'text', nullable: true },
    { name: 'avatar', type: 'character varying(500)', nullable: true },
    { name: 'trusted', type: 'jsonb', nullable: true },
    { name: 'timeout', type: 'bigint', nullable: true },
    { name: 'created', type: 'timestamp with time zone', nullable: true },
  ]);
  assert.deepEqual(repos.primaryKey, ['id']);
  assert.deepEqual(repos.uniques, [['owner']]);
  assert.ok(!repos.columns.some((c) => c.name === 'internal'), 'a field tagged `-` is not a column');

  const invoices = schema.tables.find((t) => t.name === 'invoices')!;
  assert.deepEqual(invoices.columns, [
    { name: 'id', type: 'bigint', nullable: false },
    { name: 'reference', type: 'character varying(64)', nullable: false },
    { name: 'body', type: 'text', nullable: true },
    { name: 'company_ref', type: 'bigint', nullable: true },
  ]);
  assert.deepEqual(invoices.uniques, [['reference']]);

  // Neither ORM declares a foreign key, and that is the whole point: in a
  // repository of this shape every relationship lives in a query.
  assert.deepEqual(schema.foreignKeys, []);
  // And the one guess it had to make is named.
  assert.ok(unread.some((u) => /Invoice has no TableName\(\), so its table is gorm's default mapping: invoices/.test(u.reason)), JSON.stringify(unread));
});
