import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CUSTOM_GRID_MAJOR_STEP,
  CUSTOM_GRID_STEPS,
  DEFAULT_CUSTOM_GRID_STEP,
  drawingPointToModel,
  formatCursorCoordinates,
  getCustomDrawingTransform,
  gridStepToPixels,
  isPointInsideDrawingBounds,
  modelToDrawingPoint,
} from '../src/customDrawingCoordinates'

const drawingSource = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
const gridSource = readFileSync('src/components/CustomCoordinateGrid.tsx', 'utf8')
const designerSource = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const cssSource = readFileSync('src/drawingWorkspaceShell.css', 'utf8')

test('coordinate origin is the lower-left frame corner and Y increases upward', () => {
  const transform = getCustomDrawingTransform(1400, 1200)
  const origin = modelToDrawingPoint({ x: 0, y: 0 }, transform)
  assert.equal(origin.x, transform.ox)
  assert.equal(origin.y, transform.oy + transform.height)
  assert.ok(modelToDrawingPoint({ x: 0, y: 100 }, transform).y < origin.y)
})

test('model and drawing coordinate conversion round trips', () => {
  const transform = getCustomDrawingTransform(1400, 1200)
  const model = { x: 345.5, y: 678.25 }
  const restored = drawingPointToModel(modelToDrawingPoint(model, transform), transform)
  assert.ok(Math.abs(restored.x - model.x) < 1e-9)
  assert.ok(Math.abs(restored.y - model.y) < 1e-9)
})

test('supported view-only grid steps and major interval remain explicit', () => {
  assert.deepEqual(CUSTOM_GRID_STEPS, [10, 25, 50, 100])
  assert.equal(DEFAULT_CUSTOM_GRID_STEP, 50)
  assert.equal(CUSTOM_GRID_MAJOR_STEP, 500)
  const transform = getCustomDrawingTransform(1000, 1000)
  assert.equal(gridStepToPixels(50, transform), 50 * transform.scale)
})

test('frame bounds are deterministic and cursor placeholder is explicit', () => {
  const transform = getCustomDrawingTransform(1400, 1200)
  assert.equal(isPointInsideDrawingBounds({ x: transform.ox, y: transform.oy }, transform), true)
  assert.equal(isPointInsideDrawingBounds({ x: transform.ox - 1, y: transform.oy }, transform), false)
  assert.equal(formatCursorCoordinates(null), 'X: — · Y: —')
  assert.equal(formatCursorCoordinates({ x: 49.6, y: 75.4 }), 'X: 50 mm · Y: 75 mm')
})

test('grid is a bounded non-interactive SVG viewport layer below product geometry', () => {
  assert.match(gridSource, /pointerEvents="none"/)
  assert.match(gridSource, /CUSTOM_DRAWING_VIEW\.width/)
  assert.match(gridSource, /CUSTOM_DRAWING_VIEW\.height/)
  assert.ok(drawingSource.indexOf('<CustomCoordinateGrid') < drawingSource.indexOf('className="custom-frame"'))
  assert.doesNotMatch(gridSource, /onPointer|onClick|onKeyDown/)
})

test('toolbar controls are accessible, wrapping, and view-only', () => {
  assert.match(designerSource, /aria-label="Координатна мрежа(?: и прихващане)?"/)
  assert.match(designerSource, /aria-live="polite"/)
  assert.match(designerSource, /useState\(true\).*DEFAULT_CUSTOM_GRID_STEP/)
  assert.match(cssSource, /\.custom-grid-controls[^}]*flex-wrap:\s*wrap/s)
  assert.match(cssSource, /\.custom-grid-controls[^}]*min-width:\s*0/s)
  assert.doesNotMatch(designerSource, /pushHistory\([^\n]*(gridVisible|gridStep)/)
})

test('pointer conversion uses the SVG screen matrix without snapping or geometry mutation', () => {
  assert.match(drawingSource, /getScreenCTM\(\)/)
  assert.match(drawingSource, /matrix\.inverse\(\)/)
  assert.match(drawingSource, /Math\.round\(coordinates\.x\)/)
  assert.doesNotMatch(drawingSource, /Math\.round\([^)]*\/\s*gridStep/)
  assert.doesNotMatch(gridSource, /projectGeometry|updateGeometryNode|splitField/)
})

test('narrow toolbar keeps touch-sized grid controls without text clipping', () => {
  assert.match(cssSource, /@media \(max-width: 900px\)[\s\S]*\.custom-grid-controls[\s\S]*min-height:\s*42px/)
  assert.doesNotMatch(cssSource, /\.custom-grid-controls[^}]*overflow:\s*hidden/s)
})
