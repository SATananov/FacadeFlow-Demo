# PROJECT01.3B — BG UI Language Consistency Pass

## Scope

PROJECT01.3B is a presentation-only language consistency pass for the Projects workspace and the Catalogue/source-review surfaces reached from it.

The phase does **not** change project lifecycle semantics, AI behavior, catalogue eligibility, source evidence, persistence, networking, production readiness, or machine connectivity.

## User-facing changes

- Project Detail headings, lifecycle descriptions and safety chips are Bulgarian.
- Project creation, project library and safe-reuse copy is Bulgarian.
- Project lifecycle/domain blocker messages are translated at the UI boundary; the canonical internal blocker strings remain unchanged.
- Vadim-2 and WP78 source evidence cards use Bulgarian labels and safety copy while preserving technical identifiers such as XML, LTE, WP 78 and profile codes.
- Raw WP78 blocker enum identifiers are mapped to readable Bulgarian messages before rendering.
- Catalogue and embedded profile human-review copy is Bulgarian.
- `PROJECT01.x`, XML, LTE, WP 78, AI, profile codes and units remain unchanged because they are phase/technical identifiers rather than UI language drift.

## Safety boundaries

Still locked:

- session-only project state;
- no backend/database persistence;
- no network behavior;
- no automatic similarity execution;
- no automatic reuse;
- `machineReady: false`;
- `productionApproved: false`;
- `productionExecutable: false`.

Internal enum and field names remain canonical English identifiers in TypeScript. Only their visible presentation is localized.

## Acceptance

- PROJECT01.3B dedicated language-consistency tests pass.
- Existing PROJECT01/UI01/06C source-contract tests are updated only where the visible Bulgarian wording intentionally changed.
- No lifecycle transition or safety contract is modified.
- Human visual audit required before PROJECT01.3 / 01.3A / 01.3B closure.
