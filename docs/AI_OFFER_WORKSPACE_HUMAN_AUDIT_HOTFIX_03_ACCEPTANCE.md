# Human Audit Hotfix 03 — Cell Opening + Review Rail Synchronization

Status: WORKING / NOT COMMITTED

## Human-audit defects closed

1. Natural Bulgarian sash command `Постави крило в клетка 5, отваряемо и падащо, дясно.` was previously rejected because the geometry vocabulary only recognized `двуос` / `tilt-turn`.
2. The right legacy `AI предложение` rail remained stale after the unified Offer Workspace accumulated module dimensions, quantity and opening state.

## Changes

- One shared deterministic opening parser now recognizes `двуосно`, `осово-откидно`, `отваряемо и падащо`, `отваряемо + откидно`, reversed wording, and `tilt-turn`, while keeping explicit direction mandatory.
- Correction commands reuse the same opening/direction vocabulary.
- `aiOfferWorkspaceUiSnapshot.ts` derives a read-only active-module snapshot from the unified Corpus 14–16 runtime.
- Offer Workspace publishes that snapshot upward; the existing right review rail consumes it for module dimensions, quantity, inherited offer settings, dividers, sash/opening summary and completeness progress.
- The source description is not overwritten by interactive commands.

## Safety

- Human Review remains mandatory.
- RULES VALIDATED = NO.
- MACHINE READY = NO.
- PRODUCTION APPROVED = NO.
- AUTOMATIC PRODUCTION GEOMETRY = NO.
- No commit / no push.
