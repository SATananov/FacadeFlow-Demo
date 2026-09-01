# REAL PRODUCTION DATA — RP01.13 Dry-Run Result Review / Simulation Outcome Validation Foundation

## Purpose

RP01.13 adds a human review record over an RP01.12 `LOCAL_SIMULATION_DRY_RUN_RECORD`.

It validates only whether the observed dry-run result matches the reviewer’s expected simulation
outcome for the reviewed input and scenario.

RP01.13 does not promote the rule to engineering truth or production authority.

## Human decisions

Supported decisions:

- `VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME`
- `REJECTED_SIMULATION_OUTCOME`

The reviewer must explicitly provide:

- expected boolean result;
- validator;
- validation timestamp;
- rationale.

A positive validation is refused when the declared expected result contradicts the actual dry-run
result.

## Current-source requirement

RP01.13 re-checks the active RP01.11 simulation gate and binds the review to the RP01.12 adapter
and execution fingerprint.

The reviewed dry-run must still match:

- adapter ID/version;
- executable draft ID;
- simulation gate ID;
- simulation validation record ID;
- exact executable expression;
- exact input snapshot and execution timestamp;
- stored RP01.12 execution fingerprint.

## Safety boundary

The dry-run and adapter must retain all simulation-only safety flags.

A positive outcome review sets only:

`simulationOutcomeValidated = true`

It does not set:

- `engineeringRuleValidated = true`
- `productionExecutable = true`
- `machineInstructionGenerated = true`
- `productionRuleCreated = true`
- `productionUnlockAllowed = true`
- `machineReady = true`
- `productionApproved = true`

All of those remain false.

## Invalidation

`RP01.13-DRY-RUN-OUTCOME-V1` binds the decision to the exact dry-run, adapter, gate, execution
fingerprint, input, result, and source draft fingerprint.

If the dry-run evidence, adapter binding, gate state, or source chain changes, the old review
becomes:

`STALE_REQUIRES_REVIEW`

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`.

The real pipeline remains blocked upstream because there is no second real corroborating project.
`SYNTHETIC_TEST_PROJECT_B` remains test-only algorithm evidence.

## Acceptance

PASS requires:

- RP01.13 focused real-corpus + synthetic algorithm-only tests;
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
