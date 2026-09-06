# AI05.3.2 — Mixed Opening Semantic Consistency Hotfix

## Problem

A multi-field prompt such as `FIX | OPEN | FIX` was parsed correctly at field level, but the product-level recognition card could still display `Отваряемост: Фиксирано`. The cause was the legacy global opening parser selecting a fixed-token match from the same prompt before the UI summarized the already-resolved field roles.

## Change

For products with more than one field, the prompt interpreter now checks the resolved field roles before presenting the product-level opening summary. If at least one `FIXED` field and at least one `OPENING_SASH` or `SLIDING_SASH` field coexist, the visible recognition value is `Смесена конструкция`.

Field-level roles and unresolved opening type details remain authoritative for Human Review. Single-field opening summaries are unchanged.

## Safety

- HUMAN REVIEW = YES
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

This hotfix changes semantic presentation consistency only. It does not add production geometry, profile inference, deductions, or machine authority.
