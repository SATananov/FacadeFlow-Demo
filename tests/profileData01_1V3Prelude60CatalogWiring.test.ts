import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compatibleProfiles, deriveActiveProfileSystems } from '../src/hybridProductDesigner'
import { applicationCatalogueProfiles, sampleCatalogueProfiles } from '../src/profileCatalogueData'
import {
  PRELUDE_60_APPLICATION_PROFILES,
  PRELUDE_60_CATALOG_ENTRIES,
  PRELUDE_60_CATALOG_SAFETY,
  PRELUDE_60_CATALOG_SYSTEM,
  PRELUDE_60_GLAZING_BEAD_REVIEW,
  PRELUDE_60_SYSTEM_LABEL,
  PROFILE_CATALOG_REGISTRY_VERSION,
  REGISTERED_PROFILE_CATALOG_SYSTEMS,
} from '../src/profileData/prelude60CatalogRegistry'

const entry = (code: string) => PRELUDE_60_CATALOG_ENTRIES.find((item) => item.profileCode === code)!

test('PROFILE DATA 01.1 V3 registry is versioned', () => {
  assert.equal(PROFILE_CATALOG_REGISTRY_VERSION, 'PROFILE_DATA_01.1_V3')
})

test('PRELUDE 60 is the only real catalogue registered by V3', () => {
  assert.equal(REGISTERED_PROFILE_CATALOG_SYSTEMS.length, 1)
  assert.equal(REGISTERED_PROFILE_CATALOG_SYSTEMS[0]?.label, 'PRELUDE 60')
})

test('PRELUDE 60 keeps the 60 mm system depth', () => {
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.systemDepthMm, 60)
})

test('PRELUDE 60 source is the attached catalogue, not a synthetic production table', () => {
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.sourceLabel, 'PVC Prelude_bg.pdf')
})

test('registry captures the source-listed PRELUDE main profile codes', () => {
  assert.deepEqual(
    PRELUDE_60_CATALOG_ENTRIES.map(({ profileCode }) => profileCode),
    ['482.30', '482.20', '482.05', '482.18', '482.25', '482.23', '482.21', '482.24', '482.26', '482.27', '482.11'],
  )
})

test('482.30 is a FRAME with human-confirmed base geometry', () => {
  assert.equal(entry('482.30').catalogRole, 'FRAME')
  assert.equal(entry('482.30').catalogHeightMm, 64)
  assert.equal(entry('482.30').catalogVisibleWidthMm, 42)
  assert.equal(entry('482.30').measurementUseState, 'HUMAN_CONFIRMED_BASE_GEOMETRY')
})

test('482.21 is a MULLION with human-confirmed base geometry', () => {
  assert.equal(entry('482.21').catalogRole, 'MULLION')
  assert.equal(entry('482.21').catalogHeightMm, 84)
  assert.equal(entry('482.21').catalogVisibleWidthMm, 40)
  assert.equal(entry('482.21').measurementUseState, 'HUMAN_CONFIRMED_BASE_GEOMETRY')
})

test('482.05 is registered as a SASH', () => {
  assert.equal(entry('482.05').catalogRole, 'SASH')
  assert.equal(entry('482.05').currentAppRole, 'SASH')
})

test('482.05 base profile geometry is human-confirmed as 78/56', () => {
  assert.equal(entry('482.05').catalogHeightMm, 78)
  assert.equal(entry('482.05').catalogVisibleWidthMm, 56)
  assert.equal(entry('482.05').measurementUseState, 'HUMAN_CONFIRMED_BASE_GEOMETRY')
  assert.equal(entry('482.05').measurementEvidenceKind, 'HUMAN_TECHNICAL_CONFIRMATION')
})

test('other PRELUDE source profiles are not silently activated in the current selector', () => {
  for (const code of ['482.20', '482.18', '482.25', '482.23', '482.24', '482.26', '482.27', '482.11']) {
    assert.equal(entry(code).selectableInCurrentApp, false, code)
  }
})

test('only three PRELUDE profiles bridge to the current FRAME/SASH/MULLION app model', () => {
  assert.deepEqual(PRELUDE_60_APPLICATION_PROFILES.map(({ code }) => code), ['482.30', '482.05', '482.21'])
})

test('PRELUDE 482.30 application profile is expert-confirmed', () => {
  const profile = PRELUDE_60_APPLICATION_PROFILES.find(({ code }) => code === '482.30')!
  assert.equal(profile.status, 'EXPERT_CONFIRMED')
  assert.equal(profile.dimensionA, 64)
  assert.equal(profile.dimensionB, 42)
})

test('PRELUDE 482.21 application profile is expert-confirmed', () => {
  const profile = PRELUDE_60_APPLICATION_PROFILES.find(({ code }) => code === '482.21')!
  assert.equal(profile.status, 'EXPERT_CONFIRMED')
  assert.equal(profile.dimensionA, 84)
  assert.equal(profile.dimensionB, 40)
})

test('PRELUDE 482.05 application profile exposes confirmed base geometry without promoting assembly width', () => {
  const profile = PRELUDE_60_APPLICATION_PROFILES.find(({ code }) => code === '482.05')!
  assert.equal(profile.status, 'EXPERT_CONFIRMED')
  assert.equal(profile.dimensionA, 78)
  assert.equal(profile.dimensionB, 56)
  assert.equal(profile.humanRoleReviewStatus, 'HUMAN_CONFIRMED')
  assert.match(profile.description ?? '', /Ефективната ширина.*конкретна сглобка.*отделни/)
})

test('glazing-bead review keeps 20/22 as deferred evidence rather than a universal constant', () => {
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.state, 'DEFERRED_NOT_MODELED')
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.observedExampleMm, 20)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.commonReferenceMm, 22)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.universalConstantAllowed, false)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.deriveFromProfileDimensionDifferenceAllowed, false)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.participatesInGeometryCalculations, false)
  assert.equal(PRELUDE_60_GLAZING_BEAD_REVIEW.separateFromSashOverlap, true)
})

test('legacy sampleCatalogueProfiles stays DEMO-only', () => {
  assert.ok(sampleCatalogueProfiles.every(({ system, status }) => system === 'DEMO SYSTEM' && status === 'DEMONSTRATION'))
})

test('application catalogue contains DEMO and PRELUDE without replacing either', () => {
  assert.equal(applicationCatalogueProfiles.length, sampleCatalogueProfiles.length + PRELUDE_60_APPLICATION_PROFILES.length)
  assert.ok(applicationCatalogueProfiles.some(({ system }) => system === 'DEMO SYSTEM'))
  assert.ok(applicationCatalogueProfiles.some(({ system }) => system === PRELUDE_60_SYSTEM_LABEL))
})

test('normal structured wizard system derivation now exposes PRELUDE 60', () => {
  assert.deepEqual(deriveActiveProfileSystems(applicationCatalogueProfiles), ['DEMO SYSTEM', 'PRELUDE 60'])
})

test('PRELUDE frame dropdown resolves only 482.30', () => {
  assert.deepEqual(compatibleProfiles(applicationCatalogueProfiles, 'PRELUDE 60', 'FRAME').map(({ code }) => code), ['482.30'])
})

test('PRELUDE sash dropdown resolves only 482.05', () => {
  assert.deepEqual(compatibleProfiles(applicationCatalogueProfiles, 'PRELUDE 60', 'SASH').map(({ code }) => code), ['482.05'])
})

test('PRELUDE mullion dropdown resolves only 482.21', () => {
  assert.deepEqual(compatibleProfiles(applicationCatalogueProfiles, 'PRELUDE 60', 'MULLION').map(({ code }) => code), ['482.21'])
})

test('PRELUDE catalogue never auto-selects a profile', () => {
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.automaticProfileSelectionAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.automaticProfileSelectionAllowed, false)
})

test('V3 does not calculate overlap or effective visible width', () => {
  assert.equal(PRELUDE_60_CATALOG_SAFETY.automaticAssemblyOverlapFormulaAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.effectiveVisibleWidthFromOverlapAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.glazingBeadUniversalConstantAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.deriveGlazingBeadFromProfileDimensionDifferenceAllowed, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.glazingBeadGeometryCalculationAllowed, false)
})

test('V3 remains machine-locked and production-locked', () => {
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.machineReady, false)
  assert.equal(PRELUDE_60_CATALOG_SYSTEM.productionApproved, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.machineReady, false)
  assert.equal(PRELUDE_60_CATALOG_SAFETY.productionApproved, false)
})

test('App initializes its live catalogue with applicationCatalogueProfiles', () => {
  const source = readFileSync('src/App.tsx', 'utf8')
  assert.match(source, /import \{ applicationCatalogueProfiles \} from '\.\/profileCatalogueData'/)
  assert.match(source, /useState<CatalogueProfile\[\]>\(applicationCatalogueProfiles\)/)
})

test('App does not auto-switch active profile selection from DEMO to PRELUDE', () => {
  const source = readFileSync('src/App.tsx', 'utf8')
  assert.match(source, /FRAME: 'profile-demo-frame-01'/)
  assert.match(source, /SASH: 'profile-demo-sash-01'/)
  assert.match(source, /MULLION: 'profile-demo-mullion-01'/)
  assert.doesNotMatch(source, /activeProfileSelection[^]*profile-prelude60/)
})

test('V3 does not add production or machine unlocks to its source files', () => {
  const source = readFileSync('src/profileData/prelude60CatalogRegistry.ts', 'utf8') +
    readFileSync('src/profileCatalogueData.ts', 'utf8')
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
  assert.doesNotMatch(source, /automaticProfileSelectionAllowed:\s*true/)
})
