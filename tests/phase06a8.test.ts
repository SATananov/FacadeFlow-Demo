import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { resolve } from 'node:path'
import { DOOR_HINGE_3D, buildDoorConceptualScene } from '../src/conceptual3dDoorScene'
import { calculateDoorHingeAnchor } from '../src/doorComposerLayout'
import { addDoorHardware, applyDoorTemplate, emptyDoorComposition, moveDoorHardware, setDoorOpening } from '../src/doorComposerState'
import { presetView } from '../src/conceptual3dCamera'
import { projectBoundsFaces } from '../src/conceptual3dScene'

const css = readFileSync(resolve('src/visualSystem.css'), 'utf8')
const app = readFileSync(resolve('src/App.tsx'), 'utf8')
const packageJson = readFileSync(resolve('package.json'), 'utf8')
const help = readFileSync(resolve('src/components/ContextHelp.tsx'), 'utf8')
const registry = readFileSync(resolve('src/contextHelpRegistry.ts'), 'utf8')
const customDesigner = readFileSync(resolve('src/components/CustomProductDesigner.tsx'), 'utf8')

test('central visual token layer is loaded and defines the core contracts', () => {
  assert.match(app, /import '\.\/visualSystem\.css'/)
  for (const token of ['--ff-color-accent', '--ff-color-accent-hover', '--ff-color-warning', '--ff-color-danger', '--ff-color-success', '--ff-surface-primary', '--ff-surface-secondary', '--ff-border-default', '--ff-text-primary', '--ff-text-muted', '--ff-focus-ring', '--ff-control-height', '--ff-panel-left', '--ff-transition']) assert.ok(css.includes(token), token)
})

test('controls and semantic visual states exist', () => {
  for (const contract of ['.primary-button', '.secondary-button', '.text-button', ':disabled', ':focus-visible', '[aria-pressed="true"]', '[aria-selected="true"]', '.inline-errors', '.valid', '.visual-composer-warning']) assert.ok(css.includes(contract), contract)
})

test('wizard, composer panels, canvas framing and responsive contracts exist', () => {
  for (const contract of ['.hybrid-step-indicator li.active', '.hybrid-step-indicator li.complete', '.visual-composer-layout', '.visual-library', '.visual-properties', '.visual-composer-stage', '@media (max-width: 1366px)', '@media (max-width: 1100px)', '@media (max-width: 760px)', 'overflow-x: hidden']) assert.ok(css.includes(contract), contract)
})

test('accessibility and local-only asset boundaries remain explicit', () => {
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(css, /https?:\/\//i)
  assert.doesNotMatch(css, /@import\s+url/i)
  assert.doesNotMatch(css, /url\s*\(/i)
})

test('phase script is registered without adding dependencies', () => {
  const pkg = JSON.parse(packageJson)
  assert.ok(pkg.scripts['test:phase06a8'])
  assert.equal(pkg.dependencies['@mlightcad/libredwg-web'], '0.7.10')
})

test('checkbox and radio controls are excluded from generic text-input sizing', () => {
  assert.match(css, /input:is\(\[type="checkbox"\], \[type="radio"\]\)/)
  assert.match(css, /width: 19px/)
  assert.match(css, /min-height: 19px/)
  assert.match(css, /accent-color: var\(--ff-color-accent\)/)
})

test('shared help trigger is compact, named and backed by real content', () => {
  assert.match(help, /className="ff-help-trigger"/)
  assert.match(help, /aria-label=/)
  assert.match(help, /aria-expanded=/)
  assert.match(css, /\.ff-help-trigger[\s\S]*?aspect-ratio: 1 \/ 1/)
  for (const id of ['x', 'y', 'z', 'diameter', 'depth', 'orientation', 'overall-dimensions', 'field-dimensions', 'divider-dimensions', '3d-camera', '3d-visibility', '3d-depth', 'profile-dimensions', 'dimension-annotations']) assert.ok(registry.includes(`id: '${id}'`), id)
})

test('annotation, catalogue, review and legacy preview controls remain compact and responsive', () => {
  for (const contract of ['.dimension-controls label', '.three-d-controls fieldset > label', '.catalogue-list article', '.catalogue-actions label', '.hybrid-review-check', '.view-switch', '.composer-view-tabs']) assert.ok(css.includes(contract), contract)
  assert.match(css, /\.catalogue-list article \{ display: grid/)
})

test('profile catalogue header and warning are separate normal-flow regions', () => {
  assert.match(css, /\.catalogue-modal > \.preview-header \{[\s\S]*?position: static;[\s\S]*?height: auto;/)
  assert.match(css, /\.catalogue-modal > \.preview-header p \{[\s\S]*?white-space: normal;/)
  assert.match(css, /\.catalogue-modal > \.preview-header \.preview-close \{[\s\S]*?position: static;/)
  assert.match(css, /\.catalogue-modal > \.catalogue-warning \{[\s\S]*?position: static;[\s\S]*?height: auto;[\s\S]*?margin: 0;/)
})

test('custom window designer uses a viewport drawing workspace without changing controls', () => {
  assert.match(customDesigner, /className="custom-workspace-controls"/)
  assert.match(css, /@media \(min-width: 901px\)[\s\S]*?\.custom-designer \{[\s\S]*?height: calc\(100dvh - 24px\);[\s\S]*?overflow: hidden;/)
  assert.match(css, /\.custom-designer > \.preview-header \{[\s\S]*?position: static;[\s\S]*?height: auto;/)
  assert.match(css, /grid-template-rows: max-content max-content max-content max-content minmax\(180px, 1fr\)/)
  assert.match(css, /\.custom-designer-toolbar button:not\(\.ff-help-trigger\)/)
  assert.match(css, /\.custom-designer > \.custom-designer-grid \{[\s\S]*?min-height: 0;[\s\S]*?overflow: hidden;/)
  assert.match(css, /\.custom-drawing-scroll \{[\s\S]*?min-height: 0;[\s\S]*?height: 100%;/)
  assert.doesNotMatch(css, /\.custom-designer[^}]*transform:\s*scale/)
})

test('door hinge anchor is leaf-local, vertically stable and left/right symmetric', () => {
  const leaf = { x: 100, y: 40, width: 240, height: 400 }
  for (const ratio of [.18, .5, .82]) {
    const left = calculateDoorHingeAnchor(leaf, 'LEFT', ratio, 8, 22)
    const right = calculateDoorHingeAnchor(leaf, 'RIGHT', ratio, 8, 22)
    assert.equal(left.x, leaf.x)
    assert.equal(right.x, leaf.x + leaf.width)
    assert.equal(left.y, leaf.y + ratio * leaf.height)
    assert.equal(right.y, left.y)
    assert.equal(left.bounds.x, leaf.x)
    assert.equal(right.bounds.x + right.bounds.width, leaf.x + leaf.width)
    assert.equal(left.bounds.x - leaf.x, leaf.x + leaf.width - (right.bounds.x + right.bounds.width))
    for (const marker of [left.bounds, right.bounds]) {
      assert.ok(marker.x >= leaf.x && marker.x + marker.width <= leaf.x + leaf.width)
      assert.ok(marker.y >= leaf.y && marker.y + marker.height <= leaf.y + leaf.height)
    }
  }
})

test('door 3D hinges touch their own leaf with bounded clearance in every camera preset', () => {
  let state = applyDoorTemplate(emptyDoorComposition(), 'DEMO-DOOR-DOUBLE-SOLID')
  state = setDoorOpening(state, 'leaf-1', 'LEFT', 'INWARD')
  state = setDoorOpening(state, 'leaf-2', 'RIGHT', 'INWARD')
  for (const [id, field, ratio] of [['hinge-a','leaf-1',.18],['hinge-b','leaf-1',.5],['hinge-c','leaf-2',.82]] as const) state = addDoorHardware(state, field, 'HINGE', () => id, ratio)
  state = addDoorHardware(state, 'leaf-1', 'HANDLE', () => 'handle-a', .5)
  const scene = buildDoorConceptualScene(state, 1200, 2100)
  const hinges = scene.nodes.filter(node => node.kind === 'HINGE_MARKER')
  assert.deepEqual(hinges.map(node => node.semanticSourceId), ['hinge-a','hinge-b','hinge-c'])
  assert.equal(new Set(hinges.map(node => node.nodeId)).size, hinges.length)
  assert.equal(scene.nodes.filter(node => node.semanticSourceId === 'handle-a').length, 1)
  for (const hinge of hinges) {
    const hardware = state.hardware.find(item => item.id === hinge.semanticSourceId)!
    const sash = scene.nodes.find(node => node.kind === 'SASH' && node.semanticSourceId === hardware.parentFieldId)!
    assert.ok(Math.abs(hinge.bounds.z - (sash.bounds.z + sash.bounds.depth) - DOOR_HINGE_3D.clearance) < 1e-12)
    assert.ok(DOOR_HINGE_3D.clearance <= .001)
    if (hardware.side === 'LEFT') assert.equal(hinge.bounds.x, sash.bounds.x)
    else assert.equal(hinge.bounds.x + hinge.bounds.width, sash.bounds.x + sash.bounds.width)
    assert.ok(hinge.bounds.y >= sash.bounds.y && hinge.bounds.y + hinge.bounds.height <= sash.bounds.y + sash.bounds.height)
    for (const camera of ['FRONT','BACK','LEFT','RIGHT','ISOMETRIC'] as const) {
      const hingePoints = projectBoundsFaces(hinge.bounds, presetView(camera), 800, 600).flat()
      const sashPoints = projectBoundsFaces(sash.bounds, presetView(camera), 800, 600).flat()
      const extent = (points: typeof hingePoints) => ({ minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y)) })
      const a=extent(hingePoints), b=extent(sashPoints), gapX=Math.max(0,b.minX-a.maxX,a.minX-b.maxX),gapY=Math.max(0,b.minY-a.maxY,a.minY-b.maxY)
      assert.ok(Math.hypot(gapX,gapY) <= 1, `${camera} projected hinge gap`)
    }
  }
  const before = state.hardware.map(item => ({ ...item }))
  const moved = moveDoorHardware(state, 'hinge-a', .7)
  assert.equal(moved.hardware.find(item => item.id === 'hinge-a')?.positionRatio, .7)
  assert.deepEqual(moved.hardware.filter(item => item.id !== 'hinge-a'), before.filter(item => item.id !== 'hinge-a'))
})
