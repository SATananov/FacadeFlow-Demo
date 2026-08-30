import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { CUSTOM_GRID_STEPS, CUSTOM_SNAP_MODE, DEFAULT_CUSTOM_GRID_STEP, formatSnapReadout, modelPointsDiffer, normalizeGridStep, snapCoordinate, snapModelPoint } from '../src/customDrawingCoordinates'

const designer = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const drawing = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
const marker = readFileSync('src/components/CustomSnapMarker.tsx', 'utf8')
const css = readFileSync('src/drawingWorkspaceShell.css', 'utf8')

test('GRID is the only mode and snapping is enabled by default', () => {
  assert.equal(CUSTOM_SNAP_MODE, 'GRID')
  assert.match(designer, /snappingEnabled, setSnappingEnabled] = useState\(true\)/)
})

test('only supported steps are accepted and default is 50 mm', () => {
  assert.deepEqual(CUSTOM_GRID_STEPS, [10,25,50,100])
  assert.equal(DEFAULT_CUSTOM_GRID_STEP, 50)
  assert.equal(normalizeGridStep(25), 25)
  assert.equal(normalizeGridStep(17), 50)
})

test('coordinates snap independently for every step', () => {
  assert.deepEqual(CUSTOM_GRID_STEPS.map((step) => snapModelPoint({x: 147,y: 263}, step, true)), [{x:150,y:260},{x:150,y:275},{x:150,y:250},{x:100,y:300}])
})

test('negative ties resolve toward positive infinity without negative zero or noise', () => {
  assert.equal(snapCoordinate(-25, 50), 0)
  assert.equal(Object.is(snapCoordinate(-1, 50), -0), false)
  assert.equal(snapCoordinate(-26, 50), -50)
  assert.equal(snapCoordinate(49.999999999, 50), 50)
})

test('disabled snapping returns raw values and readout distinguishes its state', () => {
  const raw = {x:347,y:718}
  assert.deepEqual(snapModelPoint(raw, 50, false), raw)
  assert.equal(formatSnapReadout(raw, snapModelPoint(raw,50,true), true), 'X: 350 mm · Y: 700 mm · SNAP: GRID')
  assert.equal(formatSnapReadout(raw, null, false), 'X: 347 mm · Y: 718 mm · SNAP: ИЗКЛ.')
  assert.equal(formatSnapReadout(null, null, true), 'X: — · Y: —')
  assert.equal(modelPointsDiffer(raw, {x:350,y:700}), true)
})

test('grid visibility and snapping are independent view-only state outside history', () => {
  assert.match(designer, /gridVisible.*snappingEnabled/s)
  assert.doesNotMatch(designer, /pushHistory\([^\n]*(gridVisible|gridStep|snappingEnabled)/)
  assert.match(designer, /gridVisible=\{gridVisible\}[\s\S]*gridStep=\{gridStep\}[\s\S]*snapPoint=\{snapPoint\}/)
})

test('marker is pointer transparent, conditional and removed on pointer leave', () => {
  assert.match(marker, /pointerEvents="none"/)
  assert.match(drawing, /snappingEnabled && snapPoint && <CustomSnapMarker/)
  assert.match(drawing, /onPointerLeave=\{\(\) => onCursorCoordinates\?\.\(null\)\}/)
  assert.match(css, /vector-effect:\s*non-scaling-stroke/)
})

test('snap preview contains no geometry mutation or drawing tools and toolbar wraps', () => {
  assert.doesNotMatch(marker, /updateGeometry|splitField|onClick|pointerCapture/)
  assert.doesNotMatch(designer, />\s*(ENDPOINT|MIDPOINT|INTERSECTION|PERPENDICULAR)\s*</i)
  assert.doesNotMatch(designer, /['"](ENDPOINT|MIDPOINT|INTERSECTION|PERPENDICULAR)['"]/i)
  assert.match(css, /\.custom-grid-controls[^}]*flex-wrap:\s*wrap/s)
})
