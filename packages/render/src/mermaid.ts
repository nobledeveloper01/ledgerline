/**
 * Mermaid `erDiagram`, for the README.
 *
 * The declared subset only: Mermaid has one kind of line and cannot draw the
 * three states, so it gets what a constraint declares — used or not — with
 * the cardinality Mermaid can express. Inferred edges are deliberately left
 * out of a picture that cannot say they are inferred; they live in the HTML
 * and the findings. The badge line beside it says how many were left out.
 */

import { tableKey, type Model } from '@ledgerline/model';

function ident(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, '_');
}

function typeWord(t: string): string {
  return t.replace(/\(.*\)/, '').replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '') || 'x';
}

export function mermaidFor(model: Model): string {
  const lines: string[] = ['erDiagram'];
  for (const t of model.tables) {
    lines.push(`  ${ident(tableKey(t))} {`);
    for (const c of t.columns) {
      const marks = [t.primaryKey.includes(c.name) ? 'PK' : '', t.uniques.some((u) => u.length === 1 && u[0] === c.name) ? 'UK' : ''].filter(Boolean).join(',');
      lines.push(`    ${typeWord(c.type)} ${ident(c.name)}${marks ? ` ${marks}` : ''}`);
    }
    lines.push('  }');
  }
  for (const e of model.edges) {
    if (e.state === 'used_undeclared') continue;
    const a = e.from[0];
    const b = e.to[0];
    if (!a || !b) continue;
    // Referencing side (many) on the left, referenced side (one) on the right, as Mermaid reads it.
    const left = e.cardinality === 'one_to_one' ? '||' : '}o';
    const right = '||';
    const dashed = e.state === 'declared_unused' ? '..' : '--';
    lines.push(`  ${ident(tableKey(a))} ${left}${dashed}${right} ${ident(tableKey(b))} : "${e.from.map((c) => c.column).join('+')}"`);
  }
  return lines.join('\n') + '\n';
}

/** The one line beside the badge (ADR-0003 #15): a number that comes from the check, not from anyone's say-so. */
export function badgeLine(model: Model): string {
  const undeclared = model.edges.filter((e) => e.state === 'used_undeclared').length + model.undeclaredTables.length;
  return undeclared === 0 ? '0 undeclared joins' : `${undeclared} undeclared join${undeclared === 1 ? '' : 's'}`;
}
