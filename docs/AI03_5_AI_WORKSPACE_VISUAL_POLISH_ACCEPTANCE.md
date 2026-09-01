# AI03.5 — AI Workspace Visual Layout / Proposal UI Polish — Acceptance

## Scope

UI-only closure polish for the already accepted AI03 parametric construction proposal flow.

## Accepted changes

- The AI02 document intelligence body spans the full two-column mode-panel width. The former empty right-side area below the extraction legend is removed.
- The AI03 proposal header is compact and no longer uses an oversized mixed-language title.
- User-facing status labels are Bulgarian: `Нуждае се от преглед`, `Прегледано от човек`, `Блокирано`.
- User-facing field roles use Bulgarian labels, including `ФИКСИРАНО`.
- Internal geometry enum `EQUAL_DISTRIBUTION_PROPOSAL` is presented as `Равномерно разпределение (предложение)`.
- `Evidence` is presented as `Доказателства`.
- The proposal is visually separated into `2D предложение`, `Ключови данни`, assumptions/review details, and `Човешка проверка`.
- Long titles and data values wrap safely instead of overlapping neighboring cards.
- Responsive layout collapses to one column on narrower screens.

## Explicit non-scope

No AI01, AI02, or AI03 inference logic changes.
No evidence merge changes.
No parametric proposal algorithm changes.
No automatic geometry acceptance.
No constructor handoff.
No production-rule validation.
No machine-ready output.

## Safety boundary

- AUTO-GENERATED PROPOSAL: YES
- AUTOMATIC ACCEPTANCE: NO
- CONSTRUCTOR HANDOFF: NO
- RULES VALIDATED: NO
- MACHINE READY: NO

## Acceptance target

AI03.5 is accepted when `test:ai03`, `test:ai03_5`, lint, build, and `git diff --check` pass and the Human Audit confirms the empty document-layout column and proposal overlap/mixed-label issues are gone.
