# Phase 06A.9.2 — 3D Dimension Annotation Readability

## Начален gate

- HEAD: `67ab15bb67a24ee60bc6bc94c140b5789b765c3e` — PASS;
- branch: `master` — PASS;
- working tree: clean — PASS;
- `origin/master...master`: `0 0` — PASS.

## Цел и обхват

Фазата подобрява единствено визуалната четимост на dimension annotations в legacy Three.js `ProductPreview`. Размерните стойности, geometry, camera presets, visibility state, selection, calculations, export и safety flags остават непроменени. Unified Drawing Workspace, координатна мрежа, snap и drawing functionality не са променяни.

## Диагностика

`DimensionLine3D` създаваше label texture върху фиксиран canvas `512×80`, запълнен почти изцяло с бял фон. Sprite-ът се мащабираше до 30% от най-големия product размер, независимо от реалната ширина на текста. Резултатът беше голяма светла лента с относително малък текст.

Sprite material вече имаше `transparent` и `depthTest: false`, а Three.js sprite автоматично е camera-facing. Липсваха обаче `depthWrite: false`, explicit render order, content-sized/HiDPI canvas, screen-space size control и отделен deterministic clearance. Annotation coordinates вече поставяха линиите извън основните XY bounds; проблемът беше главно presentation/material sizing, а не dimension calculations или CSS.

## Реализация

### Цвят и контраст

- текст: `#17323a`;
- фон: `rgba(247, 251, 251, 0.96)`;
- border и основна dimension line: `#087b91`;
- texture color space: `SRGBColorSpace`;
- еднакъв компактен visual label формат `<стойност> mm` за всички dimension типове.

Пълният semantic label, включително „Концептуална дълбочина“, остава в `aria-label`. Съществуващият текстов `dimension-summary` остава непроменен.

### Canvas и размер

Texture canvas-ът се определя от реалната `measureText()` ширина плюс explicit padding. Canvas resolution следва `devicePixelRatio`, ограничен безопасно между 1 и 3. Контекстът се мащабира според DPR, така че текстът не се размазва при HiDPI.

Sprite material използва `sizeAttenuation: false`, което запазва разумна постоянна screen-space височина при camera presets и zoom. Aspect ratio следва реалния content-sized canvas, без clipping или огледално обръщане.

### Depth и offset

- line и sprite: `depthTest: false`, `depthWrite: false`;
- line render order: `1000`;
- label render order: `1001`;
- deterministic depth clearance: `max(width, height) × 0.002`;
- label-only outward offset: `max(width, height) × 0.25` според страната извън product bounds.

Offset-ът не променя annotation start/end points, стойности или product geometry. Той пази badges извън рамката и предотвратява покриване на профили и hardware.

### Cleanup

При cleanup се dispose-ват `BufferGeometry`, `LineBasicMaterial`, `CanvasTexture` и `SpriteMaterial`. Camera movement не създава нови annotations; React key остава stable annotation ID.

## Visibility и accessibility

- всички съществуващи dimension checkbox-и запазват handlers и state;
- изключването на „Покажи размерите“ премахва annotations;
- повторното включване не създава duplicate sprites;
- camera preset промяна не променя annotation IDs;
- visibility toggle не участва в product history;
- числовите стойности остават достъпни като текст в `dimension-summary` и съществуващите properties/table региони;
- няма нови camera announcements.

## Browser acceptance

Проверено при 1366×768 и zoom 100%.

| Сценарий | Резултат |
| --- | --- |
| Window REF-01, Isometric, dimensions on | PASS — четими camera-facing badges, без бели ленти |
| Window REF-01, Left, dimensions on | PASS — labels не са огледални или edge-on |
| Window REF-01, Left, dimensions off | PASS — annotations изчезват, текстовият summary остава |
| Door REF-14, 900×2100, Isometric | PASS — четими width/height/field/depth labels |
| Door REF-14, 900×2100, Front | PASS — labels са извън рамката и не покриват продукта |

Проверени camera controls:

- Front — PASS;
- Back — PASS;
- Left — PASS;
- Right — PASS;
- Top — PASS;
- Bottom — PASS;
- Isometric — PASS;
- Reset camera — PASS, връща Isometric;
- Fit product — PASS, връща Front.

При всички presets canvas остава наличен, dimension summary запазва същите стойности и няма horizontal overflow. Labels използват billboard sprite behavior и не се оглеждат при Back. Линиите и labels са view-only overlay с controlled depth и не се скриват от product geometry.

Временните screenshots са създадени извън repository-то в `%TEMP%/FacadeFlow-Phase-06A-9-2/` и не са tracked.

## Window и door regressions

Споделеният legacy `ProductPreview` pipeline използва същия `ProductDimensions3D` за WINDOW и DOOR templates. Template/geometry calculations не са променени. Съществуващите fixed, single, double, horizontal/vertical divider, balcony/single/double door templates остават покрити от phase regression suite.

Door threshold остава `НЕРАЗРЕШЕН`; не е добавяна threshold geometry. Пълнежи, hardware и product/component geometry не са променяни.

## Safety и ограничения

- няма production geometry или производствени dimension стойности;
- няма нови dependencies;
- няма network, persistence или secrets;
- няма grid/snap/free drawing промени;
- няма промяна на repository license;
- няма tracked screenshots или audit scripts.

## Известни граници

Това е readability фаза. Dimension annotations остават концептуални/project-derived според съществуващите metadata и не представляват производствени размери, отнемания или допуски.
