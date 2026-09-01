# AI02.2 — Document Product Candidates & Conflict Review — Acceptance

## Goal
Turn explicit product rows/text blocks from project documents into review-only Product Intent candidates and compare repeated marks across independent sources.

## Accepted scope
- Candidate detection requires explicit dimensions plus product type or mark.
- AI01 deterministic Product Intent interpretation is reused.
- Evidence is converted from prompt evidence to DOCUMENT evidence with source file, page and SHA-256.
- Equal marks are grouped across sources.
- Compatible values may be carried into a merged review intent.
- Conflicting values are surfaced explicitly and the merged value becomes unresolved instead of selecting a winner.

## Conflict fields
Product type, width, height, quantity, profile system, finish, glazing and field/opening topology.

## Safety boundary
No candidate is human-confirmed automatically. No conflict is resolved automatically. No rule validation or geometry generation occurs.
