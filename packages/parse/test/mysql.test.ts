import assert from 'node:assert/strict';
import { test } from 'node:test';

import { foldMigrationsReporting, mysqlToPostgres, parseDdl } from '../src/index.ts';

test('MySQL DDL becomes the same declared schema PostgreSQL would produce', async () => {
  const s = await parseDdl(
    `CREATE TABLE \`users\` (
       \`id\` int(11) NOT NULL AUTO_INCREMENT,
       \`email\` varchar(80) NOT NULL,
       \`active\` tinyint(1) DEFAULT 1,
       \`joined\` datetime DEFAULT CURRENT_TIMESTAMP,
       \`bio\` longtext,
       \`meta\` json,
       PRIMARY KEY (\`id\`),
       UNIQUE KEY \`email_idx\` (\`email\`),
       KEY \`joined_idx\` (\`joined\`)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'people';
     CREATE TABLE \`orders\` (
       \`id\` bigint unsigned NOT NULL,
       \`user_id\` int DEFAULT NULL,
       PRIMARY KEY (\`id\`),
       CONSTRAINT \`fk_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
     ) ENGINE=InnoDB;`,
    'mysql',
    'mysql',
  );
  const users = s.tables.find((t) => t.name === 'users')!;
  assert.deepEqual(users.columns.map((c) => [c.name, c.type, c.nullable]), [
    ['id', 'integer', false],
    ['email', 'character varying(80)', false],
    ['active', 'boolean', true],
    ['joined', 'timestamp without time zone', true],
    ['bio', 'text', true],
    ['meta', 'jsonb', true],
  ]);
  assert.deepEqual(users.primaryKey, ['id']);
  assert.deepEqual(users.uniques, [['email']], 'UNIQUE KEY counts; a plain KEY is an index and does not');
  assert.deepEqual(s.foreignKeys, [
    { name: 'fk_user', from: [{ schema: 'public', name: 'orders', column: 'user_id' }], to: [{ schema: 'public', name: 'users', column: 'id' }] },
  ]);
});

test('what the rewrite has no rule for is skipped and named, never half-read', async () => {
  const r = mysqlToPostgres(`
    CREATE TABLE a (id int) PARTITION BY HASH(id);
    CREATE TABLE b (id int, full_name varchar(20) GENERATED ALWAYS AS (concat(1)) STORED);
    CREATE TABLE c (id int, FULLTEXT KEY ft (id));
    CREATE TRIGGER t BEFORE INSERT ON c FOR EACH ROW SET @x = 1;
    CREATE TABLE d (id int PRIMARY KEY);`);
  assert.deepEqual(r.skipped.map((s) => s.reason).sort(), ['a fulltext index', 'a generated column', 'a partition clause', 'a routine']);
  assert.ok(r.sql.includes('"d"') || r.sql.includes('CREATE TABLE d'), 'the statement it can read is still there');

  const folded = await foldMigrationsReporting([{ name: '001.sql', sql: 'CREATE TABLE a (id int) PARTITION BY HASH(id); CREATE TABLE b (id int PRIMARY KEY);' }], 'mysql');
  assert.equal(folded.schema.tables.length, 1);
  assert.deepEqual(folded.skipped.map((s) => `${s.file}: ${s.reason}`), ['001.sql: a partition clause']);
});

test('a keyword inside backticks survives, and a reserved word does not become syntax', async () => {
  const s = await parseDdl('CREATE TABLE `order` (`id` int PRIMARY KEY, `key` varchar(10), `table` int);', 'mysql', 'mysql');
  assert.deepEqual(s.tables.map((t) => t.name), ['order']);
  assert.deepEqual(s.tables[0]!.columns.map((c) => c.name), ['id', 'key', 'table']);
});
