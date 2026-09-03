# UI02.1B — Import / DWG / SkyGlazing / OCR Bulgarian UI Language Normalization

## Status

Candidate for human audit.

## Goal

Normalize user-facing language across the import and drawing-inspection workflows so Bulgarian users see consistent Bulgarian labels, actions, warnings and review states while technical file-format names remain intact.

## Scope

UI02.1B covers the presentation layer for:

- Import format selection and safe source inspection;
- SkyGlazing XML / LTE read-only inspection and comparison;
- DWG viewer, toolbar, section preparation, manual correction and visual text editing;
- drawing import capture/review workflow;
- local OCR suggestions and audit trail;
- combined local analysis and provisional product draft review;
- safe-inspection warnings surfaced by import/SkyGlazing/DWG helpers.

## User-facing language rules

The UI uses Bulgarian presentation labels for workflow concepts such as:

- only-for-review / read-only modes;
- support and detected-format labels;
- processing/result states;
- OCR candidate types and review decisions;
- target fields and audit actions;
- model/view/editor actions such as undo, source restore and drag;
- combined-analysis evidence/review terminology.

Technical standards and file-format names remain unchanged where they are useful to the user, including `DWG`, `DXF`, `XML`, `LTE`, `PDF`, `OCR`, `WASM`, `SHA-256`, `MIME`, `2D`, `3D` and established `Paper Space` terminology when accompanied by Bulgarian explanation.

## Architecture boundary

UI02.1B is a presentation-only language pass.

It does **not** rename or mutate canonical internal values such as:

- `SUPPORTED_FOR_VIEW_ONLY`;
- `DRAFT`, `NEEDS_REVIEW`, `VERIFIED`;
- `SUGGESTED`, `ACCEPTED`, `REJECTED`;
- DWG internal layout id `MODEL`;
- OCR/combined-analysis action enums;
- safety flags.

No backend, persistence, network, machine connection, machine export or production authority is introduced.

## Safety invariants

The following remain locked:

- `machineReady: false`;
- no automatic production approval;
- no production-executable output;
- source inspection remains local and review-only where previously defined;
- OCR and combined analysis remain suggestions requiring explicit human review.

## Automated acceptance

Dedicated contract:

```text
node --test tests/ui02_1bImportDwgSkyOcrBgLanguage.test.ts
```

The test verifies Bulgarian presentation labels, absence of audited mixed-language phrases, preserved technical terminology, unchanged canonical enums and unchanged safety boundaries.

Canonical repository verification must still be run in the normal development environment:

```text
npm run verify
```

## Human audit checklist

1. Open Import Center and review every format card.
2. Open SkyGlazing XML / LTE and confirm headings, warnings, comparison statuses and source summaries are Bulgarian.
3. Open DWG viewer and confirm workspace/editor/tool labels are Bulgarian while DWG/Paper Space terminology remains understandable.
4. Open image/PDF drawing import and run OCR review; candidate statuses, target fields and audit trail must be Bulgarian.
5. Open combined analysis/provisional draft and confirm evidence/review terminology is Bulgarian.
6. Confirm no machine-ready, production approval, backend or persistence behavior has changed.

## Excluded from UI02.1B

Help/Tour, Real Data / Rules and unrelated legacy screens remain for UI02.1C.
