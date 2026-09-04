import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildVisualComposerEffectiveProfileGeometry, effectiveWidths, VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY } from '../src/profileData/visualComposerEffectiveProfileGeometry'
import type { VisualComposition } from '../src/visualComposerTypes'

const safety = {
  sessionOnly: true,
  simulationOnly: true,
  machineReady: false,
  internalEvaluationOnly: true,
  productionApproved: false,
  sourceImmutable: true,
  exportAvailable: false,
  dwgWriteAvailable: false,
  machineConnectivityAvailable: false,
  geometryCreated: false,
} as const

function composition(
  fieldTypes: Array<'FIXED' | 'OPENABLE'>,
  dividerPlacements: string[],
  horizontal = false,
): VisualComposition {
  const count = fieldTypes.length
  const fields = fieldTypes.map((fieldType, index) => horizontal
    ? {
        id: `field-${index + 1}`,
        rect: { x: 0, y: index / count, width: 1, height: 1 / count },
        fieldType,
        openingDirection: null,
        attachedHandleId: null,
        attachedHingeIds: [],
        humanReviewState: 'UNREVIEWED' as const,
      }
    : {
        id: `field-${index + 1}`,
        rect: { x: index / count, y: 0, width: 1 / count, height: 1 },
        fieldType,
        openingDirection: null,
        attachedHandleId: null,
        attachedHingeIds: [],
        humanReviewState: 'UNREVIEWED' as const,
      })
  const components = dividerPlacements.map((placement, index) => ({
    id: `divider-${index + 1}`,
    type: horizontal ? 'HORIZONTAL_DIVIDER' as const : 'VERTICAL_DIVIDER' as const,
    parentFieldId: null,
    role: 'DIVIDER' as const,
    placement,
    source: 'DEMO' as const,
    simulationOnly: true as const,
    machineReady: false as const,
    productionApproved: false as const,
  }))
  return {
    templateId: 'TEST',
    fields,
    components,
    selectedFieldId: fields[0]?.id ?? null,
    selectedComponentId: null,
    interiorColor: '',
    exteriorColor: '',
    interiorColorCustom: '',
    exteriorColorCustom: '',
    status: 'NEEDS_REVIEW',
    message: '',
    ...safety,
  }
}

const build = (state: VisualComposition) => buildVisualComposerEffectiveProfileGeometry({
  state,
  outerWidthMm: 1400,
  outerHeightMm: 1200,
  sashOverlapMm: 7,
  frameProfileCode: '482.30',
  mullionProfileCode: '482.21',
})

test('double sash uses PROFILE DATA 01.2 to produce 42→35 frame and 40→26 mullion geometry', () => {
  const result = build(composition(['OPENABLE', 'OPENABLE'], ['50%']))
  assert.equal(result.state, 'READY')
  if (result.state !== 'READY') throw new Error(result.reason)
  assert.deepEqual(effectiveWidths(result.frameSegments), [35])
  assert.deepEqual(effectiveWidths(result.mullionSegments), [26])
  assert.ok(result.mullionSegments.every((segment) => segment.overlapApplicationCount === 2))
})

test('mixed sash/fixed keeps untouched base bands and produces one-sided 40→33 mullion', () => {
  const result = build(composition(['OPENABLE', 'FIXED'], ['50%']))
  assert.equal(result.state, 'READY')
  if (result.state !== 'READY') throw new Error(result.reason)
  assert.deepEqual(effectiveWidths(result.frameSegments), [35, 42])
  assert.deepEqual(effectiveWidths(result.mullionSegments), [33])
})

test('fixed/fixed applies no overlap to frame or mullion', () => {
  const result = build(composition(['FIXED', 'FIXED'], ['50%']))
  assert.equal(result.state, 'READY')
  if (result.state !== 'READY') throw new Error(result.reason)
  assert.deepEqual(effectiveWidths(result.frameSegments), [42])
  assert.deepEqual(effectiveWidths(result.mullionSegments), [40])
})

test('horizontal fixed/sash divider uses the same side-aware 01.2 geometry', () => {
  const result = build(composition(['FIXED', 'OPENABLE'], ['50%'], true))
  assert.equal(result.state, 'READY')
  if (result.state !== 'READY') throw new Error(result.reason)
  assert.deepEqual(effectiveWidths(result.frameSegments), [35, 42])
  assert.deepEqual(effectiveWidths(result.mullionSegments), [33])
  assert.ok(result.mullionSegments.every((segment) => segment.orientation === 'HORIZONTAL'))
})

test('manual semantic divider without template geometry does not invent a measured divider', () => {
  const state = composition(['OPENABLE'], [])
  state.components.push({
    id: 'manual-divider',
    type: 'VERTICAL_DIVIDER',
    parentFieldId: 'field-1',
    role: 'DIVIDER',
    placement: 'среда',
    source: 'DEMO',
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  })
  const result = build(state)
  assert.equal(result.state, 'READY')
  if (result.state !== 'READY') throw new Error(result.reason)
  assert.equal(result.mullionSegments.length, 0)
})

test('V3 does not promote source-only sash width or production authority', () => {
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.sashGeometryPromoted, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.globalFallbackOverlapAllowed, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.machineReady, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.productionApproved, false)
})

test('exact Visual Composer renders mm-derived structural bands and visible effective-width readout', () => {
  const source = readFileSync('src/components/VisualTemplateComposer.tsx', 'utf8')
  assert.match(source, /buildVisualComposerEffectiveProfileGeometry/)
  assert.match(source, /profileGeometry=\{effectiveProfileGeometry\}/)
  assert.match(source, /composer-effective-profile-band/)
  assert.match(source, /data-effective-visible-width-mm/)
  assert.match(source, /ProfileGeometryReadout/)
  assert.match(source, /Ефективна видима геометрия/)
  assert.match(source, /Работна стойност/)
})

test('legacy conceptual renderer remains the fallback when measured geometry is unresolved', () => {
  const source = readFileSync('src/components/VisualTemplateComposer.tsx', 'utf8')
  assert.match(source, /profileGeometry\?\.state === 'READY'/)
  assert.match(source, /className="composer-frame"/)
})

test('V3 styling exposes structural bands without creating machine or production controls', () => {
  const css = readFileSync('src/visualComposer.css', 'utf8')
  assert.match(css, /\.composer-effective-profile-band/)
  assert.match(css, /\.visual-effective-profile-geometry/)
  const combined = [readFileSync('src/components/VisualTemplateComposer.tsx', 'utf8'), css].join('\n')
  assert.doesNotMatch(combined, /machineReady\s*[:=]\s*true/)
  assert.doesNotMatch(combined, /productionApproved\s*[:=]\s*true/)
})
