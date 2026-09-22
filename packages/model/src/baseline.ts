/**
 * A baseline, not a big bang (ADR-0003 #12).
 *
 * A codebase with forty undeclared joins cannot adopt a gate that fails on
 * all forty; it either turns the gate off or never turns it on. The baseline
 * records today's findings by identity — the code and the sentence, not the
 * line, so moving a query does not resurrect a finding — and the check fails
 * only on what is not in it. Paying the debt down is then one pull request at
 * a time, and a finding that was fixed and comes back **does** fail, because
 * it left the baseline when it left the code.
 */

import type { Finding } from './findings.ts';

export const BASELINE_VERSION = 1;

export interface Baseline {
  readonly version: number;
  /** Sorted, so the file is a readable diff. */
  readonly accepted: readonly string[];
  /** When it was taken; information for a reviewer, never read by the rules. */
  readonly takenAt?: string;
}

/**
 * What identifies a finding across runs.
 *
 * The code and the sentence with the parts that move stripped out: line
 * numbers, because the same join moving from line 14 to line 19 is the same
 * debt; and the support count, because a join called from a second place is
 * still the one join — an earlier version kept `(and 1 more)` in the key and
 * a baseline stopped recognising its own debt the moment a query was copied.
 * A *different* join in the same file is different debt, and keeps its own key.
 */
export function findingKey(f: Finding): string {
  return `${f.code} ${f.sentence.replace(/:\d+/g, ':').replace(/ \(and \d+ more\)/, '')}`;
}

export function makeBaseline(findings: readonly Finding[], takenAt?: string): Baseline {
  const accepted = [...new Set(findings.map(findingKey))].sort();
  return takenAt === undefined ? { version: BASELINE_VERSION, accepted } : { version: BASELINE_VERSION, accepted, takenAt };
}

export interface AgainstBaseline {
  /** Findings not in the baseline: these fail. */
  readonly fresh: readonly Finding[];
  /** Findings the baseline accepted, and that are still here. */
  readonly accepted: readonly Finding[];
  /** Baseline entries nothing produced any more — debt paid down, and the baseline should shrink. */
  readonly fixed: readonly string[];
}

export function againstBaseline(findings: readonly Finding[], baseline: Baseline): AgainstBaseline {
  const accepted = new Set(baseline.accepted);
  const seen = new Set(findings.map(findingKey));
  return {
    fresh: findings.filter((f) => !accepted.has(findingKey(f))),
    accepted: findings.filter((f) => accepted.has(findingKey(f))),
    fixed: baseline.accepted.filter((k) => !seen.has(k)),
  };
}
