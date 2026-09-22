/**
 * PostgreSQL's own parser, loaded once.
 *
 * `@pgsql/parser` ships libpg_query compiled to WebAssembly — the server's
 * grammar, not a reimplementation — so every statement PostgreSQL accepts
 * parses here the same way. Its ESM entry has a directory import Node's ESM
 * loader refuses (`./types` with no extension), so the CommonJS entry is
 * loaded through `createRequire`; the AST is identical.
 *
 * Version 17 is pinned. Newer syntax parses under a newer version; the
 * grammar for DDL has been stable across 13–18 and nothing here depends on
 * what changed.
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

interface Pg {
  loadModule(): Promise<void>;
  parse(sql: string): Promise<ParseResult>;
  parseSync(sql: string): ParseResult;
}

/** The AST as libpg_query emits it: one wrapper key per node type. */
export type Node = Record<string, unknown>;

export interface RawStmt {
  readonly stmt: Node;
  readonly stmt_location?: number;
  readonly stmt_len?: number;
}

export interface ParseResult {
  readonly version: number;
  readonly stmts: readonly RawStmt[];
}

let loaded: Promise<Pg> | null = null;

export function pg(): Promise<Pg> {
  if (loaded === null) {
    const m = require('@pgsql/parser/v17') as Pg;
    loaded = m.loadModule().then(() => m);
  }
  return loaded;
}

export class DdlSyntaxError extends Error {
  readonly source: string;

  constructor(message: string, source: string) {
    super(message);
    this.name = 'DdlSyntaxError';
    this.source = source;
  }
}

/** Parse, and name the source in the error — a migration directory has forty files and the message must say which. */
export async function parseSql(sql: string, source: string): Promise<ParseResult> {
  const p = await pg();
  try {
    return await p.parse(sql);
  } catch (e) {
    throw new DdlSyntaxError(`${source}: ${e instanceof Error ? e.message : String(e)}`, source);
  }
}
