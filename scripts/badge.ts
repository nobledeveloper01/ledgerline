// The README's diagram and its number, from the check itself (ADR-0003 #15).
//
// Writes between the markers in README.md, so a badge nobody can award
// themselves: the count comes from the model, and CI runs this and fails if
// the README moved without the rules moving.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { badgeLine, mermaidFor } from '@ledgerline/render';
import { buildModel, resolveConfig } from 'ledgerline';

const root = join(import.meta.dirname, '..');
const check = process.argv.includes('--check');
const START = '<!-- ledgerline:start -->';
const END = '<!-- ledgerline:end -->';

// The tool reads its own fixture, because this repository has no database of its own.
const config = { ...resolveConfig(join(root, 'fixtures', 'shop-with-queries')), queries: ['queries'] };
const built = await buildModel(config);
const block = [
  START,
  '',
  `**${badgeLine(built.model)}** in the example schema below — counted by \`ledgerline check\`, not by anyone's say-so.`,
  '',
  '```mermaid',
  mermaidFor(built.model).trimEnd(),
  '```',
  '',
  END,
].join('\n');

const path = join(root, 'README.md');
const readme = readFileSync(path, 'utf8');
const before = readme.indexOf(START);
const after = readme.indexOf(END);
if (before < 0 || after < 0) {
  console.error(`README.md has no ${START} … ${END} block`);
  process.exit(1);
}
const next = readme.slice(0, before) + block + readme.slice(after + END.length);
if (check) {
  if (next !== readme) {
    console.log('\x1b[0;31m✗\x1b[0m the README badge is out of date — run make badge');
    process.exit(1);
  }
  console.log('\x1b[0;32m✓\x1b[0m the README badge matches what the check says');
} else {
  writeFileSync(path, next);
  console.log(`wrote the README badge: ${badgeLine(built.model)}`);
}
