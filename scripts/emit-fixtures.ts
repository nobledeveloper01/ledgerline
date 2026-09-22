// Writes every fixture's expected.json from its input.json through the model.
// `make fixtures` to regenerate deliberately; `make fixtures-check` diffs.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { findings, reconcile, type Claims, type DeclaredSchema } from '../packages/model/src/index.ts';

const root = join(import.meta.dirname, '..', 'fixtures');
const check = process.argv.includes('--check');
let drift = 0;
let n = 0;
for (const dir of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const inputPath = join(root, dir, 'input.json');
  if (!existsSync(inputPath)) continue;
  const input = JSON.parse(readFileSync(inputPath, 'utf8')) as { schema: DeclaredSchema; claims: Claims };
  const model = reconcile(input.schema, input.claims);
  const expected = JSON.stringify({ model, findings: findings(model) }, null, 2) + '\n';
  const outPath = join(root, dir, 'expected.json');
  n++;
  if (check) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
    if (current !== expected) {
      drift++;
      console.log(`\x1b[0;31m✗\x1b[0m fixtures/${dir}/expected.json does not match the rules — run make fixtures and read the diff`);
    }
  } else {
    writeFileSync(outPath, expected);
  }
}
if (check) {
  if (drift > 0) process.exit(1);
  console.log(`\x1b[0;32m✓\x1b[0m ${n} fixtures match the rules`);
} else {
  console.log(`wrote ${n} fixtures`);
}
