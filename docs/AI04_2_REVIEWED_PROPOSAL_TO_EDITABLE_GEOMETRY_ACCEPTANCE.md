# AI04.2 — Reviewed Proposal → Editable Geometry — Acceptance

Status: ACCEPTED FOR V1 HUMAN AUDIT

## Geometry mapping
- Overall width/height are copied from the human-reviewed AI03 proposal.
- Linear vertical or horizontal divider positions are converted into the existing nested `CustomGeometryNode` tree without changing their physical positions.
- FIXED fields stay fixed.
- OPENING_SASH fields stay opening sashes.
- LEFT/RIGHT direction is preserved when explicitly available.
- TURN / TILT / TILT_TURN opening type is preserved as editable field metadata.
- UNRESOLVED fields become `PLACEHOLDER` and remain visibly unresolved.
- SLIDING_SASH and PANEL are blocked in V1 because the current Custom Product Designer has no safe semantic equivalent.

## Profile safety
AI04 transfers only exact selectable catalogue profile evidence. A system name alone never selects frame/sash/mullion profiles. Missing exact profiles remain unresolved and the Custom Product Designer validation remains active.
