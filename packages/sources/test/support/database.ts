/**
 * A database of one's own, per test.
 *
 * `node --test` runs test files in parallel processes, and two files loading
 * different schemas into one database found each other's tables in the first
 * run of the 200-table gate. Each live test now creates its own database
 * from the maintenance connection the URL names, and drops it first if a
 * previous run left it behind.
 */
import type { Client as PgClient } from 'pg';

export async function freshDatabase(url: string, suffix: string): Promise<string> {
  const { Client } = await import('pg');
  const name = `ledgerline_test_${suffix}`;
  const admin: PgClient = new Client({ connectionString: url });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${name}`);
    await admin.query(`CREATE DATABASE ${name}`);
  } finally {
    await admin.end();
  }
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u.toString();
}

export async function load(url: string, statements: readonly string[]): Promise<void> {
  const { Client } = await import('pg');
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    for (const s of statements) await c.query(s);
  } finally {
    await c.end();
  }
}
