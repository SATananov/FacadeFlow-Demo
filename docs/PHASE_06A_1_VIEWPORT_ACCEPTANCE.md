# Phase 06A.1 — Detail drafting viewport foundation

- „Чертане на детайл“ отваря отделен full-screen session-only document.
- Документът започва с нула geometry entities и заключени `simulationOnly: true`, `machineReady: false`, `internalEvaluationOnly: true`, `productionApproved: false`.
- Grid, explicit hand mode, pan, pointer-anchored zoom, fit и reset променят само viewport state.
- Wheel остава на страницата до активиране на hand mode; Escape освобождава hand mode.
- Line, polyline, rectangle, circle и arc остават disabled.
- Няма DWG mutation, source copying, product/component/operation mutation, persistence, import/export, network, machine format или connectivity.
- Acceptance изисква Phase 05A, Phase 05B, Phase 06A tests, lint и production build да завършат успешно.
