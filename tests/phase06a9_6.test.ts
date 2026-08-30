import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { generateCadRulerTicks, getCadMajorGridStep, getCadRulerStep } from '../src/cad/cadDrafting'
import { createDefaultCadDisplayState } from '../src/cad/cadTypes'
import { getCustomDrawingTransform, modelToDrawingPoint } from '../src/customDrawingCoordinates'

const designer = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const drawing = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
const grid = readFileSync('src/components/CustomCoordinateGrid.tsx', 'utf8')
const gridLayer = readFileSync('src/components/CadWorkbenchGridLayer.tsx', 'utf8')
const guideLayer = readFileSync('src/components/CadWorkbenchGuideLayer.tsx', 'utf8')
const axes = readFileSync('src/components/CadAxisOverlay.tsx', 'utf8')
const rulers = readFileSync('src/components/CadRulers.tsx', 'utf8')
const crosshair = readFileSync('src/components/CadCrosshair.tsx', 'utf8')
const status = readFileSync('src/components/CadStatusBar.tsx', 'utf8')
const css = readFileSync('src/drawingWorkspaceShell.css', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

test('CAD drafting display defaults are visible without entering product history', () => {
  assert.deepEqual(createDefaultCadDisplayState(), {
    showMajorGrid: true,
    showAxes: true,
    showRulers: true,
    showCoordinates: true,
  })
  assert.match(designer, /useState\(createDefaultCadDisplayState\)/)
  assert.doesNotMatch(designer, /pushHistory\([^\n]*cadDisplay/)
})

test('major grid follows five minor cells for every supported grid step', () => {
  assert.equal(getCadMajorGridStep(10), 50)
  assert.equal(getCadMajorGridStep(25), 125)
  assert.equal(getCadMajorGridStep(50), 250)
  assert.equal(getCadMajorGridStep(100), 500)
  assert.match(grid, /getCadMajorGridStep\(step\)/)
})

test('ruler labels adapt to zoom while remaining millimetre model values', () => {
  const transform = getCustomDrawingTransform(1400, 1200)
  assert.equal(getCadRulerStep(50, transform, 1), 250)
  assert.equal(getCadRulerStep(50, transform, .5), 500)
  assert.equal(getCadRulerStep(50, transform, 2), 250)
  assert.match(rulers, /CUSTOM_DRAWING_VIEW\.width/)
  assert.match(rulers, /CUSTOM_DRAWING_VIEW\.height/)
  assert.match(rulers, /modelMinX/)
  assert.match(rulers, /modelMaxY/)
})

test('legacy ruler tick utility keeps exact product endpoints for downstream dimension use', () => {
  const ticks = generateCadRulerTicks(1400, 500)
  assert.equal(ticks[0].valueMm, 0)
  assert.equal(ticks.at(-1)?.valueMm, 1400)
  assert.ok(ticks.some((tick) => tick.valueMm === 250 && !tick.major))
})

test('origin remains lower-left of the product and Y continues upward', () => {
  const transform = getCustomDrawingTransform(1400, 1200)
  const origin = modelToDrawingPoint({ x: 0, y: 0 }, transform)
  assert.equal(origin.x, transform.ox)
  assert.equal(origin.y, transform.oy + transform.height)
  assert.ok(modelToDrawingPoint({ x: 0, y: 100 }, transform).y < origin.y)
  assert.match(axes, />0,0</)
})

test('grid and ruler layers are independent pointer-transparent workbench SVGs', () => {
  assert.match(gridLayer, /className="cad-workbench-grid-layer"/)
  assert.match(gridLayer, /pointerEvents="none"/)
  assert.match(guideLayer, /className="cad-workbench-guide-layer"/)
  assert.match(guideLayer, /pointerEvents="none"/)
  assert.match(gridLayer, /<CustomCoordinateGrid/)
  assert.match(guideLayer, /<CadAxisOverlay/)
  assert.match(guideLayer, /<CadRulers/)
  assert.doesNotMatch(drawing, /CustomCoordinateGrid|CadAxisOverlay|CadRulers/)
  for (const source of [gridLayer, guideLayer, grid, axes, rulers]) assert.doesNotMatch(source, /updateGeometry|splitField|onCommit|fetch|localStorage/)
})

test('workbench stage owns stable z layers: grid below product, rulers and axes above product', () => {
  const gridIndex = designer.indexOf('<CadWorkbenchGridLayer')
  const drawingIndex = designer.indexOf('<CustomProductDrawing')
  const guideIndex = designer.indexOf('<CadWorkbenchGuideLayer')
  assert.ok(gridIndex >= 0 && drawingIndex > gridIndex && guideIndex > drawingIndex)
  assert.match(designer, /className="custom-drawing-stage"/)
  assert.match(css, /\.cad-workbench-grid-layer[\s\S]*z-index:\s*1/)
  assert.match(css, /\.custom-drawing-stage > \.custom-product-drawing[\s\S]*z-index:\s*2/)
  assert.match(css, /\.cad-workbench-guide-layer[\s\S]*z-index:\s*3/)
})

test('grid is visually independent from product fills and the product cannot mask it', () => {
  assert.match(gridLayer, /cad-workbench-grid-background/)
  assert.match(css, /\.cad-workbench-grid-layer \.custom-coordinate-grid-minor-line[\s\S]*opacity:\s*\.78/)
  assert.match(css, /\.cad-workbench-grid-layer \.custom-coordinate-grid-major-line[\s\S]*opacity:\s*\.96/)
  assert.match(css, /\.custom-drawing-stage \.custom-frame \{ fill:\s*transparent; \}/)
  assert.match(css, /\.custom-drawing-stage \.custom-field \{ fill:\s*rgba\(230,247,249,\.16\); \}/)
})

test('rulers are fixed to workbench top and left edges rather than product fill order', () => {
  assert.match(rulers, /x=\{leftWidth\} y="0"/)
  assert.match(rulers, /x="0" y=\{topHeight\}/)
  assert.match(rulers, /generateVisibleRulerTicks/)
  assert.match(rulers, /gridStep, labelStep/)
  assert.doesNotMatch(rulers, /transform\.oy - topHeight/)
  assert.doesNotMatch(rulers, /transform\.ox - leftWidth/)
})

test('crosshair, rulers, axes and major grid remain independently toggleable view aids', () => {
  assert.match(designer, /aria-label="CAD помощни визуализации"/)
  assert.match(designer, /Главна мрежа/)
  assert.match(designer, /Оси X\/Y/)
  assert.match(designer, /Линийки/)
  assert.match(designer, /Координати/)
  assert.match(designer, /showMajorGrid=\{cadDisplay\.showMajorGrid\}/)
  assert.match(designer, /showAxes=\{cadDisplay\.showAxes\}/)
  assert.match(designer, /showRulers=\{cadDisplay\.showRulers\}/)
  assert.match(drawing, /showCoordinates=\{showCoordinates\}/)
})

test('CAD tool state keeps Select and existing two-click Line history unchanged', () => {
  assert.match(designer, />Избор</)
  assert.match(designer, /activeCadTool: CadTool = lineToolActive \? 'LINE' : 'SELECT'/)
  assert.match(designer, /const point = snapModelPoint\(rawPoint, gridStep, snappingEnabled\)/)
  assert.match(designer, /appendCustomDrawingLine\(value\.present, lineStartPoint, point\)/)
  assert.match(designer, /event\.key !== 'Escape'/)
  assert.match(designer, /next === value\.present \? value : pushHistory\(value, next\)/)
})

test('status bar reports tool, grid, snap, coordinates and zoom without product writes', () => {
  assert.match(status, /ИНСТРУМЕНТ/)
  assert.match(status, /МРЕЖА/)
  assert.match(status, /SNAP/)
  assert.match(status, /ZOOM/)
  assert.match(designer, /<CadStatusBar/)
  assert.match(css, /\.cad-status-bar[^}]*background:\s*#102c35/s)
  assert.doesNotMatch(status, /CustomProduct|updateGeometry|onCommit/)
})

test('phase adds no dependency and keeps the desktop workbench as the dominant canvas', () => {
  assert.equal(packageJson.scripts['test:phase06a9_6'].includes('phase06a9_6.test.ts'), true)
  assert.deepEqual(Object.keys(packageJson.dependencies).sort(), ['@mlightcad/libredwg-web','@react-three/fiber','pdfjs-dist','react','react-dom','tesseract.js','three'].sort())
  assert.match(css, /@media \(min-width: 1180px\)[\s\S]*\.drawing-workspace-viewport[\s\S]*border:\s*2px solid #087b91/)
  assert.match(css, /\.custom-cad-display-controls[^}]*flex-wrap:\s*wrap/s)
})

test('independent layers share one 820 by 560 viewBox so zoom cannot desynchronise them', () => {
  assert.match(gridLayer, /CUSTOM_DRAWING_VIEW\.width/)
  assert.match(gridLayer, /CUSTOM_DRAWING_VIEW\.height/)
  assert.match(guideLayer, /CUSTOM_DRAWING_VIEW\.width/)
  assert.match(guideLayer, /CUSTOM_DRAWING_VIEW\.height/)
  assert.match(gridLayer, /preserveAspectRatio="xMidYMid meet"/)
  assert.match(guideLayer, /preserveAspectRatio="xMidYMid meet"/)
  assert.match(css, /\.custom-drawing-stage > svg[\s\S]*position:\s*absolute[\s\S]*width:\s*100%[\s\S]*height:\s*100%/)
})
