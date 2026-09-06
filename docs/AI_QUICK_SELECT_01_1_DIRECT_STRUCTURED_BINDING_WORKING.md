# AI QUICK SELECT 01.1 — Direct Structured Binding · WORKING

Status: WORKING / HUMAN AUDIT REQUIRED

## Goal
Quick Select must not depend on re-parsing its own generated text. Explicit UI choices are bound directly to `FacadeFlowProductIntent` and become the authoritative working structured draft for Human Review.

## Direct binding
`Quick Select -> FacadeFlowQuickStructuredSelection -> FacadeFlowProductIntent -> Parametric Proposal / Review Inspector`

Generated text remains a human-readable description only.

For the reference case `1200 x 1400`, quantity `3`, preset `FIX | двуосно дясно | FIX`, the direct intent stores:

- field 1: `FIXED / FIXED`
- field 2: `OPENING_SASH / TILT_TURN / RIGHT`
- field 3: `FIXED / FIXED`

The sidebar and proposal read this structured intent directly. They do not call the prompt interpreter while the Quick Select intent is active.

## Text correction transition
If the user edits the generated description manually, the direct Quick Select intent is released. The free-text NLP workflow then becomes authoritative for the edited text. This prevents stale structured state from silently overriding a later human text correction.

## Safety
- Human Review: REQUIRED
- NLP reparse for active Quick Select intent: NO
- Automatic accepted geometry: NO
- Rules validated: NO
- Machine ready: NO
- Production approved: NO
- Commit / push: NO during working audit
