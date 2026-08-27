# Phase 05D.1 — Visual text editor

Phase 05D.1 adds a separate session-only visual layer for human text cleanup. An operator can select a visible SOURCE text, drag it to a visual offset, draw a manual wrap/clip rectangle, hide it visually, restore its SOURCE rendering, and undo actions.

The operator can also add VISUAL NOTE text by typing content and choosing height, field width, and alignment before clicking a position on the drawing. Added notes can be edited or removed.

SOURCE entities, raw text, insertion points, geometry, IDs, and the DWG file remain unchanged. Hiding is not deletion. Added notes are not DWG entities. All edits disappear on clear/reload and never enter products, components, operations, import/export, XML/LTE comparison, or machine formats.

Safety remains `simulationOnly: true`, `machineReady: false`, `internalEvaluationOnly: true`. Layout1 remains blocked and no network/backend/storage behavior is added.
