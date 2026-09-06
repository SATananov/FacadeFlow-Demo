# AI PROMPT KNOWLEDGE CORPUS 03 — WORKING ACCEPTANCE

Status: **WORKING ACCEPTANCE / NOT COMMITTED**

Corpus 03 raises FacadeFlow prompt regression from isolated attribute/profile recognition into **whole-construction prompt understanding**. It deliberately combines dimensions, quantity, marks, field topology, opening semantics, profile roles, glazing, finish, handles, hinges, hardware, door lower-panel semantics, and incomplete/conflicting instructions in the same prompt.

It does not close AI05.3 or PROFILE DATA 03 and does not grant production authority.

## Scope

Corpus 03 contains exactly **200 synthetic/private-safe prompts** split into four 50-case tracks:

- `COMPOSITE_COMPLETE` — 50 dense complete window descriptions with quantity, mark, dimensions, PRELUDE 60 profile roles, two/three/four-field topology, glazing, finish, handle, hinges, handle height, and hardware.
- `DENSE_MIXED_LANGUAGE` — 50 mixed BG/EN technical prompts with mm/cm/m dimension forms plus ordinal, numeric, and `F#` field bindings.
- `DOOR_PANEL_COMPLETE` — 50 single-leaf door prompts with punctuation variants, opening direction, inward/outward swing, lower panel, upper glazed zone, threshold, finish, handle, and hinges.
- `CONFLICT_AND_INCOMPLETE` — 50 prompts proving that known values are preserved while ambiguous dimensions, conflicting profile references, conflicting RAL values, conflicting glazing declarations, conflicting hinge quantities, missing profile systems, and ambiguous lower-panel binding remain unresolved.

PRELUDE 60 role anchors remain evidence-language anchors only:

- frame / каса: `482.30`
- sash / крило: `482.05`
- mullion / делител: `482.21`

Corpus 03 does **not** validate profile compatibility, structural suitability, hardware compatibility, fabrication tolerances, or catalogue completeness.

## Parser hardening introduced with Corpus 03

`src/aiPromptInterpreter.ts` receives narrowly scoped deterministic hardening:

1. Bulgarian quantity phrases such as `четири броя` are recognized without relying on ASCII word-boundary behavior around Cyrillic text.
2. Quantity and single-leaf expressions tolerate normal punctuation such as `1 бр.,` and `еднокрила,`.
3. Dimension conversion normalizes floating-point noise when converting metres/centimetres to millimetres.
4. Multiple distinct `RAL` values in one prompt are treated as a finish conflict; no first-value winner is selected.
5. Simultaneous double/triple glazing declarations are treated as a glazing conflict; no glazing value is selected automatically.
6. Multiple distinct hinge quantities are treated as a hardware conflict; no hinge quantity is selected automatically.

These changes preserve existing Corpus 01 and Corpus 02 expectations.

## Whole-construction acceptance rule

For complete Corpus 03 tracks, the interpreter must preserve the full deterministic intent while still returning:

- `status = NEEDS_REVIEW`
- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

For conflict/incomplete cases, the interpreter must retain independent known values but keep the conflicted/missing item unresolved instead of guessing.

## Verification evidence for this generated working ZIP

Generation-environment source verification:

- Corpus 03: **200/200 cases PASS**
- Corpus 02 regression after Corpus 03 hardening: **200/200 cases PASS**
- Corpus 01 regression after Corpus 03 hardening: **200/200 cases PASS**
- Corpus 01 + Corpus 02 + Corpus 03 emitted Node test suites: **12/12 tests PASS**
- Modified interpreter + Corpus 01/02/03 TypeScript compile with `noUnusedLocals` / `noUnusedParameters`: **PASS**
- Corpus 03 unique ids: **200/200**
- Corpus 03 unique prompt texts: **200/200**
- Complete whole-construction cases with zero unresolved items: **150/150**
- Semantic conflict cases (finish/glazing/hinge quantity): **30/30 remain unresolved**
- Door lower-panel topology cases: **50/50 preserve one field + lower panel + upper glazed zone**

Adding `tests/aiPromptKnowledgeCorpus03.test.ts` raises the normal shareable regression test-file count from **127 to 128**. Internal test exclusions remain **19**.

The generated ZIP contains no `node_modules`; full project `npm run test:regression`, `npm run lint`, and `npm run build` must be re-run on the user's local FacadeFlow repository after applying the Corpus 03 files.

## Working-state boundary

- AI PROMPT KNOWLEDGE CORPUS 01 = **WORKING ACCEPTANCE / NOT COMMITTED**
- AI PROMPT KNOWLEDGE CORPUS 02 = **WORKING ACCEPTANCE / NOT COMMITTED**
- AI PROMPT KNOWLEDGE CORPUS 03 = **WORKING ACCEPTANCE / NOT COMMITTED**
- AI05.3 = **WORKING / NOT CLOSED**
- PROFILE DATA 03 = **WORKING / NOT CLOSED**

No commit, push, automatic-geometry unlock, rules-validation closure, machine-ready state, or production approval is implied by this package.
