# PROFILE DATA 03.5 — Canonical Profile Compatibility Semantics

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**
Base checkpoint: **5a87c57 — PROFILE DATA 03.4 CLOSED**

## Purpose

Add a fail-closed compatibility-semantics layer above the explicit canonical PRELUDE 60 identities and PROFILE DATA 03.4 technical semantics.

The layer answers only a narrow question: do the already assigned canonical profiles belong to the same canonical system and represent a meaningful cross-role relation such as FRAME ↔ SASH, FRAME ↔ MULLION, or MULLION ↔ SASH?

It deliberately does **not** claim that a manufacturer-approved physical joint has been validated.

## Current canonical role relations

For the current PRELUDE 60 canonical identities, the knowledge layer can describe these conceptual system/role relations:

| Relation | Left profile | Right profile | Authority |
| --- | --- | --- | --- |
| FRAME ↔ MULLION | 482.30 | 482.21 | `CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY` |
| FRAME ↔ SASH | 482.30 | 482.05 | `CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY` |
| MULLION ↔ SASH | 482.21 | 482.05 | `CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY` |

These rows mean only that the explicit canonical identities live in PRELUDE 60 and their roles form a meaningful conceptual relation in the current FacadeFlow model.

They do **not** establish:

- exact physical adjacency between any two target instances;
- verified assembly-node geometry;
- manufacturer-approved pair compatibility;
- gasket, rebate, groove, hardware, reinforcement, or glazing compatibility;
- overlap, deduction, machining, or tolerance rules.

## Fail-closed behavior

PROFILE DATA 03.5 consumes PROFILE DATA 03.4 technical-semantics rows. It blocks if:

1. the upstream technical-semantics bridge is blocked;
2. a profile code and role do not resolve to the same canonical PRELUDE 60 identity;
3. more than one canonical code appears for the same role in the same source set;
4. more than one profile system appears in the source set;
5. a requested cross-role relation cannot be resolved.

Repeated instances of the same canonical role/code are deduplicated at the compatibility-knowledge level while their source target references remain visible as evidence.

If only one role is present, no missing pair relation is invented.

## UI acceptance

A read-only panel may display:

- the canonical role pair;
- the two explicit profile codes;
- PRELUDE 60 system identity;
- source target references;
- `CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY` authority;
- explicit `NOT VALIDATED` manufacturer assembly compatibility;
- explicit `NOT ESTABLISHED` exact joint geometry.

The panel cannot choose profiles, infer target adjacency, mutate geometry, or unlock any production state.

## Safety boundary

- CANONICAL SYSTEM/ROLE COHERENCE = YES
- MANUFACTURER ASSEMBLY COMPATIBILITY VALIDATED = NO
- INSTANCE ADJACENCY INFERENCE = NO
- VERIFIED ASSEMBLY NODE EVIDENCE = NO
- EXACT JOINT GEOMETRY = NO
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

## Acceptance criteria

PROFILE DATA 03.5 is acceptable only if tests prove that:

- the three PRELUDE 60 cross-role combinations resolve as conceptual system/role relations;
- every resolved relation remains explicitly `NOT_VALIDATED` for manufacturer assembly compatibility;
- role/code mismatches fail closed;
- same-role pseudo-pairs are not treated as compatibility relations;
- repeated target instances do not create duplicate canonical pair rows;
- missing roles do not cause invented pair relations;
- upstream blocking propagates fail-closed;
- no automatic selection, instance adjacency inference, exact joint geometry, production rule, production unlock, or machine-ready state is introduced.
