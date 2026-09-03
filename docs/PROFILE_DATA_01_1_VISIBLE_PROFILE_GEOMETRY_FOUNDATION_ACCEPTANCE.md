# PROFILE DATA 01.1 V2 — Visible Profile Geometry Foundation

## Purpose

This phase converts the production drawing rule into an explicit FacadeFlow contract:

**frame, sash and mullion are structural profiles drawn with visible width; they are not only center lines.**

The CAD Line Tool remains a separate manual drafting tool.

## Human-confirmed PRELUDE 60 values

### 482.30 — frame / каса
- system depth: `60 mm`
- profile height: `64 mm`
- visible width: `42 mm`
- state: `HUMAN_CONFIRMED`

### 482.21 — mullion / делител
- system depth: `60 mm`
- profile height: `84 mm`
- visible width: `40 mm`
- state: `HUMAN_CONFIRMED`

### 482.05 — sash / крило

The sash is explicitly part of the visible-profile geometry contract.

However, its numeric visible width is still **not human-confirmed**. The earlier provisional `56 / 34` interpretation is not stored as confirmed geometry.

- role: `SASH`
- visible band required: `true`
- visible width: `null`
- profile height: `null`
- state: `PENDING_HUMAN_CONFIRMATION`
- placeholder width allowed: `false`
- legacy single-stroke sash allowed: `false`

## Renderer integration

`CustomProductDrawing` now treats all three structural roles as profile geometry:

- frame: four filled bands using the confirmed `42 mm` visible width;
- mullion: filled rectangle using the confirmed `40 mm` visible width;
- sash: real visible-width bands **only when an explicit human-confirmed width is supplied**.

Until the sash width is confirmed, the renderer does not invent a band width. It shows a pending confirmation note instead of the legacy sash outline.

The renderer exposes an optional `sashVisibleWidthByFieldId` input so a future human-confirmed sash width can be applied per sash field without changing the structural contract.

## Frame + sash boundary

The frame+sash assembly still requires explicit overlap semantics. PROFILE DATA 01.1 V2 does not infer overlap, rebate or assembled visible width.

## Safety

- automatic profile selection: disabled
- automatic sash measurement inference: disabled
- structural profile as single stroke: forbidden
- placeholder sash width: forbidden
- frame+sash overlap inference: disabled
- machine ready: false
- production approved: false

## Acceptance

The focused suite covers the confirmed frame/mullion values, mandatory visible-band sash semantics, explicit human-confirmed sash band construction, pending-state rendering, no placeholder width, no legacy sash outline, scaling, safety and production lock.

A visual Human Audit is required after apply.
