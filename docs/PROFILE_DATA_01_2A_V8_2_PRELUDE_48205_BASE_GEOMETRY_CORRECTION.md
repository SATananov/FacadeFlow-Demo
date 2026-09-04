# PROFILE DATA 01.2A V8.2 — PRELUDE 482.05 Base Geometry Correction

## Purpose

This micro hardening slice records new human technical confirmation for PRELUDE 60 sash profile `482.05` without expanding FacadeFlow into glazing-bead selection or production geometry.

The corrected base profile geometry is:

- `482.30` FRAME — profile height `64 mm`, visible width `42 mm`;
- `482.05` WINDOW SASH — profile height `78 mm`, visible width `56 mm`;
- `482.21` MULLION — profile height `84 mm`, visible width `40 mm`.

`482.05` therefore moves from source-only `56/34` data to `HUMAN_CONFIRMED_BASE_GEOMETRY` at `78/56 mm`.

## Important distinction: base profile geometry vs assembled effective width

The confirmed `78/56 mm` values describe the base sash profile geometry. V8.2 does **not** automatically treat `56 mm` as the final effective visible width of a sash inside every frame+sash assembly.

The existing assembly boundary remains:

- effective assembled sash width is unresolved unless explicitly supplied/reviewed;
- system overlap is not subtracted from sash width automatically;
- Visual Composer V8 effective geometry still promotes frame/mullion overlap-aware bands only;
- no cutting, machining or production dimension is created.

## 22 / 22 / 44 arithmetic

The confirmed dimensions produce these arithmetic differences:

- frame: `64 - 42 = 22 mm`;
- sash: `78 - 56 = 22 mm`;
- mullion: `84 - 40 = 44 mm`.

These relationships are useful structural evidence, but V8.2 does **not** convert them into a glazing-bead formula.

## Glazing-bead evidence is deferred

The technologist clarified that the glazing bead is not universally 22 mm:

- one reviewed section example shows `20 mm`;
- `22 mm` is described as a common value;
- the eventual bead dimension may depend on the selected glazing/package configuration.

Therefore V8.2 records this only as deferred evidence:

- state: `DEFERRED_NOT_MODELED`;
- observed example: `20 mm`;
- common reference: `22 mm`;
- universal constant: **NO**;
- derive from 22/44 profile differences: **NO**;
- geometry calculations enabled: **NO**;
- future selection-dependent review: **YES**.

No glazing-bead chooser, formula or rendering is added by this slice.

## Separate from sash overlap

The glazing-bead dimension is explicitly separate from the PRELUDE sash-overlap working parameter.

The existing overlap remains:

- `7 mm`;
- system-specific;
- human-reviewed working value;
- editable;
- exact-production-confirmation-required;
- applicable only with an explicit compatible selected sash;
- not a glazing-bead size.

## Regression requirements

V8.2 regression must prove:

1. `482.05 = 78/56 mm` in both catalogue and visible-profile registries;
2. `482.05` base geometry is human-confirmed;
3. the profile remains WINDOW-only in the current application bridge;
4. arithmetic differences remain `22 / 22 / 44`;
5. `20 mm` and `22 mm` bead observations remain deferred/non-universal evidence;
6. bead dimensions are not derived from profile differences;
7. bead dimensions remain separate from the 7 mm sash overlap;
8. effective assembled sash width remains unresolved/not automatically calculated;
9. machine and production authority remain locked.

## Safety boundary

V8.2 does not introduce:

- glazing-package selection logic;
- glazing-bead selection logic;
- a universal 20 mm or 22 mm constant;
- automatic assembled sash width;
- cutting deductions;
- machining dimensions;
- production export;
- machine authority.

`machineReady = false` and `productionApproved = false` remain mandatory.
