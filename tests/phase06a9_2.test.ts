import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { DIMENSION_3D_STYLE, dimensionDepthClearance, dimensionExternalLabelPoint, dimensionLabelIsOutsideProduct, dimensionLabelWorldScale, dimensionTextureRatio, dimensionWorldPoint } from '../src/dimensionAnnotation3D'
import { formatDimensionValue } from '../src/dimensionFormatting'
import type { DimensionAnnotation } from '../src/dimensionTypes'

const line3d = readFileSync('src/components/DimensionLine3D.tsx', 'utf8')
const dimensions3d = readFileSync('src/components/ProductDimensions3D.tsx', 'utf8')
const scene = readFileSync('src/components/Product3DScene.tsx', 'utf8')
const preview = readFileSync('src/components/ProductPreview.tsx', 'utf8')
const door = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const annotation: DimensionAnnotation = { id: 'DIM-TEST', type: 'OVERALL_WIDTH', value: 1400, unit: 'MM', sourceGeometryId: 'product-root', startPoint: { x: 0, y: -70, z: 0 }, endPoint: { x: 1400, y: -70, z: 0 }, labelPosition: { x: 700, y: -82, z: 0 }, axis: 'X', visible: true, confidenceStatus: 'CONFIRMED', origin: 'PROJECT_ENTERED', productionApproved: false, machineReady: false, measurementMode: 'PROJECT_GEOMETRY', productionDeductionsApplied: false, manufacturingToleranceApplied: false, exactProfileSectionApplied: false }

test('Phase 06A.9.2 uses a high-contrast FacadeFlow label palette', () => {
  assert.equal(DIMENSION_3D_STYLE.text, '#17323a')
  assert.equal(DIMENSION_3D_STYLE.background, 'rgba(247, 251, 251, 0.96)')
  assert.equal(DIMENSION_3D_STYLE.border, '#087b91')
  assert.notEqual(DIMENSION_3D_STYLE.text, '#ffffff')
  assert.match(line3d, /fillStyle = DIMENSION_3D_STYLE\.background/)
  assert.match(line3d, /strokeStyle = DIMENSION_3D_STYLE\.border/)
})

test('label texture is HiDPI-aware, content-sized and padded without clipping', () => {
  assert.equal(dimensionTextureRatio(.5), 1)
  assert.equal(dimensionTextureRatio(2), 2)
  assert.equal(dimensionTextureRatio(4), 3)
  assert.match(line3d, /measureText\(label\)/)
  assert.match(line3d, /horizontalPadding \* 2/)
  assert.match(line3d, /canvas\.width = Math\.ceil\(logicalWidth \* ratio\)/)
  assert.match(line3d, /context\.scale\(ratio, ratio\)/)
})

test('sprite is camera-facing, non-mirrored and uses bounded readable scale', () => {
  assert.match(line3d, /<sprite renderOrder=/)
  assert.doesNotMatch(line3d, /rotation=/)
  const small = dimensionLabelWorldScale(900, 2000, 3)
  const large = dimensionLabelWorldScale(4000, 4000, 3)
  assert.deepEqual(small, { width: .165, height: .055 })
  assert.deepEqual(large, { width: .165, height: .055 })
  assert.match(line3d, /sizeAttenuation: false/)
})

test('annotations use deterministic outside offset and controlled depth', () => {
  assert.ok(Math.abs(dimensionDepthClearance(1400, 1200) - 2.8) < Number.EPSILON * 4)
  const world = dimensionWorldPoint({ x: 0, y: -70, z: 0 }, 1400, 1200)
  assert.deepEqual({ x: world.x, y: world.y }, { x: -700, y: 670 })
  assert.ok(Math.abs(world.z - 2.8) < Number.EPSILON * 4)
  assert.equal(dimensionLabelIsOutsideProduct(annotation, 1400, 1200), true)
  const external = dimensionExternalLabelPoint(annotation, 1400, 1200)
  assert.ok(external.y > world.y)
  assert.match(line3d, /depthTest: false, depthWrite: false/)
  assert.match(line3d, /line\.renderOrder = DIMENSION_3D_STYLE\.renderOrder/)
})

test('numeric values and mm formatting remain unchanged', () => {
  assert.equal(formatDimensionValue(1400), '1400 mm')
  assert.equal(formatDimensionValue(1234.567), '1234.57 mm')
  assert.equal(annotation.value, 1400)
  assert.equal(annotation.unit, 'MM')
  assert.match(line3d, /const label = formatDimensionValue\(annotation\.value\)/)
  assert.match(line3d, /aria-label=\{formatDimensionLabel\(annotation\)\}/)
})

test('resources are disposed and visibility filtering does not duplicate sprites', () => {
  for (const resource of ['geometry', 'lineMaterial', 'texture', 'spriteMaterial']) assert.match(line3d, new RegExp(`resources\\.${resource}\\.dispose\\(\\)`))
  assert.match(dimensions3d, /annotations\.filter\(\(item\) => shown\(item, visibility\)\)\.map/)
  assert.match(dimensions3d, /key=\{item\.id\}/)
  assert.match(scene, /<ProductDimensions3D annotations=\{props\.annotations\} visibility=\{props\.dimensionVisibility\}/)
})

test('window and door safety semantics remain intact', () => {
  assert.match(preview, /product\.productCategory === 'DOOR'/)
  assert.match(preview, /dimension-summary/)
  assert.match(door, /Праг: НЕРАЗРЕШЕН/)
  assert.doesNotMatch(line3d + dimensions3d, /threshold|productionGeometry|machineReady/)
})

test('scope adds no dependency, persistence, network or production geometry behavior', () => {
  assert.ok(pkg.scripts['test:phase06a9_2'])
  const source = line3d + readFileSync('src/dimensionAnnotation3D.ts', 'utf8')
  for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', 'WebSocket', 'productionGeometry', 'snap', 'coordinateGrid']) assert.equal(source.includes(forbidden), false, forbidden)
})
