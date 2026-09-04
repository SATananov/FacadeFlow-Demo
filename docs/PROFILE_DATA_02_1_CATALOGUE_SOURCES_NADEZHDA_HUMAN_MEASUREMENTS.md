# PROFILE DATA 02.1 — Catalogue Sources & Nadezhda Human Measurements

## Goal

Add two real external technical catalogue documents to the FacadeFlow catalogue workspace while keeping Nadezhda production-working values in a separate organisation-owned source area under Projects → Sources. Bat Trifon remains provenance / technical contact rather than the primary UI source label.

## External catalogue references

- KMG PRELUDE 60 — `https://altestgroup.com/pdf/system/39/bg.pdf`
- VIVA PLAST System 6400 — `https://visionplast.com/wp-content/uploads/2019/07/vias_catalog.pdf`

The documents are registered as `REFERENCE_ONLY`. FacadeFlow opens them as external PDFs and does not automatically import dimensions, promote selectable profiles, validate rules, or unlock production.

## Nadezhda production-working measurements

The following working values remain separate from catalogue truth:

- 482.30 · Frame / Каса · 64 / 42 mm
- 482.21 · Mullion / Делител · 84 / 40 mm
- 482.05 · Sash / Крило · 78 / 56 mm

For 482.05 the technical meaning / measurement baseline of 78 mm remains `MEANING_UNRESOLVED` until the exact measurement is marked on a technical section. Provenance / technical contact remains Bat Trifon.

## Separation rule

`External catalogue PDF != Nadezhda production-working value`.

The sources may be compared during human review, but neither source overwrites the other automatically.

## Safety boundary

- automatic catalogue merge: NO
- automatic geometry overwrite: NO
- automatic profile promotion: NO
- automatic rule validation: NO
- machine ready: NO
- production approved: NO

No existing PRELUDE 60 geometry, V8–V8.3.1 composer behavior, N-field targeting, overlap arithmetic, or production gate is changed by this slice.
