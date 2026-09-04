import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS } from '../src/profileData/catalogueSourceLibrary'
import {
  NADEZHDA_HUMAN_PROFILE_MEASUREMENTS,
  NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_VERSION,
  NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY,
} from '../src/realData/nadezhdaHumanProfileMeasurements'

const byCode = (code: string) => NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.find((item) => item.code === code)!

test('PROFILE DATA 02.2.1 stores all three Nadezhda PRELUDE measurements as human-confirmed geometry', () => {
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_VERSION, 'PROFILE_DATA_02.2.1')
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.length, 3)
  for (const item of NADEZHDA_HUMAN_PROFILE_MEASUREMENTS) {
    assert.equal(item.reviewState, 'HUMAN_CONFIRMED')
    assert.equal(item.deductionZoneMm, 22)
    assert.equal(item.fullDimensionMm - item.deductionZoneMm * item.deductionZoneCount, item.visibleWidthMm)
    assert.equal(item.machineReady, false)
    assert.equal(item.productionApproved, false)
  }
})

test('482.30 frame uses one 22 mm side zone: 64 minus 22 equals 42', () => {
  const frame = byCode('482.30')
  assert.equal(frame.fullDimensionMm, 64)
  assert.equal(frame.visibleWidthMm, 42)
  assert.equal(frame.deductionZoneCount, 1)
  assert.equal(frame.measurementFormulaBg, '64 − 22 = 42 mm')
})

test('482.05 sash uses one 22 mm holder-side zone: 78 minus 22 equals 56', () => {
  const sash = byCode('482.05')
  assert.equal(sash.fullDimensionMm, 78)
  assert.equal(sash.visibleWidthMm, 56)
  assert.equal(sash.deductionMeaningBg, 'Зона към държателя')
  assert.equal(sash.measurementFormulaBg, '78 − 22 = 56 mm')
})

test('482.21 mullion uses two 22 mm zones: 84 minus 22 minus 22 equals 40', () => {
  const mullion = byCode('482.21')
  assert.equal(mullion.fullDimensionMm, 84)
  assert.equal(mullion.visibleWidthMm, 40)
  assert.equal(mullion.deductionZoneCount, 2)
  assert.equal(mullion.measurementFormulaBg, '84 − 22 − 22 = 40 mm')
})

test('catalogue references remain grouped into six manufacturers and eleven reference-only systems', () => {
  assert.deepEqual(EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS.map((group) => group.brand), [
    'KMG', 'VIVA PLAST', 'WEISS PROFIL', 'PROFITEM', 'FRAMEX', 'REHAU',
  ])
  assert.equal(EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS.flatMap((group) => group.sources).length, 11)
  for (const group of EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS) {
    for (const source of group.sources) assert.equal(source.referenceState, 'REFERENCE_ONLY')
  }
})

test('catalogue UI uses collapsible manufacturer groups with KMG initially open', () => {
  const source = readFileSync('src/components/ProfileCatalogue.tsx', 'utf8')
  for (const marker of [
    'EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS',
    'catalogue-reference-brand',
    "open={group.brand === 'KMG'}",
    "group.sources.map((source)",
  ]) assert.equal(source.includes(marker), true)
})

test('Nadezhda UI shows confirmed full dimension, visible width, zone and formula instead of unresolved wording', () => {
  const source = readFileSync('src/components/ProjectSourceEvidence.tsx', 'utf8')
  for (const marker of [
    'ТЕХНИЧЕСКИ ПОТВЪРДЕНО · НАДЕЖДА',
    'Пълен размер',
    'Видима ширина',
    'measurementFormulaBg',
    '64 − 22 = 42 mm',
    '78 − 22 = 56 mm',
    '84 − 22 − 22 = 40 mm',
  ]) assert.equal(source.includes(marker), true)
  assert.equal(source.includes('ОЧАКВА ТЕХНИЧЕСКО УТОЧНЕНИЕ'), false)
})

test('confirmed Nadezhda knowledge still cannot merge into catalogue or production automatically', () => {
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.separateFromExternalCatalogueSources, true)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.automaticCatalogueMergeAllowed, false)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.automaticGeometryOverwriteAllowed, false)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.automaticProductionUseAllowed, false)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.machineReady, false)
  assert.equal(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY.productionApproved, false)
})
