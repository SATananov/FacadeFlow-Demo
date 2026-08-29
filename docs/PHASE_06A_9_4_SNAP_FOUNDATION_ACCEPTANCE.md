# Phase 06A.9.4 — Snap Foundation and Preview Marker

## Scope

Добавен е GRID-only cursor preview snap в 2D `CustomProductDesigner`: view-only toggle, snapped readout и SVG marker. Активната grid step 10/25/50/100 mm управлява snapping независимо от видимостта на мрежата.

## Policy

X и Y се прихващат независимо към най-близкото кратно на стъпката. При точна половин стъпка правилото е към положителна безкрайност; например `-25` при 50 mm става `0`. Резултатът нормализира `-0` и не съдържа floating-point шум. Отрицателните координати не се clamp-ват до касата.

Marker-ът е teal circle/crosshair, SVG-native, `pointer-events:none`, над dimensions/geometry и видим само при валидна cursor позиция и включено snapping. Размерът се компенсира спрямо workspace zoom.

Readout показва snapped координати и `SNAP: GRID`, или raw координати и `SNAP: ИЗКЛ.`. Pointer leave връща placeholder. `aria-live="polite"` получава цели моделни милиметри, а повторните еднакви стойности не обновяват state.

Grid visibility, grid step и snap toggle са независим локален view state. Те не се записват, export-ват или включват в Undo/Redo. Screen-to-model conversion продължава да използва inverse SVG CTM, затова zoom/fit не променят model/snap резултата.

## Protected behavior and limitations

Phase 06A.9.4 does not modify existing product geometry.

Free drawing tools are not implemented.

Endpoint, midpoint, intersection and perpendicular snapping are not implemented.

Не са променяни selection, divider/sash handlers, dimensions, validation, history, pointer capture, 3D, export, persistence, network или safety flags.

## Verification

- Browser 1920×1080: PASS — controls visible; no page/toolbar horizontal overflow.
- Browser 1366×768: PASS — compact wrapping toolbar and usable canvas.
- Browser 1024×768: PASS — wrapping without horizontal overflow.
- Browser 390×844: PASS — normal vertical flow, 42 px touch target and no horizontal overflow.
- Observed 50 mm GRID snap: raw `347,718` → snapped `350,700`; raw `-26,-25` → snapped `-50,0`; exact `700,600` remains `700,600`.
- Grid hidden + snapping enabled keeps the marker; snapping disabled removes it; pointer leave restores the placeholder; Undo availability remains unchanged.
- Full regression matrix: PASS.
- `test:phase06a9_4`: PASS, 8/8.
- Lint/build/diff check: PASS (build retains the existing Vite chunk-size warning).
