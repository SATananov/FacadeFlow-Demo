# AI PROMPT KNOWLEDGE CORPUS 02 — WORKING ACCEPTANCE

Status: **WORKING ACCEPTANCE / NOT COMMITTED**

This layer extends FacadeFlow prompt regression knowledge from generic construction-language coverage into **profile-aware construction language**. It does not close AI05.3 or PROFILE DATA 03 and it does not grant production authority.

## Scope

Corpus 02 contains exactly **200 synthetic/private-safe prompts** split into four 50-case tracks:

- `PROFILE_ROLES` — 50 prompts for PRELUDE 60 role language and aliases around frame/sash/mullion references.
- `PROFILE_TOPOLOGY` — 50 prompts combining profile roles with two- and three-field opening topology.
- `MATERIAL_HARDWARE` — 50 prompts combining known profile references with glazing, finish, handles, hinges, handle height, and hardware wording.
- `REVIEW_BOUNDARY` — 50 prompts covering ambiguous dimensions, missing profile system, conflicting profile-role references, and explicit unknown profile references.

The corpus uses the already established PRELUDE 60 language anchors:

- frame / каса: `482.30`
- sash / крило: `482.05`
- mullion / делител: `482.21`

These values are used as prompt-language/evidence anchors only. Corpus 02 does **not** validate profile compatibility or catalogue completeness.

## Parser hardening introduced with Corpus 02

`src/aiPromptInterpreter.ts` is hardened in three narrowly scoped ways:

1. Profile-role aliases now accept additional conversational/technical labels such as `профил за каса`, `профил каса`, `frame section`, `профил за крило`, `sash section`, `профил за делител`, and `mullion section`.
2. Bulgarian ordinal field clauses such as `първо fixed`, `второ tilt-turn left`, `трето fixed` are bound to the correct field instead of remaining globally ambiguous.
3. Conflicting explicit profile references for the same role are no longer silently resolved. Example: `frame 482.30, frame 999.22` leaves the frame profile unresolved, emits a conflict warning, and requires Human Review.

Single-field mixed-language direction phrases such as `tilt-turn наляво` and `turn надясно` are also recognized without changing production authority.

## Safety boundary

Every Corpus 02 interpretation must preserve:

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

Explicit unknown profile references may be preserved as source evidence, but they are never treated as catalogue validation.

## Verification evidence for this generated working ZIP

Targeted source-level verification was executed in the generation environment:

- Corpus 02: **200/200 cases PASS**
- Corpus 01 regression after parser hardening: **200/200 cases PASS**
- Corpus 01 + Corpus 02 emitted Node test suites: **7/7 tests PASS**
- AI01.2 + AI05.3.1 + AI05.3.2 targeted regression: **16/16 tests PASS**
- Selective TypeScript compilation of the modified interpreter/corpus source: **PASS**

The source ZIP intentionally contains no `node_modules`. Full `npm run test:regression`, `npm run lint`, and `npm run build` could not be re-run in the generation sandbox because dependency restoration is unavailable offline. Adding `tests/aiPromptKnowledgeCorpus02.test.ts` raises the shareable test-file count from **126 to 127**; the normal project regression runner will include it automatically.

## Working-state boundary

- AI PROMPT KNOWLEDGE CORPUS 01 = **WORKING ACCEPTANCE / NOT COMMITTED**
- AI PROMPT KNOWLEDGE CORPUS 02 = **WORKING ACCEPTANCE / NOT COMMITTED**
- AI05.3 = **WORKING / NOT CLOSED**
- PROFILE DATA 03 = **WORKING / NOT CLOSED**

No commit, push, production unlock, machine-ready claim, or rules-validation closure is implied by this package.
