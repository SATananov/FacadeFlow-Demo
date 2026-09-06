# AI Selection-First Beginner Offer UX — Human Audit Hotfix 06

## Purpose

This hotfix continues the browser Human Audit after Hotfix 05. It keeps the AI section selection-first and improves the offer workflow for a person who has project/customer data but does not need to know aluminium/PVC joinery terminology or command syntax.

## Human Audit findings addressed

1. Question-mark help buttons were visually stretched by generic button styles.
2. `Промени` controls did not read clearly as edit actions.
3. Guided creation could show preselected quantity/other parameters that a beginner might apply without consciously choosing them.
4. Recommendations for existing cell actions could distract the user while the selected task was `Създай нов модул`.
5. A new offer did not clearly identify who prepares it and for whom it is prepared.
6. The offer issuer should be prefilled from the provided Nadezhda company header while customer details remain user-entered.

## Offer parties

The first explicit offer step is now `Страни по офертата`.

### Изпълнител

Prefilled only from the company header supplied during Human Audit:

- `НАДЕЖДА`
- `Алуминиева и PVC дограма`
- `6600 Кърджали`
- `кв. „Студен кладенец“`
- `ул. „Дарец“ № 9`
- `nadejda94@mail.bg`

No phone, EIK or other unprovided legal data is invented.

### Възложител

Beginner-facing fields:

- type: physical person / company-organisation;
- name / company — required;
- contact person;
- phone;
- e-mail;
- customer address;
- project address / project name.

Only `тип възложител` and `име / фирма` are required to mark the identity block ready for the working draft. This does not change production authority.

## Guided AI safety/default behaviour

- width starts at `Избери`, never a silent dimension;
- height starts at `Избери`;
- quantity starts at `Избери`;
- split direction, part count, opening type and opening direction also require an explicit selection;
- next free module number may be proposed automatically, with an explanation why it was proposed;
- while `Създай нов модул` is selected, unrelated `Фикс` / `Добави крило` recommendations are hidden;
- `Приложи избора` remains disabled until the deterministic command is complete.

## Visual UX

- help `?` controls use fixed square dimensions and a 1:1 aspect ratio;
- edit actions are rendered as clear `✎ Редактирай` buttons;
- workflow strip: parties → defaults → modules/quantities → Human Review;
- issuer/customer cards have distinct hierarchy and readiness feedback;
- all new user-facing copy is Bulgarian.

## Verification evidence in generation environment

- Hotfix 06 focused tests: 8/8 PASS.
- Human Audit Hotfix 01–06 focused chain: 40/40 PASS.
- Corpus 14 + Corpus 16 targeted regression: 13/13 PASS.
- TypeScript noEmit check for changed/new TS/TSX files: PASS.
- Critical geometry/correction/session/offer/completeness runtime files are unchanged from the confirmed Hotfix 05 baseline.

Expected local repository test boundary after apply:

- TOTAL TEST FILES: 166
- INTERNAL EXCLUDED: 19
- SHAREABLE TEST FILES: 147

## Safety boundary

- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO
- AI05.3 = WORKING / NOT CLOSED
- PROFILE DATA 03 = WORKING / NOT CLOSED
- CORPUS 01–16 = WORKING / NOT COMMITTED
- NO COMMIT / NO PUSH
