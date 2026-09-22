import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { claimsFromSql } from '@ledgerline/parse';
import { stringLiterals, skipPattern } from '../src/index.ts';
const root = process.argv[2]!;
const skip = skipPattern(['server/migrations']);
const EXT = new Set(['.ts', '.js', '.tsx', '.sql']);
const files: string[] = [];
const walk = (d: string): void => {
  let e: string[]; try { e = readdirSync(d); } catch { return; }
  for (const n of e) {
    const f = join(d, n);
    if (skip.test(f.slice(root.length + 1))) continue;
    try { if (statSync(f).isDirectory()) walk(f); else if (EXT.has(n.slice(n.lastIndexOf('.')))) files.push(f); } catch { /* gone */ }
  }
};
walk(root);
const out: string[] = [];
for (const f of files) {
  let src: string; try { src = readFileSync(f, 'utf8'); } catch { continue; }
  for (const lit of stringLiterals(src)) {
    if (!/^\s*(?:SELECT\b[\s\S]*\bFROM\b|INSERT\s+INTO\b|UPDATE\b[\s\S]*\bSET\b|DELETE\b[\s\S]*\bFROM\b|WITH\b[\s\S]*\bAS\s*\()/i.test(lit.text)) continue;
    const c = await claimsFromSql(lit.text, { source: f, line: lit.line });
    if (c.unparsed > 0) out.push(`${f.slice(root.length + 1)}:${lit.line} ${lit.text.replace(/\s+/g, ' ').slice(0, 130)}`);
  }
}
console.log('unparsed:', out.length);
for (const o of out.slice(0, 14)) console.log(' •', o);
