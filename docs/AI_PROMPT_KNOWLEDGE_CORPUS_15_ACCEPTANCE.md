# AI PROMPT KNOWLEDGE CORPUS 15 — Offer Module Quantities + Commercial Summary Context

Status: **WORKING / NOT COMMITTED**

## Purpose

Corpus 15 extends the verified Offer + Multi-Module runtime with a deterministic commercial quantity layer. It keeps module quantity separate from geometry while allowing a quote to summarize how many physical products are represented by its module definitions.

## Runtime contract

- Every module may expose a geometry-origin quantity from its frame command.
- A later explicit module quantity command creates a **commercial override** without changing frame dimensions, cells, dividers or sash geometry.
- `Модул 12 да стане 3 бр.` targets module ID 12 and quantity 3; the two numbers are never conflated.
- Copying a module with an explicit quantity gives the copy its own independent quantity.
- Copying without a new quantity inherits the source module's effective commercial quantity.
- If any module has no quantity, the runtime exposes the known subtotal but **does not claim a complete offer total**.
- Ambiguous quantity commands with no module target remain `REVIEW_REQUIRED` and do not mutate the visible commercial state.
- Zero, negative or otherwise invalid quantity is rejected.
- Summary queries such as `Колко са общо?` are read-only.

## Corpus coverage

- `INITIAL_MODULE_QUANTITIES` — 50
- `QUANTITY_REVISION` — 50
- `COPY_WITH_QUANTITY` — 50
- `COMMERCIAL_SUMMARY_SAFETY` — 50
- **TOTAL — 200**

## Safety boundary

This layer is a local deterministic quote draft. It does not calculate prices, discounts, taxes, material consumption, machine instructions, production approval or validated engineering rules.

- Human Review required: **YES**
- Rules validated: **NO**
- Automatic production geometry: **NO**
- Machine ready: **NO**
- Production approved: **NO**

AI05.3 remains **WORKING / NOT CLOSED**.
PROFILE DATA 03 remains **WORKING / NOT CLOSED**.
