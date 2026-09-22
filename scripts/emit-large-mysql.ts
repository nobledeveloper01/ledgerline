// The same 200-table schema as `large-200`, written in MySQL's dialect.
//
// Phase 5's exit gate is that the corpus gates hold on a MySQL corpus of the
// same size as the PostgreSQL one, so this is deliberately the *same*
// generator with the same seed: same names, same columns, same foreign keys,
// spelled the way MySQL spells them — backticks, `int(11)`, `datetime`,
// `ENGINE=InnoDB`, `KEY` clauses inside the table body, and no schemas,
// because MySQL's "schema" is its database. What comes out the other side of
// `mysqlToPostgres` must be the same model, which is what the fixture proves.
// Written to fixtures/large-200-mysql/migrations/ by `make large`.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

class Gen {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(n: number): number {
    this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0;
    return Math.floor(((this.s >>> 8) / 16777216) * n);
  }
}

// The MySQL spelling of the same ten types the PostgreSQL generator uses.
const TYPES = ['int(11)', 'bigint(20)', 'longtext', 'varchar(120)', 'tinyint(1)', 'datetime', 'decimal(12,2)', 'char(36)', 'json', 'date'];
const WORDS = ['account', 'order', 'invoice', 'shipment', 'ticket', 'note', 'event', 'plan', 'asset', 'lease', 'payment', 'device', 'zone', 'route', 'batch', 'claim', 'policy', 'audit', 'session', 'grant'];

const g = new Gen(7);
const dir = join(import.meta.dirname, '..', 'fixtures', 'large-200-mysql', 'migrations');
rmSync(join(dir, '..'), { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, '..', 'dialect'), 'mysql\n');

// MySQL's `MODIFY COLUMN` restates the whole column, and what it leaves out
// it removes: a MODIFY without NOT NULL makes a NOT NULL column nullable.
// So to write the same two alters the PostgreSQL generator writes — one that
// changes only the type, one that changes only the nullability — the
// generator has to remember both.
const tables: { name: string; cols: string[]; types: Map<string, string>; notNull: Set<string> }[] = [];
let file = 0;
let sql = '';
for (let i = 0; i < 200; i++) {
  const name = `${WORDS[g.next(WORDS.length)]}_${WORDS[g.next(WORDS.length)]}_${i}`;
  const ncols = 3 + g.next(7);
  const cols: string[] = ['id'];
  const types = new Map<string, string>();
  const notNull = new Set<string>(['id']);
  const big = g.next(3) === 0;
  types.set('id', big ? 'bigint(20)' : 'int(11)');
  const defs: string[] = [big ? '`id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY' : '`id` int(11) NOT NULL PRIMARY KEY'];
  for (let c = 0; c < ncols; c++) {
    const cn = `${WORDS[g.next(WORDS.length)]}_${c}`;
    cols.push(cn);
    const type = TYPES[g.next(TYPES.length)]!;
    types.set(cn, type);
    const required = g.next(2) === 0;
    if (required) notNull.add(cn);
    defs.push(`\`${cn}\` ${type}${required ? ' NOT NULL' : ''}`);
  }
  const nfk = tables.length === 0 ? 0 : 1 + g.next(3);
  for (let f = 0; f < nfk; f++) {
    const target = tables[g.next(tables.length)]!;
    const cn = `${target.name.split('_')[0]}_ref_${f}`;
    cols.push(cn);
    types.set(cn, 'int(11)');
    // MySQL has no inline `REFERENCES` shorthand that it honours, so every
    // key is spelled out — and half of them get the `KEY` clause InnoDB adds.
    defs.push(`\`${cn}\` int(11) DEFAULT NULL`);
    if (g.next(2) === 0) defs.push(`KEY \`${name}_${cn}_idx\` (\`${cn}\`)`);
    defs.push(`CONSTRAINT \`${name}_${cn}_fk\` FOREIGN KEY (\`${cn}\`) REFERENCES \`${target.name}\` (\`id\`)`);
  }
  if (g.next(5) === 0) defs.push(`UNIQUE KEY \`${name}_u2\` (\`${cols[1]}\`, \`${cols[2]}\`)`);
  sql += `CREATE TABLE \`${name}\` (\n  ${defs.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';\n`;
  if (g.next(5) === 0) sql += `CREATE UNIQUE INDEX \`${name}_u\` ON \`${name}\` (\`${cols[cols.length - 1]}\`);\n`;
  tables.push({ name, cols, types, notNull });
  if ((i + 1) % 25 === 0) {
    writeFileSync(join(dir, `${String(++file).padStart(3, '0')}_tables.sql`), sql);
    sql = '';
  }
}
// The decorations and statements a real MySQL dump carries, including the
// three the rewrite refuses to guess at.
let alters = '';
for (let i = 0; i < 20; i++) {
  const t = tables[g.next(tables.length)]!;
  const c = t.cols[1 + g.next(t.cols.length - 1)]!;
  switch (g.next(4)) {
    case 0: alters += `ALTER TABLE \`${t.name}\` ADD COLUMN \`added_${i}\` longtext;\n`; t.types.set(`added_${i}`, 'longtext'); break;
    // The type change, and only that: NOT NULL is restated or MySQL drops it.
    case 1: alters += `ALTER TABLE \`${t.name}\` MODIFY COLUMN \`${c}\` longtext${t.notNull.has(c) ? ' NOT NULL' : ''};\n`; t.types.set(c, 'longtext'); break;
    case 2:
      alters += `ALTER TABLE \`${t.name}\` RENAME COLUMN \`${c}\` TO \`${c}_renamed\`;\n`;
      t.cols[t.cols.indexOf(c)] = `${c}_renamed`;
      t.types.set(`${c}_renamed`, t.types.get(c)!);
      if (t.notNull.has(c)) t.notNull.add(`${c}_renamed`);
      break;
    // The nullability change, and only that: the type is restated as it stands.
    default: alters += `ALTER TABLE \`${t.name}\` MODIFY COLUMN \`${c}\` ${t.types.get(c)} NOT NULL;\n`; t.notNull.add(c); break;
  }
}
alters += `CREATE TRIGGER \`audit_t\` BEFORE INSERT ON \`${tables[0]!.name}\` FOR EACH ROW SET NEW.id = NEW.id;\n`;
alters += `ALTER TABLE \`${tables[1]!.name}\` ADD FULLTEXT KEY \`ft\` (\`${tables[1]!.cols[1]}\`);\n`;
writeFileSync(join(dir, `${String(++file).padStart(3, '0')}_alters.sql`), alters);
console.log(`wrote ${file} migration files with ${tables.length} tables into fixtures/large-200-mysql/migrations`);
