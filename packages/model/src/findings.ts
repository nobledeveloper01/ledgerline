/**
 * What the check says, and how loudly.
 *
 * A finding is one sentence a reviewer can act on, with the evidence beneath
 * it. Severity is a policy the caller passes, with defaults chosen for a pull
 * request: a relationship the code relies on that the schema does not declare
 * *fails*; a declared constraint nothing uses *warns*; a table nothing touches
 * *informs*. The sentences are written here, once, so the CLI, the pull-request
 * comment and the HTML report say the same thing.
 */

import type { ModelDiff } from './diff.ts';
import { tablesOf, type Edge, type Model } from './reconcile.ts';
import { tableKey } from './schema.ts';

export type Severity = 'fail' | 'warn' | 'info' | 'ignore';

export interface Policy {
  readonly usedUndeclared: Severity;
  readonly declaredUnused: Severity;
  readonly undeclaredTable: Severity;
  readonly edgeRemoved: Severity;
  readonly tableRemoved: Severity;
}

export const PULL_REQUEST_POLICY: Policy = {
  usedUndeclared: 'fail',
  declaredUnused: 'warn',
  undeclaredTable: 'fail',
  edgeRemoved: 'warn',
  tableRemoved: 'warn',
};

export interface Finding {
  readonly severity: Exclude<Severity, 'ignore'>;
  readonly code: 'used_undeclared' | 'declared_unused' | 'undeclared_table' | 'edge_removed' | 'table_removed';
  readonly sentence: string;
  /** Where to look: the evidence sources, in order. */
  readonly where: readonly string[];
}

function cols(e: Edge, side: 'from' | 'to'): string {
  const c = e[side];
  const t = c[0] ? tableKey(c[0]) : '?';
  return `${t}.${c.map((x) => x.column).join('+')}`;
}

function where(e: Edge): string[] {
  return e.evidence.map((v) => (v.line !== undefined ? `${v.source}:${v.line}` : v.source));
}

/** Findings about the model as it stands — the drift the schema has right now. */
export function findings(model: Model, policy: Policy = PULL_REQUEST_POLICY): Finding[] {
  const out: Finding[] = [];
  for (const e of model.edges) {
    if (e.state === 'used_undeclared' && policy.usedUndeclared !== 'ignore') {
      const query = e.evidence.find((v) => v.kind === 'query') ?? e.evidence[0];
      const at = query && query.line !== undefined ? `${query.source}:${query.line}` : (query?.source ?? 'a query');
      out.push({
        severity: policy.usedUndeclared,
        code: 'used_undeclared',
        sentence: `The join in ${at} relies on ${cols(e, 'from')} → ${cols(e, 'to')}, which no constraint declares.`,
        where: where(e),
      });
    }
    if (e.state === 'declared_unused' && policy.declaredUnused !== 'ignore') {
      out.push({
        severity: policy.declaredUnused,
        code: 'declared_unused',
        sentence: `${cols(e, 'from')} → ${cols(e, 'to')} is declared by ${e.evidence[0]?.source ?? 'a constraint'} and used by no query that was read.`,
        where: where(e),
      });
    }
  }
  if (policy.undeclaredTable !== 'ignore') {
    for (const t of model.undeclaredTables) {
      const touching = model.edges.filter((e) => [...e.from, ...e.to].some((c) => tableKey(c) === tableKey(t)));
      out.push({
        severity: policy.undeclaredTable,
        code: 'undeclared_table',
        sentence: `${tableKey(t)} is queried (${tablesOf(touching.flatMap((e) => [...e.from, ...e.to]).filter((c) => tableKey(c) !== tableKey(t)))}) and no schema declares it.`,
        where: touching.flatMap(where),
      });
    }
  }
  return out;
}

/** Findings about a change — what a pull request did to the model. */
export function changeFindings(d: ModelDiff, policy: Policy = PULL_REQUEST_POLICY): Finding[] {
  const out: Finding[] = [];
  if (policy.edgeRemoved !== 'ignore') {
    for (const e of d.edgesRemoved) {
      out.push({
        severity: policy.edgeRemoved,
        code: 'edge_removed',
        sentence: `${cols(e, 'from')} → ${cols(e, 'to')} was ${e.state.replaceAll('_', ' ')} and is gone.`,
        where: where(e),
      });
    }
  }
  if (policy.tableRemoved !== 'ignore') {
    for (const t of d.tablesRemoved) {
      out.push({ severity: policy.tableRemoved, code: 'table_removed', sentence: `${tableKey(t)} was removed.`, where: [] });
    }
  }
  return out;
}

/** Whether a set of findings should fail a build. */
export function fails(list: readonly Finding[]): boolean {
  return list.some((f) => f.severity === 'fail');
}
