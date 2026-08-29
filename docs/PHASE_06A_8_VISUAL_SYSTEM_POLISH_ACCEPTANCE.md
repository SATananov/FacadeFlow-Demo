# Phase 06A.8 — Visual System Polish Acceptance

## Scope and principles

This phase is visual-only. It unifies the existing FacadeFlow technical/CAD identity, improves information hierarchy and compactness, and preserves every domain transition, calculation, semantic ID, geometry descriptor, camera operation, pointer interaction, validation condition, safety flag, and review outcome.

Principles: canvas-first composition; compact professional controls; consistent surfaces and borders; visible keyboard focus; state communicated by colour plus border/text; no external fonts or network assets; no marketing-style redesign.

## Read-only baseline inventory

Before editing, the workspace, Help Center, Drawing Import Center, Profile Catalogue, constructor start, standard-product selector, window and door wizards, 2D/3D window and door composers, custom-product designer, legacy template preview, property/summary panels, and empty/warning/blocked/confirmed states were inspected through their JSX and CSS contracts. The baseline inconsistencies were: duplicated raw UI colours; mixed control heights, radii and borders; uneven button variants; several competing responsive composer rules; weak distinction between metadata and human-readable values; and inconsistent selected, disabled, warning and focus treatments.

## Token system

`src/visualSystem.css` is loaded last as the central visual layer. It defines namespaced colour, background, surface, border, text, semantic-state, spacing, radius, shadow, typography, line-height, control-height, panel-width and transition tokens. UI tokens do not replace the separate DEMO product/material colour values used by renderers.

## Component variants and checked screens

- Primary: `.primary`, `.primary-button`, `.export`, `.print-button`.
- Secondary: `.secondary-button` and header/context actions.
- Quiet/toolbar: `.text-button`, card actions, composer toolbar buttons.
- Selected/toggle: `aria-pressed`, `aria-selected`, and existing selected classes.
- Disabled, warning, danger and success retain readable text and distinct border/background cues.
- App shell, Help, Import Center, Profile Catalogue, creation cards, standard-product workflow, both wizards, legacy preview, custom-product views and both 2D/3D composers inherit the shared system.
- Composer keeps the three independent desktop regions; the canvas remains the visual focus; panel surfaces, accordion affordances, selection, dimensions, conceptual warning and threshold warning are clarified.

## Responsive matrix

| Viewport | Acceptance target |
| --- | --- |
| 1920×1080 | Centered content up to 1560 px; balanced three-panel composer; canvas remains dominant. |
| 1366×768 | Compact panel tokens; header actions form a stable row; toolbar can wrap without clipping. |
| 1024×768 | Narrower side panels; readable controls; no page-level horizontal overflow. |
| Narrow/mobile | Header actions and cards become one column where needed; wizard steps use accessible horizontal scrolling; composer regions stack with normal page scrolling and 44 px action targets. |

## Accessibility checklist

- System/local font stack with Cyrillic support; technical metadata uses a local monospace stack.
- A 3 px `:focus-visible` ring applies to controls and interactive roles without changing keyboard semantics.
- Disabled controls remain legible and non-interactive.
- Selected, warning, danger and success states use borders/text in addition to colour.
- Existing `aria-current`, `aria-selected`, `aria-expanded`, disabled and button semantics are preserved.
- Reduced-motion preference disables nonessential transitions and animation.
- Normal text and controls use high-contrast dark text on light surfaces.

## Targeted controls and help refinement

- Native checkbox and radio inputs are explicitly excluded from generic text-input width, height, padding and radius rules. Their visual mark is 19 px while the surrounding label provides the larger interaction row.
- Every contextual `?` uses the shared 26 px `.ff-help-trigger`, an accessible Bulgarian name, expanded state and the existing viewport-aware portal. Click/touch toggle, Escape, outside click, resize and scroll repositioning remain centralized in `ContextHelp`.
- Available help content covers X/Y/Z, diameter, depth, orientation, overall/field/divider dimensions, selected dimension annotations, conceptual 3D depth, camera, visibility, profile Dimension A/B and the existing profile/component concepts. Demonstrational and unresolved meanings remain explicit; no production formula was added.
- Dimension annotation and 3D visibility controls use compact wrapping rows. Catalogue cards use their available width with a responsive information/selection/action grid. Wizard review confirmation is grouped with its label and actions.

## Structural and safety confirmation

No logic/state/geometry source module was edited. No reducer, action, state shape, template/component ID, category/profile transition, dimension, renderer geometry, 3D camera, fit, pointer drag, Undo/Redo, validation, review state, persistence, network or export behavior was changed. `package-lock.json`, dependency lists, repository licensing, privacy boundaries and conceptual/non-production safety copy remain unchanged.

## Manual browser checklist

Verify in a real browser before declaring full PASS:

- Main workspace, Help, Import Center and Profile Catalogue.
- Constructor start, standard-product selector, window wizard and door wizard.
- Window composer 2D/3D and door composer 2D/3D, including camera controls.
- Custom product and legacy template/product preview.
- Empty, warning, disabled, blocked and confirmed states.
- 1920×1080, 1366×768, 1024×768 and narrow layout.
- Keyboard traversal and focus-ring visibility; no clipped controls or horizontal page overflow.

## Final browser audit — 100% zoom

Executed in local Microsoft Edge against the production build.

| Screen | Result | Evidence |
| --- | --- | --- |
| Phase 02 main workspace | Pass | Checked at 1920×1080, 1366×768, 1024×768 and 390×844. No page-level horizontal overflow or clipped controls. |
| Help modal | Pass at 1366×768 | Header, close action, navigation and modal scrolling remain visible. |
| Profile Catalogue | Pass at 1366×768 | Dark header and subtitle are separate from the warning banner; close action, filters and cards remain visible. |
| Legacy Product Preview 2D | Pass at 1366×768 | Drawing, dimension toolbar, component list and close action fit without horizontal overflow. |
| Legacy Product Preview 3D | Pass at 1366×768 | View switch and 3D region open without page-level horizontal overflow. |
| CustomProductDesigner | Pass at 1366×768 after correction | Header no longer overlaps the workflow, toolbar remains visible, canvas and properties are separate, properties scroll independently and footer actions are reachable. |
| DetailDraftingPlaceholder / Non-standard future mode | Pass at 1366×768 | Locked tools remain disabled and labelled as future work; canvas and properties do not overlap. |
| Wizard review, window composer 2D/3D, door composer 2D/3D | Not completed | Automated browser navigation did not reliably reach these stateful screens; no PASS is claimed for them. |

Across audited states, visible checkbox/radio marks measured 19×19 px and contextual help triggers measured 26×26 px with a 50% radius and non-empty accessible labels. The audit detected no page-level horizontal overflow or viewport-clipped interactive controls. The final audit found and corrected two visual regressions in CustomProductDesigner: a grid track was shrinking the header into its subtitle, and a scoped toolbar rule was stretching two help triggers to 34 px high. No functional behavior was changed.
