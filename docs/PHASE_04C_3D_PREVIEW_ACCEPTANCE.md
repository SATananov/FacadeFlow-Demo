# Phase 04C — приемане на концептуалния 3D преглед

## Източници и модел

- Custom tree, REF-01–REF-17 и човешки потвърден structured import се адаптират към един `Product3DScene`.
- Raw image/PDF/OCR evidence никога не се превръща директно в 3D.
- Възлите пазят stable component ID, role, source path, profile ID/code, conceptual dimensions, position, rotation и selectable state.
- Проверени са fixed custom rectangle, vertical/nested splits, mixed fixed/opening, REF-01, REF-04, REF-09 и lower-panel REF-11/15/17.

## Изглед и взаимодействие

- Default е „2D чертеж“; налични са „3D преглед“ и „Разделен изглед“.
- Selection се споделя от 2D, 3D и component list без нови IDs или автоматично отваряне на операции.
- „Отвори компонента в работната зона“ е изрично действие и запазва operation namespaces.
- Orbit, zoom, pan, reset/fit и deterministic presets: front, back, left, right, top, bottom, isometric.
- Visibility: glazing, frame, dividers, sashes, labels, grid, wireframe, transparency и reset.
- Exploded view е само визуален и не променя source geometry.
- Opening preview е 0–60° и работи само при потвърдена LEFT/RIGHT посока; иначе е disabled.
- Показват се overall width/height, conceptual depth и selected nominal length.

## Достъпност и устойчивост

- Canvas има заглавие/описание, keyboard controls, accessible synchronized component list, focus и aria-live announcements.
- Reduced motion изключва camera damping.
- При липсващ/неуспешен WebGL се показва: „3D визуализацията не е достъпна на този компютър. Използвайте 2D чертежа.“ и view се връща към 2D.
- Renderer съществува само при 3D/split view; React Three Fiber освобождава declarative resources, OrbitControls се dispose-ва, RAF спира при unmount, DPR е ограничен до 1.5, responsive canvas използва ResizeObserver.

## Safety

- `conceptualDepthMm` default 70 mm е view-only и не използва `dimensionA/B`.
- Всеки scene има `conceptualOnly: true`, `productionGeometryApproved: false`, `machineReady: false`.
- Няма exact profile sections, hardware, gasket/glazing thickness claim, cutting formula или manufacturing geometry.
- Няма STL, OBJ, GLTF/GLB, STEP, IGES, CNC/MECAL/LTE/XM/G-code export.
- Няма CDN, iframe, cloud render, external viewer, network service или machine connectivity.
