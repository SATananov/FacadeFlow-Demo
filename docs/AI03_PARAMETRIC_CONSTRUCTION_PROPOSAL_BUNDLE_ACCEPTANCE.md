# AI03 — Parametric Construction Proposal Bundle — Acceptance

Bundle: AI03.1 → AI03.4
Status before user review: TECHNICAL VERIFY REQUIRED / HUMAN AUDIT REQUIRED

## Product objective
Move FacadeFlow from structured understanding to a visible construction proposal without crossing the human-authority boundary.

Input paths:
- AI01 Prompt Intelligence → Product Intent → AI03 proposal
- AI02 Project Document Intelligence → merged Product Intent → AI03 proposal

AI03 output:
- proportional conceptual frame;
- proposed fields and dividers;
- explicit opening semantics when available;
- assumption list for geometry that is proposed rather than evidenced;
- unresolved engineering/detail items;
- human review state.

## Non-goals
AI03 does not:
- automatically accept geometry;
- write geometry into the production/custom constructor;
- select profile codes not present in evidence;
- place hinges/handles without source evidence;
- validate engineering rules;
- produce machine output.

## Required verification
- AI01 regression PASS
- AI02 regression PASS
- AI03 tests PASS
- lint: 0 errors
- production build PASS
- `git diff --check` PASS
- Human Audit of one prompt proposal, one document proposal and one blocked/conflict case.
