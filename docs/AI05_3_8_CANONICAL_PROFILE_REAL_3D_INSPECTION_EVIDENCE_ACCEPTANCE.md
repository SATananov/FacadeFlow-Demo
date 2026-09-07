# AI05.3.8 — Canonical Profile Real 3D Inspection Evidence

## Status

- Parent: `AI05.3` — OPEN / WORKING
- Step: `AI05.3.8` — WORKING
- Base checkpoint: `f9d905c` (`AI05.3.7` closed)
- PROFILE_DATA03: OPEN / WORKING
- RTP01: WORKING

## Goal

Expose the already-established canonical profile assignment trace as a read-only, human-inspectable evidence layer on the real WebGL conceptual 3D scene created by AI05.3.7.

The step does **not** create geometry, infer profiles, apply exact profile sections, calculate production deductions, validate production rules, or unlock manufacturing.

## Accepted behavior

1. Inspection is derived only from the AI05.3.4 canonical assignment bridge and the AI05.3.7 real conceptual `Product3DScene`.
2. Every canonical FRAME / MULLION / SASH assignment must resolve to one or more actual 3D scene nodes by explicit `role + sourcePath` trace.
3. Every resolved node must preserve the explicit canonical `profileCode`.
4. Every profile-bearing FRAME / DIVIDER / SASH scene node must be covered by a canonical inspection row. Untraced profile-bearing nodes are a conflict; no profile inference is allowed.
5. Existing WebGL `selectedId` is reused for human inspection. Selecting an evidence row may highlight an existing node; it does not mutate the scene.
6. Node dimensions and positions shown by this step are labeled `visualBoundsOnly`. They are conceptual renderer bounds, not production dimensions or exact profile contours.
7. Any missing source path, profile mismatch, lineage mismatch, untraced node, duplicate node ownership, non-human-reviewed scene source, or production-ready flag produces `BLOCKED_CONFLICT`.

## Safety boundary

- READ ONLY INSPECTION = YES
- REAL WEBGL SCENE ONLY = YES
- HUMAN-REVIEWED CONCEPTUAL SCENE ONLY = YES
- EXPLICIT ASSIGNMENTS ONLY = YES
- VISUAL BOUNDS ONLY = YES
- PROFILE INFERENCE = NO
- ASSIGNMENT EDITING = NO
- GEOMETRY EDITING = NO
- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC SYSTEM ASSIGNMENT = NO
- AUTOMATIC GEOMETRY = NO
- EXACT PROFILE CONTOUR = NO
- PRODUCTION DEDUCTIONS = NO
- MANUFACTURING TOLERANCE = NO
- RULES VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

## Files

- `src/aiCanonicalProfile3DInspectionEvidence.ts`
- `src/components/CanonicalProfile3DInspectionPanel.tsx`
- `src/components/CanonicalProfileRealConceptual3DPanel.tsx`
- `tests/ai05_3_8CanonicalProfile3DInspectionEvidence.test.ts`
- `package.json`

## Verification

Run:

```powershell
npm run test:ai05_3_5
npm run test:ai05_3_6
npm run test:ai05_3_7
npm run test:ai05_3_8
npm run lint
npm run build
git diff --check
```

AI05.3.8 is acceptable only when the focused regression remains green and all production safety flags remain locked.
