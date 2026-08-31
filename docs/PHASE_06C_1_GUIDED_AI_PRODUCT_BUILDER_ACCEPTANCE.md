# PHASE 06C.1 — Guided AI Product Builder

## Purpose

Add a structured, human-led product intake inside the existing FacadeFlow AI workspace. The phase must help a user describe a window or door through guided fields without pretending that an AI model, manufacturer rules, geometry generation, or production export is connected.

## Locked boundaries

- AI model remains `NOT_CONNECTED`.
- Automatic geometry remains disabled.
- No backend, network call, persistence, machine connection, or production output is added.
- `simulationOnly` remains `true` and `machineReady` remains `false`.
- Human confirmation is separate from engineering/rules validation.
- Missing values remain unresolved; they are never invented.
- Manual profile/system codes are allowed as human evidence, but are visibly left for catalogue/rules compatibility checking.

## Guided intake

The existing four Phase 06B.1 input routes remain unchanged as route keys. The `DESCRIPTION` route now exposes a guided product builder before the free-text field.

The builder captures:

1. product type (window / door), name/mark, quantity;
2. overall width and height in mm;
3. profile system, frame, sash and mullion from the active catalogue;
4. manual system/profile codes when catalogue data is not yet available;
5. opening type, left/right and inward/outward direction where relevant;
6. door threshold/lower-node description;
7. glazing/fill type and exact human-entered description;
8. colour mode and colour codes/descriptions;
9. hardware type, exact hardware description, handle type/description and optional hinge quantity;
10. additional notes.

## Dependency behavior

- Catalogue dropdowns show only active (non-archived) profiles.
- Frame/sash/mullion dropdowns are filtered by selected system and profile role.
- Changing the profile system clears incompatible selected catalogue profile IDs.
- Changing product/opening type clears dependent stale opening/hardware fields where they no longer apply.
- Editing any field after a prepared/confirmed proposal invalidates that proposal and requires review again.

## Human Gate

`Подготви за човешка проверка` creates one session-only `FacadeFlowProductSpecification` from the structured human input.

The specification:

- carries manual evidence identifying the Guided AI Product Builder;
- records unresolved fields;
- remains simulation-only;
- remains not machine-ready;
- does not create geometry.

`Потвърди човешката чернова` is enabled only when no required structured fields remain unresolved and the explicit human review checkbox is selected.

Human confirmation does **not** complete the separate rules-validation gate and never sets production approval.

## Regression requirements

All Phase 06B.1 / 06B.2 tests must remain passing. In particular, the six job scopes, four input-mode keys, unified workspace shell, dark Human Gate inspector, safety rail, Nadezhda branding, and all AI/production safety flags stay intact.

## Verification

Run:

```powershell
npm run test:phase06b1
npm run test:phase06b2_1_2
npm run test:phase06b2_polish
npm run test:phase06b2_3
npm run test:phase06c1
npm run lint
npm run build
```

Manual verification:

- open FacadeFlow AI;
- choose a job context;
- choose `Води ме / описание`;
- verify the guided groups appear in order;
- verify selecting a catalogue system filters role dropdowns;
- verify manual profile/system entry works when catalogue data is absent;
- verify fixed glazing hides/removes hardware requirements;
- verify door selection exposes threshold/lower-node input;
- verify the proposal lists unresolved values;
- verify confirmation requires explicit human review;
- verify no action marks the product machine-ready or production-approved.
