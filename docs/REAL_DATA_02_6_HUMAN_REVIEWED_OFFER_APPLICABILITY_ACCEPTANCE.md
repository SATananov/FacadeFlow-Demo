# REAL DATA 02.6 — Human-reviewed Offer Applicability

## Status

Acceptance target: **EXPLICIT HUMAN APPLICABILITY FOUNDATION**

REAL DATA 02.6 consumes the geometry/offer separation produced by REAL DATA 02.5 and adds an explicit, auditable human-review record for deciding whether an offer variant applies to shared project geometry.

## Why this phase exists

REAL DATA 02.5 correctly separates common project geometry from offer alternatives. It intentionally leaves every shared-geometry offer variant at `REQUIRES_HUMAN_CONFIRMATION`.

REAL DATA 02.6 closes that review gap without copying geometry, mutating the source draft, selecting a winning offer, or inferring applicability.

## Human applicability decisions

A decision contains:

- stable decision id;
- target offer variant id;
- decision value: `APPLIES` or `DOES_NOT_APPLY`;
- scope: `SHARED_PROJECT_GEOMETRY` or `MODULE_SUBSET`;
- explicit module ids for subset decisions only;
- reviewer id;
- review timestamp;
- free review note.

The review function accepts only explicit decisions supplied by a human workflow. It has no automatic decision path.

## Review states

Per offer variant, the read model exposes:

- `NOT_APPLICABLE`
- `NOT_REVIEWED`
- `PARTIALLY_REVIEWED`
- `CONFIRMED_APPLIES`
- `CONFIRMED_DOES_NOT_APPLY`
- `CONFIRMED_MIXED_SCOPE`
- `CONFLICT_REVIEW_REQUIRED`

A mixed scope is valid only when every shared module has an explicit human decision and some modules are accepted while others are rejected.

## Conflict behavior

Conflicting human decisions are never resolved with last-write-wins.

If the same module receives both `APPLIES` and `DOES_NOT_APPLY` for the same variant:

- the module is listed in `conflictingModuleIds`;
- the variant enters `CONFLICT_REVIEW_REQUIRED`;
- downstream reviewed use remains blocked.

## Validation

REAL DATA 02.6 rejects:

- unknown offer variant ids;
- decisions on variants not marked by REAL DATA 02.5 as requiring shared-geometry confirmation;
- missing reviewer identity;
- invalid review timestamps;
- duplicate decision ids;
- empty module-subset decisions;
- duplicate module ids in one subset decision;
- module ids outside the shared project geometry;
- module ids attached to whole-shared-geometry decisions.

Invalid decisions are not silently applied.

## Downstream reviewed-use gate

`readyForDownstreamHumanReviewedUse` becomes true only when:

- there are no validation errors;
- at least one offer variant requires human review;
- every review-required variant is fully reviewed;
- no variant remains partial, unreviewed, or conflicting.

This gate means only that the applicability relationship is human-reviewed. It is **not** a production approval and does not select a commercial winner.

## Safety invariants

REAL DATA 02.6 MUST preserve:

- explicit human decision required;
- no automatic applicability inference;
- no automatic offer selection;
- no module duplication;
- no module merging;
- no mutation of the source draft;
- no automatic reuse;
- no lifecycle ProjectRecord creation;
- no opening/sash/divider/profile inference;
- production remains locked;
- `machineReady === false`;
- `productionApproved === false`.

## Module identity

Same-size module positions remain distinct. Applicability is recorded against stable module ids, never against a geometry signature such as width × height.

## Auditability

Accepted decisions retain reviewer id, review timestamp, note, target variant, target scope, and decision id. Review metadata is not synthesized from source evidence.

## Privacy boundary

No private customer/project document is tracked by this phase.

The phase tests use only synthetic structural examples. Original client identities, scans, offers and commercial data remain outside Git and outside shareable checkpoints.

## Acceptance checks

REAL DATA 02.6 passes when:

- shared applicability begins unreviewed;
- whole-geometry APPLIES and DOES_NOT_APPLY decisions work explicitly;
- module-subset review remains partial until all modules are reviewed;
- fully reviewed mixed scope is represented explicitly;
- conflicting decisions remain unresolved;
- invalid variant/module/reviewer/timestamp decisions are rejected;
- no offer winner is selected automatically;
- all review-required variants must be complete before downstream reviewed use;
- source draft remains byte-equivalent before/after review invocation;
- same-size positions remain distinct;
- production and lifecycle boundaries remain locked;
- private client/project identifiers are absent from tracked phase files;
- focused tests pass;
- full FacadeFlow verification passes.

## Out of scope

REAL DATA 02.6 does NOT:

- provide UI controls yet;
- select the commercially preferred offer variant;
- mutate `NadezhdaProjectPatternDraft`;
- promote a source draft into the Projects workspace;
- resolve pricing known gaps;
- infer construction geometry or production profiles;
- create machine output;
- approve production.

## Next safe layer

A later layer can expose this human-review contract in a read-only/project-draft review UI or use a fully reviewed applicability result as an input to a separate explicit offer-selection workflow. That future layer must preserve the distinction between **applicable alternative** and **selected commercial choice**.
