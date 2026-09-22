/**
 * The model → positions, at build time.
 *
 * ELK's layered algorithm places every table and routes every edge once,
 * here, so the HTML does no layout work and opens from `file://` on a
 * machine with nothing on it. Each table is one node sized by its rows; each
 * edge — declared or inferred, polymorphic fan-outs included — is one ELK
 * edge between tables. Ghost tables are laid out like the rest, so the
 * diagram shows where the code thinks a table is.
 */

import { createRequire } from 'node:module';

import { tableKey, type Model, type TableRef } from '@ledgerline/model';

const require = createRequire(import.meta.url);

interface ElkNode {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  layoutOptions?: Record<string, string>;
  children?: ElkNode[];
  edges?: ElkEdge[];
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
  sections?: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; bendPoints?: { x: number; y: number }[] }[];
}

interface Elk {
  layout(graph: ElkNode): Promise<ElkNode>;
}

export const ROW_H = 22;
export const HEAD_H = 30;
export const CHAR_W = 7.2;
export const PAD = 12;

export interface PlacedTable {
  readonly id: string;
  readonly ref: TableRef;
  readonly ghost: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PlacedEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly points: readonly { readonly x: number; readonly y: number }[];
}

export interface Layout {
  readonly width: number;
  readonly height: number;
  readonly tables: readonly PlacedTable[];
  readonly edges: readonly PlacedEdge[];
}

function widthFor(lines: readonly string[]): number {
  return Math.max(120, Math.ceil(Math.max(...lines.map((l) => l.length)) * CHAR_W) + PAD * 2);
}

export async function layoutModel(model: Model): Promise<Layout> {
  const ELK = require('elkjs/lib/elk.bundled.js') as new () => Elk;
  const elk = new ELK();

  const nodes: ElkNode[] = [];
  const refs = new Map<string, { ref: TableRef; ghost: boolean }>();
  for (const t of model.tables) {
    const id = tableKey(t);
    refs.set(id, { ref: { schema: t.schema, name: t.name }, ghost: false });
    const lines = [id, ...t.columns.map((c) => `${c.name}  ${c.type}`)];
    nodes.push({ id, width: widthFor(lines), height: HEAD_H + ROW_H * t.columns.length + PAD });
  }
  for (const g of model.undeclaredTables) {
    const id = tableKey(g);
    refs.set(id, { ref: g, ghost: true });
    nodes.push({ id, width: widthFor([id]), height: HEAD_H + PAD });
  }

  const edges: ElkEdge[] = [];
  const known = new Set(nodes.map((n) => n.id));
  for (const e of model.edges) {
    const a = e.from[0] ? tableKey(e.from[0]) : null;
    const b = e.to[0] ? tableKey(e.to[0]) : null;
    if (!a || !b || !known.has(a) || !known.has(b) || a === b) continue;
    edges.push({ id: e.id, sources: [a], targets: [b] });
  }
  for (const p of model.polymorphic) {
    const a = p.from[0] ? tableKey(p.from[0]) : null;
    if (!a || !known.has(a)) continue;
    for (const [value, t] of Object.entries(p.targets)) {
      const b = tableKey(t);
      if (known.has(b) && b !== a) edges.push({ id: `${p.id}~${value}`, sources: [a], targets: [b] });
    }
  }

  const graph = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '48',
      'elk.layered.spacing.nodeNodeBetweenLayers': '96',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.thoroughness': '3',
    },
    children: nodes,
    edges,
  });

  const tables: PlacedTable[] = (graph.children ?? []).map((n) => {
    const r = refs.get(n.id)!;
    return { id: n.id, ref: r.ref, ghost: r.ghost, x: n.x ?? 0, y: n.y ?? 0, width: n.width ?? 0, height: n.height ?? 0 };
  });
  const placedEdges: PlacedEdge[] = (graph.edges ?? []).map((e) => {
    const s = e.sections?.[0];
    const points = s ? [s.startPoint, ...(s.bendPoints ?? []), s.endPoint] : [];
    return { id: e.id, from: e.sources[0]!, to: e.targets[0]!, points };
  });
  return { width: graph.width ?? 0, height: graph.height ?? 0, tables, edges: placedEdges };
}
