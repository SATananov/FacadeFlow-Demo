# Phase 06A.9.5 — Line Tool

## Scope

Добавен е единствено 2D **Line** инструмент върху съществуващия `CustomProductDesigner` drawing workspace. Инструментът създава локални сесийни линии, отделени от `CustomProduct.geometry` и от production/export модела.

## Interaction

- `Линия` активира инструмента.
- Първият клик задава начало и показва статус `Изберете крайна точка · Esc отказва`.
- Pointer move след началото показва live preview.
- Вторият клик завършва линията и създава точно една history стъпка.
- `Esc` отказва текущата команда и деактивира Line без history mutation.
- Zero-length крайна точка се отхвърля и не създава history стъпка.
- След успешно завършване инструментът остава активен за следваща линия.

## Snap behavior

Phase 06A.9.5 използва само вече заключения GRID snap от Phase 06A.9.4.

- При включено `Прихващане`: start, live preview и end използват snapped model coordinates.
- При изключено `Прихващане`: използват се raw model coordinates от inverse SVG CTM conversion.
- Не са добавяни endpoint, midpoint, intersection, perpendicular или object snapping режими.

## Local-session layer and history

Линиите се пазят в отделен `CustomDrawingLineLayer` с IDs `line-0001`, `line-0002`, ... . Layer-ът живее само в текущата React сесия на конструктора.

Line history е отделно от product history. `Отмени линия` премахва една завършена линия с една undo операция; `Повтори линия` възстановява същия stable ID и същите endpoints. Draft start/live preview не се записват в history.

## Protected behavior and exclusions

Не са променяни:

- `CustomProduct.geometry`, frame/divider/sash логика или product validation;
- product Undo/Redo семантиката;
- dimensions и 3D;
- export payload;
- persistence, local storage или network;
- machine/production integration;
- dependencies.

Не са добавяни други drawing tools.

Line SVG layer и preview са `pointer-events:none`, така че не блокират frame/divider/field selection или snap preview.

## Verification

Automated acceptance:

- `npm run test:phase06a9_5`
- full Phase 05A → 06A.9.5 regression matrix
- `npm run lint`
- `npm run build`

Browser acceptance to verify after applying the patch on Windows:

- 1920×1080 — controls visible; no horizontal page/toolbar overflow.
- 1366×768 — compact wrapping toolbar and usable canvas.
- 1024×768 — controls wrap without horizontal overflow.
- 390×844 — vertical flow, 42 px Line-tool touch targets, no horizontal overflow.

Manual Line audit:

1. Activate `Линия` → `Изберете начална точка · Esc отказва`.
2. First click → live preview + `Изберете крайна точка · Esc отказва`.
3. Second click → persistent local-session line.
4. `Отмени линия` once removes exactly that line.
5. `Повтори линия` restores identical ID/endpoints.
6. Same start/end click creates no history entry.
7. `Esc` during draft creates no history entry.
8. GRID ON uses snapped start/live/end; GRID OFF uses raw start/live/end.
9. Existing frame/divider/field selection and snap marker remain interactive/visible.


## Browser audit correction — compact short-desktop workspace

The manual 06A.9.5 browser audit identified that a short desktop viewport could leave too little vertical room for the 2D drawing canvas. The correction is layout-only:

- desktop viewports at or below 850 px height initially collapse the current-step settings while preserving the existing disclosure button;
- the Line and canvas navigation controls share the compact workspace toolbar instead of forcing an extra full-width row;
- short-desktop header/status chrome is reduced so the 2D viewport remains the dominant working region;
- product geometry, snap calculations, line history, export, persistence, and dependencies are unchanged.

## Browser audit viewport-fit correction

- On short desktop screens the main drawing region reserves a practical working height instead of collapsing into a preview strip.
- `Побери / нулирай` remains the deterministic fit state (`zoom = 1`).
- Zoom now scales both drawing width and height, with a 0.5x–3.0x view-only range and scrollable overflow when magnified.
- The correction changes viewport presentation only; model coordinates, GRID snapping, line endpoints, product geometry, history, export and persistence remain unchanged.
