# PROFILE DATA 03.7 — Canonical Profile Assembly Evidence Human Review

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**
Base checkpoint: **a31ffd2**

## Purpose

PROFILE DATA 03.7 adds an explicit human-review decision layer over the assembly-evidence ledger created by PROFILE DATA 03.6.

The reviewer may confirm that the **current evidence classification has been reviewed**, request more evidence, or reject the current evidence as insufficient. This step does not edit the evidence source and does not promote any relation into manufacturer-approved or production-validated compatibility.

## Decisions

For each canonical relation:

- `ACCEPT_CURRENT_EVIDENCE` — accepts only the currently visible evidence maturity/classification.
- `REQUEST_MORE_EVIDENCE` — blocks closure and requires a human note.
- `REJECT_CURRENT_EVIDENCE` — blocks closure and requires a human note.

A human acceptance means:

> “I reviewed and accept the current evidence classification as represented.”

It does **not** mean:

- manufacturer pair approval;
- verified assembly-node evidence;
- exact joint geometry verification;
- instance adjacency verification;
- production compatibility validation;
- production rule validation;
- machine readiness.

## Evidence fingerprint / stale review invalidation

Each review record stores:

- the PROFILE DATA 03.6 bridge version;
- source intent ID;
- an evidence-state fingerprint;
- a per-relation row signature;
- profile codes and evidence maturity.

If the current assembly evidence changes, the prior human decision becomes `STALE_REVIEW_REQUIRED` and must be repeated. A stale acceptance cannot remain active on changed evidence.

## Fail-closed behavior

PROFILE DATA 03.7 blocks when:

- PROFILE DATA 03.6 is not `READY_FOR_HUMAN_REVIEW`;
- upstream evidence contains conflicts;
- a review references a relation no longer present;
- multiple active review records exist for the same relation.

No “latest wins” behavior is allowed for ambiguous duplicate active decisions.

## UI

The panel exposes, per relation:

- current evidence maturity;
- current human review state;
- an optional/required note;
- **Приемам текущото ниво на доказателство**;
- **Искам още доказателство**;
- **Отхвърлям текущото доказателство**.

There is no profile picker, geometry editor, manufacturer-approval control or production action in this panel.

## Safety boundary

PROFILE DATA 03.7 preserves:

- HUMAN REVIEW OF CURRENT EVIDENCE ONLY = YES
- HUMAN ACCEPTANCE IS MANUFACTURER APPROVAL = NO
- HUMAN ACCEPTANCE CREATES VERIFIED ASSEMBLY NODE EVIDENCE = NO
- VERIFIED ASSEMBLY NODE EVIDENCE = NO
- MANUFACTURER ASSEMBLY COMPATIBILITY VALIDATED = NO
- EXACT JOINT GEOMETRY VERIFIED = NO
- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC GEOMETRY = NO
- PRODUCTION COMPATIBILITY VALIDATED = NO
- PRODUCTION RULE APPLIED = NO
- PRODUCTION DEDUCTIONS APPLIED = NO
- MANUFACTURING TOLERANCE APPLIED = NO
- RULES VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

## Acceptance

PROFILE DATA 03.7 is acceptable when:

1. every current evidence relation starts unreviewed;
2. only explicit human decisions change review state;
3. negative decisions require notes;
4. human acceptance never upgrades evidence maturity or compatibility authority;
5. changed evidence invalidates old review records;
6. duplicate active decisions fail closed;
7. upstream blocked evidence cannot be reviewed;
8. all production safety locks remain false.
