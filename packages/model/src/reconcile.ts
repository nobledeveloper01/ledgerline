/**
 * The declared schema and the claims become one model.
 *
 * Every edge in the model is in exactly one of three states, and the state is
 * the product: **declared and used** is what an ERD normally shows; **declared
 * and never used** is a constraint the code no longer relies on; **used and
 * never declared** is the join the application depends on that the database
 * does not protect — the one that bites in production.
 *
 * Two claims about the same column pair, from any evidence, are one edge with
 * all of the evidence on it. Direction comes from the constraint when there
 * is one, else from uniqueness: the side that is unique is the one being
 * pointed at. When neither side is unique the edge is undirected and its
 * cardinality is unknown, and the model says so rather than guessing.
 */

import { validClaim, type Claims, type Evidence } from './claims.ts';
import { columnKey, findTable, isUnique, tableKey, type ColumnRef, type DeclaredSchema, type Table, type TableRef } from './schema.ts';

export type EdgeState = 'declared_and_used' | 'declared_unused' | 'used_undeclared';

export type Cardinality = 'many_to_one' | 'one_to_one' | 'unknown';

export interface Edge {
  /** Stable across runs: the sorted column keys of both ends, joined. */
  readonly id: string;
  readonly from: readonly ColumnRef[];
  readonly to: readonly ColumnRef[];
  readonly directed: boolean;
  readonly state: EdgeState;
  readonly cardinality: Cardinality;
  readonly evidence: readonly Evidence[];
  /**
   * How many distinct places support this edge as a query — sources and
   * lines, not repeated runs of one statement. One join in one report is a
   * weaker claim than the same join in forty files (ADR-0003 #3).
   */
  readonly support: number;
}

export interface PolymorphicEdge {
  readonly id: string;
  readonly from: readonly ColumnRef[];
  readonly discriminator: ColumnRef;
  readonly targets: Readonly<Record<string, TableRef>>;
  readonly evidence: readonly Evidence[];
}

export interface Model {
  readonly tables: readonly Table[];
  readonly edges: readonly Edge[];
  readonly polymorphic: readonly PolymorphicEdge[];
  /** Tables that claims refer to and the schema does not declare. Drawn as ghosts, reported as findings. */
  readonly undeclaredTables: readonly TableRef[];
}

function endKey(cols: readonly ColumnRef[]): string {
  return cols.map(columnKey).sort().join('+');
}

/** The pair, in a canonical order, so `a→b` and `b→a` from two queries meet as one edge. */
function pairId(a: readonly ColumnRef[], b: readonly ColumnRef[]): string {
  const [x, y] = [endKey(a), endKey(b)].sort();
  return `${x}=${y}`;
}

interface Building {
  from: readonly ColumnRef[];
  to: readonly ColumnRef[];
  directed: boolean;
  declared: boolean;
  used: boolean;
  evidence: Evidence[];
}

function orient(schema: DeclaredSchema, b: Building): { from: readonly ColumnRef[]; to: readonly ColumnRef[]; directed: boolean; cardinality: Cardinality } {
  const tableOf = (cols: readonly ColumnRef[]): Table | null => (cols[0] ? findTable(schema, cols[0]) : null);
  const names = (cols: readonly ColumnRef[]): string[] => cols.map((c) => c.column);
  const fromT = tableOf(b.from);
  const toT = tableOf(b.to);
  const fromUnique = fromT !== null && isUnique(fromT, names(b.from));
  const toUnique = toT !== null && isUnique(toT, names(b.to));

  if (b.directed) {
    return { from: b.from, to: b.to, directed: true, cardinality: fromUnique && toUnique ? 'one_to_one' : toUnique ? 'many_to_one' : 'unknown' };
  }
  // Undirected: the unique side is the one being pointed at.
  if (toUnique && !fromUnique) return { from: b.from, to: b.to, directed: true, cardinality: 'many_to_one' };
  if (fromUnique && !toUnique) return { from: b.to, to: b.from, directed: true, cardinality: 'many_to_one' };
  if (fromUnique && toUnique) return { from: b.from, to: b.to, directed: false, cardinality: 'one_to_one' };
  return { from: b.from, to: b.to, directed: false, cardinality: 'unknown' };
}

export function reconcile(schema: DeclaredSchema, claims: Claims): Model {
  const edges = new Map<string, Building>();

  const add = (from: readonly ColumnRef[], to: readonly ColumnRef[], directed: boolean, declared: boolean, evidence: Evidence): void => {
    const id = pairId(from, to);
    const existing = edges.get(id);
    if (existing) {
      // A directed claim (a constraint) wins the orientation; a second
      // directed claim that disagrees keeps the first, and both stay as evidence.
      if (directed && !existing.directed) {
        existing.from = from;
        existing.to = to;
        existing.directed = true;
      }
      existing.declared ||= declared;
      existing.used ||= !declared;
      existing.evidence.push(evidence);
      return;
    }
    edges.set(id, { from, to, directed, declared, used: !declared, evidence: [evidence] });
  };

  for (const fk of schema.foreignKeys) {
    add(fk.from, fk.to, true, true, { kind: 'constraint', source: fk.name, text: `FOREIGN KEY (${fk.from.map((c) => c.column).join(', ')}) REFERENCES ${tableKey(fk.to[0] ?? { schema: '', name: '?' })} (${fk.to.map((c) => c.column).join(', ')})` });
  }
  for (const c of claims.relationships) {
    if (!validClaim(c)) continue;
    add(c.from, c.to, c.directed, false, c.evidence);
  }

  const declaredTables = new Set(schema.tables.map(tableKey));
  const undeclared = new Map<string, TableRef>();
  const noteTable = (ref: TableRef): void => {
    if (!declaredTables.has(tableKey(ref))) undeclared.set(tableKey(ref), { schema: ref.schema, name: ref.name });
  };

  const out: Edge[] = [];
  for (const [id, b] of edges) {
    const o = orient(schema, b);
    for (const c of [...b.from, ...b.to]) noteTable(c);
    out.push({
      id,
      from: o.from,
      to: o.to,
      directed: o.directed,
      state: b.declared && b.used ? 'declared_and_used' : b.declared ? 'declared_unused' : 'used_undeclared',
      cardinality: o.cardinality,
      evidence: b.evidence,
      support: new Set(b.evidence.filter((v) => v.kind !== 'constraint').map((v) => `${v.source}:${v.line ?? ''}`)).size,
    });
  }

  const poly = new Map<string, PolymorphicEdge>();
  for (const p of claims.polymorphic) {
    if (!validClaim(p)) continue;
    const id = `${endKey(p.from)}~${columnKey(p.discriminator)}`;
    const targets = { ...(poly.get(id)?.targets ?? {}), ...p.targets };
    for (const t of Object.values(p.targets)) noteTable(t);
    for (const c of [...p.from, p.discriminator]) noteTable(c);
    poly.set(id, { id, from: p.from, discriminator: p.discriminator, targets, evidence: [...(poly.get(id)?.evidence ?? []), p.evidence] });
  }

  const byKey = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return {
    tables: [...schema.tables].sort((a, b) => (tableKey(a) < tableKey(b) ? -1 : 1)),
    edges: out.sort(byKey),
    polymorphic: [...poly.values()].sort(byKey),
    undeclaredTables: [...undeclared.values()].sort((a, b) => (tableKey(a) < tableKey(b) ? -1 : 1)),
  };
}

/** The tables a claim's columns belong to, for a finding's sentence. */
export function tablesOf(cols: readonly ColumnRef[]): string {
  return [...new Set(cols.map(tableKey))].join(', ');
}
