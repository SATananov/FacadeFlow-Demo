# Phase 05D.3 — Canvas navigation acceptance

- Wheel scrolls the page while canvas navigation is inactive.
- A normal canvas click activates the visible hand mode.
- In hand mode drag pans and wheel zooms around the pointer.
- Escape, outside click, or “Освободи мишката” returns wheel control to the page.
- Visual text editing and manual correction always take interaction priority.
- Navigation changes viewport state only; it does not mutate DWG or session text evidence.
- `machineReady: false`, `internalEvaluationOnly: true`.
