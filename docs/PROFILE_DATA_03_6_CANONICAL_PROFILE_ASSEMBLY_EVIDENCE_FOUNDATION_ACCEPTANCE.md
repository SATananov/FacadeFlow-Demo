# PROFILE DATA 03.6 — Canonical Profile Assembly Evidence Foundation

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**
Base checkpoint: **d472612 — PROFILE DATA 03.5 CLOSED**

## Purpose

Add a provenance-first assembly-evidence ledger above PROFILE DATA 03.5 without converting conceptual compatibility into manufacturer-approved or production-valid compatibility.

The layer distinguishes four evidence channels that must never be silently merged:

1. canonical system/role relation;
2. catalogue same-system membership evidence;
3. human-reviewed working assembly-rule evidence;
4. verified assembly-node evidence.

## Current PRELUDE 60 evidence maturity

| Relation | Canonical relation | Catalogue evidence | Human working assembly evidence | Verified assembly-node evidence |
| --- | --- | --- | --- | --- |
| FRAME 482.30 ↔ MULLION 482.21 | ESTABLISHED | same PRELUDE 60 system only | NOT RECORDED FOR THIS RELATION | NOT RECORDED |
| FRAME 482.30 ↔ SASH 482.05 | ESTABLISHED | same PRELUDE 60 system only | human-reviewed 7 mm sash-overlap working rule | NOT RECORDED |
| MULLION 482.21 ↔ SASH 482.05 | ESTABLISHED | same PRELUDE 60 system only | human-reviewed 7 mm sash-overlap working rule | NOT RECORDED |

The 7 mm value already exists in `PROFILE DATA 01.2` as a system-level human-reviewed **working** value. It is editable and explicitly requires exact production confirmation. PROFILE DATA 03.6 references that existing source instead of duplicating or promoting it.

## Evidence meaning

### Canonical relation

PROFILE DATA 03.5 established only canonical PRELUDE 60 system/role coherence. This remains conceptual evidence.

### Catalogue evidence

`PVC Prelude_bg.pdf` and the registered PRELUDE 60 catalogue establish that the canonical profiles belong to the same catalogue system. Same-system membership is **not** manufacturer pair approval and does not prove a specific joint.

### Human working assembly evidence

The existing PRELUDE 60 sash-overlap rule establishes a human-reviewed working relationship between an explicitly adjacent sash and a frame or mullion. It does not infer which target instances are adjacent. It does not validate the exact physical joint, gasket/rebate/groove interaction, machining, reinforcement, glazing, hardware, or production tolerance.

No equivalent human-reviewed working assembly rule is currently recorded for FRAME ↔ MULLION in this evidence ledger.

### Verified assembly-node evidence

No manufacturer-approved or otherwise verified assembly-node evidence is recorded by PROFILE DATA 03.6. Therefore all rows remain:

- `VERIFIED ASSEMBLY NODE EVIDENCE = NO`
- `MANUFACTURER ASSEMBLY COMPATIBILITY VALIDATED = NO`
- `EXACT JOINT GEOMETRY VERIFIED = NO`

## Fail-closed behavior

PROFILE DATA 03.6 consumes the PROFILE DATA 03.5 compatibility-semantics bridge and blocks if:

1. the upstream bridge is blocked;
2. upstream unexpectedly claims manufacturer validation;
3. upstream unexpectedly asserts instance adjacency;
4. an evidence record resolves to another system.

The layer never invents target adjacency and never upgrades human working evidence to manufacturer approval.

## UI acceptance

A read-only evidence panel may display:

- the canonical relation;
- catalogue same-system evidence and source label;
- whether a human-reviewed working relation rule is recorded;
- the existing PRELUDE 60 7 mm working overlap where applicable;
- exact-production-confirmation-required status;
- verified assembly-node evidence state;
- manufacturer compatibility state;
- exact joint geometry state.

The panel cannot choose profiles, infer adjacency, edit geometry, validate production compatibility, or unlock machine output.

## Safety boundary

- EVIDENCE LEDGER ONLY = YES
- CATALOGUE EVIDENCE = SAME-SYSTEM MEMBERSHIP ONLY
- HUMAN WORKING RULE IS MANUFACTURER APPROVAL = NO
- INSTANCE ADJACENCY INFERENCE = NO
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

## Acceptance criteria

PROFILE DATA 03.6 is acceptable only if tests prove that:

- FRAME ↔ MULLION remains conceptual + same-system catalogue evidence only;
- FRAME ↔ SASH and MULLION ↔ SASH reference the existing human-reviewed 7 mm working overlap rule;
- the 7 mm rule remains exact-production-confirmation-required and does not infer adjacency;
- all three relations retain their source target trace from PROFILE DATA 03.5;
- no relation gains verified assembly-node evidence;
- no human working rule is promoted to manufacturer approval;
- upstream blocking propagates fail-closed;
- no production compatibility, exact joint geometry, automatic geometry, production unlock, or machine-ready state is introduced.
