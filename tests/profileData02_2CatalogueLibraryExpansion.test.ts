import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  EXTERNAL_PROFILE_CATALOGUE_SOURCES,
  EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS,
  PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY,
  PROFILE_CATALOGUE_SOURCE_LIBRARY_VERSION,
} from '../src/profileData/catalogueSourceLibrary'

const byId = (id: string) => EXTERNAL_PROFILE_CATALOGUE_SOURCES.find((item) => item.id === id)!

test('PROFILE DATA 02.2 expands the external source library to eleven independent reference entries', () => {
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_VERSION, 'PROFILE_DATA_02.2')
  assert.equal(EXTERNAL_PROFILE_CATALOGUE_SOURCES.length, 11)
  assert.equal(new Set(EXTERNAL_PROFILE_CATALOGUE_SOURCES.map((item) => item.id)).size, 11)
})

test('KMG registers PRELUDE 60 and PRESTIGE 70 as separate official PDF sources', () => {
  const prelude = byId('kmg-prelude60-bg-pdf')
  const prestige = byId('kmg-prestige70-bg-pdf')
  assert.equal(prelude.systemDepthMm, 60)
  assert.equal(prelude.sourceUrl, 'https://altestgroup.com/pdf/system/39/bg.pdf')
  assert.equal(prestige.systemDepthMm, 70)
  assert.equal(prestige.sourceUrl, 'https://altestgroup.com/pdf/system/40/bg.pdf')
  assert.deepEqual(prestige.focusProfileCodes, ['549.15', '549.16', '549.17', '549.05'])
})

test('VIVA PLAST keeps System 6400 and System 7500 as two records pointing to the shared technical catalogue', () => {
  const s6400 = byId('vivaplast-6400-bg-pdf')
  const s7500 = byId('vivaplast-7500-bg-pdf')
  assert.equal(s6400.systemDepthMm, 60)
  assert.equal(s7500.systemDepthMm, 70)
  assert.equal(s6400.sourceUrl, s7500.sourceUrl)
  assert.equal(s6400.sourceHost, 'visionplast.com')
})

test('WEISS SMART WP4000 and PROFITEM Q60/Q72 are registered as technical PDF references', () => {
  const weiss = byId('weiss-smart-wp4000-multi-pdf')
  const q60 = byId('profitem-q60-multi-pdf')
  const q72 = byId('profitem-q72-multi-pdf')
  assert.equal(weiss.systemDepthMm, 60)
  assert.deepEqual(weiss.focusProfileCodes, ['WP4001', 'WP4002', 'WP3003'])
  assert.equal(q60.systemDepthMm, 60)
  assert.equal(q72.systemDepthMm, 72)
  assert.equal(q60.sourceUrl, q72.sourceUrl)
})

test('Framex 58, 71 and 80 remain separate technical catalogue references', () => {
  assert.deepEqual(
    ['framex-58-uk-pdf', 'framex-71-uk-pdf', 'framex-80-uk-pdf'].map((id) => {
      const item = byId(id)
      return [item.system, item.systemDepthMm, item.sourceKind, item.sourceHost]
    }),
    [
      ['Framex 58', 58, 'TECHNICAL_PDF', 'framex.ua'],
      ['Framex 71', 71, 'TECHNICAL_PDF', 'framex.ua'],
      ['Framex 80', 80, 'TECHNICAL_PDF', 'framex.ua'],
    ],
  )
})

test('REHAU Euro-Design 70 is explicitly a product-page reference, not a code-level PDF import', () => {
  const rehau = byId('rehau-euro-design-70-bg-page')
  assert.equal(rehau.systemDepthMm, 70)
  assert.equal(rehau.sourceKind, 'PRODUCT_PAGE')
  assert.equal(rehau.focusProfileCodes.length, 0)
  assert.match(rehau.sourceUrl, /rehau\.com/)
})

test('every external source remains reference-only with no automatic geometry or production authority', () => {
  for (const source of EXTERNAL_PROFILE_CATALOGUE_SOURCES) {
    assert.equal(source.referenceState, 'REFERENCE_ONLY')
    assert.equal(source.technicalDataAutoImported, false)
    assert.equal(source.automaticCataloguePromotionAllowed, false)
    assert.equal(source.machineReady, false)
    assert.equal(source.productionApproved, false)
  }
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY.externalDocumentsMayOverwriteHumanReviewedGeometry, false)
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY.externalDocumentsMayAutoCreateSelectableProfiles, false)
  assert.equal(PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY.externalDocumentsMayUnlockProduction, false)
})

test('catalogue source library groups the eleven references by six manufacturers without changing source records', () => {
  assert.deepEqual(
    EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS.map((group) => [group.brand, group.sources.length]),
    [
      ['KMG', 2],
      ['VIVA PLAST', 2],
      ['WEISS PROFIL', 1],
      ['PROFITEM', 2],
      ['FRAMEX', 3],
      ['REHAU', 1],
    ],
  )
  assert.equal(EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS.flatMap((group) => group.sources).length, 11)
})

test('catalogue UI exposes grouped manufacturers, source type and language while preserving source actions', () => {
  const source = readFileSync('src/components/ProfileCatalogue.tsx', 'utf8')
  for (const marker of [
    'PROFILE DATA 02.2.1',
    'EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS',
    'catalogue-reference-brand',
    'catalogueSourceKindLabelBg',
    'catalogueLanguageLabelBg',
    'Тип източник',
    'Отвори PDF каталога',
    'Отвори официалния източник',
    'EXTERNAL_PROFILE_CATALOGUE_SOURCES.length',
  ]) assert.equal(source.includes(marker), true)
})

test('PROFILE DATA 02.2 does not touch Nadezhda human measurements or PRELUDE working geometry', () => {
  const human = readFileSync('src/realData/nadezhdaHumanProfileMeasurements.ts', 'utf8')
  const base = readFileSync('src/profileData/prelude60BaseProfiles.ts', 'utf8')
  assert.equal(human.includes("sourceOrganisation: 'Надежда'"), true)
  assert.equal(human.includes("sourcePerson: 'Бат Трифон'"), true)
  assert.equal(base.includes('profileHeightMm: 78'), true)
  assert.equal(base.includes('visibleWidthMm: 56'), true)
  assert.equal(base.includes('catalogueSourceLibrary'), false)
})
