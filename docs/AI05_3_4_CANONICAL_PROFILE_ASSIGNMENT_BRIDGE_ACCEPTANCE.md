# AI05.3.4 вЂ” Canonical Profile Assignment Bridge

Status: **WORKING**
Parent: **AI05.3 вЂ” OPEN / WORKING**
PROFILE DATA 03: **OPEN / WORKING**
RTP01: **WORKING**

## Purpose

Preserve explicit canonical profile assignments without loss across:

`Product Intent -> AI05.2 Construction Graph -> AI05.3 Drawing -> conceptual 3D metadata`

for the current PRELUDE 60 working identities:

- FRAME = `482.30`
- MULLION = `482.21`
- SASH = `482.05`

## Bridge rules

1. Product Intent is the assignment authority. Downstream layers may preserve an explicit code, but they may not originate a new code.
2. Graph and Drawing must carry the same explicit code for the same semantic target. Missing or drifting downstream values block the bridge.
3. Downstream target correlation must use stable semantic identity/order. Positional index fallback is not allowed; missing target association blocks the bridge.
4. PROFILE DATA 03.3 validates only `system + role + code` canonical identity. It does not supply geometry.
5. Conceptual 3D receives a separate `profileAssignmentBridge` metadata trace. Existing geometry is not rewritten by this step.
6. System-only input stays unresolved. No PRELUDE default profile set is created.
7. Role mismatches and downstream drift are surfaced as conflicts rather than auto-corrected.

## Safety

- Human review required: **YES**.
- Automatic profile selection: **NO**.
- Automatic system assignment: **NO**.
- Automatic geometry: **NO**.
- Exact profile contour applied: **NO**.
- Geometry mutated by bridge: **NO**.
- Rules validated: **NO**.
- Production unlock: **NO**.
- Machine ready: **NO**.
- Production approved: **NO**.

This step does not close AI05.3, PROFILE DATA 03, or RTP01.
