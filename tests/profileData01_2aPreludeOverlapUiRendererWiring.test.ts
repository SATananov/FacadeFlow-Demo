import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applicationCatalogueProfiles, sampleCatalogueProfiles } from '../src/profileCatalogueData'
import {
  PROFILE_DATA_01_2A_VERSION,
  PROFILE_OVERLAP_WIRING_SAFETY,
  resolveActiveProfileSystemOverlap,
} from '../src/profileData/profileSystemOverlapWiring'
import { calculateEffectiveVisibleWidth } from '../src/profileData/sashOverlapGeometry'

const preludeSelection = {
  FRAME: 'profile-prelude60-frame-48230',
  SASH: 'profile-prelude60-sash-48205',
  MULLION: 'profile-prelude60-mullion-48221',
} as const

test('PROFILE DATA 01.2A is versioned', () => {
  assert.equal(PROFILE_DATA_01_2A_VERSION, 'PROFILE_DATA_01.2A')
})

test('selected PRELUDE 60 profiles resolve the registered 7 mm working overlap', () => {
  const resolved = resolveActiveProfileSystemOverlap(applicationCatalogueProfiles, preludeSelection)
  assert.equal(resolved.state, 'APPLIES')
  if (resolved.state !== 'APPLIES') throw new Error('PRELUDE 60 overlap should apply')
  assert.equal(resolved.systemLabel, 'PRELUDE 60')
  assert.equal(resolved.sashOverlapMm, 7)
  assert.equal(resolved.source, 'REGISTERED_PROFILE_SYSTEM')
  assert.equal(resolved.workingValueOnly, true)
  assert.equal(resolved.productionConfirmationRequired, true)
})

test('DEMO SYSTEM does not inherit the PRELUDE overlap', () => {
  const resolved = resolveActiveProfileSystemOverlap(sampleCatalogueProfiles, {
    FRAME: 'profile-demo-frame-01',
    SASH: 'profile-demo-sash-01',
    MULLION: 'profile-demo-mullion-01',
  })
  assert.equal(resolved.state, 'UNREGISTERED_SYSTEM')
  assert.equal(resolved.sashOverlapMm, null)
})

test('missing active profile ids keep overlap unresolved', () => {
  const resolved = resolveActiveProfileSystemOverlap(applicationCatalogueProfiles, { FRAME: 'missing-profile' })
  assert.equal(resolved.state, 'UNRESOLVED')
  assert.equal(resolved.sashOverlapMm, null)
})

test('mixed selected systems never receive one overlap automatically', () => {
  const resolved = resolveActiveProfileSystemOverlap(applicationCatalogueProfiles, {
    FRAME: 'profile-prelude60-frame-48230',
    SASH: 'profile-demo-sash-01',
  })
  assert.equal(resolved.state, 'MIXED_SYSTEMS')
  assert.equal(resolved.sashOverlapMm, null)
})

test('resolved PRELUDE wiring produces the audited frame and mullion reductions', () => {
  const resolved = resolveActiveProfileSystemOverlap(applicationCatalogueProfiles, preludeSelection)
  if (resolved.state !== 'APPLIES') throw new Error('PRELUDE 60 overlap should apply')
  assert.equal(calculateEffectiveVisibleWidth(42, resolved.sashOverlapMm, true, false).effectiveVisibleWidthMm, 35)
  assert.equal(calculateEffectiveVisibleWidth(40, resolved.sashOverlapMm, true, false).effectiveVisibleWidthMm, 33)
  assert.equal(calculateEffectiveVisibleWidth(40, resolved.sashOverlapMm, true, true).effectiveVisibleWidthMm, 26)
  assert.equal(calculateEffectiveVisibleWidth(40, resolved.sashOverlapMm, false, false).effectiveVisibleWidthMm, 40)
})

test('CustomProductDesigner resolves active-system overlap and passes it explicitly to renderer', () => {
  const source = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
  assert.match(source, /resolveActiveProfileSystemOverlap/)
  assert.match(source, /effectiveSashOverlapMm/)
  assert.match(source, /sashOverlapMm=\{effectiveSashOverlapMm\}/)
})

test('CustomProductDesigner shows the PRELUDE working-value audit readout without production wording', () => {
  const source = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
  assert.match(source, /Застъпване на крилото/)
  assert.match(source, /работна човешки прегледана стойност/)
  assert.match(source, /Не е производствено потвърждение/)
})

test('renderer remains explicit-prop only and keeps overlap audit attributes', () => {
  const source = readFileSync('src/components/CustomProductDrawing.tsx', 'utf8')
  assert.match(source, /sashOverlapMm\?: number \| null/)
  assert.match(source, /data-sash-overlap-mm/)
  assert.match(source, /data-effective-visible-width-mm/)
  assert.match(source, /data-overlap-applications/)
})

test('01.2A adds no machine or production authority', () => {
  assert.equal(PROFILE_OVERLAP_WIRING_SAFETY.machineReady, false)
  assert.equal(PROFILE_OVERLAP_WIRING_SAFETY.productionApproved, false)
  assert.equal(PROFILE_OVERLAP_WIRING_SAFETY.globalFallbackOverlapAllowed, false)

  const files = [
    readFileSync('src/profileData/profileSystemOverlapWiring.ts', 'utf8'),
    readFileSync('src/components/CustomProductDesigner.tsx', 'utf8'),
  ].join('\n')
  assert.doesNotMatch(files, /machineReady\s*[:=]\s*true/)
  assert.doesNotMatch(files, /productionApproved\s*[:=]\s*true/)
  assert.doesNotMatch(files, /automaticProfileSelectionAllowed\s*[:=]\s*true/)
})
