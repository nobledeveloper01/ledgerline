# ADR-0007 — A join through a shared parent is not a missing relationship

**Status.** Accepted, 2026-09-23. Phase 5, from the Phase 4 gate run.

## Context

Ory Kratos is multi-tenant. Every table carries an `nid` — a network id —
with a declared foreign key to `networks.id`, and every query joins on it:

```sql
SELECT …
FROM identities
INNER JOIN identity_credentials
    ON  identities.id = identity_credentials.identity_id
    AND identities.nid = identity_credentials.nid
```

The second condition made `ledgerline check` fail the build:

> fail: The join in `persistence/sql/identity/persister_identity.go:347`
> relies on `identities.nid → identity_credentials.nid`, which no constraint
> declares.

Every word of that is true. No constraint relates those two columns, and none
should: they are not related to each other, they are both related to
`networks`. The join is the tenant scoping that a multi-tenant application
puts in every query it has.

This is the worst kind of false positive. It is not rare, it is not subtle,
and it fires on *every query in the repository* — which is exactly the
experience that makes a team turn a gate off and never turn it back on.

## Decision

**When both ends of an inferred edge already have a declared foreign key to
the same table, the finding is `shared_parent`, and it never fails.**

The sentence says what it is rather than what it is not:

> `public.identities.nid` and `public.identity_credentials.nid` are joined,
> and both already reference `public.networks`. That is a correlation through
> a shared parent, not a missing relationship.

Its severity is `info` by default and is a policy field like every other, so
a team that wants these silent can say so and a team that wants them loud can
too.

The rule uses only what the constraints already say. It invents nothing, it
guesses nothing from column names, and it does not need to know what a tenant
is. Two columns pointing at one table is a fact in the schema; the tool reads
it and stops.

## Consequences

The edge is still on the diagram, still traceable to its line, still carries
its evidence. What changes is the sentence and the severity, which is the
whole of the difference between *your build is broken* and *here is something
about your schema*.

On Kratos this turned the run from one failing finding to zero, and the one
finding into a sentence that is worth reading. Its schema is well
constrained; the tool was wrong and now says so.

The rule is deliberately narrow: single-column edges only, and only when both
sides have a declared target in common. A composite join or a column with no
declared target is left alone, because the evidence for the conclusion is not
there.

## Alternatives rejected

- **Ignore columns named `nid`, `tenant_id`, `org_id`.** A list of names to
  guess at, which is the thing this product refuses to be. It would also be
  wrong on the first schema whose tenant column is called something else.
- **Silence any join where both sides are non-unique.** Far too broad: most
  true undeclared relationships join a non-unique column to a primary key,
  and plenty join two non-unique columns.
- **Leave it as a failure and let people use the baseline.** The baseline is
  for real debt somebody has decided to pay down later. Filling it with
  findings the tool should never have made is teaching people that the
  findings are noise.
