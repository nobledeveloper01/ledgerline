import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { reconcile, NO_CLAIMS } from '@ledgerline/model';

import { listMigrations, parsePrisma, readModel, schemaFromDatabase, schemaFromMigrations, serializeModel, writeModel } from '../src/index.ts';
import { freshDatabase, load } from './support/database.ts';

const here = join(import.meta.dirname, 'migrations');

test('a migrations directory is read in name order, up scripts only, .sql only', async () => {
  assert.deepEqual(listMigrations(here).map((m) => m.name), ['0001_users.sql', '0002_orders.sql']);
  const s = await schemaFromMigrations(here);
  assert.deepEqual(s.tables.map((t) => t.name), ['orders', 'users']);
  assert.equal(s.foreignKeys[0]?.name, 'orders_user_id_fkey');
});

test('a Prisma schema becomes the declared schema Prisma would migrate to, with @map and @@map honoured', () => {
  const s = parsePrisma(`
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id        BigInt   @id
  title     String
  authorId  Int?     @map("author_id")
  status    Status   @default(DRAFT)
  tags      String[]
  createdAt DateTime @map("created_at")
  author    User?    @relation(fields: [authorId], references: [id])

  @@map("posts")
  @@unique([authorId, title])
}

enum Status {
  DRAFT
  LIVE
}
`);
  assert.deepEqual(s.tables.map((t) => t.name), ['User', 'posts']);
  const posts = s.tables.find((t) => t.name === 'posts')!;
  assert.deepEqual(posts.columns.map((c) => [c.name, c.type, c.nullable]), [
    ['id', 'bigint', false],
    ['title', 'text', false],
    ['author_id', 'integer', true],
    ['status', '"Status"', false],
    ['tags', 'text[]', false],
    ['created_at', 'timestamp(3) without time zone', false],
  ]);
  assert.deepEqual(posts.primaryKey, ['id']);
  assert.deepEqual(posts.uniques, [['author_id', 'title']]);
  assert.deepEqual(s.foreignKeys, [
    { name: 'posts_author_id_fkey', from: [{ schema: 'public', name: 'posts', column: 'author_id' }], to: [{ schema: 'public', name: 'User', column: 'id' }] },
  ]);
});

test('the model file is canonical, versioned, and refuses another format', async () => {
  const s = await schemaFromMigrations(here);
  const model = reconcile(s, NO_CLAIMS);
  const text = serializeModel(model);
  assert.equal(text, serializeModel(JSON.parse(JSON.stringify(model)) as typeof model), 'the same model serialises the same bytes');
  assert.ok(text.endsWith('\n'));
  assert.ok(text.indexOf('"edges"') < text.indexOf('"tables"'), 'keys are sorted');
  const dir = mkdtempSync(join(tmpdir(), 'ledgerline-'));
  const path = join(dir, 'ledgerline.model.json');
  writeModel(path, model);
  assert.deepEqual(readModel(path), model);
  writeFileSync(path, JSON.stringify({ format: 99, model }));
  assert.throws(() => readModel(path), /format 99 is not 1/);
});

test('migrations and a live database produce byte-identical schemas', { skip: !process.env['LEDGERLINE_TEST_DATABASE_URL'] && 'set LEDGERLINE_TEST_DATABASE_URL to run — blocks the Phase 1 gate, allowed while building' }, async () => {
  const url = await freshDatabase(process.env['LEDGERLINE_TEST_DATABASE_URL']!, 'small');
  await load(url, listMigrations(here).map((m) => m.sql));
  const fromMigrations = await schemaFromMigrations(here);
  const fromDatabase = await schemaFromDatabase(url);
  assert.equal(JSON.stringify(fromDatabase), JSON.stringify(fromMigrations));
});
