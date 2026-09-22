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
import { findTable, tableKey, type DeclaredSchema, type Table } from './schema.ts';

export type Severity = 'fail' | 'warn' | 'info' | 'ignore';

export interface Policy {
  readonly usedUndeclared: Severity;
  readonly declaredUnused: Severity;
  readonly undeclaredTable: Severity;
  readonly edgeRemoved: Severity;
  readonly tableRemoved: Severity;
  /** A used-and-undeclared edge whose referencing column is nullable: rows may point at nothing (ADR-0003 #5). */
  readonly orphanSide: Severity;
  /** A `<x>_id` column with no relationship, or a relationship whose column name says another table (ADR-0003 #8). */
  readonly namingDrift: Severity;
}

export const PULL_REQUEST_POLICY: Policy = {
  usedUndeclared: 'fail',
  declaredUnused: 'warn',
  undeclaredTable: 'fail',
  edgeRemoved: 'warn',
  tableRemoved: 'warn',
  orphanSide: 'warn',
  namingDrift: 'info',
};

export interface Finding {
  readonly severity: Exclude<Severity, 'ignore'>;
  readonly code: 'used_undeclared' | 'declared_unused' | 'undeclared_table' | 'edge_removed' | 'table_removed' | 'orphan_side' | 'name_without_join' | 'name_disagrees';
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

/** `user_id` → the tables it could name: `user`, `users`, `useres`; `company_id` → `company`, `companies`. */
function tablesNamedBy(column: string): string[] {
  const m = /^(.+)_id$/.exec(column);
  if (!m) return [];
  const stem = m[1]!;
  const out = [stem, `${stem}s`, `${stem}es`];
  if (stem.endsWith('y')) out.push(`${stem.slice(0, -1)}ies`);
  return out;
}

/** Findings about the model as it stands — the drift the schema has right now. */
/**
 * What the queries that were read actually touched, by table key.
 *
 * Given, `declared_unused` is only claimed about a table some query named.
 * The rule this encodes came out of running the check on Mastodon: a Rails
 * application speaks to its database through ActiveRecord, so 84 SQL
 * statements were found across 613 files, and the tool warned about 148
 * relationships being *used by no query that was read* — each of them true,
 * and all of them worthless, because no query touching those tables was read
 * either. Absence of a query is not evidence of an unused relationship when
 * the sample is empty. Where the sample is empty the tool must say nothing.
 */
export type Sampled = ReadonlySet<string>;

export function findings(model: Model, policy: Policy = PULL_REQUEST_POLICY, sampled: Sampled | null = null): Finding[] {
  const out: Finding[] = [];
  /**
   * Whether a query that was read touched the table that *carries* the key.
   *
   * The referencing side only. A join over `account_aliases.account_id` would
   * appear in a query that reads `account_aliases`; that `accounts` is read
   * everywhere else in the application says nothing about whether this
   * particular relationship is used, and counting it would let one popular
   * table vouch for every table that points at it.
   */
  const inSample = (e: Edge): boolean => sampled === null || e.from.some((c) => sampled.has(tableKey(c)));
  const schema: DeclaredSchema = { tables: model.tables, foreignKeys: [] };
  for (const e of model.edges) {
    if (e.state === 'used_undeclared' && policy.usedUndeclared !== 'ignore') {
      const query = e.evidence.find((v) => v.kind === 'query') ?? e.evidence[0];
      const at = query && query.line !== undefined ? `${query.source}:${query.line}` : (query?.source ?? 'a query');
      const more = e.support > 1 ? ` (and ${e.support - 1} more)` : '';
      out.push({
        severity: policy.usedUndeclared,
        code: 'used_undeclared',
        sentence: `The join in ${at}${more} relies on ${cols(e, 'from')} → ${cols(e, 'to')}, which no constraint declares.`,
        where: where(e),
      });
      // The orphan side: the referencing column can be null and nothing checks what it points at.
      const fromTable = e.from[0] ? findTable(schema, e.from[0]) : null;
      const nullable = e.directed && fromTable !== null && e.from.every((c) => fromTable.columns.find((x) => x.name === c.column)?.nullable === true);
      if (nullable && policy.orphanSide !== 'ignore') {
        out.push({
          severity: policy.orphanSide,
          code: 'orphan_side',
          sentence: `Rows in ${tableKey(e.from[0]!)} may reference no ${tableKey(e.to[0]!)}: ${e.from.map((c) => c.column).join('+')} is nullable and no constraint checks it.`,
          where: where(e),
        });
      }
    }
    if (e.state === 'declared_unused' && policy.declaredUnused !== 'ignore' && inSample(e)) {
      out.push({
        severity: policy.declaredUnused,
        code: 'declared_unused',
        sentence: `${cols(e, 'from')} → ${cols(e, 'to')} is declared by ${e.evidence[0]?.source ?? 'a constraint'} and used by no query that was read.`,
        where: where(e),
      });
    }
  }
  if (policy.namingDrift !== 'ignore') {
    const tableNames = new Set(model.tables.map((t) => t.name));
    const related = (t: Table, column: string): Edge[] => model.edges.filter((e) => [...e.from, ...e.to].some((c) => c.name === t.name && c.schema === t.schema && c.column === column));
    for (const t of model.tables) {
      for (const c of t.columns) {
        const named = tablesNamedBy(c.name).filter((n) => tableNames.has(n));
        if (named.length === 0) continue;
        const edges = related(t, c.name);
        if (edges.length === 0) {
          out.push({
            severity: policy.namingDrift,
            code: 'name_without_join',
            sentence: `${tableKey(t)}.${c.name} is named like a reference to ${named[0]!} and no constraint or query relates them.`,
            where: [],
          });
          continue;
        }
        const others = edges.flatMap((e) => [...e.from, ...e.to]).filter((x) => !(x.name === t.name && x.schema === t.schema)).map((x) => x.name);
        const disagree = others.filter((n) => !named.includes(n));
        if (disagree.length > 0 && !others.some((n) => named.includes(n))) {
          out.push({
            severity: policy.namingDrift,
            code: 'name_disagrees',
            sentence: `${tableKey(t)}.${c.name} is named like a reference to ${named[0]!} but relates to ${[...new Set(disagree)].join(', ')}.`,
            where: edges.flatMap(where),
          });
        }
      }
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
