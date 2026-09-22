// A 200-table schema, generated deterministically, for the parse gate.
//
// Real-world-shaped: each table has an id, three to nine columns from a small
// vocabulary of types, and one to three foreign keys to earlier tables, some
// unnamed, some composite, some schema-qualified; a fifth of the tables get a
// unique index; a handful are renamed or altered by later "migrations". The
// generator uses the high bits of its LCG. Written to
// fixtures/large-200/migrations/ by `make fixtures`, never by hand.
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

const TYPES = ['integer', 'bigint', 'text', 'varchar(120)', 'boolean', 'timestamptz', 'numeric(12,2)', 'uuid', 'jsonb', 'date'];
const WORDS = ['account', 'order', 'invoice', 'shipment', 'ticket', 'note', 'event', 'plan', 'asset', 'lease', 'payment', 'device', 'zone', 'route', 'batch', 'claim', 'policy', 'audit', 'session', 'grant'];

const g = new Gen(7);
const dir = join(import.meta.dirname, '..', 'fixtures', 'large-200', 'migrations');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const tables: { schema: string; name: string; cols: string[] }[] = [];
let file = 0;
let sql = 'CREATE SCHEMA billing;\nCREATE SCHEMA ops;\n';
for (let i = 0; i < 200; i++) {
  const schema = i % 7 === 0 ? 'billing' : i % 11 === 0 ? 'ops' : 'public';
  const name = `${WORDS[g.next(WORDS.length)]}_${WORDS[g.next(WORDS.length)]}_${i}`;
  const ncols = 3 + g.next(7);
  const cols: string[] = ['id'];
  const defs: string[] = [g.next(3) === 0 ? 'id bigserial PRIMARY KEY' : 'id integer PRIMARY KEY'];
  for (let c = 0; c < ncols; c++) {
    const cn = `${WORDS[g.next(WORDS.length)]}_${c}`;
    cols.push(cn);
    defs.push(`${cn} ${TYPES[g.next(TYPES.length)]}${g.next(2) === 0 ? ' NOT NULL' : ''}`);
  }
  const nfk = tables.length === 0 ? 0 : 1 + g.next(3);
  for (let f = 0; f < nfk; f++) {
    const target = tables[g.next(tables.length)]!;
    const cn = `${target.name.split('_')[0]}_ref_${f}`;
    cols.push(cn);
    if (g.next(2) === 0) defs.push(`${cn} integer REFERENCES ${target.schema}.${target.name}`);
    else defs.push(`${cn} integer`, `CONSTRAINT ${name}_${cn}_fk FOREIGN KEY (${cn}) REFERENCES ${target.schema}.${target.name} (id)`);
  }
  if (g.next(5) === 0) defs.push(`UNIQUE (${cols[1]}, ${cols[2]})`);
  sql += `CREATE TABLE ${schema}.${name} (\n  ${defs.join(',\n  ')}\n);\n`;
  if (g.next(5) === 0) sql += `CREATE UNIQUE INDEX ${name}_u ON ${schema}.${name} (${cols[cols.length - 1]});\n`;
  tables.push({ schema, name, cols });
  if ((i + 1) % 25 === 0) {
    writeFileSync(join(dir, `${String(++file).padStart(3, '0')}_tables.sql`), sql);
    sql = '';
  }
}
// Later migrations that alter what earlier ones made.
let alters = '';
for (let i = 0; i < 20; i++) {
  const t = tables[g.next(tables.length)]!;
  const c = t.cols[1 + g.next(t.cols.length - 1)]!;
  switch (g.next(4)) {
    case 0: alters += `ALTER TABLE ${t.schema}.${t.name} ADD COLUMN added_${i} text;\n`; break;
    case 1: alters += `ALTER TABLE ${t.schema}.${t.name} ALTER COLUMN ${c} TYPE text;\n`; break;
    case 2: alters += `ALTER TABLE ${t.schema}.${t.name} RENAME COLUMN ${c} TO ${c}_renamed;\n`; t.cols[t.cols.indexOf(c)] = `${c}_renamed`; break;
    default: alters += `ALTER TABLE ${t.schema}.${t.name} ALTER COLUMN ${c} SET NOT NULL;\n`; break;
  }
}
writeFileSync(join(dir, `${String(++file).padStart(3, '0')}_alters.sql`), alters);
console.log(`wrote ${file} migration files with ${tables.length} tables into fixtures/large-200/migrations`);
