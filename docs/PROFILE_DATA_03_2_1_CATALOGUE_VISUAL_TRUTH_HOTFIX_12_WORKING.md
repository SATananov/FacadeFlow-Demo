# PROFILE DATA 03.2.1 — Catalogue Visual Truth Hotfix 12

Status: WORKING / HUMAN AUDIT REQUIRED

## Human Audit defect

The PROFILE DATA visual section viewer displayed a generic hand-authored SVG-like profile shell. Although it was labelled as schematic, the shape did not correspond to the PRELUDE catalogue profile and was visually misleading.

## Hotfix

The generic hardcoded profile body is removed from `ProfileSectionViewer`.

The primary visual now comes from the already verified PRELUDE catalogue extraction used by the Technical Profile Inspector:

- `482.30` → `482_30_with_dimensions.svg`
- `482.05` → `482_05_with_dimensions.svg`
- `482.21` → `482_21_with_dimensions.svg`

The catalogue visual and Nadezhda human-confirmed measurement semantics remain separate authorities.

## Safety

- AI REDRAWN CONTOUR: NO
- VERIFIED CATALOGUE VISUAL: YES
- ISOLATED PRODUCTION CAD CONTOUR: NO
- AUTOMATIC CATALOGUE/HUMAN MERGE: NO
- MACHINE READY: NO
- PRODUCTION APPROVED: NO

The catalogue visual is evidence for the profile appearance shown by the manufacturer PDF. It is not promoted to machine geometry.
