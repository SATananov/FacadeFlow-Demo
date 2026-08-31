# PHASE 06C.2 — REAL NADEZHDA CATALOGUE FOUNDATION

## Scope

Introduce a source-backed, read-only evidence layer from the locked real Nadezhda project samples before any expert profile-role mapping is treated as catalogue truth.

## Locked evidence

- Project evidence label: `Вадим-2`.
- SkyGlazing XML SHA-256: `1FAFBDE7A13A28936EDC9FE9382DB5F50DA6B22D8168CF5959D95AE053E8DF08`.
- LTE SHA-256: `6D753E558A1EA330573F2555F34603CD406EC9C6842A4CAB4EE210D1450A272A`.
- XML pieces: 46.
- LTE fixed-width records: 84.
- XML barcodes found in LTE: 46/46.
- XML machining operations: 220.
- Observed profile codes only: `78.01`, `78.27`, `78.33`, `78.51`.

## Human-gate rules

1. An observed code is **not** automatically a frame, sash or mullion.
2. Evidence starts with role `UNCONFIRMED`.
3. A person must explicitly choose `Каса`, `Крило` or `Делител` before the evidence is prepared for catalogue review.
4. The prepared catalogue record has status `SOURCE_EVIDENCE`, not `EXPERT_CONFIRMED`.
5. The system label stays explicitly unconfirmed until Nadezhda supplies the authoritative system/manufacturer mapping.
6. Source evidence may participate in simulation dropdowns after the human role assignment, but the AI Builder must warn that role/system still require expert confirmation.

## Safety boundary

- No network access.
- No persistence layer.
- No AI inference.
- No automatic role inference.
- No automatic geometry.
- No machine writer/export.
- No production approval.
- `simulationOnly = true`.
- `machineReady = false`.

## Reproducibility

Run `npm run audit:nadezhda-evidence` against `local-samples/phase05a` to recompute SHA-256, XML/LTE counts, barcode match and per-code evidence. The audit is read-only and fails if the locked sample facts change.
