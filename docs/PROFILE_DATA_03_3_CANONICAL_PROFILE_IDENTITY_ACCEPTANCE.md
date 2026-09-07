# PROFILE DATA 03.3 вЂ” Canonical Profile Identity

Status: **WORKING**
Parent: **PROFILE DATA 03 вЂ” OPEN / WORKING**

## Scope

This step records only the canonical identity relationship for the currently verified PRELUDE 60 working profiles:

- PRELUDE 60 / `482.30` = `FRAME`
- PRELUDE 60 / `482.21` = `MULLION`
- PRELUDE 60 / `482.05` = `SASH`

The identity layer contains no new dimensions, contour points, deductions, tolerances, machining rules, or assembly geometry.

## Acceptance boundaries

- Profile identity is resolved only from an **explicit system + explicit profile code + expected semantic role**.
- PRELUDE 60 system recognition is token-bounded: `PRELUDE` and `60` must be complete normalized tokens; `PRELUDE 600` and `PRELUDE 160` are rejected.
- Selecting PRELUDE 60 alone does **not** assign any profile code.
- A role mismatch such as FRAME + `482.05` is rejected as a mismatch; it is not corrected automatically.
- Catalogue visual truth and Nadezhda human working semantics stay separate.
- Exact contour authority remains not established.
- Automatic profile assignment: **NO**.
- Automatic system assignment: **NO**.
- Automatic geometry: **NO**.
- Machine ready: **NO**.
- Production approved: **NO**.
