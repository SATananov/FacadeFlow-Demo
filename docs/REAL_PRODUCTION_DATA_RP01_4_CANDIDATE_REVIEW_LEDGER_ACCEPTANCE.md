# REAL PRODUCTION DATA — RP01.4 Human Candidate Review Ledger / Invalidation Foundation

## Purpose

RP01.4 adds an append-only human review ledger for RP01.3 candidate production patterns.

A human decision now carries provenance tied to the exact candidate evidence state that was
reviewed. If that evidence changes later, the old decision remains in history but is no
longer treated as a current candidate review.

## Ledger entry

Each review entry records:

- candidate ID;
- profile code;
- candidate kind;
- source project;
- human decision;
- reviewer;
- review timestamp;
- review note;
- evidence fingerprint version;
- exact evidence fingerprint;
- evidence count at review;
- source pattern key at review;
- operation name at review when applicable.

## Evidence fingerprint

`RP01.4-EVIDENCE-V1` is a deterministic evidence identity, not a cryptographic source-file hash.

It includes the candidate identity and the source-backed candidate fields that matter to this
review layer, including:

- candidate ID;
- candidate status/kind;
- profile code;
- source project;
- source pattern key;
- evidence count;
- repeated-observation multiplicity;
- operation name;
- single-project / cross-project evidence state.

Human review metadata is intentionally excluded from the evidence fingerprint.

## Invalidation

A ledger entry is:

- `CURRENT` when the current candidate still has the exact reviewed evidence fingerprint;
- `STALE_REQUIRES_REVIEW` when the candidate is missing or its evidence fingerprint changed.

Stale entries are never deleted. They remain audit history.

A new human review may be recorded for a changed evidence fingerprint while the old entry stays
stale in the ledger.

A second review of the exact same current evidence fingerprint is blocked by this foundation.

## Safety boundary

Human review in RP01.4 still means candidate review only.

It does not:

- create a production rule;
- infer a universal machining rule;
- infer a universal cut rule;
- infer profile role or system identity;
- enable automatic geometry;
- create machine output;
- mark anything machine-ready;
- approve production.

Required locks remain:

- `automaticRulePromotionAllowed = false`
- `productionRuleCreated = false`
- `machineReady = false`
- `productionApproved = false`

## Acceptance

PASS requires:

- RP01.4 focused real-sample tests;
- RP01.3 regression;
- RP01.2 regression;
- RP01.1 regression;
- Nadezhda evidence regression and audit;
- WP78 project-system bridge regression;
- WP78 evidence-aware gate regression;
- lint;
- production build.
