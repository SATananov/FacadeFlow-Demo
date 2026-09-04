# PROFILE DATA 01.2A V8.3.1 — Audit Metadata & Reproducibility Hardening

Status: MAINTENANCE HARDENING — VERIFY REQUIRED AFTER APPLY

## Baseline

Independent source-only audit baseline: `7071c2b`. The V8–V8.3 functional stack passed independent logic/regression review. This slice addresses only audit closure hygiene discovered after that audit.

## Changes

- `CURRENT_ARCHITECTURE_STATUS.md` and README now describe V8–V8.3 as functionally closed/audited instead of pending closure.
- PRELUDE visible-geometry `systemLabel` is normalized from the inconsistent display value `PRELUDE 60 mm` to canonical `PRELUDE 60`. No profile dimensions or effective geometry formulas change.
- Node runtime expectations are declared via `.nvmrc`, `.node-version` and `package.json#engines`.
- Shareable checkpoint creation now requires a real `origin`, successful fetch, an existing `origin/<branch>` and exact `0 0` synchronization.
- `SHAREABLE_CLEAN` refuses `-SkipVerify`.
- Checkpoint payload gets deterministic `CHECKPOINT_CONTENT_SHA256.txt`; its SHA-256 and file count are recorded in `CHECKPOINT_MANIFEST.txt`.
- ZIP entry order is ordinal/deterministic and entry timestamps are fixed to remove packaging-time noise.
- Manifest creation time is replaced by deterministic Git commit time.

## Explicit non-changes

This slice does not modify:

- N-field divider or sash geometry;
- PRELUDE 482.30 / 482.21 / 482.05 dimensions;
- 7 mm working overlap;
- glazing-bead semantics;
- Working Configuration access rules;
- WINDOW/DOOR Composer state or field targeting;
- AI01–AI04 authority;
- `machineReady`, `productionApproved`, engineering or machine-output authority.

The authoritative PRELUDE PDF is not embedded into the shareable checkpoint by this maintenance slice. No source-evidence SHA-256 is invented without that file.

## Required closure

```bash
npm run verify
git diff --check
git status --short
```

Then review the staged diff, commit/push, confirm origin sync `0 0`, and create a new `SHAREABLE_CLEAN` checkpoint.
