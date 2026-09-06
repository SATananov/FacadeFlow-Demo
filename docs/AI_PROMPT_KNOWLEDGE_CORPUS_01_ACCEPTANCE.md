# AI PROMPT KNOWLEDGE CORPUS 01 — Acceptance

## Status

WORKING LAYER / NOT A CLOSURE OF AI05.3 OR PROFILE DATA 03.

This package is based on the working checkpoint immediately before Prompt Corpus 01. It must not be used as evidence that unrelated working files are committed or closed.

## Goal

Add a synthetic/private-safe prompt knowledge and regression corpus with exactly 200 prompts:

- 50 conversational prompts
- 50 technical prompts
- 50 mixed-language / mixed-style prompts
- 50 incomplete or ambiguous prompts

The corpus is evaluation knowledge. Runtime interpretation remains deterministic and semantic; it does not select an answer by exact prompt-string lookup.

## Added

- `src/aiPromptKnowledgeCorpus01.ts`
- `tests/aiPromptKnowledgeCorpus01.test.ts`
- `npm run test:ai_prompt_corpus01`

## Interpreter hardening driven by the corpus

1. Safe dimension-unit handling.
   - `180 на 140 см` may safely share centimetres and becomes `1800 × 1400 mm`.
   - Explicit mixed units such as `1.8 m x 1400 mm` are converted independently.
   - Ambiguous forms such as `1.8 x 1400 mm`, `180 x 1.4 m`, and decimal dimensions without units remain unresolved.
2. Natural opening phrases such as `се отваря наляво/надясно` and English `turn right/left` bind direction to a field.
3. Numeric field addressing supports `field 1 ...`, `поле 1 ...`, and compact `F1=...` clauses.
4. Two-field shared sliding language such as `и двете плъзгащи` is supported.
5. Elliptical sliding field clauses may inherit SLIDING only when the whole prompt already contains explicit sliding semantics.
6. Short lower-panel syntax such as `долен панел 500 mm` is supported.
7. Word quantities such as `четири броя` are supported.
8. A handle colour no longer prevents a later explicit profile/product colour from being considered.
9. Prompt live preview no longer invents quantity `1` when quantity was not supplied.

## Audit hygiene included

- AI05.3 UI test drift is corrected so visual labels are asserted in `aiDrawingVisualGrammar.ts`, where the architecture now owns them.
- `.gitignore` protects local AI training `.venv`, `__pycache__`, input and output working material from accidental `git add -A`.

## Safety invariants

Every corpus case asserts:

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

Ambiguous or incomplete prompts are expected to remain unresolved rather than receive invented values.

## Verification status for this package

Verified in the isolated checkpoint build workspace:

- Corpus count: 200
- Distribution: 50 / 50 / 50 / 50
- IDs unique: PASS
- Prompt strings unique: PASS
- Deterministic corpus evaluation: 200 / 200 PASS
- Focused TypeScript compilation of interpreter + corpus layer: PASS
- Legacy AI01 interpreter probes: PASS

Must be run in the user's repository after APPLY:

- `npm run test:ai_prompt_corpus01`
- `npm run test:ai01_2`
- focused AI05.3 test
- `npm run lint`
- `npm run build`
- full `npm run test:regression` before any commit/closure decision
