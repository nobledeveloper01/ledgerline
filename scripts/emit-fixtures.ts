// Writes every fixture's expected.json through the rules. `make fixtures` to
// regenerate deliberately; `make fixtures-check` diffs.
//
// A fixture is a directory with either `input.json` (a DeclaredSchema and
// Claims, handed straight to the model) or `migrations/` (real DDL, read
// through the parser first) with optional `queries/` (real SQL, read through
// the parser too) or `claims.json` beside it. Both
// kinds produce the same `expected.json`: the reconciled model and its
// findings. The migrations kind is what holds the parser to the corpus.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { findings, reconcile, NO_CLAIMS, type Claims, type DeclaredSchema } from '@ledgerline/model';
import { claimsFromSqlFiles, schemaFromMigrations } from '@ledgerline/sources';

const root = join(import.meta.dirname, '..', 'fixtures');
const check = process.argv.includes('--check');
let drift = 0;
let n = 0;
for (const dir of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const base = join(root, dir);
  let schema: DeclaredSchema;
  let claims: Claims;
  if (existsSync(join(base, 'input.json'))) {
    const input = JSON.parse(readFileSync(join(base, 'input.json'), 'utf8')) as { schema: DeclaredSchema; claims: Claims };
    schema = input.schema;
    claims = input.claims;
  } else if (existsSync(join(base, 'migrations'))) {
    schema = await schemaFromMigrations(join(base, 'migrations'));
    // `queries/` holds SQL the application runs, read through the parser; `claims.json` holds claims handed in directly.
    claims = existsSync(join(base, 'queries'))
      ? await claimsFromSqlFiles(join(base, 'queries'), schema, base)
      : existsSync(join(base, 'claims.json'))
        ? (JSON.parse(readFileSync(join(base, 'claims.json'), 'utf8')) as Claims)
        : NO_CLAIMS;
  } else {
    continue;
  }
  const model = reconcile(schema, claims);
  const expected = JSON.stringify({ model, findings: findings(model) }, null, 2) + '\n';
  const outPath = join(base, 'expected.json');
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
