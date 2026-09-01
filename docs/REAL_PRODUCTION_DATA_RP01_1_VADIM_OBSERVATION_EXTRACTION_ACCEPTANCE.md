# REAL PRODUCTION DATA — RP01.1 Vadim Observation Extraction Foundation

## Purpose

RP01.1 creates a conservative, source-preserving extraction foundation for the existing
SkyGlazing project evidence **Вадим-2**.

The layer extracts what was actually observed in SkyGlazing XML/LTE exports. It does not
promote one project into a universal production rule.

## XML observations

The extractor preserves explicit XML fields including:

- project / generator / unit;
- DXF name and profile code;
- `MaxY` / `MaxZ` as raw XML evidence only;
- barcode;
- `sxB`, `dxB`, `sxC`, `dxC`, `Length`;
- machining `Work/Name`;
- raw operation positions;
- face point coordinates and `AngleA` / `AngleC`;
- tool `T`;
- named parameter values.

No engineering meaning is invented for undocumented XML fields.

## LTE observations

The extractor preserves every parseable LTE line with:

- profile code;
- raw description;
- barcode;
- full raw line;
- `Left`, `Right`, `Upper`, or `Bottom` only when that word is explicitly present
  in the description.

It does not decode undocumented fixed-width LTE fields.

## XML ↔ LTE correlation

Correlation is barcode-only. No profile-code, length, position, or fuzzy inference is used
to manufacture a match.

## Verified Vadim-2 snapshot

The source audit used for RP01.1 records:

- XML observations: 46;
- LTE observations: 84;
- exact XML barcodes found in LTE: 46;
- LTE-only records: 38;
- machining Work operations: 220;
- profiles: `78.01`, `78.27`, `78.33`, `78.51`;
- observed Work names:
  - `STD_NOTCH`: 112
  - `STD_HOLE`: 76
  - `STD_SLOT`: 17
  - `STD_DRILL`: 6
  - `STD_KEYHOLE`: 6
  - `STD_POCKET`: 3

Existing FacadeFlow profile-level aggregates remain the reference for XML/LTE per-profile counts.

## Safety boundary

Every extracted item is `OBSERVED_PRODUCTION_DATA`.

RP01.1 explicitly does **not**:

- create a universal production rule;
- infer a profile role;
- confirm WP78 system identity automatically;
- reinterpret XML `MaxY` / `MaxZ` as confirmed catalogue dimensions;
- mark anything machine-ready;
- approve production;
- create machine output.

Repeated patterns are a future, separately reviewed phase.

## Acceptance

PASS requires:

- RP01.1 focused tests;
- Nadezhda evidence regression and audit;
- WP78 project-system evidence regression;
- WP78 evidence-aware rule-gate regression;
- lint;
- production build.
