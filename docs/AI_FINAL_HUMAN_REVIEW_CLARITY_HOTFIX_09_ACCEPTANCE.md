# Human Audit Hotfix 09 — Final Human Review Clarity

## Status

WORKING / NOT COMMITTED / HUMAN REVIEW ONLY

## Goal

Make Step 4 understandable to a non-specialist before any human confirmation is recorded.
The final review must show who the offer is for, who prepares it, exactly what module/cell state is being confirmed, and what the confirmation does **not** authorize.

## UX changes

- Step 4 remains explicitly **human review** and is presented as the final review of the offer draft.
- Shows **Възложител** and the verified issuer **НАДЕЖДА** before confirmation.
- Shows the full sash description for sash cells, e.g. **Двуосно · дясно**, rather than the generic label “КРИЛО”.
- Adds a plain-language **Какво потвърждаваш?** explanation.
- Renames the main action to **✓ Потвърждавам тази офертна чернова**.
- Adds **✎ Върни се за корекция**, which returns the user to Step 3.
- Confirmation is unavailable until the minimum customer identity (customer type + name/company) is present.
- Repeats the safety boundary next to the confirmation decision.

## Safety boundary

Human confirmation remains draft-level only.

- AUTOMATIC GEOMETRY: NO
- RULES VALIDATED: NO
- MACHINE READY: NO
- PRODUCTION APPROVED: NO

No machine handoff, production approval, rule validation, or automatic geometry authority is introduced by this hotfix.

## Human-audit scenario

Expected final module state used by the targeted test:

- Module 1
- 1200 × 1400 mm
- quantity 3
- Cell 2: fixed
- Cell 3: tilt-turn / right (**Двуосно · дясно**)
- Cell 4: fixed

The module may become READY_FOR_HUMAN_REVIEW and later HUMAN_CONFIRMED, while all production safety boundaries remain false.
