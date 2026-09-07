# PROFILE DATA 03.4 — Canonical Profile Technical Semantics

Status: **WORKING**
Parent: **PROFILE DATA 03 OPEN / WORKING**
Base checkpoint: **14dd910 — AI05.3.9 CLOSED**

## Purpose

Connect an already explicit PRELUDE 60 canonical profile identity to human-confirmed technical meaning without promoting that knowledge to exact contour geometry or production truth.

This layer answers questions such as:

- which working full dimension belongs to the already assigned profile code;
- which human-confirmed visible width belongs to that code;
- where the working semantics came from;
- what the catalogue independently labels;
- whether the catalogue and human sources are directly comparable.

It does **not** choose a profile, draw a profile section, calculate production deductions, apply tolerances, validate manufacturing rules, or unlock machine output.

## Canonical technical semantics

Current source-of-truth records:

| Canonical role | Code | Human-confirmed full working dimension | Human-confirmed visible width | Human working formula |
| --- | --- | ---: | ---: | --- |
| FRAME / Каса | 482.30 | 64 mm | 42 mm | 64 − 22 = 42 mm |
| MULLION / Делител | 482.21 | 84 mm | 40 mm | 84 − 22 − 22 = 40 mm |
| SASH / Крило | 482.05 | 78 mm | 56 mm | 78 − 22 = 56 mm |

These are **working semantics**. They are not asserted as exact contour coordinates or production section geometry.

## Provenance boundary

PROFILE DATA 03.4 reuses the existing separated authorities:

- canonical identity: `PROFILE_IDENTITY_ONLY`;
- human working semantics: `HUMAN_CONFIRMED_WORKING_SEMANTICS` from Надежда / Бат Трифон;
- catalogue: `CATALOGUE_REFERENCE_ONLY` from `PVC Prelude_bg.pdf`, page 2.

The sources remain separate with `SEPARATE_SOURCES_NO_AUTO_MERGE`.

The 482.05 catalogue drawing labels an overall extent of 56 mm, but the current catalogue provenance does not establish that label as a visible-width semantic. The human-confirmed working semantics independently record 78 mm full working dimension and 56 mm visible width. PROFILE DATA 03.4 preserves that distinction instead of silently merging the two meanings.

## Canonical assignment bridge

The read-only adapter consumes only explicit AI05.3.4 canonical assignments. For each FRAME / MULLION / SASH target it verifies:

1. profile code resolves to a known canonical PRELUDE 60 identity;
2. canonical role matches the technical source role;
3. provenance role matches the canonical role;
4. technical values are attached as knowledge only;
5. target trace (`targetKind`, `targetRef`, `profileCode`) remains unchanged.

If the upstream canonical assignment bridge is not ready, or the identity and semantics disagree, PROFILE DATA 03.4 fails closed.

## UI acceptance

The real conceptual 3D workflow may display a read-only technical semantics panel showing:

- canonical role and profile code;
- target trace;
- human-confirmed full working dimension;
- human-confirmed visible width;
- human formula/reference;
- catalogue reference;
- explicit provenance and exact-contour warning.

The panel cannot edit the profile or geometry.

## Safety boundary

- HUMAN WORKING SEMANTICS = YES
- CATALOGUE REFERENCE = YES
- SOURCE AUTO MERGE = NO
- AUTOMATIC PROFILE SELECTION = NO
- EXACT PROFILE CONTOUR = NO
- MEASUREMENT ANCHORS BOUND TO CONTOUR = NO
- AUTOMATIC GEOMETRY = NO
- PRODUCTION DEDUCTIONS APPLIED = NO
- MANUFACTURING TOLERANCE APPLIED = NO
- RULES VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

## Acceptance criteria

PROFILE DATA 03.4 is acceptable only if tests prove that:

- 482.30 resolves to FRAME, 64 mm full working dimension, 42 mm visible width;
- 482.21 resolves to MULLION, 84 mm full working dimension, 40 mm visible width;
- 482.05 resolves to SASH, 78 mm full working dimension, 56 mm visible width;
- role mismatches fail closed;
- catalogue and human sources remain separate;
- the SASH catalogue 56 mm extent is not silently reclassified as catalogue visible width;
- canonical assignment target trace is preserved;
- no geometry, deductions, tolerances, rule validation, production unlock, or machine-ready state is introduced.
