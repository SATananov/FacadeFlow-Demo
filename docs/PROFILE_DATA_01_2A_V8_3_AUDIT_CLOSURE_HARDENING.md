# PROFILE DATA 01.2A V8–V8.3 Audit Closure Hardening

This maintenance slice closes issues found by an independent audit of the V8–V8.3 shareable checkpoint. It does not add machine-output authority or weaken any human-review gate.

## Closure changes

- Shareable regression is self-contained: `tests/*.internal.test.ts` are private-evidence tests and are excluded from `npm run test:regression`.
- Locked Vadim XML/LTE evidence remains covered by `npm run test:internal-evidence` and `npm run verify:internal` when `local-samples/phase05a` is present.
- `ShareableClean` runs `npm run verify`; `InternalAudit` runs `npm run verify:internal`.
- Door Composer composition is parent-owned and survives Back → Reopen. It is reseeded only when the configured starting topology changes.
- Obsolete separate DOOR DEMO runtime gates were retired from `src`.
- PRELUDE 60 visible geometry derives confirmed base dimensions from the canonical catalog registry instead of duplicating the 64/42, 84/40 and 78/56 runtime values.
- The ambiguous overlap safety flag was split into explicit catalog-preservation and working-effective-geometry statements.
- Checkpoint ZIP creation now writes portable `/` entry separators and validates the archive before reporting success.
- Historical `V8.1.1` naming is documented as a follow-up folded into V8.1, not a separate closure artifact.

## Safety boundary

Still false / unavailable:

- automatic production geometry
- production approval
- machine readiness
- export authority
- automatic profile selection
- universal PRELUDE overlap inference
- glazing-bead inference from 20/22 mm or profile-dimension differences

Door threshold remains unresolved until explicit technical data is introduced and reviewed.
