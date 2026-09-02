import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  appendCustomDrawingLine,
  createCustomDrawingLineLayer,
  findCustomDrawingLine,
  getCustomDrawingLineMetrics,
  removeCustomDrawingLine,
  updateCustomDrawingLine,
} from '../src/customDrawingLines'

const designer = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const drawing = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
const properties = readFileSync('src/components/CadLinePropertiesPanel.tsx', 'utf8')
const lines = readFileSync('src/customDrawingLines.ts', 'utf8')
const css = readFileSync('src/drawingWorkspaceShell.css', 'utf8')
const acceptance = readFileSync('docs/PHASE_06A_9_7_LINE_SELECTION_PROPERTIES_ACCEPTANCE.md', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

function sampleLayer() {
  return appendCustomDrawingLine(createCustomDrawingLineLayer(), { x: 0, y: 0 }, { x: 300, y: 400 })
}

test('line metrics remain pure model-space millimetres', () => {
  const line = sampleLayer().lines[0]
  assert.ok(line)
  const metrics = getCustomDrawingLineMetrics(line)
  assert.equal(metrics.lengthMm, 500)
  assert.ok(Math.abs(metrics.angleDeg - 53.13010235415598) < 1e-9)
})

test('line lookup and numeric update keep stable ID and nextId', () => {
  const layer = sampleLayer()
  const current = findCustomDrawingLine(layer, 'line-0001')
  assert.equal(current?.id, 'line-0001')
  const updated = updateCustomDrawingLine(layer, 'line-0001', { x: 50, y: 60 }, { x: 350, y: 460 })
  assert.notEqual(updated, layer)
  assert.equal(updated.nextId, 2)
  assert.equal(updated.lines[0]?.id, 'line-0001')
  assert.deepEqual(updated.lines[0]?.start, { x: 50, y: 60 })
  assert.deepEqual(updated.lines[0]?.end, { x: 350, y: 460 })
})

test('numeric edit rejects zero-length Lines and no-op edits without history-worthy mutation', () => {
  const layer = sampleLayer()
  assert.equal(updateCustomDrawingLine(layer, 'line-0001', { x: 20, y: 20 }, { x: 20, y: 20 }), layer)
  assert.equal(updateCustomDrawingLine(layer, 'line-0001', { x: 0, y: 0 }, { x: 300, y: 400 }), layer)
  assert.equal(updateCustomDrawingLine(layer, 'missing', { x: 0, y: 0 }, { x: 20, y: 20 }), layer)
})

test('deleting a Line preserves the monotonic nextId and ignores missing IDs', () => {
  const layer = sampleLayer()
  const removed = removeCustomDrawingLine(layer, 'line-0001')
  assert.equal(removed.lines.length, 0)
  assert.equal(removed.nextId, 2)
  assert.equal(removeCustomDrawingLine(removed, 'missing'), removed)
})

test('Select mode owns Line selection while Line mode disables Line hit targets', () => {
  assert.match(designer, /selectedDrawingLineId/)
  assert.match(designer, /findCustomDrawingLine\(lineHistory\.present, selectedDrawingLineId\)/)
  assert.match(designer, /lineSelectionEnabled=\{!lineToolActive\}/)
  assert.match(designer, /onSelectDrawingLine=\{setSelectedDrawingLineId\}/)
  assert.match(designer, /toggleLineTool = \(\) => \{ setLineStartPoint\(null\); setSelectedDrawingLineId\(null\)/)
  assert.match(drawing, /lineSelectionEnabled && <line/)
  assert.match(drawing, /className="custom-drawing-line-hit" pointerEvents="stroke"/)
})

test('Line selection uses a wide invisible hit target without changing visible stroke geometry', () => {
  assert.match(drawing, /className=\{selected \? 'custom-drawing-line selected' : 'custom-drawing-line'\} pointerEvents="none"/)
  assert.match(drawing, /lineBodyDragHandlers\(line\.id, selected\)/)
  assert.match(drawing, /lineBodyDragHandlers[\s\S]*event\.stopPropagation\(\)/)
  assert.match(drawing, /onSelectDrawingLine\?\.\(line\.id\)/)
  assert.match(css, /\.custom-drawing-line-hit \{[^}]*stroke: transparent;[^}]*stroke-width: 14/s)
  assert.match(css, /\.custom-drawing-line\.selected \{[^}]*stroke-width: 3\.2/s)
})

test('selected Line gets explicit endpoint grips', () => {
  assert.match(drawing, /custom-drawing-line-grip/)
  assert.match(drawing, /cx=\{start\.x\}/)
  assert.match(drawing, /cx=\{end\.x\}/)
  assert.match(css, /\.custom-drawing-line-grip \{[^}]*fill: #fff;[^}]*stroke: #067c91/s)
})

test('right rail switches to Line properties and product field selection clears Line selection', () => {
  assert.match(designer, /selectedDrawingLine \? <CadLinePropertiesPanel/)
  assert.match(designer, /selectedFieldId=\{selectedDrawingLine \? '' : selectedFieldId\}/)
  assert.match(designer, /onSelectField=\{setSelectedFieldId\}/)
  assert.match(designer, /onClearDrawingLineSelection=\{\(\) => setSelectedDrawingLineId\(null\)\}/)
  assert.match(drawing, /onClearDrawingLineSelection\?\.\(\); onSelectField\(node\.id\)/)
  assert.match(properties, />Избрана линия</)
  assert.match(properties, /drawing \/ \{line\.id\}/)
})

test('Line properties expose numeric endpoints, calculated length and angle', () => {
  for (const label of ['X1 (mm)', 'Y1 (mm)', 'X2 (mm)', 'Y2 (mm)', 'Дължина', 'Ъгъл']) assert.match(properties, new RegExp(label.replace(/[()]/g, '\\$&')))
  assert.match(properties, /getCustomDrawingLineMetrics\(line\)/)
  assert.match(properties, /Приложи координатите/)
  assert.match(properties, /Координатите трябва да са числови/)
})

test('Line edit and delete operations push only Line history', () => {
  assert.match(designer, /updateCustomDrawingLine\(value\.present, selectedDrawingLineId, start, end\)/)
  assert.match(designer, /removeCustomDrawingLine\(value\.present, selectedDrawingLineId\)/)
  assert.match(designer, /next === value\.present \? value : pushHistory\(value, next\)/)
  assert.doesNotMatch(properties, /onCommit|setHistory|CustomProduct|updateGeometry|splitField/)
  assert.doesNotMatch(lines, /onCommit|CustomProduct|updateGeometry|splitField|fetch|localStorage/)
})

test('keyboard delete is guarded from form editing and Escape clears only Line selection', () => {
  assert.match(designer, /event\.target as HTMLElement/)
  assert.match(designer, /closest\('input, select, textarea, \[contenteditable=/)
  assert.match(designer, /event\.key === 'Escape'/)
  assert.match(designer, /event\.key !== 'Delete' && event\.key !== 'Backspace'/)
  assert.match(designer, /event\.preventDefault\(\)/)
})

test('Line helper geometry remains session-only and outside export/persistence boundaries', () => {
  assert.match(properties, /само за текущата сесия/)
  assert.match(properties, /Не влиза в изделието и не се експортира/)
  assert.match(acceptance, /do \*\*not\*\* enter simulation export/)
  assert.doesNotMatch(properties, /exportCustomProduct|fetch|localStorage|sessionStorage/)
  assert.doesNotMatch(lines, /exportCustomProduct|fetch|localStorage|sessionStorage/)
})

test('phase adds no dependency and keeps accepted 06A.9.6 CAD foundation intact', () => {
  assert.equal(packageJson.scripts['test:phase06a9_7'].includes('phase06a9_7.test.ts'), true)
  assert.deepEqual(Object.keys(packageJson.dependencies).sort(), ['@mlightcad/libredwg-web','@react-three/fiber','pdfjs-dist','react','react-dom','tesseract.js','three'].sort())
  assert.match(designer, /<CadWorkbenchGridLayer/)
  assert.match(designer, /<CadWorkbenchGuideLayer/)
  assert.match(designer, /<CadStatusBar/)
  assert.match(designer, />Експортирай JSON на симулационната чернова</)
})
