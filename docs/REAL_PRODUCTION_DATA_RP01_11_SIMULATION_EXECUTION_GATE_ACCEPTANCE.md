# REAL PRODUCTION DATA — RP01.11 Non-Production Executable Draft Validation / Simulation Execution Gate

## Purpose

RP01.11 adds human validation over the RP01.10 simulation-only executable draft.

A positive decision can open only:

`ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION`

RP01.11 does not execute the expression and does not create a runtime adapter.

## Current real-corpus truth

The locked real corpus still contains only `Вадим-2`, so the real chain remains blocked upstream.
`SYNTHETIC_TEST_PROJECT_B` is used only inside focused tests and is not claimed as a real project.

## Human decision

Supported decisions:

- `VALIDATED_FOR_SIMULATION_EXECUTION`
- `REJECTED_FOR_SIMULATION_EXECUTION`

Validator, timestamp, simulation context, and rationale are mandatory.

The source RP01.10 executable review must remain current and approved, and the complete upstream
source chain must remain unchanged.

## Fingerprint / invalidation

`RP01.11-EXECUTABLE-DRAFT-V1` binds the decision to the exact:

- simulation-only executable draft ID/type/status;
- title, executable expression, execution context, and creation timestamp;
- execution safety flags;
- RP01.10 review;
- RP01.9 gate;
- RP01.8 engineering validation;
- RP01.7 source draft/review;
- RP01.6 promotion gate;
- stored and current RP01.10 evidence fingerprints.

A change makes the old validation `STALE_REQUIRES_REVIEW`.

## Safety boundary

Even when the gate is `ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION`:

- `localSimulationExecutionCompleted = false`
- `runtimeAdapterCreated = false`
- `productionExecutable = false`
- `machineInstructionGenerated = false`
- `automaticMachineTranslationAllowed = false`
- `productionRuleCreated = false`
- `productionUnlockAllowed = false`
- `machineReady = false`
- `productionApproved = false`

No CNC/machine output, production export, or production unlock is created.

## Acceptance

PASS requires focused RP01.11 tests, RP01.10→RP01.1 regressions, Nadezhda evidence regression/audit,
WP78 evidence regressions, lint, and production build.
