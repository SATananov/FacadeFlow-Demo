# AI01.2 — Prompt Interpretation Adapter — Acceptance

## Goal

Turn explicit free-text product descriptions into the canonical `FacadeFlowProductIntent` contract introduced in AI01.1, without network calls, automatic geometry, production authority, or invented missing engineering facts.

## Accepted behavior

- Bulgarian and English prompt text can be interpreted locally with deterministic extraction rules.
- Explicit overall dimensions are normalized to millimetres.
- Explicit product type, mark, quantity, field count, field roles/opening hints, profile system/profile labels, finish, glazing, handle, hinge quantity/type, opening direction and swing can be captured when present.
- Every interpretation preserves the original prompt as source evidence.
- Missing values remain unresolved.
- Ambiguous multi-field opening language is not applied to every field automatically.
- Output always requires human review.

## Safety boundary

- External AI model: **NOT CONNECTED**
- Network access: **NO**
- Automatic geometry: **NO**
- Rules validated: **NO**
- Machine ready: **NO**
- Production approved: **NO**

## Verification

`npm run test:ai01_2`
