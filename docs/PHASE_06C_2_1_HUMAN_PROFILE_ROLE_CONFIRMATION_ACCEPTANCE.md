# PHASE 06C.2.1 — Human Profile Role Confirmation + Catalogue Promotion

Status: implementation candidate — requires local regression/build and human visual verification before lock.

## Acceptance boundary

- Real Nadezhda / Vadim-2 profile evidence remains visible and immutable as source evidence.
- Clicking `Каса / Крило / Делител` opens a **pending human review**; it does not immediately add the source profile to the catalogue.
- The reviewer must explicitly confirm the proposed role and identify the human / technologist who confirmed it.
- Source code and observed section dimensions remain read-only during the review.
- Only `HUMAN_CONFIRMED` source-evidence profiles are eligible for the Guided AI catalogue dropdowns.
- Changing role/system/name of an already confirmed source-backed profile invalidates the previous human-role confirmation and requires reconfirmation.
- HUMAN CONFIRMED is not expert approval, rule validation, production approval, automatic geometry, or machine readiness.
- No network, persistence, machine writer, or automatic production geometry is introduced.
