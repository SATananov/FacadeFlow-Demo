# AI Offer Workspace Human Audit UI Integration Hotfix

Status: WORKING / NOT COMMITTED

## Human Audit defect

Corpus 14–16 runtime logic existed and passed automated tests, but an offer-only description such as:

- Нова оферта.
- Система PRELUDE 60.
- Цвят RAL 7016.
- Двоен стъклопакет.
- Обков ROTO NX.

left the Offer Runtime UI hidden until a numbered module was already present. In addition, the Offer, Commercial Summary and Completeness panels owned separate local React state, so commands entered in one panel were not guaranteed to appear in the others.

## Hotfix

- Show the offer workspace as soon as the source text establishes offer context.
- Treat line-separated settings following `Нова оферта` as offer defaults while no module exists yet.
- Keep setting-only commands ambiguous after modules exist unless offer/module scope is explicit.
- Use the Corpus 16 completeness runtime as the single UI state owner. It already nests Corpus 15 commercial state, Corpus 14 offer state and the multi-module geometry runtime.
- Keep one visible interactive Offer Workspace in the main AI intake flow instead of three independent offer/commercial/review panels.
- Display offer defaults, module tabs, effective settings, quantity, geometry preview, completeness and Human Confirm from that same state.

## Safety boundaries

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO
- Human Confirm remains review-only.

## Expected test boundary after apply

- Previous total: 160
- New hotfix test file: +1
- Expected total: 161
- Internal excluded: 19
- Expected shareable: 142

NO COMMIT / NO PUSH.
