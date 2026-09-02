import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  appendCustomDrawingLine,
  createCustomDrawingLineLayer,
  getCustomDrawingLineMetrics,
  getCustomDrawingLineTranslation,
  translateCustomDrawingLine,
} from '../src/customDrawingLines'

const designer = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const drawing = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
const lines = readFileSync('src/customDrawingLines.ts', 'utf8')
const css = readFileSync('src/drawingWorkspaceShell.css', 'utf8')
const acceptance = readFileSync('docs/PHASE_06A_9_9_MOVE_WHOLE_LINE_ACCEPTANCE.md', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

function sampleLayer() {
  return appendCustomDrawingLine(createCustomDrawingLineLayer(), { x: 125, y: 225 }, { x: 525, y: 625 })
}

test('translation helper moves both endpoints by the same delta and preserves identity', () => {
  const layer = sampleLayer()
  const moved = translateCustomDrawingLine(layer, 'line-0001', { x: 100, y: -50 })
  assert.equal(moved.nextId, 2)
  assert.equal(moved.lines[0]?.id, 'line-0001')
  assert.deepEqual(moved.lines[0]?.start, { x: 225, y: 175 })
  assert.deepEqual(moved.lines[0]?.end, { x: 625, y: 575 })
})

test('whole-Line translation preserves vector length and angle', () => {
  const layer = sampleLayer()
  const before = layer.lines[0]!
  const moved = translateCustomDrawingLine(layer, before.id, { x: -75, y: 125 })
  const after = moved.lines[0]!
  assert.deepEqual(
    { x: after.end.x - after.start.x, y: after.end.y - after.start.y },
    { x: before.end.x - before.start.x, y: before.end.y - before.start.y },
  )
  assert.deepEqual(getCustomDrawingLineMetrics(after), getCustomDrawingLineMetrics(before))
})

test('translation helper rejects no-op and missing-Line mutations', () => {
  const layer = sampleLayer()
  assert.equal(translateCustomDrawingLine(layer, 'line-0001', { x: 0, y: 0 }), layer)
  assert.equal(translateCustomDrawingLine(layer, 'missing', { x: 50, y: 50 }), layer)
})

test('GRID policy snaps the movement delta rather than reshaping endpoints', () => {
  assert.deepEqual(getCustomDrawingLineTranslation({ x: 10, y: 20 }, { x: 73, y: -6 }, 50, true), { x: 50, y: -50 })
  assert.deepEqual(getCustomDrawingLineTranslation({ x: 10, y: 20 }, { x: 73, y: -6 }, 50, false), { x: 63, y: -26 })
  assert.deepEqual(getCustomDrawingLineTranslation({ x: 10, y: 20 }, { x: 73, y: -6 }, 0, true), { x: 63, y: -26 })
})

test('only an already selected Line body can begin body dragging in Select mode', () => {
  assert.match(designer, /lineBodyEditingEnabled=\{!lineToolActive\}/)
  assert.match(designer, /selectedDrawingLineId !== lineId/)
  assert.match(drawing, /lineBodyDragHandlers\(line\.id, selected\)/)
  assert.match(drawing, /if \(!selected \|\| !lineBodyEditingEnabled\) return/)
  assert.match(drawing, /aria-label=\{selected \? `Премести цялата \$\{line\.id\}` : `Избери \$\{line\.id\}`\}/)
  assert.match(css, /\.custom-drawing-line-group\.selected \.custom-drawing-line-hit \{[^}]*cursor: move;[^}]*touch-action: none/s)
})

test('Line body drag uses SVG pointer capture and model-space pointer coordinates', () => {
  const bodySection = drawing.slice(drawing.indexOf('const lineBodyDragHandlers'), drawing.indexOf('return <svg'))
  assert.match(bodySection, /setPointerCapture\(event\.pointerId\)/)
  assert.match(bodySection, /hasPointerCapture\(event\.pointerId\)/)
  assert.match(bodySection, /releasePointerCapture\(event\.pointerId\)/)
  assert.match(bodySection, /clientToModelCoordinates\(event\.clientX, event\.clientY\)/)
  assert.match(bodySection, /onPointerCancel:/)
  assert.match(bodySection, /onCancelLineBodyDrag\?\.\(\)/)
})

test('body movement preview is ephemeral and translates both rendered endpoints with the same delta', () => {
  assert.match(designer, /\[lineBodyDrag, setLineBodyDrag\]/)
  assert.match(drawing, /lineBodyDrag\?\.lineId === line\.id/)
  assert.match(drawing, /translatedStart = bodyDrag \? \{ x: line\.start\.x \+ bodyDrag\.delta\.x, y: line\.start\.y \+ bodyDrag\.delta\.y \} : line\.start/)
  assert.match(drawing, /translatedEnd = bodyDrag \? \{ x: line\.end\.x \+ bodyDrag\.delta\.x, y: line\.end\.y \+ bodyDrag\.delta\.y \} : line\.end/)
  assert.match(drawing, /custom-drawing-line-group\$\{selected \? ' selected' : ''\}\$\{bodyDrag \? ' moving' : ''\}/)
  assert.match(css, /\.custom-drawing-line-group\.moving \.custom-drawing-line-hit \{[^}]*cursor: grabbing/s)
})

test('preview and commit share the same delta-based GRID translation policy', () => {
  assert.match(designer, /moveLineBodyDrag[\s\S]*getCustomDrawingLineTranslation\(current\.pointerStart, rawPoint, gridStep, snappingEnabled\)/)
  assert.match(designer, /commitLineBodyDrag[\s\S]*getCustomDrawingLineTranslation\(lineBodyDrag\.pointerStart, rawPoint, gridStep, snappingEnabled\)/)
  assert.match(lines, /Math\.round\(raw\.x \/ gridStep\) \* gridStep/)
  assert.match(lines, /Math\.round\(raw\.y \/ gridStep\) \* gridStep/)
})

test('one completed whole-Line drag creates at most one Line-history commit', () => {
  assert.match(designer, /commitLineBodyDrag[\s\S]*translateCustomDrawingLine\(value\.present, lineId, delta\)/)
  assert.match(designer, /commitLineBodyDrag[\s\S]*next === value\.present \? value : pushHistory\(value, next\)/)
  const moveSection = designer.slice(designer.indexOf('const moveLineBodyDrag'), designer.indexOf('const commitLineBodyDrag'))
  assert.doesNotMatch(moveSection, /setLineHistory|pushHistory|translateCustomDrawingLine/)
})

test('Escape and tool/history changes cancel transient whole-Line dragging', () => {
  assert.match(designer, /if \(lineBodyDrag\) \{ setLineBodyDrag\(null\); return \}/)
  assert.match(designer, /lineBodyDrag\.lineId !== lineId/)
  assert.match(designer, /toggleLineTool = \(\) => \{[^}]*setLineBodyDrag\(null\)/)
  assert.match(designer, /undoLine = \(\) => \{[^}]*setLineBodyDrag\(null\)/)
  assert.match(designer, /redoLine = \(\) => \{[^}]*setLineBodyDrag\(null\)/)
  assert.match(acceptance, /Escape.*cancel/i)
})

test('endpoint editing remains separate and higher-priority than body dragging', () => {
  assert.match(designer, /beginLineEndpointDrag[\s\S]*setLineBodyDrag\(null\)/)
  assert.match(designer, /beginLineBodyDrag[\s\S]*setLineEndpointDrag\(null\)/)
  assert.match(drawing, /endpointDragHandlers\(line\.id, 'start'\)/)
  assert.match(drawing, /endpointDragHandlers\(line\.id, 'end'\)/)
  assert.match(drawing, /lineBodyDragHandlers\(line\.id, selected\)/)
})

test('whole-Line dragging remains Line-only and cannot mutate product geometry/history', () => {
  const bodySection = designer.slice(designer.indexOf('const beginLineBodyDrag'), designer.indexOf('const lineToolStatus'))
  assert.doesNotMatch(bodySection, /onCommit\(|replaceGeometry|updateGeometryNode|splitField|setHistory\(/)
  assert.match(bodySection, /setLineHistory/)
  assert.doesNotMatch(lines, /CustomProduct|onCommit|updateGeometry|splitField|fetch|localStorage|sessionStorage/)
})

test('session-only export boundary and dependencies remain unchanged', () => {
  assert.match(acceptance, /session-only/i)
  assert.match(acceptance, /simulation export/i)
  assert.match(designer, />Експортирай JSON на симулационната чернова</)
  assert.equal(packageJson.scripts['test:phase06a9_9'].includes('phase06a9_9.test.ts'), true)
  assert.deepEqual(Object.keys(packageJson.dependencies).sort(), ['@mlightcad/libredwg-web','@react-three/fiber','pdfjs-dist','react','react-dom','tesseract.js','three'].sort())
})
