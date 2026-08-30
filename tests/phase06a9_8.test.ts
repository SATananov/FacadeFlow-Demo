import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  appendCustomDrawingLine,
  createCustomDrawingLineLayer,
  updateCustomDrawingLineEndpoint,
} from '../src/customDrawingLines'

const designer = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const drawing = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
const lines = readFileSync('src/customDrawingLines.ts', 'utf8')
const css = readFileSync('src/drawingWorkspaceShell.css', 'utf8')
const acceptance = readFileSync('docs/PHASE_06A_9_8_ENDPOINT_GRIP_EDITING_ACCEPTANCE.md', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

function sampleLayer() {
  return appendCustomDrawingLine(createCustomDrawingLineLayer(), { x: 100, y: 200 }, { x: 500, y: 600 })
}

test('endpoint helper moves only the requested endpoint and preserves stable Line identity', () => {
  const layer = sampleLayer()
  const movedStart = updateCustomDrawingLineEndpoint(layer, 'line-0001', 'start', { x: 150, y: 250 })
  assert.equal(movedStart.nextId, 2)
  assert.equal(movedStart.lines[0]?.id, 'line-0001')
  assert.deepEqual(movedStart.lines[0]?.start, { x: 150, y: 250 })
  assert.deepEqual(movedStart.lines[0]?.end, { x: 500, y: 600 })

  const movedEnd = updateCustomDrawingLineEndpoint(movedStart, 'line-0001', 'end', { x: 700, y: 800 })
  assert.deepEqual(movedEnd.lines[0]?.start, { x: 150, y: 250 })
  assert.deepEqual(movedEnd.lines[0]?.end, { x: 700, y: 800 })
})

test('endpoint helper rejects zero-length, missing-Line and no-op drag commits', () => {
  const layer = sampleLayer()
  assert.equal(updateCustomDrawingLineEndpoint(layer, 'line-0001', 'start', { x: 500, y: 600 }), layer)
  assert.equal(updateCustomDrawingLineEndpoint(layer, 'line-0001', 'end', { x: 100, y: 200 }), layer)
  assert.equal(updateCustomDrawingLineEndpoint(layer, 'line-0001', 'start', { x: 100, y: 200 }), layer)
  assert.equal(updateCustomDrawingLineEndpoint(layer, 'missing', 'start', { x: 20, y: 30 }), layer)
})

test('selected endpoint grips become pointer-interactive only in Select mode', () => {
  assert.match(designer, /lineEndpointEditingEnabled=\{!lineToolActive\}/)
  assert.match(drawing, /pointerEvents=\{lineEndpointEditingEnabled \? 'all' : 'none'\}/)
  assert.match(drawing, /aria-label=\{`Премести начало на \$\{line\.id\}`\}/)
  assert.match(drawing, /aria-label=\{`Премести край на \$\{line\.id\}`\}/)
  assert.match(css, /\.custom-drawing-line-grip \{[^}]*cursor: move;[^}]*touch-action: none/s)
})

test('grip drag uses SVG pointer capture so movement survives leaving the small grip target', () => {
  assert.match(drawing, /setPointerCapture\(event\.pointerId\)/)
  assert.match(drawing, /hasPointerCapture\(event\.pointerId\)/)
  assert.match(drawing, /releasePointerCapture\(event\.pointerId\)/)
  assert.match(drawing, /onPointerCancel:/)
  assert.match(drawing, /onCancelLineEndpointDrag\?\.\(\)/)
})

test('pointer coordinates are converted through the owning SVG model transform during drag', () => {
  assert.match(drawing, /const svgRef = useRef<SVGSVGElement>\(null\)/)
  assert.match(drawing, /const svg = svgRef\.current/)
  assert.match(drawing, /svg\.getScreenCTM\(\)/)
  assert.match(drawing, /drawingPointToModel\(drawingPoint, transform\)/)
  assert.match(drawing, /clientToModelCoordinates\(event\.clientX, event\.clientY\)/)
})

test('drag preview is ephemeral and changes only the displayed selected Line endpoint', () => {
  assert.match(designer, /\[lineEndpointDrag, setLineEndpointDrag\]/)
  assert.match(drawing, /lineEndpointDrag\?\.lineId === line\.id/)
  assert.match(drawing, /displayStart = drag\?\.endpoint === 'start' \? drag\.point : line\.start/)
  assert.match(drawing, /displayEnd = drag\?\.endpoint === 'end' \? drag\.point : line\.end/)
  assert.match(css, /\.custom-drawing-line-grip\.dragging/)
})

test('drag preview and final commit both use the accepted GRID snap policy', () => {
  const snapCalls = designer.match(/snapModelPoint\(rawPoint, gridStep, snappingEnabled\)/g) ?? []
  assert.ok(snapCalls.length >= 3, 'Line create, drag preview and drag commit should all use the shared snap policy')
  assert.match(designer, /moveLineEndpointDrag[\s\S]*snapModelPoint\(rawPoint, gridStep, snappingEnabled\)/)
  assert.match(designer, /commitLineEndpointDrag[\s\S]*snapModelPoint\(rawPoint, gridStep, snappingEnabled\)/)
})

test('one completed drag creates at most one Line-history commit', () => {
  assert.match(designer, /commitLineEndpointDrag[\s\S]*updateCustomDrawingLineEndpoint\(value\.present, lineId, endpoint, point\)/)
  assert.match(designer, /commitLineEndpointDrag[\s\S]*next === value\.present \? value : pushHistory\(value, next\)/)
  const moveBody = designer.slice(designer.indexOf('const moveLineEndpointDrag'), designer.indexOf('const commitLineEndpointDrag'))
  assert.doesNotMatch(moveBody, /setLineHistory|pushHistory|updateCustomDrawingLineEndpoint/)
})

test('Escape cancels an active endpoint drag before normal Select-mode deselection', () => {
  assert.match(designer, /event\.key === 'Escape'/)
  assert.match(designer, /if \(lineEndpointDrag\) \{ setLineEndpointDrag\(null\); return \}/)
  assert.match(designer, /lineEndpointDrag\.lineId !== lineId \|\| lineEndpointDrag\.endpoint !== endpoint/)
  assert.match(designer, /setLineEndpointDrag\(null\)/)
  assert.match(acceptance, /Escape.*cancel/i)
})

test('Line mode and Line undo redo cancel any transient endpoint drag', () => {
  assert.match(designer, /toggleLineTool = \(\) => \{ setLineStartPoint\(null\); setSelectedDrawingLineId\(null\); setLineEndpointDrag\(null\)/)
  assert.match(designer, /undoLine = \(\) => \{ setLineStartPoint\(null\); setSelectedDrawingLineId\(null\); setLineEndpointDrag\(null\)/)
  assert.match(designer, /redoLine = \(\) => \{ setLineStartPoint\(null\); setSelectedDrawingLineId\(null\); setLineEndpointDrag\(null\)/)
})

test('endpoint drag remains Line-only and cannot mutate product geometry or product history', () => {
  const dragSection = designer.slice(designer.indexOf('const beginLineEndpointDrag'), designer.indexOf('const setTop'))
  assert.doesNotMatch(dragSection, /onCommit\(|replaceGeometry|updateGeometryNode|splitField|setHistory\(/)
  assert.match(dragSection, /setLineHistory/)
  assert.doesNotMatch(lines, /CustomProduct|onCommit|updateGeometry|splitField|fetch|localStorage/)
})

test('helper Lines remain session-only and export boundary is unchanged', () => {
  assert.match(acceptance, /session-only/i)
  assert.match(acceptance, /simulation export/i)
  assert.match(designer, />Експортирай custom simulation JSON</)
  assert.doesNotMatch(lines, /exportCustomProduct|fetch|localStorage|sessionStorage/)
})

test('phase adds no dependency and registers its dedicated acceptance test', () => {
  assert.equal(packageJson.scripts['test:phase06a9_8'].includes('phase06a9_8.test.ts'), true)
  assert.deepEqual(Object.keys(packageJson.dependencies).sort(), ['@mlightcad/libredwg-web','@react-three/fiber','pdfjs-dist','react','react-dom','tesseract.js','three'].sort())
  assert.match(designer, /<CadWorkbenchGridLayer/)
  assert.match(designer, /<CadWorkbenchGuideLayer/)
  assert.match(designer, /<CadStatusBar/)
})
