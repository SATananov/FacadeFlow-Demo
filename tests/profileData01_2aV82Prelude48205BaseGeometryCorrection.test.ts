import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PRELUDE_60_APPLICATION_PROFILES,
  PRELUDE_60_CATALOG_ENTRIES,
  PRELUDE_60_CATALOG_SAFETY,
  PRELUDE_60_GLAZING_BEAD_REVIEW,
} from '../src/profileData/prelude60CatalogRegistry'
import { PRELUDE_60_SASH_OVERLAP_PARAMETER } from '../src/profileData/sashOverlapGeometry'
import {
  PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY,
  PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY,
  PRELUDE_60_VISIBLE_PROFILE_GEOMETRY,
} from '../src/profileData/visibleProfileGeometry'
import { VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY } from '../src/profileData/visualComposerEffectiveProfileGeometry'

const entry = (code: string) => PRELUDE_60_CATALOG_ENTRIES.find((item) => item.profileCode === code)!
const appProfile = (code: string) => PRELUDE_60_APPLICATION_PROFILES.find((item) => item.code === code)!

const frame = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.30']
const sash = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.05']
const mullion = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.21']

test('V8.2 corrects PRELUDE 482.05 base profile geometry to human-confirmed 78/56', () => {
  assert.equal(entry('482.05').catalogHeightMm, 78)
  assert.equal(entry('482.05').catalogVisibleWidthMm, 56)
  assert.equal(entry('482.05').measurementUseState, 'HUMAN_CONFIRMED_BASE_GEOMETRY')
  assert.equal(entry('482.05').measurementEvidenceKind, 'HUMAN_TECHNICAL_CONFIRMATION')
  assert.equal(sash.profileHeightMm, 78)
  assert.equal(sash.visibleWidthMm, 56)
  assert.equal(sash.measurementState, 'HUMAN_CONFIRMED')
})

test('482.05 application bridge is expert-confirmed base data and remains WINDOW-only', () => {
  const profile = appProfile('482.05')
  assert.equal(profile.dimensionA, 78)
  assert.equal(profile.dimensionB, 56)
  assert.equal(profile.status, 'EXPERT_CONFIRMED')
  assert.deepEqual(profile.compatibleProductCategories, ['WINDOW'])
  assert.equal(profile.simulationOnly, true)
  assert.equal(profile.requiresHumanApproval, true)
})

test('confirmed profile arithmetic is 22 / 22 / 44 without turning those differences into a glazing-bead formula', () => {
  assert.equal(frame.profileHeightMm! - frame.visibleWidthMm!, 22)
  assert.equal(sash.profileHeightMm! - sash.visibleWidthMm!, 22)
  assert.equal(mullion.profileHeightMm! - mullion.visibleWidthMm!, 44)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.deriveFromProfileDimensionDifferenceAllowed, false)
})

test('20 mm example and common 22 mm glazing bead stay deferred evidence only', () => {
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.state, 'DEFERRED_NOT_MODELED')
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.observedExampleMm, 20)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.commonReferenceMm, 22)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.universalConstantAllowed, false)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.participatesInGeometryCalculations, false)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.selectionDependentFutureReview, true)
})

test('glazing bead remains separate from the 7 mm sash overlap', () => {
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.separateFromSashOverlap, true)
  assert.equal(PRELUDE_60_SASH_OVERLAP_PARAMETER.sashOverlapMm, 7)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.glazingBeadUniversalConstantAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.glazingBeadGeometryCalculationAllowed, false)
})

test('base 78/56 confirmation does not promote effective assembled sash geometry', () => {
  assert.equal(PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY.baseProfileHeightMm, 78)
  assert.equal(PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY.baseProfileVisibleWidthMm, 56)
  assert.equal(PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY.assemblyEffectiveVisibleWidthState, 'UNRESOLVED')
  assert.equal(PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY.sashEffectiveAssemblyWidthState, 'UNRESOLVED')
  assert.equal(PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY.automaticAssemblyVisibleWidthCalculationAllowed, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.sashGeometryPromoted, false)
})

test('V8.2 keeps production authority locked', () => {
  assert.equal(PRELUDE_60_CATALOG_SAFETY.machineReady, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.productionApproved, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.machineReady, false)
  assert.equal(VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY.productionApproved, false)
})
