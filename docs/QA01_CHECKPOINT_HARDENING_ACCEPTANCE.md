# QA01 — Checkpoint Hardening & Canonical Verification — Acceptance

Status: IMPLEMENTED / VERIFY REQUIRED

## Purpose

QA01 closes maintenance findings discovered during the independent audit of baseline `42e26f8`.

It is a **non-feature maintenance phase**. It must not change UI behavior, AI inference, geometry, catalogue evidence, rule evaluation, RP01 authority, project lifecycle behavior, or production boundaries.

## Changes

1. Add one canonical full-regression runner:
   - discovers every shareable `tests/*.test.ts` file and excludes explicit `*.internal.test.ts`;
   - generates a temporary Vite SSR entry under `.facadeflow-runtime/`;
   - executes the combined Node test harness;
   - automatically includes future shareable `.test.ts` files without adding a package script per file;
   - keeps locked/private RP01 evidence in a separate `test:internal-evidence` suite that requires `local-samples/phase05a`.

2. Add one canonical repository verification command:

   ```bash
   npm run verify
   ```

   which runs the full shareable regression, lint, and production build. Controlled internal checkpoints use `npm run verify:internal` to add the locked evidence suite.

3. Add explicit checkpoint package classes:
   - `SHAREABLE_CLEAN`: private local evidence is excluded;
   - `INTERNAL_AUDIT`: private local evidence may be retained for controlled internal review.

4. Add `docs/CURRENT_ARCHITECTURE_STATUS.md` as the current status source of truth so historical acceptance wording cannot be mistaken for the present closure state.

## Safety / architecture non-change

QA01 adds no runtime application import and no product-domain behavior.

It does not:

- modify `src/`;
- add backend/network/persistence;
- alter AI01–AI04;
- alter WP78/RP01;
- alter geometry or constructor semantics;
- enable machine readiness or production approval;
- promote evidence or rules;
- create PROJECT01 lifecycle behavior.

## Acceptance

Required:

```bash
npm run test:regression
npm run lint
npm run build
npm run verify
git diff --check
```

Expected:

- all shareable `tests/*.test.ts` files are included automatically, while `*.internal.test.ts` remains explicitly separated;
- regression is green;
- lint has zero errors;
- build passes;
- `SHAREABLE_CLEAN` packaging excludes `local-samples`, DWG and LTE evidence;
- `INTERNAL_AUDIT` and `SHAREABLE_CLEAN` are explicitly distinguishable in the generated manifest;
- no files under `src/` are changed by QA01.

After QA01 is committed and synchronized, the next major phase may begin as `PROJECT01.1`.
