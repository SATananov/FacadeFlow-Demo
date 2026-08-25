# Phase 04D — приемане на синхронизираните размери

## Единен модел

- `DimensionAnnotation` има stable ID, type, MM value, source geometry/path, start/end/label points, axis, visibility, source/confidence status и safety flags.
- Поддържани са overall width/height, field width/height, vertical/horizontal divider position, component nominal length и conceptual depth.
- 2D и 3D използват един memoized annotation set от текущата structured geometry; няма независими копия на размерите.
- Metadata: `measurementMode: PROJECT_GEOMETRY`, `productionDeductionsApplied: false`, `manufacturingToleranceApplied: false`, `exactProfileSectionApplied: false`, `productionApproved: false`, `machineReady: false`.

## 2D/3D проверки

- Общите размери, field размерите, divider позициите и selected nominal length се обновяват при width/height, split, template и selection промени.
- SVG линиите имат extension marks, arrows, mm labels, contrast stroke и безопасни offsets в рамките на viewBox.
- 3D overlay използва локални Three.js lines и camera-facing sprite labels; conceptual depth е изрично означена.
- Dimension controls включват all, overall, fields, dividers, selected component, conceptual depth и reset и остават in-memory при 2D/3D/split превключване.
- Има текстово accessible обобщение и видима легенда: „Размерите са проектни/геометрични. Производствените отнемания и допуски не са приложени.“
- Невалидна/unresolved стойност не се показва като `0 mm`, а като „Неразрешен размер“.

## Import evidence

- Immutable source остава отделен; пазят се filename, SHA-256, page, crop или CAD entity reference.
- Всеки detected dimension е evidence със source `OCR_DERIVED`, `CAD_DERIVED` или `MANUALLY_ENTERED` и decision `UNRESOLVED`, `ACCEPTED` или `REJECTED`.
- OCR/CAD стойност не се прилага автоматично. Annotation се създава само от individually accepted/edited и human-confirmed value.
- Unresolved/conflicting evidence не се гадае и не се показва като валиден размер.
- Ръчна промяна на потвърден imported width/height добавя нов traceable manual evidence и връща structured draft към `NEEDS_REVIEW`.
- Нито един imported dimension не променя `machineReady: false`.

## Ръчни сценарии

- Custom 1800 × 1400; vertical split; horizontal nested split; move divider; frame/divider/sash selection.
- 2D/3D/split и седем camera presets; individual toggles; depth 70→90 променя само conceptual depth.
- REF-04, REF-09, REF-17; VERIFIED imported structured draft; unresolved import.
- Stable component IDs и operations остават непроменени; WebGL fallback и managed launcher остават работещи.

## Ред на построяване и размерни анотации

- Общите размери се валидират преди създаването на външната каса; касата предхожда делителите, крилата и посоките.
- Анотациите се преизчисляват детерминирано след всяка валидна промяна на каса, делител или поле и се използват от същия 2D/3D модел.
- Импортните размери влизат в ordered structured model само след индивидуално човешко потвърждение; unresolved стойности не се гадаят.
