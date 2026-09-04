import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  EXTERNAL_PROFILE_CATALOGUE_SOURCES,
  PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY,
} from '../src/profileData/catalogueSourceLibrary'
import {
  NADEZHDA_HUMAN_PROFILE_MEASUREMENTS,
  NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY,
} from '../src/realData/nadezhdaHumanProfileMeasurements'

const sourceById = (id: string) => EXTERNAL_PROFILE_CATALOGUE_SOURCES.find((item) => item.id === id)!
const measurementByCode = (code: string) => NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.find((item) => item.code === code)!

test('PROFILE DATA 02.1 registers KMG PRELUDE 60 and VIVA PLAST 6400 as external PDF references', () => {
  const kmg = sourceById('kmg-prelude60-bg-pdf')
  const viva = sourceById('vivaplast-6400-bg-pdf')
  assert.equal(kmg.sourceUrl, 'https://altestgroup.com/pdf/system/39/bg.pdf')
  assert.equal(kmg.system, 'PRELUDE 60')
  assert.equal(kmg.systemDepthMm, 60)
  assert.ok(kmg.focusProfileCodes.includes('482.30'))
  assert.ok(kmg.focusProfileCodes.includes('482.05'))
  assert.ok(kmg.focusProfileCodes.includes('482.21'))
  assert.equal(viva.sourceUrl, 'https://visionplast.com/wp-content/uploads/2019/07/vias_catalog.pdf')
  assert.equal(viva.system, 'System 6400')
  assert.equal(viva.systemDepthMm, 60)
})

test('external catalogue sources are reference-only and cannot auto-promote technical data', () => {
  for (const source of EXTERNAL_PROFILE_CATALOGUE_SOURCES) {
    assert.equal(source.referenceState, 'REFERENCE_ONLY')
    assert.equal(source.technicalDataAutoImported, false)
    assert.equal(source.automaticCataloguePromotionAllowed, false)
    assert.equal(source.machineReady, false)
    assert.equal(source.productionApproved, false)
  }
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY.externalDocumentsMayOverwriteHumanReviewedGeometry, false)
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY.externalDocumentsMayAutoCreateSelectableProfiles, false)
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY.machineReady, false)
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY.productionApproved, false)
})

test('Nadezhda keeps Bat Trifon measurements in a separate human-source registry', () => {
  assert.deepEqual(
    NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.map((item) => [item.code, item.value1Mm, item.value2Mm]),
    [
      ['482.30', 64, 42],
      ['482.21', 84, 40],
      ['482.05', 78, 56],
    ],
  )
  for (const item of NADEZHDA_HUMAN_PROFILE_MEASUREMENTS) {
    assert.equal(item.sourceOrganisation, 'Надежда')
    assert.equal(item.sourcePerson, 'Бат Трифон')
    assert.equal(item.appliesToCatalogueTruthAutomatically, false)
    assert.equal(item.appliesToProductionAutomatically, false)
    assert.equal(item.machineReady, false)
    assert.equal(item.productionApproved, false)
  }
})

test('482.05 keeps the human-confirmed 78 to 56 mm interpretation in the Nadezhda knowledge layer', () => {
  const sash = measurementByCode('482.05')
  assert.equal(sash.reviewState, 'HUMAN_CONFIRMED')
  assert.equal(sash.fullDimensionMm, 78)
  assert.equal(sash.visibleWidthMm, 56)
  assert.equal(sash.deductionZoneMm, 22)
  assert.equal(sash.deductionZoneCount, 1)
  assert.equal(sash.measurementFormulaBg, '78 − 22 = 56 mm')
})

test('human measurements cannot merge into catalogue truth or production automatically', () => {
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.separateFromExternalCatalogueSources, true)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.automaticCatalogueMergeAllowed, false)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.automaticGeometryOverwriteAllowed, false)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.automaticRuleValidationAllowed, false)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.automaticProductionUseAllowed, false)
})

test('catalogue workspace exposes both external PDF references without importing them as selectable profiles', () => {
  const source = readFileSync('src/components/ProfileCatalogue.tsx', 'utf8')
  for (const marker of [
    'EXTERNAL_PROFILE_CATALOGUE_SOURCES',
    'Каталожни документи',
    'Отвори PDF каталога',
    'БЕЗ АВТОМАТИЧЕН IMPORT НА РАЗМЕРИ',
  ]) assert.equal(source.includes(marker), true)
})

test('Nadezhda project source area uses organisation-first wording while preserving Bat Trifon provenance', () => {
  const source = readFileSync('src/components/ProjectSourceEvidence.tsx', 'utf8')
  for (const marker of [
    'NADEZHDA_HUMAN_PROFILE_MEASUREMENTS',
    'PRELUDE 60 · Надежда',
    'РЕАЛНИ ПРОИЗВОДСТВЕНИ ДАННИ',
    'ИЗТОЧНИК: НАДЕЖДА',
    'ТЕХНИЧЕСКИ ПОТВЪРДЕНО · НАДЕЖДА',
    'ТЕХНИЧЕСКИ КОНТАКТ: БАТ ТРИФОН',
    'БЕЗ АВТОМАТИЧЕН CATALOGUE MERGE',
  ]) assert.equal(source.includes(marker), true)
})

test('PROFILE DATA 02.1 does not alter existing PRELUDE geometry or production authority', () => {
  const base = readFileSync('src/profileData/prelude60BaseProfiles.ts', 'utf8')
  const registry = readFileSync('src/profileData/prelude60CatalogRegistry.ts', 'utf8')
  assert.equal(base.includes("profileHeightMm: 78"), true)
  assert.equal(base.includes("visibleWidthMm: 56"), true)
  assert.equal(registry.includes("machineReady: false"), true)
  assert.equal(registry.includes("productionApproved: false"), true)
  assert.equal(base.includes('catalogueSourceLibrary'), false)
  assert.equal(registry.includes('nadezhdaHumanProfileMeasurements'), false)
})
