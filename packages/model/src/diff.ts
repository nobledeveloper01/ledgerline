/**
 * What changed between two models.
 *
 * The diff is the pull-request comment and the drift gate. It is computed on
 * the model, not on the DDL, so a change that adds a foreign key for a join the
 * code already relied on shows as *an edge that was used-and-undeclared is now
 * declared-and-used* — which is the sentence a reviewer wants — rather than as
 * twelve lines of migration.
 */

import type { Edge, EdgeState, Model } from './reconcile.ts';
import { tableKey, type Column, type Table, type TableRef } from './schema.ts';

export interface ColumnChange {
  readonly table: TableRef;
  readonly column: string;
  readonly before: Column | null;
  readonly after: Column | null;
}

export interface EdgeStateChange {
  readonly edge: Edge;
  readonly before: EdgeState;
  readonly after: EdgeState;
}

export interface ModelDiff {
  readonly tablesAdded: readonly Table[];
  readonly tablesRemoved: readonly Table[];
  readonly columnsChanged: readonly ColumnChange[];
  readonly edgesAdded: readonly Edge[];
  readonly edgesRemoved: readonly Edge[];
  readonly edgesChanged: readonly EdgeStateChange[];
}

export function isEmptyDiff(d: ModelDiff): boolean {
  return (
    d.tablesAdded.length === 0 &&
    d.tablesRemoved.length === 0 &&
    d.columnsChanged.length === 0 &&
    d.edgesAdded.length === 0 &&
    d.edgesRemoved.length === 0 &&
    d.edgesChanged.length === 0
  );
}

function sameColumn(a: Column, b: Column): boolean {
  return a.name === b.name && a.type === b.type && a.nullable === b.nullable;
}

export function diff(before: Model, after: Model): ModelDiff {
  const beforeTables = new Map(before.tables.map((t) => [tableKey(t), t]));
  const afterTables = new Map(after.tables.map((t) => [tableKey(t), t]));

  const tablesAdded = after.tables.filter((t) => !beforeTables.has(tableKey(t)));
  const tablesRemoved = before.tables.filter((t) => !afterTables.has(tableKey(t)));

  const columnsChanged: ColumnChange[] = [];
  for (const [key, b] of beforeTables) {
    const a = afterTables.get(key);
    if (!a) continue;
    const bc = new Map(b.columns.map((c) => [c.name, c]));
    const ac = new Map(a.columns.map((c) => [c.name, c]));
    for (const [name, col] of bc) {
      const now = ac.get(name);
      if (!now) columnsChanged.push({ table: { schema: b.schema, name: b.name }, column: name, before: col, after: null });
      else if (!sameColumn(col, now)) columnsChanged.push({ table: { schema: b.schema, name: b.name }, column: name, before: col, after: now });
    }
    for (const [name, col] of ac) {
      if (!bc.has(name)) columnsChanged.push({ table: { schema: b.schema, name: b.name }, column: name, before: null, after: col });
    }
  }

  const beforeEdges = new Map(before.edges.map((e) => [e.id, e]));
  const afterEdges = new Map(after.edges.map((e) => [e.id, e]));
  const edgesAdded = after.edges.filter((e) => !beforeEdges.has(e.id));
  const edgesRemoved = before.edges.filter((e) => !afterEdges.has(e.id));
  const edgesChanged: EdgeStateChange[] = [];
  for (const [id, b] of beforeEdges) {
    const a = afterEdges.get(id);
    if (a && a.state !== b.state) edgesChanged.push({ edge: a, before: b.state, after: a.state });
  }

  return { tablesAdded, tablesRemoved, columnsChanged, edgesAdded, edgesRemoved, edgesChanged };
}
