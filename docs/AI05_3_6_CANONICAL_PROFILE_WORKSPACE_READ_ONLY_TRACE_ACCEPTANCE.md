# AI05.3.6 вЂ” Canonical Profile Workspace Read-only Trace Integration

Status: **WORKING**
Parent: **AI05.3 вЂ” OPEN / WORKING**
PROFILE DATA 03: **OPEN / WORKING**
RTP01: **WORKING**

## Purpose

Mount canonical profile assignment visibility into the real parametric construction workspace without creating a second state, inventing profile assignments, or pretending that conceptual 3D has already been reviewed.

The authoritative integration point is `ParametricConstructionProposalPanel`, because that component already owns the real:

`Product Intent -> AI05.2 Construction Graph -> AI05.3 Drawing`

chain.

The visible working identities remain:

- PRELUDE 60 / FRAME = `482.30`
- PRELUDE 60 / MULLION = `482.21`
- PRELUDE 60 / SASH = `482.05`

## Integration rules

1. `ParametricConstructionProposalPanel` builds the existing AI05.3.4 canonical bridge from its already-created Product Intent, Construction Graph and Drawing.
2. AI05.3.6 derives a read-only workspace review from that bridge.
3. The review panel shows Product Intent, Graph and Drawing values for each resolved target.
4. Missing explicit assignments stay missing. No default profile is supplied.
5. Missing or changed source trace is fail-closed and becomes `BLOCKED_CONFLICT`.
6. AI05.3.6 does **not** manufacture a conceptual 3D scene merely to satisfy AI05.3.5.
7. Conceptual 3D end-to-end review remains explicitly `PENDING_REAL_CONCEPTUAL_3D_SCENE` in this workspace stage.
8. AI05.3.5 remains the authority for true bridge-vs-real-scene end-to-end review when a real conceptual 3D scene is available.
9. The workspace panel is read-only and adds no profile edit, confirmation-to-production, machine or production action.
10. This step does not modify 2D or 3D geometry.

## Why the integration is not mounted in `PromptInterpretationPanel` or `Product3DPreview`

- `PromptInterpretationPanel` owns interpretation/session interaction but delegates the actual construction graph/drawing work to `ParametricConstructionProposalPanel`.
- `Product3DPreview` receives only a `buildScene` callback and does not own Product Intent + Construction Graph + Drawing.
- Mounting AI05.3.6 in either location would require duplicating state or inventing missing upstream data.

## Safety

- Read-only workspace visibility: **YES**
- Human review required: **YES**
- Profile inference/defaults: **NO**
- Assignment editing: **NO**
- Synthetic conceptual 3D scene: **NO**
- Automatic profile selection: **NO**
- Automatic system assignment: **NO**
- Automatic geometry: **NO**
- Exact profile contour applied: **NO**
- Rules validated: **NO**
- Production unlock: **NO**
- Machine ready: **NO**
- Production approved: **NO**

This step does not close AI05.3, PROFILE DATA 03, or RTP01.
