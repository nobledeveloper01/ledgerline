import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

import type { DeclaredSchema } from '@ledgerline/model';

import { schemaFromMigrations, schemaFromMigrationsReporting } from '../src/index.ts';

/**
 * Phase 5's gate. `fixtures/large-200-mysql` is the *same* generated schema as
 * `fixtures/large-200`, written the way MySQL writes it, so the two must
 * reconcile to the same structure: same tables, same columns, same
 * nullability, same keys, same foreign keys. Where they cannot agree — MySQL
 * has no `uuid` and its `datetime` carries no zone — the difference is
 * asserted rather than tolerated, so a change to the type map cannot drift
 * quietly.
 */
const my = join(import.meta.dirname, '..', '..', '..', 'fixtures', 'large-200-mysql', 'migrations');
const pg = join(import.meta.dirname, '..', '..', '..', 'fixtures', 'large-200', 'migrations');

/** MySQL has no schemas, so the comparison is by bare table name. */
function shape(s: DeclaredSchema): Map<string, { columns: [string, boolean][]; primaryKey: readonly string[]; uniques: string[] }> {
  return new Map(
    s.tables.map((t) => [
      t.name,
      {
        columns: t.columns.map((c): [string, boolean] => [c.name, c.nullable]),
        primaryKey: t.primaryKey,
        uniques: t.uniques.map((u) => u.join('+')).sort(),
      },
    ]),
  );
}

function edges(s: DeclaredSchema): string[] {
  return s.foreignKeys.map((fk) => `${fk.from.map((c) => `${c.name}.${c.column}`).join('+')}→${fk.to.map((c) => `${c.name}.${c.column}`).join('+')}`).sort();
}

test('the MySQL corpus is 200 tables and reports the two statements it refused to guess at', async () => {
  const { schema, skipped } = await schemaFromMigrationsReporting(my, 'mysql');
  assert.equal(schema.tables.length, 200);
  assert.equal(schema.foreignKeys.length, 375);
  assert.deepEqual(
    skipped.map((s) => s.reason).sort(),
    ['a fulltext index', 'a routine'],
    'the trigger and the fulltext index are named, not silently dropped',
  );
  const tables = new Set(schema.tables.map((t) => t.name));
  for (const fk of schema.foreignKeys) {
    for (const c of [...fk.from, ...fk.to]) assert.ok(tables.has(c.name), `${fk.name} points at ${c.name}, which is not a table`);
  }
  assert.ok(schema.tables.some((t) => t.columns.some((c) => c.name.endsWith('_renamed'))), 'RENAME COLUMN was applied');
  assert.ok(schema.tables.some((t) => t.columns.some((c) => c.name.startsWith('added_'))), 'ADD COLUMN was applied');
});

test('the MySQL corpus and the PostgreSQL corpus are the same schema', async () => {
  const a = shape(await schemaFromMigrations(my, 'mysql'));
  const b = shape(await schemaFromMigrations(pg));
  assert.deepEqual([...a.keys()].sort(), [...b.keys()].sort(), 'the same table names');
  for (const [name, left] of a) assert.deepEqual(left, b.get(name), `${name} differs`);
  assert.deepEqual(edges(await schemaFromMigrations(my, 'mysql')), edges(await schemaFromMigrations(pg)), 'the same foreign keys');
});

test('the two types MySQL cannot spell are mapped deliberately, not by accident', async () => {
  const a = await schemaFromMigrations(my, 'mysql');
  const b = await schemaFromMigrations(pg);
  const types = (s: DeclaredSchema): Map<string, string> => new Map(s.tables.flatMap((t) => t.columns.map((c): [string, string] => [`${t.name}.${c.name}`, c.type])));
  const left = types(a);
  const right = types(b);
  const pairs = new Set<string>();
  for (const [key, type] of right) {
    const mine = left.get(key);
    assert.ok(mine !== undefined, `${key} is missing from the MySQL corpus`);
    if (mine !== type) pairs.add(`${type} → ${mine}`);
  }
  assert.deepEqual(
    [...pairs].sort(),
    ['timestamp with time zone → timestamp without time zone', 'uuid → character(36)'],
    'only the two MySQL has no word for differ, and each differs the one way ADR-0002 says it should: as the database would report it',
  );
});
