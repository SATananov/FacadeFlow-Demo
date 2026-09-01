# AI01 Prompt Intelligence Bundle — AI01.2 → AI01.4

This bundle is the first usable Natural Language → Product Intent path in FacadeFlow.

## Flow

`Prompt text → local deterministic interpretation → Canonical Product Intent → human-visible review → explicit transfer → Guided Product Builder → existing Human Confirm gate`

## What it can do now

It can recognize common explicit product language such as dimensions, product category, quantity, simple field layout hints, profile system/codes, opening vocabulary, finish/RAL, glazing, handles and hinges.

## What it deliberately cannot do yet

- No LLM/API/model call.
- No document/PDF/DWG semantic extraction.
- No inferred engineering rules.
- No automatic multi-field geometry.
- No automatic profile compatibility decision.
- No automatic Human Confirm.
- No production or machine export.

## Next architectural layer

A future model adapter may produce the same canonical `FacadeFlowProductIntent` contract. The UI and human-review bridge must not depend on a particular AI provider.
