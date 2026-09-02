# AI03 — Parametric Construction Proposal Bundle — Acceptance

Bundle: AI03.1 → AI03.5
Status at final clean checkpoint: IMPLEMENTED / HUMAN-REVIEWED FLOW / SAFETY BOUNDARY PRESERVED

## Product objective

Move FacadeFlow from structured understanding to a visible parametric construction proposal without crossing the human-authority boundary.

Input paths:
- AI01 Prompt Intelligence → Canonical Product Intent → AI03 proposal;
- AI02 Project Document Intelligence → merged Canonical Product Intent → AI03 proposal.

The AI03 boundary ends at a reviewable proposal. AI04 is a separate downstream layer and may create editable constructor geometry only after the AI03 proposal is human-reviewed and the user performs a separate explicit handoff action.

## Bundle composition

- **AI03.1 — Parametric Construction Proposal Foundation**: deterministic proposal contract and blocked/review states.
- **AI03.2 — Parametric 2D Proposal Preview**: proportional conceptual frame, fields/dividers and review-visible proposal evidence.
- **AI03.3 — Parametric Proposal Human Review**: explicit human review state; review does not create machine or production authority.
- **AI03.4 — Prompt / Document Proposal Integration**: AI01 and AI02 converge on the same AI03 proposal path.
- **AI03.5 — AI Workspace Visual Layout / Proposal UI Polish**: UI-only closure polish; no inference, evidence-merge, proposal-algorithm or safety-boundary change.

## AI03 output

- proportional conceptual frame;
- proposed fields and dividers;
- explicit opening semantics when supported by available evidence;
- assumption list for geometry that is proposed rather than evidenced;
- unresolved engineering/detail items;
- source/evidence context needed for review;
- human review state: `BLOCKED`, `NEEDS_REVIEW` or `HUMAN_REVIEWED`.

## Human-authority and safety boundary

Within AI03:

- AUTO-GENERATED PROPOSAL: possible;
- AUTOMATIC ACCEPTANCE: NO;
- AUTOMATIC CONSTRUCTOR HANDOFF: NO;
- RULES VALIDATED: NO;
- MACHINE READY: NO;
- PRODUCTION APPROVED: NO.

`HUMAN_REVIEWED` means that a person reviewed the proposal; it does not mean engineering validation, production approval or machine readiness.

AI04 does not weaken this boundary: its editable constructor draft requires both a human-reviewed AI03 proposal and a separate explicit human acknowledgement. Constructor validation and further human review remain downstream responsibilities.

## Non-goals

AI03 does not:
- automatically accept geometry;
- write proposal geometry directly into the production/custom constructor;
- select profile codes not present as exact selectable catalogue evidence;
- place hinges/handles without source evidence;
- resolve unsupported opening/geometry semantics by hidden approximation;
- validate engineering rules;
- produce production or machine output.

## Required closure verification

- `npm run test:ai01_prompt` PASS;
- `npm run test:ai02_documents` PASS;
- `npm run test:ai03` PASS;
- `npm run test:ai03_5` PASS;
- `npm run test:ai04` regression PASS;
- lint: 0 errors;
- production build PASS;
- `git diff --check` PASS;
- Human Audit of at least one prompt proposal, one document proposal and one blocked/conflict case;
- visual Human Audit confirming AI03.5 layout/label/wrapping polish without semantic behavior change.

## Related acceptance records

- `docs/AI03_5_AI_WORKSPACE_VISUAL_POLISH_ACCEPTANCE.md`
- `docs/AI04_EDITABLE_CONSTRUCTOR_GEOMETRY_V1_BUNDLE_ACCEPTANCE.md`
- `docs/PHASE_06C_3_7_RULE_VALIDATION_GATE_AGGREGATION_FOUNDATION_ACCEPTANCE.md`
