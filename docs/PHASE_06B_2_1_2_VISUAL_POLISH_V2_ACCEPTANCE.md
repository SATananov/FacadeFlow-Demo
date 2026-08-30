# PHASE 06B.2.1 + 06B.2.2 — Visual Polish V2

## Scope

Visual-only refinement on top of the already applied 06B.2.1 / 06B.2.2 work. No CAD geometry, import interpretation, AI state transitions, backend, networking, persistence, machine integration or production export behavior changes.

## Refinements

- AI → Human Gate is visually integrated as a dark CAD Inspector instead of a disconnected white panel.
- AI safety/status rail is rendered as compact technical status chips and remains horizontally accessible at narrower widths.
- The supplied Nadezhda logo asset remains unchanged; only its shell presentation becomes smaller and less visually dominant.
- AI job cards gain stronger secondary-text contrast and a clearer selected state while preserving the cyan + orange FacadeFlow selection language.
- Responsive behavior keeps status information and review content accessible without hiding critical actions.

## Safety boundaries preserved

- AI model remains `NOT_CONNECTED`.
- automatic geometry remains disabled.
- human review remains required.
- rules validation remains required.
- production approval remains false.
- machine-ready remains false.

## Human visual audit

1. Main header reads as one technical brand/navigation system; logo does not dominate the workspace.
2. AI status rail is readable and visually compact.
3. Human Gate / review inspector belongs visually to the dark CAD workspace.
4. Completed review steps remain clearly distinguishable from pending steps.
5. Warning/rule content uses orange selectively, not as a general UI color.
6. Job-card descriptions are readable without losing the dark technical visual language.
7. Selected job card is clearly identified through cyan outline + orange lower accent.
8. At narrower desktop/tablet width, status chips remain accessible and the inspector moves below the intake rather than hiding content.
