# PROFILE DATA 01.2A — PRELUDE Overlap UI / Renderer Wiring Acceptance

## Goal
Wire the already accepted PROFILE DATA 01.2 sash-overlap model into the existing custom 2D renderer without creating a second geometry model or any production authority.

## Accepted behavior
- The active FRAME / SASH / MULLION catalogue selections are resolved to exactly one profile system.
- A sash overlap is applied only when that exact selected system exists in the registered system catalogue and exposes an explicit positive `sashOverlapMm`.
- PRELUDE 60 currently resolves to the human-reviewed working value `7 mm`.
- DEMO SYSTEM, mixed systems, missing profile IDs and unregistered systems receive no overlap.
- The resolved value is passed explicitly to `CustomProductDrawing` through `sashOverlapMm`.
- The existing PROFILE DATA 01.2 segment-aware geometry remains the only implementation of effective visible width.
- The custom designer shows a visible audit readout: system, overlap in mm, working-value status and production-confirmation warning.
- The UI readout is informational. This phase does not add an editor for catalogue-system engineering values.

## Human audit targets
For PRELUDE 60 with the current 7 mm working value:
- frame 482.30: `42 -> 35 mm` where a sash overlaps; `42 mm` where no sash touches;
- mullion 482.21: `40 -> 33 mm` with sash on one side;
- mullion 482.21: `40 -> 26 mm` between two sashes;
- mullion 482.21: `40 mm` with no sash on either side.

A mixed `sash / fixed` or `sash / fixed / sash` construction should be used to verify segment-aware behavior visually.

## Safety boundary
`HUMAN_REVIEWED_WORKING_VALUE` is not production confirmation.

This phase does not:
- select profiles automatically;
- infer a profile system from dimensions or geometry;
- invent a fallback overlap;
- alter sash visible width from the overlap rule;
- create machine output;
- set `machineReady=true`;
- set `productionApproved=true`.
