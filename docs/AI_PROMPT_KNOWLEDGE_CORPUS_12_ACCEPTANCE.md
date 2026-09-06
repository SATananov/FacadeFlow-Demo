# AI PROMPT KNOWLEDGE CORPUS 12 — Interactive Command Runtime

Status: **WORKING / NOT COMMITTED / NOT CLOSED**

## Purpose

Corpus 12 converts the already-tested sequential module session into a real interactive draft runtime:

1. the operator starts a module session;
2. enters one command;
3. presses **Приложи**;
4. sees the current deterministic draft state immediately;
5. enters the next command against the same session state;
6. ambiguous commands remain visible as `REVIEW_REQUIRED` without mutating the visible module;
7. later clear commands may continue from the last valid visible state.

This is the workflow described for practical offer/module construction: module quantity and frame first, then dividers/cells/sashes command by command.

## Stable Cell ID rule

Cell IDs are stable while the cell remains unchanged. Existing active cells are never globally renumbered.

If a cell is structurally divided, that cell is retired and its children receive new IDs. Other active cell IDs remain unchanged. Correction-only operations such as moving a divider or changing a sash do not globally renumber cells.

## New runtime layer

`src/aiPromptModuleInteractiveRuntime.ts`

The runtime stores the ordered command list and deterministically rebuilds the current editor binding after each explicit command. It exposes:

- current step;
- current editor frame;
- last-command status;
- whether the last command was applied;
- whether the visible state changed;
- unresolved count;
- full safety boundary.

Supported explicit runtime controls:

- create from existing module source text;
- apply one new command;
- reload explicitly from the source description;
- clear and start a new local session.

There is no hidden automatic synchronization between the main description textarea and the interactive runtime after the runtime has started.

## UI integration

`src/components/ModuleCommandInteractiveRuntimePanel.tsx`

The AI workspace now contains a simulation-only interactive module command panel when the current source text contains a module/frame anchor. The panel provides:

- **Следваща команда** input;
- **Приложи** action;
- **Зареди описанието** explicit reload;
- **Нова сесия** explicit local reset;
- current frame visualization;
- active and retired Cell IDs;
- quantity and frame dimensions;
- command history;
- visual focus on an active cell;
- `REVIEW_REQUIRED` feedback without geometry mutation.

Selecting a cell is only a visual focus and never changes construction state by itself.

## Corpus

Exactly **200** interactive sessions, split 50/50/50/50:

- `STEPWISE_BUILD_APPLY`
- `STEPWISE_CORRECTION_APPLY`
- `STEPWISE_UNDO_CONTINUATION`
- `STEPWISE_REVIEW_RECOVERY`

Every case is executed one command at a time rather than as one pre-composed session prompt.

## Generator verification

- Corpus 12 deterministic evaluator: **200/200 PASS**
- Pure TypeScript runtime/import chain with strict + no-unused checks: **PASS**
- New React interactive panel JSX/type check with local React stubs: **PASS**
- Corpus 07–11 interpreters remain unchanged from the Corpus 11 baseline.

The full local repository verification must still be run on the user's real checkout with installed dependencies.

Expected test-file boundary after apply:

- total `*.test.ts`: **156**
- internal excluded: **19**
- shareable regression: **137**

## Safety boundary

Corpus 12 does **not** grant production authority.

- `humanReviewRequired = true`
- `rulesValidated = false`
- `automaticGeometryAllowed = false`
- `simulationOnly = true`
- `machineReady = false`
- `productionApproved = false`

The interactive Apply button applies commands only to a local deterministic draft state. It is not production handoff, machine output, rule validation, or production approval.

## Working phase boundary

- AI05.3: **WORKING / NOT CLOSED**
- PROFILE DATA 03: **WORKING / NOT CLOSED**
- PROMPT CORPUS 01–12: **WORKING / NOT COMMITTED**
- NO COMMIT / NO PUSH
