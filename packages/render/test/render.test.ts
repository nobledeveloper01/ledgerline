import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { findings, type Model } from '@ledgerline/model';

import { PALETTE, badgeLine, layoutModel, mermaidFor, renderHtml } from '../src/index.ts';

const fixture = (name: string): Model => (JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', '..', 'fixtures', name, 'expected.json'), 'utf8')) as { model: Model }).model;

/** WCAG relative luminance and contrast ratio, for the palette test. */
function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
const contrast = (a: string, b: string): number => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
};

test('the 200-table corpus lays out and renders in under two seconds, as one file with no network', async () => {
  const model = fixture('large-200');
  const t0 = performance.now();
  const html = await renderHtml(model, { title: 'large', findings: findings(model) });
  const took = performance.now() - t0;
  assert.ok(took < 2000, `${took.toFixed(0)} ms`);
  assert.ok(html.length > 100_000);
  assert.equal((html.match(/class="table/g) ?? []).length, 200);
  assert.ok(!/(src|href)="https?:/.test(html), 'nothing is fetched');
  assert.ok(!/@import|url\((?!#)/.test(html), 'no font, no image');
});

test('the three states are told apart without colour: solid, dashed, dotted with a mark; polymorphic dash-dot with a diamond; ghosts dashed', async () => {
  const model = fixture('shop-with-queries');
  const html = await renderHtml(model);
  const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
  assert.match(css, /\.edge\.declared_unused \.line \{ stroke-dasharray: 8 6/);
  assert.match(css, /\.edge\.used_undeclared \.line \{ stroke-dasharray: 2 5/);
  assert.match(css, /\.edge\.polymorphic \.line \{ stroke-dasharray: 10 4 2 4/);
  assert.match(css, /\.ghost \.box \{ stroke-dasharray/);
  assert.ok(html.includes('class="edge used_undeclared"'));
  assert.ok(html.includes('<g class="mark"'), 'the warning mark on the undeclared edge');
  assert.ok(html.includes('class="mark poly"'), 'the diamond on the polymorphic edge');
  assert.ok(html.includes('class="table ghost" data-table="public.audit_log"'));
  // Cardinality only from uniqueness: the undeclared join points at users.id (a key) and gets the foot; the polymorphic edges get none.
  const undeclared = html.slice(html.indexOf('class="edge used_undeclared"'));
  assert.ok(undeclared.slice(0, 600).includes('marker-start="url(#crow)"'));
});

test('every table and edge is keyboard-reachable with a label, and the focus is a URL a person can send', async () => {
  const html = await renderHtml(fixture('shop-with-queries'));
  assert.equal((html.match(/class="table[^"]*" data-table="[^"]+" tabindex="0" role="button" aria-label="/g) ?? []).length, 8);
  assert.ok((html.match(/class="edge [a-z_]+" data-edge="[^"]+" data-from="[^"]+" data-to="[^"]+" tabindex="0" role="button" aria-label="/g) ?? []).length >= 4);
  assert.ok(html.includes("'#focus=' + encodeURIComponent(focus) + '&hops=' + hops"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('role="img" aria-label="Entity relationship diagram'));
});

test('both palettes clear 4.5:1 for text on every surface they are placed on', () => {
  for (const [name, p] of Object.entries(PALETTE)) {
    for (const surface of [p.bg, p.panel, p.head] as const) {
      for (const [label, ink] of [['ink', p.ink], ['muted', p.muted], ['warn', p.warn], ['ghost', p.ghost], ['focus', p.focus]] as const) {
        assert.ok(contrast(ink, surface) >= 4.5, `${name}: ${label} ${ink} on ${surface} is ${contrast(ink, surface).toFixed(2)}`);
      }
    }
  }
});

test('the evidence panel gets the model, and the model in the page carries no literal from a query', async () => {
  const html = await renderHtml(fixture('shop-with-queries'));
  const json = html.slice(html.indexOf('<script id="model"'), html.indexOf('</script>'));
  assert.ok(json.includes('"evidence"'));
  assert.ok(json.includes('reports.sql'));
  assert.ok(!json.includes('2026-01-01'), 'the date literal was masked before it reached the evidence');
  assert.ok(!json.includes('ada@example.com'));
  assert.ok(!json.includes('</script'), 'a closing tag inside the JSON would end the script element');
});

test('Mermaid gets the declared subset, with the badge line counting what it left out', () => {
  const model = fixture('shop-with-queries');
  const m = mermaidFor(model);
  assert.ok(m.startsWith('erDiagram\n'));
  assert.ok(m.includes('public_invoices }o--|| public_orders : "order_id"'), 'declared and used: solid');
  assert.ok(m.includes('public_refunds }o..|| public_invoices : "invoice_id"'), 'declared, unused: dashed');
  assert.ok(!/public_orders \S+ public_users/.test(m), 'the inferred join to users is not drawn where it cannot be labelled inferred');
  assert.ok(m.includes('integer id PK'));
  assert.equal(badgeLine(model), '3 undeclared joins');
  assert.equal(badgeLine(fixture('constraint-and-ghost')), '2 undeclared joins');
});

test('layout is deterministic: the same model twice gives the same positions', async () => {
  const model = fixture('two-tables-one-join');
  const a = await layoutModel(model);
  const b = await layoutModel(model);
  assert.deepEqual(a, b);
  assert.equal(a.tables.length, 2);
  assert.equal(a.edges.length, 1);
  assert.ok(a.edges[0]!.points.length >= 2);
});
