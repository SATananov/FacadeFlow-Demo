# FacadeFlow — Human Audit Hotfix 04 Acceptance

## Scope

Hotfix 04 fixes the Human Audit finding that a multi-cell module could become **READY FOR HUMAN REVIEW** after only one cell received an opening. It also adds the first reusable **Guided AI Command Builder** so non-specialists do not need to know exact façade/window terminology or prompt syntax.

This is a working Human Review layer only. It does **not** validate engineering rules, unlock machines, generate production approval, or close AI05.3 / PROFILE DATA 03.

## Per-cell completeness contract

Every **active** Cell ID must have an explicit disposition before the module can pass the opening/fixed completeness check:

- `SASH` — an explicit sash/opening exists in the current module state;
- `FIXED` — the active cell was explicitly marked fixed;
- `UNRESOLVED` — neither state is known.

Example after the audited geometry:

- Cell 2 — unresolved
- Cell 4 — unresolved
- Cell 5 — tilt-turn right sash
- Cell 6 — unresolved

The module therefore remains **INCOMPLETE**. Only after Cells 2, 4 and 6 are explicitly marked fixed (or receive sashes) may the module become **READY FOR HUMAN REVIEW**.

A legacy single-cell command such as `... каса 1500 x 1400 mm, фикс` remains valid because there is only one active cell and the fixed intent is unambiguous.

## Guided AI UX foundation

The Offer Workspace now contains a guided command builder next to the existing free-text command box. The operator can select an action and context-aware parameters instead of memorizing technical prompt syntax.

Supported guided actions include:

- create module with frame dimensions and quantity;
- open/switch module;
- copy module;
- set quantity;
- set/change frame dimensions;
- split an active cell vertically/horizontally into equal parts;
- explicitly mark a cell fixed;
- add a sash;
- change an existing sash;
- move/delete a divider;
- update an offer-wide setting;
- update a setting for one module only;
- Undo;
- commercial total query.

Context rules:

- retired Cell IDs are not offered;
- Add Sash offers only active cells without a sash;
- Change Sash offers only active cells with a sash;
- divider actions offer only current divider IDs;
- module actions offer only current module IDs;
- Human Review unresolved cells expose quick actions **Fix** / **Add sash** that preset the guided builder;
- offer defaults and effective module settings expose **Change** shortcuts that preset the correct offer/module scope.

## Catalogue safety

Hotfix 04 does not invent catalogue options. Finite runtime facts (actions, active cells, directions, opening type, module IDs, divider IDs) are dropdowns. Profile-system, finish, glazing and hardware values reuse current verified/current-context values and allow an explicit user-entered value. Expanding these to authoritative catalogue-only dropdowns remains gated by PROFILE DATA 03.

## Correction/session compatibility

Explicit FIX is now a valid semantic correction even when a cell never had a sash. Multi-cell fixed commands such as `Клетки 2, 4 и 6 са фиксирани` are accepted when all targets are active.

If a cell was explicitly fixed, a later explicit Add Sash command can change it back to a sash within the same correction/session chain. Current sash state wins over an earlier fixed declaration for completeness.

## Verification in generation environment

- Hotfix 04 targeted node tests: **7/7 PASS**
- Hotfix 01–04 + Corpus 16 targeted regression: **32/32 PASS**
- Corpus 07–16 targeted regression: **62/62 PASS**
- Guided builder + Offer Workspace panel strict TypeScript/JSX selective check: **PASS**
- Package JSON: valid
- Expected local test boundary after apply: **164 total / 19 internal / 145 shareable**

The full repository `npm run test:regression`, `npm run lint`, and `npm run build` must be re-run in the user's Windows repository after applying the ZIP.

## Safety boundary

- AUTOMATIC PRODUCTION GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO
- HUMAN REVIEW REQUIRED = YES
- AI05.3 = WORKING / NOT CLOSED
- PROFILE DATA 03 = WORKING / NOT CLOSED
- CORPUS 01–16 = WORKING / NOT COMMITTED
- NO COMMIT / NO PUSH
