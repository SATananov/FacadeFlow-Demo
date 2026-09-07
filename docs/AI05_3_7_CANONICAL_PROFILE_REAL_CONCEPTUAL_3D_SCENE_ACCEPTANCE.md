# AI05.3.7 — Canonical Profile Assignments → Real Conceptual 3D Scene

Status: **WORKING**
Parent: **AI05.3 — OPEN / WORKING**
PROFILE DATA 03: **OPEN / WORKING**
RTP01: **WORKING**

## Purpose

Connect the already verified canonical profile assignment trace to the application's real `Product3DScene` / WebGL path without inventing a production model.

The input chain remains:

`Product Intent -> AI05.2 Construction Graph -> AI05.3 Drawing -> AI05.3.4 Canonical Profile Assignment Bridge -> HUMAN REVIEWED conceptual topology -> AI05.3.7 real conceptual 3D scene`

The working explicit identities remain:

- PRELUDE 60 / FRAME = `482.30`
- PRELUDE 60 / MULLION = `482.21`
- PRELUDE 60 / SASH = `482.05`

## Real-scene rule

AI05.3.7 does not create a placeholder or synthetic review object and call it 3D. It creates the same `Product3DScene` structure consumed by the existing `Product3DPreview` and `Product3DScene` WebGL renderer.

However, the scene is released only after the conceptual topology has reached `HUMAN_REVIEWED`.

Before that state, AI05.3.7 returns `WAITING_FOR_HUMAN_REVIEW` and no scene.

## Geometry authority

The scene has exactly one geometry authority:

`HUMAN_REVIEWED_CONCEPTUAL_TOPOLOGY_ONLY`

AI05.3.7 may visually extrude the already reviewed 2D rectangles into boxes so the existing WebGL renderer can display them. These box faces and conceptual depth are rendering envelopes only. They are not profile dimensions, production deductions, fabrication contours, machining contours, tolerances, or production geometry.

AI05.3.7 must not:

- add or remove fields;
- add or remove mullions;
- change field rectangles;
- move divider positions;
- infer a missing profile;
- infer a profile system;
- use canonical profile identity as geometry authority;
- apply exact profile contour;
- apply deductions or tolerances;
- validate production rules;
- unlock production or machine output.

If the human-reviewed proposal and AI05.3 Drawing no longer describe the same field/divider topology, the real 3D scene is blocked.

## Canonical profile binding

The profile identity affects scene metadata only.

The real scene nodes preserve the already explicit Drawing code through semantic source paths:

- `FRAME:frame-root` -> all frame nodes -> `482.30`
- `MULLION:<divider-id>` -> matching divider node -> `482.21`
- `SASH:<field-id>` -> matching sash nodes -> `482.05`

AI05.3.7 checks every canonical assignment against actual scene nodes. A missing node or a changed node profile code becomes `BLOCKED_CONFLICT`.

The AI05.3.4 bridge metadata is attached to the real scene without mutating scene geometry. AI05.3.5 then performs the existing end-to-end review against this real scene.

## Workspace integration

`ParametricConstructionProposalPanel` keeps AI05.3.6 visible while the topology is not yet human reviewed.

After `HUMAN_REVIEWED`, the pending trace is replaced by `CanonicalProfileRealConceptual3DPanel`, which mounts:

- the real existing `Product3DPreview` WebGL experience;
- real scene-node bindings for canonical profile codes;
- the AI05.3.5 end-to-end human review panel.

This does not create any new production action.

## Safety

- Real WebGL conceptual scene: **YES**
- Human-reviewed topology required first: **YES**
- Synthetic scene stub: **NO**
- New topology generation: **NO**
- Automatic profile selection: **NO**
- Automatic system assignment: **NO**
- Automatic geometry: **NO**
- Exact profile contour: **NO**
- Production deductions: **NO**
- Manufacturing tolerances: **NO**
- Rules validated: **NO**
- Production unlock: **NO**
- Machine ready: **NO**
- Production approved: **NO**

AI05.3, PROFILE DATA 03 and RTP01 remain **OPEN / WORKING**.
