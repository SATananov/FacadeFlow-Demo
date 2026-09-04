import assert from 'node:assert/strict'
import test from 'node:test'
import { applicationCatalogueProfiles } from '../src/profileCatalogueData'
import { compatibleProfiles, createStructuredConfiguration, reconcileStructuredConfiguration } from '../src/hybridProductDesigner'
import { resolveActiveProfileSystemOverlap, PROFILE_OVERLAP_WIRING_SAFETY } from '../src/profileData/profileSystemOverlapWiring'
import { buildVisualComposerEffectiveProfileGeometry, effectiveWidths, VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY } from '../src/profileData/visualComposerEffectiveProfileGeometry'
import { applyComposerItemForExplicitTarget } from '../src/visualComposerExplicitFieldTarget'
import { applyComposerTemplate, createEmptyComposition } from '../src/visualComposerState'
import { VISUAL_COMPOSER_TEMPLATES } from '../src/visualComposerTemplates'
import type { VisualComposition } from '../src/visualComposerTypes'

const PRELUDE_SELECTION = {
  FRAME: 'profile-prelude60-frame-48230',
  SASH: 'profile-prelude60-sash-48205',
  MULLION: 'profile-prelude60-mullion-48221',
} as const

function build(state: VisualComposition, outerWidthMm: number) {
  return buildVisualComposerEffectiveProfileGeometry({
    state,
    outerWidthMm,
    outerHeightMm: 1200,
    sashOverlapMm: 7,
    frameProfileCode: '482.30',
    sashProfileCode: '482.05',
    mullionProfileCode: '482.21',
  })
}

test('triple template keeps exact canonical 1/3 and 2/3 geometry ratios independent of display labels', () => {
  const template = VISUAL_COMPOSER_TEMPLATES.find(({ id }) => id === 'DEMO-WINDOW-TRIPLE')
  assert.ok(template)
  assert.equal(template.dividers[0]?.positionRatio, 1 / 3)
  assert.equal(template.dividers[1]?.positionRatio, 2 / 3)
  assert.equal(template.dividers[0]?.placement, '33.33%')
  assert.equal(template.dividers[1]?.placement, '66.67%')
})

for (const [templateId, expectedMullions] of [
  ['DEMO-WINDOW-DOUBLE', 1],
  ['DEMO-WINDOW-TRIPLE', 2],
  ['DEMO-WINDOW-QUADRUPLE', 3],
] as const) {
  for (const outerWidthMm of [1200, 1400]) {
    test(`${templateId} at ${outerWidthMm} mm applies PRELUDE overlap to every all-open mullion`, () => {
      const state = applyComposerTemplate(createEmptyComposition(), templateId)
      const result = build(state, outerWidthMm)
      assert.equal(result.state, 'READY')
      if (result.state !== 'READY') throw new Error(result.reason)
      assert.deepEqual(effectiveWidths(result.frameSegments), [35])
      assert.deepEqual(effectiveWidths(result.mullionSegments), [26])
      assert.equal(result.mullionSegments.length, expectedMullions)
      assert.ok(result.mullionSegments.every((segment) => segment.overlapApplicationCount === 2))
      assert.ok(result.mullionSegments.every((segment) => segment.adjacentSashIds.length === 2))
    })
  }
}

test('triple mixed open/fixed/open applies one-sided overlap to both internal mullions', () => {
  const initial = applyComposerTemplate(createEmptyComposition(), 'DEMO-WINDOW-TRIPLE')
  const mixed = applyComposerItemForExplicitTarget(initial, 'field-2', 'FIELD_FIXED', () => 'unused')
  const result = build(mixed, 1400)
  assert.equal(result.state, 'READY')
  if (result.state !== 'READY') throw new Error(result.reason)
  assert.deepEqual(effectiveWidths(result.mullionSegments), [33])
  assert.ok(result.mullionSegments.every((segment) => segment.overlapApplicationCount === 1))
})

test('registered overlap never applies when no explicit sash profile is selected', () => {
  const frameOnly = resolveActiveProfileSystemOverlap(applicationCatalogueProfiles, {
    FRAME: PRELUDE_SELECTION.FRAME,
  })
  assert.equal(frameOnly.state, 'SASH_REQUIRED')
  assert.equal(frameOnly.sashOverlapMm, null)

  const frameAndMullion = resolveActiveProfileSystemOverlap(applicationCatalogueProfiles, {
    FRAME: PRELUDE_SELECTION.FRAME,
    MULLION: PRELUDE_SELECTION.MULLION,
  })
  assert.equal(frameAndMullion.state, 'SASH_REQUIRED')
  assert.equal(frameAndMullion.sashOverlapMm, null)
})

test('effective geometry itself rejects overlap input without an explicit sash profile code', () => {
  const state = applyComposerTemplate(createEmptyComposition(), 'DEMO-WINDOW-DOUBLE')
  const result = buildVisualComposerEffectiveProfileGeometry({
    state,
    outerWidthMm: 1400,
    outerHeightMm: 1200,
    sashOverlapMm: 7,
    frameProfileCode: '482.30',
    sashProfileCode: null,
    mullionProfileCode: '482.21',
  })
  assert.equal(result.state, 'UNRESOLVED')
  if (result.state !== 'UNRESOLVED') throw new Error('geometry should stay unresolved')
  assert.match(result.reason, /профил за крило/)
})

test('PRELUDE 482.05 is selectable for WINDOW but not accepted as a DOOR sash', () => {
  assert.deepEqual(
    compatibleProfiles(applicationCatalogueProfiles, 'PRELUDE 60', 'SASH', 'WINDOW').map(({ code }) => code),
    ['482.05'],
  )
  assert.deepEqual(
    compatibleProfiles(applicationCatalogueProfiles, 'PRELUDE 60', 'SASH', 'DOOR').map(({ code }) => code),
    [],
  )

  const door = {
    ...createStructuredConfiguration('DOOR'),
    productName: 'Тестова врата',
    overallWidth: '1000',
    overallHeight: '2100',
    profileSystem: 'PRELUDE 60',
    frameProfileId: PRELUDE_SELECTION.FRAME,
    sashProfileId: PRELUDE_SELECTION.SASH,
    wizardStep: 4 as const,
  }
  const reconciled = reconcileStructuredConfiguration(door, applicationCatalogueProfiles)
  assert.equal(reconciled.frameProfileId, PRELUDE_SELECTION.FRAME)
  assert.equal(reconciled.sashProfileId, '')
  assert.equal(reconciled.status, 'NEEDS_REVIEW')
})

test('unmapped PRELUDE door sash catalogue entries remain outside the selectable application bridge', () => {
  const applicationCodes = new Set(applicationCatalogueProfiles.map(({ code }) => code))
  assert.equal(applicationCodes.has('482.26'), false)
  assert.equal(applicationCodes.has('482.27'), false)
})

test('V8 hardening preserves all production safety locks', () => {
  assert.equal(PROFILE_OVERLAP_WIRING_SAFETY.explicitSashProfileRequired, true)
  assert.equal(PROFILE_OVERLAP_WIRING_SAFETY.roleConsistentSelectionRequired, true)
  assert.equal(PROFILE_OVERLAP_WIRING_SAFETY.machineReady, false)
  assert.equal(PROFILE_OVERLAP_WIRING_SAFETY.productionApproved, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.canonicalDividerPositionRatioRequired, true)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.explicitSashProfileRequired, true)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.machineReady, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.productionApproved, false)
})
