# AI GUIDED ORIENTATION 01 — WORKING

Status: WORKING / HUMAN AUDIT REQUIRED

## Goal
Make the FacadeFlow AI workspace understandable for a user who does not always know which control to use next, without weakening source provenance or production-safety boundaries.

## Changes
- Adds a persistent contextual helper: **„Не знаеш какво да правиш? Помощник · Какво да направя сега?“**
- Explains Quick Select as four concrete actions.
- Rewords technical settings so unknown profile data is explicitly allowed to remain **НЕУТОЧНЕНО**.
- Adds plain-language A-A / B-B / C-C explanation next to catalogue profile-section cards.
- Adds **„Разгледай подробно“** on each profile card.
- Keeps the large Technical Profile Inspector collapsed by default to avoid duplicating the same profile visuals on the main technical sheet.
- Opening a profile card can select that exact profile in the detailed inspector.

## Safety
- No automatic profile assignment.
- No automatic geometry acceptance.
- No rule validation unlock.
- No machine-ready state.
- No production approval.
- Unknown values remain unknown rather than being guessed.

## Human audit focus
1. Can a non-expert understand what to do from the helper without external explanation?
2. Is „Технически настройки“ discoverable but clearly optional when the values are unknown?
3. Are A-A / B-B / C-C understandable in plain Bulgarian?
4. Does the main AI technical sheet remain compact, with the large inspector hidden until requested?
5. Does „Разгледай подробно“ open the correct selected profile?

NO COMMIT / NO PUSH.
