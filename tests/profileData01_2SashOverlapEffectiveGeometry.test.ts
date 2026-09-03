import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  PRELUDE_60_SASH_OVERLAP_PARAMETER,
  PROFILE_DATA_01_2_VERSION,
  SASH_OVERLAP_SAFETY,
  buildOverlapAwareFrameSegments,
  buildOverlapAwareMullionSegments,
  calculateEffectiveVisibleWidth,
  type StructuralLeafRegion,
} from '../src/profileData/sashOverlapGeometry'
import {
  PRELUDE_60_CATALOG_SAFETY,
  PRELUDE_60_CATALOG_SYSTEM,
  PROFILE_CATALOG_REGISTRY_VERSION,
} from '../src/profileData/prelude60CatalogRegistry'

const sash = (id: string, x: number, y: number, width: number, height: number): StructuralLeafRegion => ({
  id,
  fieldType: 'OPENING_SASH',
  rect: { x, y, width, height },
})

const fixed = (id: string, x: number, y: number, width: number, height: number): StructuralLeafRegion => ({
  id,
  fieldType: 'FIXED_GLAZING',
  rect: { x, y, width, height },
})

test('PROFILE DATA 01.2 is versioned', () => {
  assert.equal(PROFILE_DATA_01_2_VERSION, 'PROFILE_DATA_01.2')
  assert.equal(PROFILE_CATALOG_REGISTRY_VERSION, 'PROFILE_DATA_01.1_V3')
})

test('PRELUDE 60 exposes an editable system-level sash overlap input', () => {
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.sashOverlapMm, 7)
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.sashOverlapEditable, true)
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.sashOverlapState, 'HUMAN_REVIEWED_WORKING_VALUE')
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.sashOverlapProductionConfirmationRequired, true)
})

test('PRELUDE 60 working overlap is not a global universal constant', () => {
  assert.equal(PRELUDE_60_SASH_OVERLAP_PARAMETER.sashOverlapMm, 7)
  assert.equal(PRELUDE_60_SASH_OVERLAP_PARAMETER.editable, true)
  assert.equal(SASH_OVERLAP_SAFETY.globalFallbackOverlapAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.universalSashOverlapConstantAllowed, false)
})

test('no sash adjacency keeps full frame visible width', () => {
  const result = calculateEffectiveVisibleWidth(42, 7, false, false)
  assert.equal(result.effectiveVisibleWidthMm, 42)
  assert.equal(result.overlapApplicationCount, 0)
})

test('one sash adjacency reduces frame visible width once', () => {
  const result = calculateEffectiveVisibleWidth(42, 7, true, false)
  assert.equal(result.effectiveVisibleWidthMm, 35)
  assert.equal(result.overlapApplicationCount, 1)
})

test('mullion with sash on one side reduces 40 to 33', () => {
  const result = calculateEffectiveVisibleWidth(40, 7, true, false)
  assert.equal(result.effectiveVisibleWidthMm, 33)
})

test('mullion between two sashes reduces 40 to 26', () => {
  const result = calculateEffectiveVisibleWidth(40, 7, true, true)
  assert.equal(result.effectiveVisibleWidthMm, 26)
  assert.equal(result.overlapApplicationCount, 2)
})

test('different systems can explicitly use 6 mm overlap', () => {
  assert.equal(calculateEffectiveVisibleWidth(40, 6, true, true).effectiveVisibleWidthMm, 28)
})

test('different systems can explicitly use 8 mm overlap', () => {
  assert.equal(calculateEffectiveVisibleWidth(40, 8, true, true).effectiveVisibleWidthMm, 24)
})

test('invalid zero overlap is rejected instead of silently defaulted', () => {
  assert.throws(() => calculateEffectiveVisibleWidth(40, 0, true, false))
})

test('overlap cannot consume the full structural visible width', () => {
  assert.throws(() => calculateEffectiveVisibleWidth(10, 5, true, true))
})

test('full fixed field keeps all four frame sides at base 42 mm', () => {
  const segments = buildOverlapAwareFrameSegments(1400, 1200, [fixed('fixed', 0, 0, 1400, 1200)], 7)
  assert.equal(segments.length, 4)
  assert.ok(segments.every((segment) => segment.effectiveVisibleWidthMm === 42))
})

test('full sash field reduces all four touched frame sides to 35 mm', () => {
  const segments = buildOverlapAwareFrameSegments(1400, 1200, [sash('sash', 0, 0, 1400, 1200)], 7)
  assert.equal(segments.length, 4)
  assert.ok(segments.every((segment) => segment.effectiveVisibleWidthMm === 35))
  assert.ok(segments.every((segment) => segment.adjacentSashIds.includes('sash')))
})

test('frame reduction is segment-aware for fixed and sash fields on the same side', () => {
  const leaves = [
    sash('top-sash', 0, 0, 700, 600),
    fixed('bottom-fixed', 0, 600, 700, 600),
    fixed('right-fixed', 700, 0, 700, 1200),
  ]
  const left = buildOverlapAwareFrameSegments(1400, 1200, leaves, 7).filter((segment) => segment.side === 'LEFT')
  assert.equal(left.length, 2)
  assert.equal(left[0]?.effectiveVisibleWidthMm, 35)
  assert.equal(left[1]?.effectiveVisibleWidthMm, 42)
})

test('vertical mullion with left sash and right fixed field is 33 mm', () => {
  const leaves = [sash('left-sash', 0, 0, 700, 1200), fixed('right-fixed', 700, 0, 700, 1200)]
  const segments = buildOverlapAwareMullionSegments('VERTICAL', 700, { x: 0, y: 0, width: 1400, height: 1200 }, leaves, 7)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]?.effectiveVisibleWidthMm, 33)
  assert.equal(segments[0]?.rect.x, 687)
  assert.equal(segments[0]?.rect.width, 33)
  assert.equal(segments[0]?.sideAHasSash, true)
  assert.equal(segments[0]?.sideBHasSash, false)
})

test('vertical mullion between two sashes is 26 mm and remains centered after equal overlap', () => {
  const leaves = [sash('left', 0, 0, 700, 1200), sash('right', 700, 0, 700, 1200)]
  const segment = buildOverlapAwareMullionSegments('VERTICAL', 700, { x: 0, y: 0, width: 1400, height: 1200 }, leaves, 7)[0]!
  assert.equal(segment.effectiveVisibleWidthMm, 26)
  assert.equal(segment.rect.x, 687)
  assert.equal(segment.rect.width, 26)
  assert.equal(segment.overlapApplicationCount, 2)
})

test('vertical mullion without sash remains 40 mm', () => {
  const leaves = [fixed('left', 0, 0, 700, 1200), fixed('right', 700, 0, 700, 1200)]
  const segment = buildOverlapAwareMullionSegments('VERTICAL', 700, { x: 0, y: 0, width: 1400, height: 1200 }, leaves, 7)[0]!
  assert.equal(segment.effectiveVisibleWidthMm, 40)
  assert.equal(segment.rect.x, 680)
})

test('mullion reduction is segment-aware along its length', () => {
  const leaves = [
    sash('left-top', 0, 0, 700, 600),
    fixed('left-bottom', 0, 600, 700, 600),
    fixed('right', 700, 0, 700, 1200),
  ]
  const segments = buildOverlapAwareMullionSegments('VERTICAL', 700, { x: 0, y: 0, width: 1400, height: 1200 }, leaves, 7)
  assert.equal(segments.length, 2)
  assert.equal(segments[0]?.effectiveVisibleWidthMm, 33)
  assert.equal(segments[1]?.effectiveVisibleWidthMm, 40)
})

test('horizontal mullion applies overlap on top and bottom independently', () => {
  const leaves = [sash('top', 0, 0, 1400, 600), fixed('bottom', 0, 600, 1400, 600)]
  const segment = buildOverlapAwareMullionSegments('HORIZONTAL', 600, { x: 0, y: 0, width: 1400, height: 1200 }, leaves, 7)[0]!
  assert.equal(segment.effectiveVisibleWidthMm, 33)
  assert.equal(segment.rect.y, 587)
  assert.equal(segment.rect.height, 33)
})

test('this rule never reduces sash visible width itself', () => {
  assert.equal(SASH_OVERLAP_SAFETY.reduceSashVisibleWidthFromThisRuleAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.sashVisibleWidthReductionFromSystemOverlapAllowed, false)
})

test('renderer accepts overlap only as an explicit prop and preserves no-overlap fallback', () => {
  const source = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
  assert.match(source, /sashOverlapMm\?: number \| null/)
  assert.match(source, /explicitSashOverlapMm/)
  assert.match(source, /buildOverlapAwareFrameSegments/)
  assert.match(source, /buildOverlapAwareMullionSegments/)
  assert.match(source, /: frameVisibleBands &&/)
})

test('renderer exposes base/effective widths for audit without machine semantics', () => {
  const source = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
  assert.match(source, /data-base-visible-width-mm/)
  assert.match(source, /data-effective-visible-width-mm/)
  assert.match(source, /data-overlap-applications/)
  assert.doesNotMatch(source, /machineReady\s*=\s*true/)
  assert.doesNotMatch(source, /productionApproved\s*=\s*true/)
})

test('production and machine authority stay locked', () => {
  assert.equal(SASH_OVERLAP_SAFETY.machineReady, false)
  assert.equal(SASH_OVERLAP_SAFETY.productionApproved, false)
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.machineReady, false)
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.productionApproved, false)
})
