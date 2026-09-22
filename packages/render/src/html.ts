/**
 * One static HTML file.
 *
 * The SVG is written here, at build time, from the layout; the page carries a
 * few hundred lines of inline JavaScript for pan, zoom, search, focus and the
 * evidence panel, and nothing else — no framework, no font, no fetch, no
 * network. It opens from `file://`, it opens with JavaScript off (the diagram
 * is plain SVG; only the interactions need script), and it opens on a phone.
 *
 * The three edge states are distinguishable **without colour**: declared and
 * used is a solid line; declared and never used is dashed; used and never
 * declared is dotted with a warning mark at its midpoint. A polymorphic edge
 * is dash-dot with a diamond. A crow's foot appears only where uniqueness
 * proved it (ADR-0003 #4). Line weight follows support (#3). Ghost tables are
 * dashed outlines (#1).
 *
 * Focus (#10): clicking a table narrows the diagram to it and its neighbours
 * at one or two hops, and writes `#focus=<table>&hops=<n>` to the URL, so a
 * link to a subgraph needs no server.
 */

import { tableKey, type Finding, type Model } from '@ledgerline/model';

import { HEAD_H, PAD, ROW_H, layoutModel, type Layout } from './layout.ts';

/** Light and dark, both authored; contrast asserted in a test. */
export const PALETTE = {
  light: { bg: '#f7f7f5', ink: '#1a1a1a', muted: '#5f6368', line: '#4a4a4a', panel: '#ffffff', head: '#e8e8e3', warn: '#8a3b00', ghost: '#5c5c5c', focus: '#1d4ed8' },
  dark: { bg: '#141416', ink: '#ececec', muted: '#a9adb5', line: '#c8c8c8', panel: '#1e1e22', head: '#2a2a30', warn: '#ffb266', ghost: '#9a9a9a', focus: '#8ab4ff' },
} as const;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attr(s: string): string {
  return esc(s).replace(/'/g, '&#39;');
}

function pathOf(points: readonly { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

function midpoint(points: readonly { x: number; y: number }[]): { x: number; y: number } {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y);
    segs.push(d);
    total += d;
  }
  let half = total / 2;
  for (let i = 1; i < points.length; i++) {
    const d = segs[i - 1]!;
    if (half <= d) {
      const t = d === 0 ? 0 : half / d;
      return { x: points[i - 1]!.x + (points[i]!.x - points[i - 1]!.x) * t, y: points[i - 1]!.y + (points[i]!.y - points[i - 1]!.y) * t };
    }
    half -= d;
  }
  return points[points.length - 1]!;
}

export interface RenderOptions {
  readonly title?: string;
  readonly findings?: readonly Finding[];
  /**
   * What a query log said was touched in its window (ADR-0003 #2). Given,
   * every table and column *absent* from it is drawn faded and titled with
   * the window's name — a fact about the window, never advice to drop
   * anything. Absent, nothing is faded, because with no window there is no
   * claim to make.
   */
  readonly usage?: { readonly touched: ReadonlySet<string>; readonly window: string };
}

export async function renderHtml(model: Model, options: RenderOptions = {}): Promise<string> {
  const layout = await layoutModel(model);
  return htmlFor(model, layout, options);
}

export function svgFor(model: Model, layout: Layout, usage?: RenderOptions['usage']): string {
  const tables = new Map(model.tables.map((t) => [tableKey(t), t]));
  const edgeById = new Map(model.edges.map((e) => [e.id, e]));
  const parts: string[] = [];

  for (const pe of layout.edges) {
    const e = edgeById.get(pe.id);
    const poly = e ? null : model.polymorphic.find((p) => pe.id.startsWith(`${p.id}~`));
    const state = e ? e.state : 'polymorphic';
    const support = e ? e.support : (poly?.evidence.length ?? 1);
    const weight = (1 + Math.min(3, Math.log2(1 + support))).toFixed(1);
    const mid = midpoint(pe.points);
    const label = e
      ? `${e.from.map((c) => c.column).join('+')} → ${e.to.map((c) => c.column).join('+')}`
      : `${poly?.from.map((c) => c.column).join('+') ?? ''} (${poly?.discriminator.column ?? ''} = ${pe.id.split('~').pop() ?? ''})`;
    const foot = e && e.cardinality === 'many_to_one' && e.directed ? ' marker-start="url(#crow)"' : '';
    const arrow = e && e.directed ? ' marker-end="url(#to)"' : '';
    const aria = e ? `${e.state.replaceAll('_', ' ')}: ${label}, ${e.cardinality.replaceAll('_', ' ')}, ${support} place${support === 1 ? '' : 's'}` : `polymorphic: ${label}`;
    parts.push(
      `<g class="edge ${state}" data-edge="${attr(pe.id)}" data-from="${attr(pe.from)}" data-to="${attr(pe.to)}" tabindex="0" role="button" aria-label="${attr(aria)}">` +
        `<path class="hit" d="${pathOf(pe.points)}"/>` +
        `<path class="line" d="${pathOf(pe.points)}" stroke-width="${weight}"${foot}${arrow}/>` +
        (state === 'used_undeclared' ? `<g class="mark" transform="translate(${mid.x.toFixed(1)} ${mid.y.toFixed(1)})"><circle r="8"/><text y="4" text-anchor="middle">!</text></g>` : '') +
        (state === 'polymorphic' ? `<g class="mark poly" transform="translate(${mid.x.toFixed(1)} ${mid.y.toFixed(1)})"><rect x="-6" y="-6" width="12" height="12" transform="rotate(45)"/></g>` : '') +
        `<text class="label" x="${(mid.x + 6).toFixed(1)}" y="${(mid.y - 6).toFixed(1)}">${esc(label)}</text>` +
        `</g>`,
    );
  }

  for (const pt of layout.tables) {
    const t = tables.get(pt.id);
    const rows = t
      ? t.columns
          .map((c, i) => {
            const y = pt.y + HEAD_H + ROW_H * i + ROW_H * 0.7;
            const key = t.primaryKey.includes(c.name) ? ' pk' : '';
            const cold = usage !== undefined && !usage.touched.has(`${pt.id}.${c.name}`) ? ' unused' : '';
            const why = cold === '' ? '' : `<title>No query named this column in ${esc(usage!.window)}. A fact about that window, not advice.</title>`;
            return `<text class="col${key}${cold}" x="${(pt.x + PAD).toFixed(1)}" y="${y.toFixed(1)}" data-column="${attr(c.name)}">${why}<tspan class="name">${esc(c.name)}</tspan> <tspan class="type">${esc(c.type)}${c.nullable ? '' : ' •'}</tspan></text>`;
          })
          .join('')
      : '';
    const coldTable = usage !== undefined && !usage.touched.has(pt.id) && (t?.columns ?? []).every((c) => !usage.touched.has(`${pt.id}.${c.name}`)) ? ' unused' : '';
    parts.push(
      `<g class="table${pt.ghost ? ' ghost' : ''}${coldTable}" data-table="${attr(pt.id)}" tabindex="0" role="button" aria-label="${attr(pt.ghost ? `${pt.id}, queried but not declared` : `table ${pt.id}, ${t?.columns.length ?? 0} columns`)}" transform="translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})">` +
        `<rect class="box" width="${pt.width}" height="${pt.height}" rx="6"/>` +
        `<rect class="head" width="${pt.width}" height="${HEAD_H}" rx="6"/>` +
        `<text class="title" x="${PAD}" y="${HEAD_H * 0.68}">${esc(pt.id)}</text>` +
        `</g>` +
        (t ? `<g class="rows" data-table="${attr(pt.id)}">${rows}</g>` : ''),
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(layout.width)} ${Math.ceil(layout.height)}" width="${Math.ceil(layout.width)}" height="${Math.ceil(layout.height)}" role="img" aria-label="Entity relationship diagram, ${model.tables.length} tables, ${model.edges.length} relationships">` +
    `<defs>` +
    `<marker id="to" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="arrow"/></marker>` +
    `<marker id="crow" viewBox="0 0 12 12" refX="1" refY="6" markerWidth="12" markerHeight="12" orient="auto"><path d="M12 0 L1 6 L12 12 M1 6 L12 6" class="foot"/></marker>` +
    `</defs>` +
    `<g id="viewport">${parts.join('')}</g></svg>`
  );
}

export function htmlFor(model: Model, layout: Layout, options: RenderOptions): string {
  const title = options.title ?? 'Ledgerline';
  const findings = options.findings ?? [];
  const data = {
    tables: model.tables.map((t) => ({ id: tableKey(t), columns: t.columns, primaryKey: t.primaryKey, uniques: t.uniques })),
    ghosts: model.undeclaredTables.map(tableKey),
    edges: model.edges.map((e) => ({ id: e.id, from: tableKey(e.from[0]!), to: tableKey(e.to[0]!), fromCols: e.from.map((c) => c.column), toCols: e.to.map((c) => c.column), state: e.state, cardinality: e.cardinality, support: e.support, evidence: e.evidence })),
    polymorphic: model.polymorphic.map((p) => ({ id: p.id, from: tableKey(p.from[0]!), discriminator: p.discriminator.column, targets: Object.fromEntries(Object.entries(p.targets).map(([k, v]) => [k, tableKey(v)])), evidence: p.evidence })),
    findings,
  };
  const counts = { used: model.edges.filter((e) => e.state === 'declared_and_used').length, unused: model.edges.filter((e) => e.state === 'declared_unused').length, undeclared: model.edges.filter((e) => e.state === 'used_undeclared').length };
  const L = PALETTE.light;
  const D = PALETTE.dark;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — schema</title>
<style>
:root { color-scheme: light dark; --bg:${L.bg}; --ink:${L.ink}; --muted:${L.muted}; --line:${L.line}; --panel:${L.panel}; --head:${L.head}; --warn:${L.warn}; --ghost:${L.ghost}; --focus:${L.focus}; }
@media (prefers-color-scheme: dark) { :root:not([data-theme=light]) { --bg:${D.bg}; --ink:${D.ink}; --muted:${D.muted}; --line:${D.line}; --panel:${D.panel}; --head:${D.head}; --warn:${D.warn}; --ghost:${D.ghost}; --focus:${D.focus}; } }
:root[data-theme=dark] { --bg:${D.bg}; --ink:${D.ink}; --muted:${D.muted}; --line:${D.line}; --panel:${D.panel}; --head:${D.head}; --warn:${D.warn}; --ghost:${D.ghost}; --focus:${D.focus}; }
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: var(--bg); color: var(--ink); font: 1rem/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
header { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; padding: .6rem 1rem; border-bottom: 1px solid var(--head); background: var(--panel); }
header h1 { font-size: 1rem; margin: 0; }
header .counts { color: var(--muted); font-size: .9rem; }
header input, header button, header select { font: inherit; min-height: 2.5rem; padding: 0 .7rem; border: 1px solid var(--line); border-radius: .4rem; background: var(--panel); color: var(--ink); }
header input:focus, header button:focus, header select:focus, [tabindex]:focus { outline: 3px solid var(--focus); outline-offset: 2px; }
main { display: grid; grid-template-columns: 1fr minmax(16rem, 24rem); height: calc(100% - 3.6rem); }
@media (max-width: 48rem) { main { grid-template-columns: 1fr; grid-template-rows: 1fr minmax(12rem, 40%); } }
#stage { overflow: hidden; position: relative; touch-action: none; }
#stage svg { display: block; width: 100%; height: 100%; }
aside { border-left: 1px solid var(--head); background: var(--panel); overflow: auto; padding: 1rem; }
aside h2 { font-size: .95rem; margin: 0 0 .5rem; }
aside p, aside li { font-size: .9rem; }
aside code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85em; white-space: pre-wrap; word-break: break-word; }
.legend { display: flex; flex-wrap: wrap; gap: .5rem 1rem; font-size: .85rem; color: var(--muted); }
.legend svg { vertical-align: middle; }
.finding { padding: .5rem .6rem; border-left: 4px solid var(--line); margin: .4rem 0; background: var(--bg); border-radius: 0 .3rem .3rem 0; }
.finding.fail { border-color: var(--warn); }
.finding small { color: var(--muted); display: block; }
/* The diagram. */
.box { fill: var(--panel); stroke: var(--line); stroke-width: 1.2; }
.head { fill: var(--head); stroke: var(--line); stroke-width: 1.2; }
.title { font: 700 13px ui-monospace, SFMono-Regular, Menlo, monospace; fill: var(--ink); }
.col { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; fill: var(--ink); }
.col .type { fill: var(--muted); }
.col.pk .name { text-decoration: underline; }
.ghost .box { stroke-dasharray: 6 4; stroke: var(--ghost); fill: none; }
/* ADR-0003 #2: what a query log's window did not touch, drawn faded. Opacity
   only — never a colour that reads as an error, because unused in a window is
   not a fault. */
.col.unused { opacity: 0.38; }
.table.unused .box, .table.unused .head, .table.unused .title { opacity: 0.45; }
.ghost .head { fill: none; stroke: var(--ghost); stroke-dasharray: 6 4; }
.ghost .title { fill: var(--ghost); font-style: italic; }
.edge .hit { fill: none; stroke: transparent; stroke-width: 14; }
.edge .line { fill: none; stroke: var(--line); }
.edge.declared_unused .line { stroke-dasharray: 8 6; stroke: var(--muted); }
.edge.used_undeclared .line { stroke-dasharray: 2 5; stroke-linecap: round; stroke: var(--warn); }
.edge.polymorphic .line { stroke-dasharray: 10 4 2 4; }
.edge .mark circle { fill: var(--warn); }
.edge .mark text { fill: var(--panel); font: 700 12px system-ui, sans-serif; }
.edge .mark.poly rect { fill: var(--panel); stroke: var(--line); stroke-width: 1.5; }
.edge .label { font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; fill: var(--muted); paint-order: stroke; stroke: var(--bg); stroke-width: 3px; }
.arrow { fill: var(--line); }
.foot { fill: none; stroke: var(--line); stroke-width: 1.5; }
.edge.used_undeclared .arrow { fill: var(--warn); }
.dim { opacity: .12; }
.hilite .box { stroke: var(--focus); stroke-width: 3; }
.edge.sel .line { stroke: var(--focus); }
.sr { position: absolute; left: -9999px; }
</style>
</head>
<body>
<header>
  <h1>${esc(title)}</h1>
  <span class="counts">${model.tables.length} tables · ${counts.used} declared and used · ${counts.unused} declared, unused · ${counts.undeclared} used, undeclared${model.undeclaredTables.length ? ` · ${model.undeclaredTables.length} ghost` : ''}${model.polymorphic.length ? ` · ${model.polymorphic.length} polymorphic` : ''}</span>
  <label class="sr" for="q">Search tables and columns</label>
  <input id="q" type="search" placeholder="Search tables and columns" autocomplete="off">
  <label for="hops" class="sr">Hops around the focused table</label>
  <select id="hops" aria-label="Hops around the focused table"><option value="1">1 hop</option><option value="2">2 hops</option></select>
  <button id="clear" type="button">Show all</button>
  <button id="fit" type="button">Fit</button>
  <button id="theme" type="button" aria-pressed="false">Dark</button>
</header>
<main>
  <div id="stage">${svgFor(model, layout, options.usage)}</div>
  <aside id="panel" aria-live="polite">
    <div class="legend">
      <span><svg width="36" height="10" aria-hidden="true"><line x1="0" y1="5" x2="36" y2="5" stroke="currentColor" stroke-width="2"/></svg> declared and used</span>
      <span><svg width="36" height="10" aria-hidden="true"><line x1="0" y1="5" x2="36" y2="5" stroke="currentColor" stroke-width="2" stroke-dasharray="8 6"/></svg> declared, unused</span>
      <span><svg width="36" height="10" aria-hidden="true"><line x1="0" y1="5" x2="36" y2="5" stroke="currentColor" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/></svg> ! used, undeclared</span>
      <span><svg width="36" height="10" aria-hidden="true"><line x1="0" y1="5" x2="36" y2="5" stroke="currentColor" stroke-width="2" stroke-dasharray="10 4 2 4"/></svg> ◇ polymorphic</span>
      <span>dashed box: queried, not declared</span>
      <span>• not null &nbsp; <u>underlined</u>: primary key</span>
    </div>
    <h2>Findings (${findings.length})</h2>
    <div id="findings">${findings.length === 0 ? '<p>None. The schema declares every relationship the queries rely on.</p>' : findings.map((f) => `<div class="finding ${f.severity}"><strong>${f.severity}</strong> ${esc(f.sentence)}${f.where.length ? `<small>${esc(f.where.slice(0, 5).join(' · '))}${f.where.length > 5 ? ` · +${f.where.length - 5}` : ''}</small>` : ''}</div>`).join('')}</div>
    <h2>Selection</h2>
    <div id="detail"><p>Click a table to focus on it and its neighbours; click an edge to see the evidence. Arrow keys pan, +/− zoom, Tab moves between tables and edges.</p></div>
  </aside>
</main>
<script id="model" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>
(function () {
  'use strict';
  const model = JSON.parse(document.getElementById('model').textContent);
  const svg = document.querySelector('#stage svg');
  const vp = document.getElementById('viewport');
  const detail = document.getElementById('detail');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // --- neighbours ---------------------------------------------------------
  const adj = new Map();
  const link = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); adj.get(a).add(b); };
  for (const e of model.edges) { link(e.from, e.to); link(e.to, e.from); }
  for (const p of model.polymorphic) for (const t of Object.values(p.targets)) { link(p.from, t); link(t, p.from); }
  function within(start, hops) {
    const seen = new Set([start]); let frontier = [start];
    for (let h = 0; h < hops; h++) { const next = []; for (const n of frontier) for (const m of adj.get(n) || []) if (!seen.has(m)) { seen.add(m); next.push(m); } frontier = next; }
    return seen;
  }
  // --- focus and search ---------------------------------------------------
  let focus = null;
  function apply() {
    const hops = Number(document.getElementById('hops').value);
    const q = document.getElementById('q').value.trim().toLowerCase();
    const keep = focus ? within(focus, hops) : null;
    for (const g of svg.querySelectorAll('.table, .rows')) {
      const id = g.dataset.table;
      const hit = !q || id.toLowerCase().includes(q) || (model.tables.find((t) => t.id === id) || { columns: [] }).columns.some((c) => c.name.toLowerCase().includes(q));
      g.classList.toggle('dim', (keep && !keep.has(id)) || !hit);
      g.classList.toggle('hilite', focus === id);
    }
    for (const g of svg.querySelectorAll('.edge')) {
      const on = (!keep || (keep.has(g.dataset.from) && keep.has(g.dataset.to)));
      g.classList.toggle('dim', !on);
    }
    const hash = focus ? '#focus=' + encodeURIComponent(focus) + '&hops=' + hops : '';
    if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash);
  }
  function readHash() {
    const m = /focus=([^&]+)(?:&hops=(\\d))?/.exec(location.hash);
    if (m) { focus = decodeURIComponent(m[1]); if (m[2]) document.getElementById('hops').value = m[2]; showTable(focus); }
    apply();
  }
  function showTable(id) {
    const t = model.tables.find((x) => x.id === id);
    const edges = model.edges.filter((e) => e.from === id || e.to === id);
    const polys = model.polymorphic.filter((p) => p.from === id || Object.values(p.targets).includes(id));
    let h = '<h3>' + esc(id) + (t ? '' : ' <em>(queried, not declared)</em>') + '</h3>';
    if (t) h += '<p>' + t.columns.length + ' columns' + (t.primaryKey.length ? ', key ' + esc(t.primaryKey.join('+')) : ', no primary key') + (t.uniques.length ? ', unique: ' + t.uniques.map((u) => esc(u.join('+'))).join(', ') : '') + '</p>';
    h += '<ul>' + edges.map((e) => '<li><code>' + esc(e.fromCols.join('+')) + ' → ' + esc(e.to === id ? e.from : e.to) + '.' + esc(e.toCols.join('+')) + '</code> — ' + esc(e.state.replace(/_/g, ' ')) + ', ' + e.support + ' place' + (e.support === 1 ? '' : 's') + '</li>').join('')
      + polys.map((p) => '<li><code>' + esc(p.from) + '.' + esc(p.discriminator) + '</code> → ' + Object.entries(p.targets).map(([k, v]) => esc(k) + ': ' + esc(v)).join(', ') + ' (polymorphic)</li>').join('') + '</ul>';
    detail.innerHTML = h;
  }
  function showEdge(id) {
    const e = model.edges.find((x) => x.id === id) || model.polymorphic.find((p) => id.startsWith(p.id + '~'));
    if (!e) return;
    const ev = e.evidence || [];
    let h = '<h3>' + (e.state ? esc(e.state.replace(/_/g, ' ')) : 'polymorphic') + '</h3>';
    if (e.state) h += '<p><code>' + esc(e.from) + '.' + esc(e.fromCols.join('+')) + ' → ' + esc(e.to) + '.' + esc(e.toCols.join('+')) + '</code><br>' + esc(e.cardinality.replace(/_/g, ' ')) + ', ' + e.support + ' place' + (e.support === 1 ? '' : 's') + '</p>';
    h += '<h4>Evidence (' + ev.length + ')</h4><ul>' + ev.map((v) => '<li><small>' + esc(v.kind) + ' · ' + esc(v.source) + (v.line != null ? ':' + v.line : '') + '</small><br><code>' + esc(v.text) + '</code></li>').join('') + '</ul>';
    detail.innerHTML = h;
    for (const g of svg.querySelectorAll('.edge')) g.classList.toggle('sel', g.dataset.edge === id);
  }
  svg.addEventListener('click', (ev) => {
    const t = ev.target.closest('.table, .rows'); const e = ev.target.closest('.edge');
    if (t) { focus = focus === t.dataset.table ? null : t.dataset.table; if (focus) showTable(focus); apply(); }
    else if (e) showEdge(e.dataset.edge);
  });
  svg.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.target.click(); } });
  document.getElementById('q').addEventListener('input', apply);
  document.getElementById('hops').addEventListener('change', apply);
  document.getElementById('clear').addEventListener('click', () => { focus = null; document.getElementById('q').value = ''; apply(); detail.innerHTML = '<p>Showing everything.</p>'; });
  window.addEventListener('hashchange', readHash);
  // --- pan and zoom -------------------------------------------------------
  const vb = svg.viewBox.baseVal; const full = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
  let view = { ...full };
  function setView() { svg.setAttribute('viewBox', view.x + ' ' + view.y + ' ' + view.w + ' ' + view.h); }
  function zoom(f, cx, cy) { const nx = view.x + (cx - view.x) * (1 - f); const ny = view.y + (cy - view.y) * (1 - f); view = { x: nx, y: ny, w: view.w * f, h: view.h * f }; setView(); }
  function pt(ev) { const r = svg.getBoundingClientRect(); return { x: view.x + (ev.clientX - r.left) / r.width * view.w, y: view.y + (ev.clientY - r.top) / r.height * view.h }; }
  svg.addEventListener('wheel', (ev) => { ev.preventDefault(); const p = pt(ev); zoom(ev.deltaY > 0 ? 1.1 : 0.9, p.x, p.y); }, { passive: false });
  let drag = null;
  svg.addEventListener('pointerdown', (ev) => { drag = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y }; svg.setPointerCapture(ev.pointerId); });
  svg.addEventListener('pointermove', (ev) => { if (!drag) return; const r = svg.getBoundingClientRect(); view.x = drag.vx - (ev.clientX - drag.x) / r.width * view.w; view.y = drag.vy - (ev.clientY - drag.y) / r.height * view.h; setView(); });
  svg.addEventListener('pointerup', () => { drag = null; });
  document.getElementById('fit').addEventListener('click', () => { view = { ...full }; setView(); });
  document.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
    const step = view.w * 0.05;
    if (ev.key === 'ArrowLeft') { view.x -= step; setView(); } else if (ev.key === 'ArrowRight') { view.x += step; setView(); }
    else if (ev.key === 'ArrowUp') { view.y -= step; setView(); } else if (ev.key === 'ArrowDown') { view.y += step; setView(); }
    else if (ev.key === '+' || ev.key === '=') zoom(0.9, view.x + view.w / 2, view.y + view.h / 2); else if (ev.key === '-') zoom(1.1, view.x + view.w / 2, view.y + view.h / 2);
    else if (ev.key === 'Escape') document.getElementById('clear').click();
  });
  // --- theme --------------------------------------------------------------
  const themeBtn = document.getElementById('theme');
  function setTheme(t) { document.documentElement.dataset.theme = t; themeBtn.setAttribute('aria-pressed', String(t === 'dark')); themeBtn.textContent = t === 'dark' ? 'Light' : 'Dark'; try { localStorage.setItem('ledgerline-theme', t); } catch (_) {} }
  themeBtn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  try { const saved = localStorage.getItem('ledgerline-theme'); if (saved) setTheme(saved); } catch (_) {}
  readHash();
})();
</script>
</body>
</html>
`;
}
