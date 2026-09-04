import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'

test('legacy separate DOOR DEMO runtime gates are retired from production source', () => {
  assert.equal(existsSync('src/doorComposerDemoAccess.ts'), false)
  assert.equal(existsSync('src/doorComposerEligibility.ts'), false)
})

test('door working composer uses the live source configuration instead of a derived DEMO replacement', () => {
  const wizard = readFileSync('src/components/StructuredConfigurationWizard.tsx', 'utf8')
  for (const required of [
    'canOpenWorkingComposer',
    'openDoorComposer',
    'configuration={configuration}',
    'initial={doorComposition}',
    'onChange={setDoorComposition}',
  ]) assert.equal(wizard.includes(required), true)
  for (const retired of [
    'doorDemoAcknowledged',
    'createDoorComposerDemoConfiguration',
    'getDoorComposerDemoAccess',
    'getDoorComposerEligibility',
  ]) assert.equal(wizard.includes(retired), false)
})

test('door composer keeps unresolved threshold and production locks in the working flow', () => {
  const source = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
  for (const marker of [
    'Работна конфигурация',
    'thresholdAcknowledged',
    'Праг: НЕРАЗРЕШЕН',
    'Статусът остава NEEDS_REVIEW',
  ]) assert.equal(source.includes(marker), true)
})
