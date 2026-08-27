# Phase 06A.2 — Hybrid Product Designer Foundation

## Приети входни маршрути

- „Стандартно изделие“ отваря category foundation. Само „Прозорец“ и „Врата“ са достъпни; плъзгаща система, витрина и фасаден модул са disabled и ясно означени „Предстои“.
- „Зареди скица или чертеж“ записва единствено избора на sketch-assisted route и препраща към съществуващия import center. Не се създава втори uploader и не се копират автоматично geometry, dimensions, OCR evidence, DWG entities, products или operations.
- „Нестандартно изделие“ използва Phase 06A.1 viewport foundation с grid, explicit hand mode, pan, pointer-anchored zoom, fit, reset и Escape release. Geometry tools и двата бъдещи режима остават disabled.

## Единен session-only модел

Трите маршрута използват един typed semantic session model с route, category, workflow step, review/source status и точно нула geometry entities. Route/category transitions са pure и изчистват несъвместимото route-specific състояние.

Заключени стойности: `sessionOnly: true`, `simulationOnly: true`, `machineReady: false`, `internalEvaluationOnly: true`, `productionApproved: false`, `sourceImmutable: true`, `geometryCreated: false`, `exportAvailable: false`, `dwgWriteAvailable: false`, `machineConnectivityAvailable: false`.

Session state не влиза в localStorage, IndexedDB, cookies, URL, filesystem, backend/network service или съществуващите product/component/operation exports. Затварянето unmount-ва workspace-а и изчиства сесията.

## Бъдеща архитектура — не е реализирана

Бъдещи отделни фази могат да свържат structured menu configuration, manual correction, immutable architectural sketch underlay, human-confirmed semantic geometry и синхронизиран conceptual 2D/3D изглед. Те могат да разглеждат profile colors, glazing/panels, opening directions, handles/hardware и visual joint review.

Планираната project hierarchy е: project → building → floor → room/facade → product mark → quantity → revision. Drawing documentation export е бъдеща отделна възможност и трябва да остане отделен от machine/manufacturing output.

DWG writing остава блокиран. Съществуващата LibreDWG интеграция е read-only, GPL/internal-evaluation-only и не може да се използва като writer. DXF/DWG drawing export изисква отделна одобрена фаза. MECAL, LTE, XM, G-code и CNC generation остават забранени.

## Accessibility и навигация

- Route/category cards са native keyboard buttons с видим focus.
- Active, disabled и future състоянията имат текстови обозначения и не разчитат само на цвят.
- Breadcrumb, „Назад“, „Начало на конструктора“ и „Назад към FacadeFlow“ са видими.
- Escape освобождава активната viewport navigation и не изтрива designer session-а.
- Layout-ът е responsive за desktop, tablet и mobile.

## Автоматична проверка

- `npm run test:phase05a` — PASS, 11/11 tests.
- `npm run test:phase05b` — PASS, 110/110 tests.
- `npm run test:phase06a` — PASS, 8/8 tests.
- `npm run test:phase06a2` — PASS, 12/12 tests.
- `npm run lint` — PASS, без lint errors или warnings.
- `npm run build` — PASS; запазени са само съществуващите informational Vite warnings за LibreDWG browser externalization и bundle size.
- `git diff --check` — PASS.
