# Phase 06C.3.2.1 — Bulgarian Pipeline Labels Acceptance

## Scope

Display-only cleanup for the Phase 06C.3.2 unified DEMO review pipeline.

## Acceptance

- [x] Visible `NEEDS REVIEW` is rendered as `НУЖЕН ЧОВЕШКИ ПРЕГЛЕД`.
- [x] Visible `HUMAN REVIEWED` is rendered as `ЧОВЕШКИ ПРЕГЛЕД · ГОТОВ`.
- [x] `Human Review` and `Handoff` step labels are Bulgarian.
- [x] `SINGLE_PRODUCT` is not exposed as the packet context summary; the user sees `Единично изделие`.
- [x] `MANUAL evidence` is rendered as Bulgarian provenance copy.
- [x] Safety footer and live-product safety labels are Bulgarian.
- [x] Internal enums remain unchanged: `NEEDS_REVIEW`, `HUMAN_REVIEWED`, `HUMAN_CONFIRMED`.
- [x] Human review remains an acknowledgement only and never becomes product confirmation, rules approval, persistence or machine readiness.
- [x] No network, backend, persistence, automatic geometry or production path is added.
