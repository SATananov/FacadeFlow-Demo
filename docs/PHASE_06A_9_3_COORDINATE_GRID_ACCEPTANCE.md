# Phase 06A.9.3 — Coordinate Grid and Cursor Coordinates

## Цел

Фазата добавя само визуална координатна помощ към 2D viewport-а на `CustomProductDesigner`: ограничена SVG мрежа, моделни координати на курсора и настройки за видимост и стъпка. Не се добавя CAD функционалност.

## Координатен модел

- Началото `0,0` е долният ляв външен ъгъл на касата.
- Оста X расте надясно, а оста Y — нагоре.
- Screen-to-model преобразуването използва SVG `getScreenCTM().inverse()` и същия uniform transform като чертежа.
- Координатите са относителни към касата и се показват в целия drawing canvas; при напускане на canvas-а се показва `X: — · Y: —`.

## Мрежа и контроли

- Мрежата е включена по подразбиране със стъпка 50 mm.
- Поддържани стъпки: 10, 25, 50 и 100 mm.
- Главните линии са през 500 mm.
- Мрежата е bounded до SVG viewport-а около изделието, стои под geometry и dimension слоевете и е с `pointer-events: none`.
- Toolbar контролите wrap-ват; на narrow layout запазват минимум 42 px височина.
- Cursor output използва `aria-live="polite"`.

## View-only и защитена логика

Видимостта на мрежата, избраната стъпка и координатите на курсора са локален view state. Те не се записват, не се export-ват и не участват в Undo/Redo. Не са променяни workflow state, geometry, calculations, selection, pointer operations, validation, renderer-и, safety flags или export semantics. Legacy preview, door composer, 3D и `DetailDraftingPlaceholder` не са променяни.

## Изрични ограничения

Няма snapping, rulers, guides, measurement tool, X/Y редактори, нови drawing инструменти, свободно чертане или production geometry. Мрежата не влияе на геометрията.

`Snapping is not implemented in Phase 06A.9.3`.

## Browser checklist

Проверка при zoom 100% за 1920×1080, 1366×768, 1024×768 и 390×844:

- [x] мрежата остава bounded до drawing viewport-а около касата;
- [x] X/Y осите и `0,0` са правилно ориентирани;
- [x] cursor coordinates следват курсора и се нулират при напускане на canvas-а;
- [x] toggle и всички стъпки работят без history операция;
- [x] няма shell/toolbar horizontal overflow и текстът не се изрязва;
- [x] geometry, dimensions, selection и drawing interaction остават работещи;
- [x] 3D renderer-ът не е променен и не получава grid layer.

Реалният headless Chrome audit при browser zoom 100% потвърди:

- 1920×1080 — PASS: canvas, frame, minor/major grid, toolbar и controls са видими; няма page или toolbar overflow.
- 1366×768 — PASS: всички региони са видими, controls wrap-ват и няма overflow.
- 1024×768 — PASS: toolbar wrap-ва на допълнителен ред без horizontal overflow.
- 390×844 — PASS: normal vertical flow, 330 px toolbar content в 390 px viewport, без horizontal page/toolbar overflow.

Измерените cursor позиции са `0,0`, `1400,0`, `0,1200`, `1400,1200` и център `700,600`. След zoom и fit/reset центърът остава `700,600`. След pointer leave readout-ът е `X: — · Y: —`. Settings hide/show запазва ширината 1400 mm. Toggle-ът и последователното избиране на 10/25/50/100 mm не променят Undo availability.

## Автоматизирани проверки

Пълната regression матрица `test:phase05a`–`test:phase06a9_3` премина успешно.

- `npm run test:phase06a9_3`: PASS, 8/8
- `npm run lint`: PASS
- `npm run build`: PASS (само съществуващото Vite chunk-size предупреждение)
- `git diff --check`: PASS
