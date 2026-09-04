import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applicationCatalogueProfiles } from '../src/profileCatalogueData'
import { resolveActiveProfileSystemOverlap } from '../src/profileData/profileSystemOverlapWiring'

const wizard = readFileSync('src/components/StructuredConfigurationWizard.tsx', 'utf8')
const composer = readFileSync('src/components/VisualTemplateComposer.tsx', 'utf8')
const css = readFileSync('src/visualComposer.css', 'utf8')

test('wizard passes the existing catalogue profiles into the exact VisualTemplateComposer route', () => {
  assert.match(wizard, /<VisualTemplateComposer configuration=\{configuration\} profiles=\{profiles\}/)
})

test('VisualTemplateComposer accepts CatalogueProfile[] and reuses the existing 01.2A resolver', () => {
  assert.match(composer, /CatalogueProfile/)
  assert.match(composer, /resolveActiveProfileSystemOverlap/)
  assert.match(composer, /profiles:\s*CatalogueProfile\[\]/)
})

test('VisualTemplateComposer resolves overlap from the confirmed configuration profile ids only', () => {
  for (const marker of [
    'configuration.frameProfileId',
    'configuration.sashProfileId',
    'configuration.mullionProfileId',
  ]) assert.ok(composer.includes(marker), marker)
})

test('PRELUDE 60 active profile ids resolve the current human-reviewed 7 mm working value', () => {
  const resolved = resolveActiveProfileSystemOverlap(applicationCatalogueProfiles, {
    FRAME: 'profile-prelude60-frame-48230',
    SASH: 'profile-prelude60-sash-48205',
    MULLION: 'profile-prelude60-mullion-48221',
  })
  assert.equal(resolved.state, 'APPLIES')
  if (resolved.state !== 'APPLIES') throw new Error('PRELUDE 60 should resolve')
  assert.equal(resolved.systemLabel, 'PRELUDE 60')
  assert.equal(resolved.sashOverlapMm, 7)
  assert.equal(resolved.productionConfirmationRequired, true)
})

test('exact Visual Composer shows a visible audit readout before human visual acceptance', () => {
  assert.match(composer, /visual-profile-overlap-audit/)
  assert.match(composer, /Застъпване на крилото/)
  assert.match(composer, /не е производствено потвърждение/)
  assert.match(composer, /data-sash-overlap-mm/)
  assert.match(css, /\.visual-profile-overlap-audit/)
})

test('unknown or mixed systems still have no automatic overlap fallback', () => {
  assert.match(composer, /Застъпване: не се прилага автоматично/)
  assert.match(composer, /Няма една регистрирана система/)
})

test('V2 bridge does not add production or machine authority', () => {
  const combined = [wizard, composer].join('\n')
  assert.doesNotMatch(combined, /machineReady\s*[:=]\s*true/)
  assert.doesNotMatch(combined, /productionApproved\s*[:=]\s*true/)
})
