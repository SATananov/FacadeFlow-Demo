# REAL PRODUCTION DATA — RP01.19 Reviewed Evidence Consumer Contract / UI-AI Boundary Foundation

## Purpose

RP01.19 formalizes how UI and future AI consumers may use an RP01.18 reviewed-evidence read model.

The contract separates two permitted read-only actions from prohibited inference and authority
actions.

The permitted actions are:

- display an available reviewed-evidence projection;
- expose an available reviewed-evidence projection to AI context as reference-only evidence.

No prediction, engineering authority, production authority, or machine instruction is created.

## Contract states

`READ_ONLY_CONSUMER_CONTRACT_ACTIVE`

Requires an RP01.18 read model with:

- `state = AVAILABLE_FOR_READ_ONLY_CONSUMER`;
- `reviewedEvidenceAvailable = true`;
- a non-null consumer projection.

`NO_REVIEWED_EVIDENCE_CONTRACT`

Used when the RP01.18 model is unavailable or has no projection.

## UI boundary

When the contract is active, the UI may:

- display the reviewed-evidence projection;
- display historical reviewed observed simulation results;
- display historical reviewed expected simulation results.

The UI must:

- label the content as reviewed simulation evidence;
- preserve exact reviewed-scenario scope;
- keep the projection read-only.

The UI may not:

- present the evidence as a prediction;
- present the evidence as engineering approval;
- present the evidence as production approval;
- trigger machine instruction generation.

## AI-context boundary

When the RP01.18 read model permits AI-context exposure, RP01.19 may set:

`mayReceiveReviewedEvidenceContext = true`

The purpose is still strictly:

`REFERENCE_ONLY`

The AI-context contract must preserve the exact evidence scope and may not:

- treat evidence as prediction;
- infer an unreviewed scenario outcome;
- generalize across scenarios;
- claim engineering validation;
- claim production readiness;
- generate machine instructions.

## Action gate

RP01.19 adds explicit action assessment.

Only these actions may return `ALLOWED_READ_ONLY` when evidence is available:

- `DISPLAY_REVIEWED_EVIDENCE`
- `EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT`

These remain blocked:

- `TREAT_EVIDENCE_AS_PREDICTION`
- `INFER_UNREVIEWED_SCENARIO_OUTCOME`
- `GENERALIZE_ACROSS_SCENARIOS`
- `CLAIM_ENGINEERING_VALIDATION`
- `CLAIM_PRODUCTION_READINESS`
- `GENERATE_MACHINE_INSTRUCTION`

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

The real production-data chain therefore remains blocked upstream because there is still no second
real corroborating project.

Focused RP01.19 tests use synthetic RP01.17 query results only to test the UI/AI consumer boundary.

## Safety boundary

RP01.19 always keeps:

- `automaticOutcomeInferenceAllowed = false`
- `inferredOutcome = null`
- `scenarioGeneralizationAllowed = false`
- `inferenceBeyondReviewedScenariosAllowed = false`
- `engineeringRuleValidated = false`
- `engineeringAuthorityGranted = false`
- `automaticRulePromotionAllowed = false`
- `productionExecutable = false`
- `machineInstructionGenerated = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`
- `productionAuthorityGranted = false`

No CNC/machine output, production export, or production unlock is created.

## Acceptance

PASS requires:

- RP01.19 focused tests;
- RP01.18 regression;
- RP01.17 regression;
- RP01.16 regression;
- RP01.15 regression;
- RP01.14 regression;
- RP01.13 regression;
- RP01.12 regression;
- RP01.11 regression;
- RP01.10 regression;
- RP01.9 regression;
- RP01.8 regression;
- RP01.7 regression;
- RP01.6 regression;
- RP01.5 regression;
- RP01.4 regression;
- RP01.3 regression;
- RP01.2 regression;
- RP01.1 regression;
- Nadezhda evidence regression and audit;
- WP78 project-system evidence regression;
- WP78 evidence-aware rule-gate regression;
- lint;
- production build.
