import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { canOpenWorkingComposer, confirmStructuredConfiguration, createStructuredConfiguration, maximumAccessibleConfigurationStep, moveStructuredConfigurationStep, updateStructuredConfiguration, validateStructuredConfiguration } from '../src/hybridProductDesigner'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

const dimensionsOnly = (category: 'WINDOW' | 'DOOR') => updateStructuredConfiguration(
  createStructuredConfiguration(category),
  { productName: category === 'WINDOW' ? 'Работен прозорец W-01' : 'Работна врата D-01', overallWidth: '1200', overallHeight: category === 'WINDOW' ? '1200' : '2100' },
  sampleCatalogueProfiles,
)

test('working composer is available from known name and dimensions without invented technical data', () => {
  const window = dimensionsOnly('WINDOW')
  const door = dimensionsOnly('DOOR')
  for (const configuration of [window, door]) {
    assert.equal(canOpenWorkingComposer(configuration), true)
    assert.equal(configuration.profileSystem, '')
    assert.equal(configuration.frameProfileId, '')
    assert.equal(configuration.sashProfileId, '')
    assert.equal(configuration.mullionProfileId, '')
    assert.equal(maximumAccessibleConfigurationStep(configuration, sampleCatalogueProfiles), 5)
    assert.equal(moveStructuredConfigurationStep(configuration, 5, sampleCatalogueProfiles).wizardStep, 5)
  }
})

test('working access does not weaken strict technical confirmation', () => {
  for (const category of ['WINDOW', 'DOOR'] as const) {
    const configuration = { ...dimensionsOnly(category), wizardStep: 5 as const, humanReviewChecked: true }
    const errors = validateStructuredConfiguration(configuration, sampleCatalogueProfiles)
    assert.ok(errors.some((error) => error.includes('профилна система')))
    assert.ok(errors.some((error) => error.includes('каса')))
    if (category === 'DOOR') {
      assert.equal(configuration.thresholdStatus, 'UNRESOLVED')
      assert.ok(errors.some((error) => error.includes('Прагът е неразрешен')))
    }
    assert.notEqual(confirmStructuredConfiguration(configuration, sampleCatalogueProfiles).status, 'HUMAN_CONFIRMED')
  }
})

test('wizard explains partial-data workflow and no longer routes doors through a separate demo gate', () => {
  const source = readFileSync('src/components/StructuredConfigurationWizard.tsx', 'utf8')
  for (const marker of [
    'Започнете с данните, които имате',
    'Можете да продължите без система',
    'Празните роли остават неразрешени',
    'Отвори работния конструктор',
    'Работна конфигурация',
    'Готово за машина</dt><dd>Не',
  ]) assert.equal(source.includes(marker), true)
  for (const removed of ['createDoorComposerDemoConfiguration', 'getDoorComposerDemoAccess', 'doorDemoAcknowledged']) assert.equal(source.includes(removed), false)
})

test('window and door use one shared technical-data panel and keep unknown glazing data deferred', () => {
  const windowSource = readFileSync('src/components/VisualTemplateComposer.tsx', 'utf8')
  const doorSource = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
  const panelSource = readFileSync('src/components/WorkingConfigurationDataPanel.tsx', 'utf8')
  for (const source of [windowSource, doorSource]) assert.equal(source.includes('WorkingConfigurationDataPanel'), true)
  for (const marker of [
    'Празните полета остават празни и не се допълват автоматично',
    'Стъклопакет / стъклодържател',
    '20/22 mm не се добавят или изчисляват автоматично',
  ]) assert.equal(panelSource.includes(marker), true)
  assert.equal(panelSource.includes('Праг'), true)
  assert.equal(panelSource.includes('НЕРАЗРЕШЕН'), true)
})

test('door working composer uses the current source configuration and acknowledges unresolved threshold inside the composer', () => {
  const wizard = readFileSync('src/components/StructuredConfigurationWizard.tsx', 'utf8')
  const door = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
  assert.equal(wizard.includes('<DoorVisualComposer configuration={configuration} profiles={profiles}'), true)
  for (const marker of ['thresholdAcknowledged', 'Разбирам, че прагът още не е определен', 'Потвърди работната композиция', 'Статусът остава NEEDS_REVIEW']) assert.equal(door.includes(marker), true)
  for (const removed of ['demoOnly', 'sourceProfileSystem', 'DEMO-only тест']) assert.equal(door.includes(removed), false)
})

test('working configuration never unlocks production or fills glazing-bead values as technical truth', () => {
  const files = [
    'src/hybridProductDesigner.ts',
    'src/components/StructuredConfigurationWizard.tsx',
    'src/components/VisualTemplateComposer.tsx',
    'src/components/DoorVisualComposer.tsx',
    'src/components/WorkingConfigurationDataPanel.tsx',
  ]
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n')
  for (const forbidden of ['machineReady: true', 'productionApproved: true', 'geometryCreated: true', 'exportAvailable: true']) assert.equal(source.includes(forbidden), false)
  assert.equal(source.includes('20/22 mm не се добавят или изчисляват автоматично'), true)
})
