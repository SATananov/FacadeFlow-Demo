# PHASE 06B.2.1 + 06B.2.2 — Global Single-Scroll Workspace Acceptance

## Scope

This micro-fix standardizes scroll ownership across FacadeFlow top-level workspaces without changing geometry, AI state, import interpretation, CAD behavior, or production boundaries.

## Required behavior

- Opening the Product Designer locks the underlying FacadeFlow page from scrolling.
- Opening any `preview-overlay` workspace (product preview, template picker, import center, profile catalogue, custom designer) locks the underlying page.
- The active top-level workspace/modal owns the vertical page scroll instead of allowing a second browser-page scrollbar behind it.
- Scroll chaining from the active overlay to the hidden underlying page is blocked.
- Functional local viewports remain local: drawing/document source stage, custom drawing viewport, visual-composer stage, DWG canvas/layers, 3D controls and accessible lists.
- Local functional viewports use contained overscroll so reaching their edge does not unexpectedly move the outer workspace.
- No CAD geometry, AI interpretation, import extraction, profile data, rules validation, machine/export logic, backend, network or persistence behavior is changed.

## Human audit

Check at minimum:

1. FacadeFlow AI — one meaningful outer vertical scroll; sticky review inspector behaves correctly.
2. Product Designer start screen — no second browser scrollbar behind the designer.
3. Structured product configuration — the underlying FacadeFlow page remains locked.
4. Import Center — modal scroll works; background page does not move.
5. Profile Catalogue — modal scroll works; background page does not move.
6. Custom Designer — modal scroll works; CAD/drawing viewport may still scroll locally when needed.
7. Visual Composer / CAD workbench — purpose-built canvas/tool-panel scrolling remains functional and does not scroll the hidden page underneath.

Human visual confirmation remains required before committing the phase.
