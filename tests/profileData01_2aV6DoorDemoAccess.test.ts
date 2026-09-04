import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createDoorComposerDemoConfiguration, getDoorComposerDemoAccess } from '../src/doorComposerDemoAccess'
import { createStructuredConfiguration } from '../src/hybridProductDesigner'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

const sourceDoor = () => ({
  ...createStructuredConfiguration('DOOR'),
  productName: 'Еднокрила остъклена врата',
  overallWidth: '1200',
  overallHeight: '2100',
  profileSystem: 'PRELUDE 60',
  frameProfileId: 'profile-prelude60-frame-48230',
  sashProfileId: 'profile-prelude60-sash-48205',
  mullionProfileId: 'profile-prelude60-mullion-48221',
  wizardStep: 5 as const,
  status: 'NEEDS_REVIEW' as const,
})

test('PRELUDE source може да отвори отделен DEMO тест без смяна на source system', () => {
  const source = sourceDoor()
  const access = getDoorComposerDemoAccess(source, true, true, sampleCatalogueProfiles)
  assert.equal(access.eligible, true)
  assert.equal(access.sourceProfileSystem, 'PRELUDE 60')
  assert.equal(source.profileSystem, 'PRELUDE 60')
})

test('DEMO достъпът изисква две изрични човешки потвърждения', () => {
  const source = sourceDoor()
  assert.equal(getDoorComposerDemoAccess(source, false, true, sampleCatalogueProfiles).eligible, false)
  assert.equal(getDoorComposerDemoAccess(source, true, false, sampleCatalogueProfiles).eligible, false)
  assert.ok(getDoorComposerDemoAccess(source, false, false, sampleCatalogueProfiles).blockers.length >= 2)
})

test('derived composer config използва само DEMO профили и пази размерите', () => {
  const source = sourceDoor()
  const demo = createDoorComposerDemoConfiguration(source, sampleCatalogueProfiles)
  assert.ok(demo)
  assert.equal(demo.profileSystem, 'DEMO SYSTEM')
  assert.equal(demo.frameProfileId, 'profile-demo-frame-01')
  assert.equal(demo.sashProfileId, 'profile-demo-sash-01')
  assert.equal(demo.mullionProfileId, 'profile-demo-mullion-01')
  assert.equal(demo.overallWidth, source.overallWidth)
  assert.equal(demo.overallHeight, source.overallHeight)
  assert.equal(source.profileSystem, 'PRELUDE 60')
})

test('derived DEMO config остава safety locked', () => {
  const demo = createDoorComposerDemoConfiguration(sourceDoor(), sampleCatalogueProfiles)!
  assert.equal(demo.thresholdStatus, 'UNRESOLVED')
  assert.equal(demo.status, 'NEEDS_REVIEW')
  assert.equal(demo.machineReady, false)
  assert.equal(demo.geometryCreated, false)
  assert.equal(demo.exportAvailable, false)
  assert.equal(demo.simulationOnly, true)
})

test('липсващ DEMO sash блокира достъпа и не създава composer config', () => {
  const profiles = sampleCatalogueProfiles.filter((profile) => profile.role !== 'SASH')
  const access = getDoorComposerDemoAccess(sourceDoor(), true, true, profiles)
  assert.equal(access.eligible, false)
  assert.ok(access.blockers.some((item) => item.includes('DEMO SYSTEM')))
  assert.equal(createDoorComposerDemoConfiguration(sourceDoor(), profiles), null)
})

test('wizard показва отделния DEMO gate и никога не заменя source configuration', () => {
  const source = readFileSync('src/components/StructuredConfigurationWizard.tsx', 'utf8')
  for (const text of ['doorDemoAcknowledged', 'createDoorComposerDemoConfiguration', 'Използвай отделен DEMO режим само за концептуален тест', 'Текущата конфигурация и избраните каталожни профили няма да бъдат променяни', 'Отвори DEMO концептуалния конструктор на врата', 'sourceProfileSystem={configuration.profileSystem}']) assert.equal(source.includes(text), true)
})

test('door composer маркира ясно DEMO-only режима и source system', () => {
  const source = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
  for (const text of ['demoOnly', 'sourceProfileSystem', 'DEMO тест · Източник:', 'Визуализатор: DEMO SYSTEM', 'Текущата конфигурация не се променя', 'DEMO-only тест']) assert.equal(source.includes(text), true)
})
