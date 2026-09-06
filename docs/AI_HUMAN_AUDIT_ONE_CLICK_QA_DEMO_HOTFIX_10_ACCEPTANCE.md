# Human Audit Hotfix 10 — One-click QA Demo State

Status: WORKING / NOT COMMITTED

## Goal
Stop forcing the human auditor to rebuild the same offer/module scenario after every UI hotfix.

## DEV-only QA entry
A clearly marked `QA · САМО ЗА ТЕСТ` control is available only when `import.meta.env.DEV` is true. It is not rendered in production builds.

One click loads the verified Human Audit scenario and scrolls to Step 4:

- Customer: Иван Иванов
- Issuer: НАДЕЖДА
- PRELUDE 60
- RAL 7016
- Двоен стъклопакет
- ROTO NX
- Module 1
- 1200 × 1400 mm
- 3 pcs
- three equal vertical cells: 2, 3, 4
- Cell 2: fixed
- Cell 3: tilt-turn / right (`Двуосно · дясно`)
- Cell 4: fixed
- review status: READY_FOR_HUMAN_REVIEW
- not Human Confirmed yet

## Safety boundary
The demo is QA state only. It does not change or relax any production boundary:

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

The QA demo does not call Human Confirm automatically and does not generate machine output.

## Scope
This hotfix adds only QA/demo infrastructure and UI access. Core geometry, correction, session, offer, commercial and completeness runtimes remain unchanged.
