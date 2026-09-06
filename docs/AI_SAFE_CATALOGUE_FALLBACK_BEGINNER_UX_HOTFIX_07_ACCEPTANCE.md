# Human Audit Hotfix 07 — Safe Catalogue Fallback + Beginner Guidance Polish

## Status
WORKING / NOT COMMITTED / HUMAN REVIEW ONLY

## Human-audit defect addressed
When a user edits an offer setting such as Handle and no verified catalogue alternatives are loaded, the guided AI must not present a blank technical field as if the user is expected to know what to type.

## Accepted UX behaviour
- When verified alternatives are unavailable, the UI explicitly says so.
- The user gets safe choices: keep the field unresolved/unchanged, enter a value they already know, or open Data and Catalogues.
- Manual values remain explicitly subject to human review and do not become production facts.
- Catalogue navigation is wired to the existing real catalogue action.
- Unrelated recommendations are suppressed while a setting is being edited.
- “Preview as text” is moved under Additional options; Apply remains the primary action.
- Offer flow shows Step 1 of 4 through Step 4 of 4.
- User-facing email wording is Bulgarian (“Електронна поща”).
- Physical-person contact wording explains that a separate contact is optional.

## Safety boundary
RULES VALIDATED = NO
MACHINE READY = NO
PRODUCTION APPROVED = NO
NO COMMIT / NO PUSH
