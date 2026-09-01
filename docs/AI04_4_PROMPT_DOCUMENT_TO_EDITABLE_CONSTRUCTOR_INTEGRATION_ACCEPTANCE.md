# AI04.4 — Prompt / Document → Editable Constructor Integration — Acceptance

Status: ACCEPTED FOR V1 HUMAN AUDIT

## Entry paths
Both AI03 entry paths expose the same AI04 handoff after AI03 human review:
- Prompt Intelligence → Product Intent → AI03 proposal → Human Review → AI04 editable constructor draft.
- Project Document Intelligence → merged Product Intent → AI03 proposal → Human Review → AI04 editable constructor draft.

## Explicit gate
The AI04 button is not enabled merely because AI03 generated geometry. It appears only after `HUMAN_REVIEWED` and requires a second acknowledgement that the reviewed topology should become an editable simulation draft.

## Safety
`AUTOMATIC CONSTRUCTOR HANDOFF = NO`
`RULES VALIDATED = NO`
`MACHINE READY = NO`
`PRODUCTION APPROVED = NO`
