/**
 * Explaining a finding, and the questions a reviewer asks next.
 *
 * `explain` (ADR-0003 #13) is the evidence chain in full plus the DDL that
 * would close the finding — printed, never run: a diagram tool with write
 * access to a database is a liability wearing a feature's clothes.
 *
 * `blast` (#9) is the impact analysis a reviewer does by hand before touching
 * a hot table: every edge, every query, every file that would be affected,
 * direct and at one more hop.
 *
 * `usage` (#2) turns a query log into counts, so a column nothing read in the
 * window can be said out loud — as a fact about the window, never as advice
 * to drop it.
 */

import type { Finding } from './findings.ts';
import { tableKey, type ColumnRef, type TableRef } from './schema.ts';
import type { Edge, Model } from './reconcile.ts';

export interface Explanation {
  readonly finding: Finding;
  /** Every piece of evidence behind it, in the order it was seen. */
  readonly evidence: readonly { readonly kind: string; readonly at: string; readonly text: string }[];
  /** Why the cardinality is what it is, in a sentence. */
  readonly cardinality: string | null;
  /** DDL that would close it. Printed for a person to put in a migration; never run. */
  readonly closingDdl: readonly string[];
}

function edgeFor(model: Model, f: Finding): Edge | null {
  // The orphan-side sentence names the two tables and the columns, without an arrow.
  const orphan = /^Rows in ([\w.]+) may reference no ([\w.]+): ([\w+]+) is nullable/.exec(f.sentence);
  if (orphan) {
    const [, fromTable, toTable, fromCols] = orphan as unknown as [string, string, string, string];
    return (
      model.edges.find((e) => (e.from[0] ? tableKey(e.from[0]) : '') === fromTable && (e.to[0] ? tableKey(e.to[0]) : '') === toTable && e.from.map((c) => c.column).join('+') === fromCols) ?? null
    );
  }
  // Otherwise the sentence names both ends around an arrow; the edge id is built from them.
  const m = /([\w.]+)\.([\w+]+) → ([\w.]+)\.([\w+]+)/.exec(f.sentence);
  if (!m) return null;
  const [, fromTable, fromCols, toTable, toCols] = m as unknown as [string, string, string, string, string];
  return (
    model.edges.find((e) => {
      const a = e.from[0] ? tableKey(e.from[0]) : '';
      const b = e.to[0] ? tableKey(e.to[0]) : '';
      return a === fromTable && b === toTable && e.from.map((c) => c.column).join('+') === fromCols && e.to.map((c) => c.column).join('+') === toCols;
    }) ?? null
  );
}

function ddlToClose(e: Edge): string[] {
  const from = e.from[0];
  const to = e.to[0];
  if (!from || !to) return [];
  const name = `${from.name}_${e.from.map((c) => c.column).join('_')}_fkey`;
  const lines = [
    `ALTER TABLE ${tableKey(from)}`,
    `  ADD CONSTRAINT ${name}`,
    `  FOREIGN KEY (${e.from.map((c) => c.column).join(', ')})`,
    `  REFERENCES ${tableKey(to)} (${e.to.map((c) => c.column).join(', ')});`,
  ];
  return [lines.join('\n')];
}

export function explain(model: Model, finding: Finding): Explanation {
  const edge = edgeFor(model, finding);
  const evidence = (edge?.evidence ?? []).map((v) => ({ kind: v.kind, at: v.line === undefined ? v.source : `${v.source}:${v.line}`, text: v.text }));
  const cardinality =
    edge === null
      ? null
      : edge.cardinality === 'unknown'
        ? 'Unknown: neither side is a primary key or a unique constraint, so nothing proves which side is the one.'
        : edge.cardinality === 'one_to_one'
          ? `One to one: ${edge.from.map((c) => c.column).join('+')} and ${edge.to.map((c) => c.column).join('+')} are both unique.`
          : `Many to one: ${tableKey(edge.to[0]!)}.${edge.to.map((c) => c.column).join('+')} is unique, so many rows may point at one.`;
  return {
    finding,
    evidence,
    cardinality,
    closingDdl: edge !== null && finding.code === 'used_undeclared' ? ddlToClose(edge) : [],
  };
}

export interface BlastRadius {
  readonly table: TableRef;
  /** Edges that touch the table itself. */
  readonly direct: readonly Edge[];
  /** Edges one more hop out: what a change reaches through a neighbour. */
  readonly indirect: readonly Edge[];
  /** Every place a query touched any of it, deduplicated, in reading order. */
  readonly places: readonly string[];
}

export function blastRadius(model: Model, table: TableRef): BlastRadius {
  const key = tableKey(table);
  const touches = (e: Edge, k: string): boolean => [...e.from, ...e.to].some((c) => tableKey(c) === k);
  const direct = model.edges.filter((e) => touches(e, key));
  const neighbours = new Set(direct.flatMap((e) => [...e.from, ...e.to]).map(tableKey).filter((k) => k !== key));
  const indirect = model.edges.filter((e) => !touches(e, key) && [...neighbours].some((n) => touches(e, n)));
  const places = [...new Set([...direct, ...indirect].flatMap((e) => e.evidence.filter((v) => v.kind !== 'constraint').map((v) => (v.line === undefined ? v.source : `${v.source}:${v.line}`))))];
  return { table, direct, indirect, places };
}

export interface ColumnUse {
  readonly column: ColumnRef;
  readonly reads: number;
}

export interface UsageReport {
  /** Tables no query in the window touched. */
  readonly unusedTables: readonly TableRef[];
  /** Columns no query in the window named. */
  readonly unusedColumns: readonly ColumnRef[];
  readonly window: string;
}

/**
 * What a query log says was touched.
 *
 * `mentions` is the set of `table.column` a reader found in the window — the
 * caller produces it, because *what a query touched* is the parser's job and
 * this is the rule about what the counts mean. A column absent from the set
 * is unused **in that window**, which is a fact about the window and is
 * phrased that way everywhere it is shown.
 */
export function usage(model: Model, mentions: ReadonlySet<string>, window: string): UsageReport {
  const unusedTables: TableRef[] = [];
  const unusedColumns: ColumnRef[] = [];
  for (const t of model.tables) {
    const key = tableKey(t);
    const anyColumn = t.columns.some((c) => mentions.has(`${key}.${c.name}`));
    if (!mentions.has(key) && !anyColumn) {
      unusedTables.push({ schema: t.schema, name: t.name });
      continue;
    }
    for (const c of t.columns) {
      if (!mentions.has(`${key}.${c.name}`)) unusedColumns.push({ schema: t.schema, name: t.name, column: c.name });
    }
  }
  return { unusedTables, unusedColumns, window };
}
