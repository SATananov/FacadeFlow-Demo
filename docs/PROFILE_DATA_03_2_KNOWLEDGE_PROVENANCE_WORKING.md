# PROFILE DATA 03.2 — PRELUDE Knowledge Provenance · WORKING

## Goal

Make the PRELUDE 60 knowledge model explicit about **where each dimension comes from**.

PROFILE DATA 03.2 does not merge catalogue evidence with Nadezhda human-confirmed working semantics. It presents them side by side and records whether a directly comparable visible-width value exists.

## PRELUDE records

### 482.30 · FRAME

Catalogue reference currently exposes a 60 mm system depth plus labelled 64 / 42 mm geometry in the verified catalogue visual. Nadezhda keeps the human-confirmed working rule:

`64 − 22 = 42 mm`

The visible-width value agrees, but the sources still remain separate.

### 482.05 · SASH

The verified catalogue visual currently carries a labelled 56 mm extent, while the Nadezhda working semantics are:

`78 − 22 = 56 mm`

PROFILE DATA 03.2 deliberately marks these as **NOT DIRECTLY COMPARABLE** because the current catalogue record does not establish that its 56 mm label has the same semantic meaning as the human-confirmed visible width. The application must not invent catalogue truth for 78 mm.

### 482.21 · MULLION

Catalogue reference and Nadezhda working semantics both expose the 40 mm visible-width value, while Nadezhda keeps the human-confirmed rule:

`84 − 22 − 22 = 40 mm`

Again, agreement does not authorize an automatic merge.

## UI

The Visual Section Viewer now shows two explicit provenance cards:

- `CATALOGUE · REFERENCE ONLY`
- `NADEZHDA · HUMAN CONFIRMED WORKING SEMANTICS`

and an explicit gate:

`AUTO MERGE: NO · EXACT CONTOUR AUTHORITY: NO`

## Safety

- automatic catalogue merge: NO;
- automatic geometry overwrite: NO;
- exact contour authority established: NO;
- automatic production use: NO;
- machine ready: NO;
- production approved: NO.

## Closure state

**WORKING / CLOSURE CANDIDATE ONLY.** PROFILE DATA 03 stays open until regression and Human Audit confirm the new provenance UI and data contracts.
