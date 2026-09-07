# PROFILE DATA 03.11 — Manual Assembly Evidence Human Review / Acceptance Gate

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**
Base checkpoint: **6e1cde4**

## Goal

Add an explicit human-review gate for sources manually registered by PROFILE DATA 03.10.

The reviewer may choose:

- `ACCEPT_SOURCE`
- `REJECT_SOURCE`
- `NEEDS_MORE_EVIDENCE`

The decision is anchored to both the current PROFILE DATA 03.9 readiness fingerprint and the exact PROFILE DATA 03.10 submission fingerprint.

## Meaning of ACCEPT

`ACCEPT_SOURCE` means only that a human reviewer accepts the registered source at the source-review level for the current requirement context.

It does **not** automatically:

- apply the source to the assembly evidence ledger;
- satisfy the missing evidence requirement;
- create validated evidence;
- create manufacturer approval;
- create verified assembly-node evidence;
- validate exact joint geometry;
- upgrade evidence maturity;
- validate production compatibility;
- unlock production or machine output.

A later explicit controlled evidence-application layer is required before any evidence ledger can change.

## Fail-closed behavior

The review is blocked or marked stale when:

- PROFILE DATA 03.10 intake is blocked;
- the registration is stale;
- the readiness fingerprint changed;
- the submission fingerprint changed;
- more than one active review record exists for one submission;
- a review record references a missing submission.

`REJECT_SOURCE` and `NEEDS_MORE_EVIDENCE` require a human note.

## Aggregate statuses

- `NO_REGISTERED_SOURCE`
- `HUMAN_REVIEW_INCOMPLETE`
- `HUMAN_ACTION_REQUIRED`
- `STALE_REVIEW_REQUIRED`
- `SOURCES_HUMAN_REVIEWED_NOT_APPLIED`
- fail-closed blocked states

## Safety boundary

- SOURCE HUMAN REVIEW ONLY = YES
- ACCEPTED SOURCE APPLIED TO EVIDENCE LEDGER = NO
- REQUIREMENT SATISFIED = NO
- VALIDATED EVIDENCE CREATED = NO
- MANUFACTURER APPROVAL = NO
- VERIFIED ASSEMBLY NODE EVIDENCE CREATED = NO
- EXACT JOINT GEOMETRY VERIFIED = NO
- EVIDENCE MATURITY AUTO UPGRADE = NO
- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC GEOMETRY = NO
- PRODUCTION COMPATIBILITY VALIDATED = NO
- PRODUCTION RULE APPLIED = NO
- PRODUCTION DEDUCTIONS APPLIED = NO
- MANUFACTURING TOLERANCE APPLIED = NO
- RULES VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO
