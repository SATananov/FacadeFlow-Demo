# PHASE 06C.3.1.1 — AI DEMO TERMINOLOGY CLARITY

## Goal
Make the visible Bulgarian wording in the full AI DEMO suite immediately understandable to a non-developer user.

## Visible terminology
- `Води ме / описание` becomes `Стъпка по стъпка / описание`.
- `Воден прозорец` becomes `Прозорец · стъпка по стъпка`.
- `Водена врата` becomes `Врата · стъпка по стъпка`.
- DEMO job names and descriptions use the same wording.
- The Human Review panel describes the workflow as `Формулярът „Стъпка по стъпка“`.

## Compatibility
Internal stable enum/scenario identifiers such as `GUIDED_WINDOW` and `GUIDED_DOOR` are intentionally unchanged. This is a UX terminology cleanup only.

## Safety
No project data, catalogue data, geometry, AI inference, persistence, rules validation, machine-ready state or production approval logic is changed.

## Acceptance
- `npm run test:phase06c3_1_1`
- Regression: `npm run test:phase06c3_1`
- Regression: `npm run test:phase06c3`
- `npm run lint`
- `npm run build`
- Human visual review confirms that window and door DEMO cards are unambiguous.
