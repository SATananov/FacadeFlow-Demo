# REAL USER WORKFLOW INTEGRATION V1 — Acceptance

Base checkpoint: `c683323`

## Goal

Move FacadeFlow from PROFILE DATA foundation work into the first real prompt-driven user workflow:

`human description → structured intent → reviewed knowledge check → exact clarification questions → human answers → candidate intent → human review → conceptual drawing`

This milestone intentionally does **not** create production validation or machine output.

## Implemented

### 1. Prompt-time workflow state

- `FacadeFlowJobDraft.realUserWorkflow` stores the current workflow in the session state.
- Editing the original description invalidates the derived workflow.
- Renaming/referencing the job does not discard saved clarification answers.
- Human clarification answers are plain candidate input and remain reviewable.

### 2. Real clarification UI

After local prompt interpretation the UI now:

- shows recognized information;
- shows reviewed PRELUDE 60 working semantics when exact codes are explicitly present;
- asks only currently missing structural questions;
- allows the human to type/save an answer;
- allows the human to explicitly keep an item unknown;
- allows PRELUDE 60 canonical profile codes to be **suggested for human confirmation**;
- allows a saved clarification to be removed/rebuilt.

### 3. Early PROFILE DATA usage

For explicit PRELUDE 60 prompts, the workflow may surface these canonical candidates:

- FRAME `482.30`
- SASH `482.05`
- MULLION `482.21`

The candidates are never applied automatically.

When the human explicitly confirms the codes, the UI may display the current reviewed working semantics:

- `482.30` FRAME — 64 mm working dimension / 42 mm visible width
- `482.05` SASH — 78 mm working dimension / 56 mm visible width
- `482.21` MULLION — 84 mm working dimension / 40 mm visible width

These values remain semantic/review evidence only. They are not exact contour geometry or production deductions.

### 4. Natural Bulgarian topology phrase improvement

The local interpreter now recognizes common leaf-count wording such as:

- `двукрилен / двукрилна`
- `трикрилен / трикрила`
- `четирикрилен / четирикрилна`

This identifies the field count only. It does not guess each field role/opening.

### 5. Drawing gate

The parametric/conceptual drawing proposal is withheld while required clarification questions remain.

Optional unknowns may stay explicit and the candidate can still proceed to human review.

## Safety boundary

- HUMAN CLARIFICATION CAPTURE = YES
- PROFILE KNOWLEDGE DIAGNOSTIC = YES
- PROFILE CANDIDATE SUGGESTION = YES, HUMAN CONFIRMATION REQUIRED
- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC EVIDENCE ACCEPTANCE = NO
- AUTOMATIC KNOWLEDGE RESOLUTION = NO
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- PRODUCTION COMPATIBILITY VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO

## Acceptance checks

- focused Real User Workflow V1 tests pass;
- previous PROFILE DATA 03.21–03.29 regressions pass;
- lint passes with no new errors;
- build passes;
- staged diff check passes;
- only intended milestone files are staged.
