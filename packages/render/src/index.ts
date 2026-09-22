/**
 * `@ledgerline/render`: the model → one static HTML file, and Mermaid. An
 * adapter; every rule stays in `@ledgerline/model`.
 */
export { layoutModel, type Layout, type PlacedTable, type PlacedEdge } from './layout.ts';
export { renderHtml, htmlFor, svgFor, PALETTE, type RenderOptions } from './html.ts';
export { mermaidFor, badgeLine } from './mermaid.ts';
