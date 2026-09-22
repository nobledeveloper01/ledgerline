import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

import { listMigrations, schemaFromDatabase, schemaFromMigrations } from '../src/index.ts';
import { freshDatabase, load } from './support/database.ts';

/** The Phase 1 gate on the 200-table corpus: it parses, it is the size it says, and it matches a live database byte for byte. */
const dir = join(import.meta.dirname, '..', '..', '..', 'fixtures', 'large-200', 'migrations');

test('the 200-table corpus folds through nine migrations with every foreign key resolved', async () => {
  const s = await schemaFromMigrations(dir);
  assert.equal(s.tables.length, 200);
  assert.ok(s.foreignKeys.length > 300, `${s.foreignKeys.length} foreign keys`);
  const tables = new Set(s.tables.map((t) => `${t.schema}.${t.name}`));
  for (const fk of s.foreignKeys) {
    for (const c of [...fk.from, ...fk.to]) assert.ok(tables.has(`${c.schema}.${c.name}`), `${fk.name} points at ${c.schema}.${c.name}, which is not a table`);
    assert.ok(fk.to.length > 0, `${fk.name} references no columns`);
  }
  assert.ok(s.tables.some((t) => t.columns.some((c) => c.name.endsWith('_renamed'))), 'the rename migration was applied');
  assert.ok(s.tables.some((t) => t.columns.some((c) => c.name.startsWith('added_'))), 'the add-column migration was applied');
});

test('the 200-table corpus read from migrations and from a live database is byte-identical', { skip: !process.env['LEDGERLINE_TEST_DATABASE_URL'] && 'set LEDGERLINE_TEST_DATABASE_URL — blocks the Phase 1 gate, allowed while building' }, async () => {
  const url = await freshDatabase(process.env['LEDGERLINE_TEST_DATABASE_URL']!, 'large');
  await load(url, listMigrations(dir).map((m) => m.sql));
  const a = JSON.stringify(await schemaFromMigrations(dir));
  const b = JSON.stringify(await schemaFromDatabase(url));
  assert.equal(b, a);
});
