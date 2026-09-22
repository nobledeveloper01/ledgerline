/**
 * What the application does: relationship claims, each with its evidence.
 *
 * A claim is one observation — this query joins these columns to those — and
 * it is never a fact on its own. Claims are collected by adapters (a SQL log,
 * an ORM model file, a constraint in the DDL) and the reconcile rules decide
 * what they add up to. The rule that matters is that **a claim without
 * evidence is not a claim**: every one carries where it was seen, so every
 * edge on the diagram can be clicked through to a line.
 */

import type { ColumnRef, TableRef } from './schema.ts';

export type EvidenceKind =
  /** A `FOREIGN KEY` constraint in the DDL. */
  | 'constraint'
  /** A join, a cross-table `WHERE`, or a subquery in SQL the application ran or contains. */
  | 'query'
  /** A relation declared in an ORM model file. */
  | 'orm';

export interface Evidence {
  readonly kind: EvidenceKind;
  /** A file path, a log name, a constraint name — whatever a person would open. */
  readonly source: string;
  readonly line?: number;
  /** The text itself, trimmed: the join clause, the constraint, the relation line. */
  readonly text: string;
}

/**
 * A relationship between two sets of columns, as one piece of evidence saw it.
 *
 * Direction is *from the referencing side to the referenced side* when the
 * evidence knows (a constraint always does; a join does not), and adapters
 * that cannot tell set `directed: false`; the reconcile rules orient it from
 * uniqueness if they can.
 */
export interface RelationshipClaim {
  readonly from: readonly ColumnRef[];
  readonly to: readonly ColumnRef[];
  readonly directed: boolean;
  readonly evidence: Evidence;
}

/**
 * A polymorphic association: one column pair that points at different tables
 * depending on a discriminator — `owner_type = 'Post' AND owner_id = posts.id`.
 * Drawn as one thing with its targets named, never flattened into ordinary
 * edges, because the flattening is exactly the lie an ERD tells about a
 * Rails or Laravel schema.
 */
export interface PolymorphicClaim {
  readonly from: readonly ColumnRef[];
  readonly discriminator: ColumnRef;
  /** Discriminator value → the table it means. */
  readonly targets: Readonly<Record<string, TableRef>>;
  readonly evidence: Evidence;
}

export interface Claims {
  readonly relationships: readonly RelationshipClaim[];
  readonly polymorphic: readonly PolymorphicClaim[];
}

export const NO_CLAIMS: Claims = { relationships: [], polymorphic: [] };

/** Every claim is required to carry evidence with text; adapters that forget are caught here, not on a diagram. */
/**
 * Internal, deliberately: `reconcile` is the only thing that should ever ask.
 * A source reader that had to validate its own claims before handing them
 * over would be a second place the rule lives.
 */
export function validClaim(c: RelationshipClaim | PolymorphicClaim): boolean {
  return c.evidence.text.trim().length > 0 && c.evidence.source.trim().length > 0 && c.from.length > 0;
}
