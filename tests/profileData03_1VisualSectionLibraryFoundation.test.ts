import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  NADEZHDA_PRELUDE_VISUAL_SECTIONS,
  PROFILE_VISUAL_SECTION_LIBRARY_SAFETY,
  PROFILE_VISUAL_SECTION_LIBRARY_VERSION,
} from '../src/profileData/visualSectionLibrary'

const byCode = (code: string) => NADEZHDA_PRELUDE_VISUAL_SECTIONS.find((item) => item.profileCode === code)!

test('PROFILE DATA 03.1 exposes three schematic Nadezhda PRELUDE visual sections', () => {
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_VERSION, 'PROFILE_DATA_03.1')
  assert.equal(NADEZHDA_PRELUDE_VISUAL_SECTIONS.length, 3)
  assert.deepEqual(NADEZHDA_PRELUDE_VISUAL_SECTIONS.map((item) => item.profileCode).sort(), ['482.05', '482.21', '482.30'])
  for (const item of NADEZHDA_PRELUDE_VISUAL_SECTIONS) {
    assert.equal(item.evidenceState, 'HUMAN_CONFIRMED')
    assert.equal(item.visualizationKind, 'MEASUREMENT_SCHEMA')
    assert.equal(item.exactProfileContourAvailable, false)
    assert.equal(item.schematicOnly, true)
    assert.equal(item.machineReady, false)
    assert.equal(item.productionApproved, false)
    assert.equal(item.zones.reduce((sum, zone) => sum + zone.sizeMm, 0), item.fullDimensionMm)
  }
})

test('482.30 section visualizes 42 mm visible plus one 22 mm side zone', () => {
  const item = byCode('482.30')
  assert.equal(item.fullDimensionMm, 64)
  assert.equal(item.visibleWidthMm, 42)
  assert.deepEqual(item.zones.map((zone) => [zone.kind, zone.sizeMm]), [['VISIBLE', 42], ['DEDUCTION', 22]])
  assert.equal(item.formulaBg, '64 − 22 = 42 mm')
})

test('482.05 section visualizes 56 mm visible plus one 22 mm holder zone', () => {
  const item = byCode('482.05')
  assert.equal(item.fullDimensionMm, 78)
  assert.equal(item.visibleWidthMm, 56)
  assert.deepEqual(item.zones.map((zone) => [zone.kind, zone.sizeMm]), [['VISIBLE', 56], ['DEDUCTION', 22]])
  assert.equal(item.zones[1].labelBg, 'Зона към държателя')
  assert.equal(item.formulaBg, '78 − 22 = 56 mm')
})

test('482.21 section visualizes two 22 mm side zones around 40 mm visible width', () => {
  const item = byCode('482.21')
  assert.equal(item.fullDimensionMm, 84)
  assert.equal(item.visibleWidthMm, 40)
  assert.deepEqual(item.zones.map((zone) => [zone.kind, zone.sizeMm]), [['DEDUCTION', 22], ['VISIBLE', 40], ['DEDUCTION', 22]])
  assert.equal(item.formulaBg, '84 − 22 − 22 = 40 mm')
})

test('visual section UI is wired into the Nadezhda source card with profile tabs and verified catalogue visual truth', () => {
  const evidenceUi = readFileSync('src/components/ProjectSourceEvidence.tsx', 'utf8')
  const viewerUi = readFileSync('src/components/ProfileSectionViewer.tsx', 'utf8')
  for (const marker of [
    'NADEZHDA_PRELUDE_VISUAL_SECTIONS',
    'ProfileSectionViewer',
    'PROFILE DATA 03.2.1 · VERIFIED CATALOGUE VISUAL LIBRARY',
    'Каталогови сечения · PRELUDE 60',
    'Покажи каталогово сечение',
    'CATALOGUE VISUAL',
  ]) assert.equal(evidenceUi.includes(marker), true)
  for (const marker of [
    'preludeTechnicalProfileByCode',
    'catalogueWithDimensionsAsset',
    'CATALOGUE VISUAL VERIFIED',
    'КАТАЛОЖНО СЕЧЕНИЕ · AI ПРЕРИСУВАНЕ: НЕ',
    'ISOLATED PRODUCTION CONTOUR: NO',
    'MACHINE READY: NO',
    'PRODUCTION APPROVED: NO',
  ]) assert.equal(viewerUi.includes(marker), true)
})

test('visual section safety cannot promote schematic evidence into production authority', () => {
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_SAFETY.exactCadContourClaimed, false)
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_SAFETY.schematicOnly, true)
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_SAFETY.automaticCatalogueMergeAllowed, false)
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_SAFETY.automaticGeometryOverwriteAllowed, false)
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_SAFETY.automaticProductionUseAllowed, false)
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_SAFETY.machineReady, false)
  assert.equal(PROFILE_VISUAL_SECTION_LIBRARY_SAFETY.productionApproved, false)
})
