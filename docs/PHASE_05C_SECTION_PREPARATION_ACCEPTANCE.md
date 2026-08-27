# Phase 05C — Guided section preparation

Phase 05C adds a Bulgarian, keyboard-accessible six-step review assistant after a human selects a proven DWG section.

The assistant covers section choice, visible dimensions, outer frame, dividers, sashes/opening symbols, and final human review. Every confirmation is session-only and disappears on file clear/reload.

It does not detect or create production components, infer missing dimensions, mutate the DWG, create a product, associate XML/LTE data, export a format, or enable machine connectivity.

Safety remains locked: `simulationOnly: true`, `machineReady: false`, `internalEvaluationOnly: true`. Layout1 remains blocked. Phase 05B GPL/internal-evaluation restrictions remain unchanged.

Acceptance requires Phase 05A and Phase 05B tests, lint, production build, and `git diff --check` to pass. No commit or push is performed by the patch installer.
