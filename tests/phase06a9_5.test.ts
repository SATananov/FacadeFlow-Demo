import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { snapModelPoint } from '../src/customDrawingCoordinates'
import { appendCustomDrawingLine, createCustomDrawingLineLayer } from '../src/customDrawingLines'
import { createHistory, pushHistory, redoHistory, undoHistory } from '../src/customHistory'

const designer = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const drawing = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
const css = readFileSync('src/drawingWorkspaceShell.css', 'utf8')
const packageJson = readFileSync('package.json', 'utf8')
const shell = readFileSync('src/components/DrawingWorkspaceShell.tsx', 'utf8')

test('line layer starts empty and uses stable sequential ids', () => {
  const initial = createCustomDrawingLineLayer()
  const first = appendCustomDrawingLine(initial, {x:100,y:100}, {x:300,y:200})
  assert.equal(first.lines.length, 1)
  assert.equal(first.lines[0].id, 'line-0001')
  assert.deepEqual(first.lines[0].start, {x:100,y:100})
  assert.deepEqual(first.lines[0].end, {x:300,y:200})
  const second = appendCustomDrawingLine(first, {x:10,y:20}, {x:30,y:40})
  assert.equal(second.lines[1].id, 'line-0002')
})

test('zero-length line is rejected without creating a new layer state', () => {
  const initial = createCustomDrawingLineLayer()
  assert.equal(appendCustomDrawingLine(initial, {x:50,y:50}, {x:50,y:50}), initial)
})

test('one completed line is exactly one undo step and redo restores the same line', () => {
  const initial = createCustomDrawingLineLayer()
  const completed = appendCustomDrawingLine(initial, {x:100,y:150}, {x:350,y:450})
  const history = pushHistory(createHistory(initial), completed)
  assert.equal(history.past.length, 1)
  const undone = undoHistory(history)
  assert.equal(undone.present.lines.length, 0)
  const redone = redoHistory(undone)
  assert.deepEqual(redone.present.lines[0], completed.lines[0])
  assert.equal(redone.present.lines[0].id, 'line-0001')
})

test('GRID snapping feeds snapped start/live/end while disabled snapping preserves raw points', () => {
  assert.deepEqual(snapModelPoint({x:147,y:263}, 50, true), {x:150,y:250})
  assert.deepEqual(snapModelPoint({x:147,y:263}, 50, false), {x:147,y:263})
  assert.match(designer, /const point = snapModelPoint\(rawPoint, gridStep, snappingEnabled\)/)
  assert.match(designer, /linePreviewPoint.*snapModelPoint\(cursorCoordinates, gridStep, snappingEnabled\)/s)
})

test('line tool exposes activation, two-step Bulgarian guidance and Escape cancellation', () => {
  assert.match(designer, /aria-label="Инструмент линия"/)
  assert.match(designer, /aria-pressed=\{lineToolActive\}[^>]*>Линия</)
  assert.match(designer, /Изберете начална точка/)
  assert.match(designer, /Изберете крайна точка/)
  assert.match(designer, /Esc отказва/)
  assert.match(designer, /event\.key !== 'Escape'/)
})

test('Escape and zero-length rejection do not push line history', () => {
  const escapeSection = designer.slice(designer.indexOf("useEffect(() => { if (!lineToolActive)"), designer.indexOf('const projected'))
  assert.doesNotMatch(escapeSection, /pushHistory/)
  assert.match(designer, /next === value\.present \? value : pushHistory\(value, next\)/)
})

test('drawing layer and live preview are pointer transparent and separate from product geometry', () => {
  assert.match(drawing, /className="custom-drawing-line-layer" pointerEvents="none"/)
  assert.match(drawing, /custom-drawing-line-preview/)
  assert.match(css, /\.custom-drawing-line-layer\s*\{\s*pointer-events:\s*none/)
  assert.doesNotMatch(readFileSync('src/customDrawingLines.ts', 'utf8'), /CustomProduct|updateGeometry|splitField|fetch|localStorage/)
})

test('phase adds only the Line tool surface, no object snap modes or dependencies', () => {
  assert.doesNotMatch(designer, /endpoint|midpoint|intersection|perpendicular/i)
  assert.match(packageJson, /"test:phase06a9_5"/)
  const pkg = JSON.parse(packageJson)
  assert.equal(pkg.dependencies['@mlightcad/libredwg-web'], '0.7.10')
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['@mlightcad/libredwg-web','@react-three/fiber','pdfjs-dist','react','react-dom','tesseract.js','three'].sort())
  assert.match(css, /\.custom-line-tool-controls[^}]*flex-wrap:\s*wrap/s)
})


test('short desktop workspace keeps the 2D canvas usable without changing drawing behavior', () => {
  assert.match(shell, /useState\(true\)/)
  assert.match(shell, /matchMedia\('\(min-width: 901px\) and \(max-height: 850px\)'\)/)
  assert.match(shell, /shortDesktop\.matches(?: \|\| workbenchDesktop\.matches)?\) setSettingsVisible\(false\)/)
  assert.match(css, /@media \(min-width: 901px\) and \(max-height: 850px\)/)
  assert.match(css, /\.drawing-workspace-status \{ max-height: min\(84px,12dvh\); \}/)
  const lineIndex = designer.indexOf('className="custom-line-tool-controls"')
  const canvasIndex = designer.indexOf('className="custom-canvas-controls"')
  const dimensionIndex = designer.indexOf('<DimensionControls', canvasIndex)
  assert.ok(lineIndex >= 0 && canvasIndex > lineIndex && dimensionIndex > canvasIndex)
})


test('short-desktop viewport fit reserves real drawing height and zoom scales both axes', () => {
  assert.match(css, /\.drawing-workspace-shell\.drawing-workspace-shell \{ overflow-x: hidden; overflow-y: auto; scrollbar-gutter: stable; \}/)
  assert.match(css, /\.drawing-workspace-main \{ min-height: min\(430px,54dvh\); \}/)
  assert.match(designer, /Math\.min\(3, value \+ \.25\)/)
  assert.match(designer, /Math\.max\(\.5, value - \.25\)/)
  assert.match(designer, /className="custom-drawing-zoom" style=\{\{ width: `\$\{zoom \* 100\}%`, height: `\$\{zoom \* 100\}%` \}\}/)
  assert.match(designer, /setZoom\(1\).*Побери \/ нулирай/)
})
