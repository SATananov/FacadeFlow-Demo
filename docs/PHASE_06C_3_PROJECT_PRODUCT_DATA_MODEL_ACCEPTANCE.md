# PHASE 06C.3 — Project / Product Data Model Foundation

Status: implementation candidate — requires local regression/build and human visual verification before lock.

## Goal
Prepare FacadeFlow for real Nadezhda project data before the remaining catalogues and production rules arrive. The project model must support both large hierarchical jobs and a single standalone product without forcing artificial levels.

## Acceptance boundary
- A job owns a session-only, simulation-only flexible project structure.
- Supported manual node kinds are building/corpus, floor, facade, room, zone, position/mark, and technical detail.
- No node is auto-created and no label is invented.
- The user may leave the hierarchy empty (`Без структура / директно изделие`).
- Any node may be placed below an existing node; the UI recommends context-appropriate levels but does not assume every real job follows one rigid hierarchy.
- One active node/path is the current placement for the guided product.
- Preparing or confirming a guided product copies the human-selected path labels into `groupPath` and stores the stable `placementNodeId`; labels are not used as relational identity.
- Project nodes already reserve `EXTRACTED`, evidence references, and human-review statuses for future PDF/DWG/schedule ingestion, while this phase creates only manual DRAFT nodes.
- Changing/removing the active placement invalidates the previous guided review/confirmation so a confirmed product is never silently reassigned.
- Removing a node recursively removes its descendants and clears an invalid active placement.
- Project structure remains local React session state only. No database, server, browser persistence, network sync, machine writer, production approval, or automatic geometry is introduced.

## Intended future extension
The same structure can later receive extracted nodes from PDF/DWG/schedules as source evidence, but that future extraction must preserve source/page/revision and pass through human review before becoming trusted project data.
