# AI QUICK SELECT 01 — Product / Module Presets — WORKING

## Goal
Make the everyday FacadeFlow flow selection-first instead of requiring the operator to rewrite the same product description for every standard product/module.

## Scope
- Primary AI input now offers **Quick Select** and **Describe with AI** as sibling modes.
- Quick Select supports product dropdown, field-count configuration, dimensions, quantity, visual opening presets, and optional known technical values.
- The prepared result is still plain structured source text and goes through the existing local interpreter / Human Review path.
- Offer Step 3 now exposes a prominent **Quick module** builder.
- A new offer module inherits existing offer defaults automatically; local overrides remain a separate existing action.
- Existing Guided AI Command Builder and free-text command mode remain available for fine editing.
- Sliding presets are visible in Quick Select, but the offer-module runtime explicitly refuses to fabricate sliding geometry until that runtime supports it.

## Safety
- Human Review remains mandatory.
- Rules validated: NO.
- Automatic production geometry: NO.
- Machine ready: NO.
- Production approved: NO.
- No model-weight update or training promotion is introduced.

## Status
WORKING / HUMAN AUDIT REQUIRED.
AI05.3 remains OPEN / WORKING.
PROFILE DATA 03 remains OPEN / WORKING.
REAL TRAINING PACK 01 remains WORKING.
NO COMMIT / NO PUSH.
