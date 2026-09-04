import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createDoorComposerEntryComposition, resolveDoorComposerEntry, resolveWindowComposerEntry } from '../src/composerEntryConsistency'
import { createStructuredConfiguration, getProductNameSuggestions, reconcileStructuredConfiguration, updateStructuredConfiguration } from '../src/hybridProductDesigner'
import { setDoorOpening } from '../src/doorComposerState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import { composerTemplateIdForProductPreset, composerTemplateLabel, isComposerTemplateCompatible } from '../src/structuredComposerTemplateSelection'
import { applyComposerTemplate, createEmptyComposition } from '../src/visualComposerState'

test('new structured configuration has no silent composer template selection', () => {
  assert.equal(createStructuredConfiguration('WINDOW').composerTemplateId, null)
  assert.equal(createStructuredConfiguration('DOOR').composerTemplateId, null)
})

test('every visible WINDOW and DOOR product preset maps to an explicit composer template', () => {
  for (const category of ['WINDOW', 'DOOR'] as const) {
    for (const name of getProductNameSuggestions(category)) {
      const id = composerTemplateIdForProductPreset(category, name)
      assert.ok(id, `${category} preset should map: ${name}`)
      assert.equal(composerTemplateLabel(category, id), name)
      assert.equal(isComposerTemplateCompatible(category, id), true)
    }
  }
})


test('renaming an explicitly typed product keeps its selected topology; generic mode is changed only explicitly', () => {
  const explicit = { ...createStructuredConfiguration('WINDOW'), productName: 'Двукрилен прозорец', composerTemplateId: 'DEMO-WINDOW-DOUBLE' }
  const renamed = updateStructuredConfiguration(explicit, { productName: 'W-12 дневна' }, sampleCatalogueProfiles)
  assert.equal(renamed.productName, 'W-12 дневна')
  assert.equal(renamed.composerTemplateId, 'DEMO-WINDOW-DOUBLE')
  const generic = updateStructuredConfiguration(renamed, { composerTemplateId: null }, sampleCatalogueProfiles)
  assert.equal(generic.composerTemplateId, null)
})

test('explicit double WINDOW selection auto-seeds the matching composition instead of an empty canvas', () => {
  const entry = resolveWindowComposerEntry(createEmptyComposition(), 'DEMO-WINDOW-DOUBLE', null)
  assert.equal(entry.seededTemplateId, 'DEMO-WINDOW-DOUBLE')
  assert.equal(entry.composition.templateId, 'DEMO-WINDOW-DOUBLE')
  assert.equal(entry.composition.fields.length, 2)
})

test('changing an explicit WINDOW preset replaces only the seeded topology on the next entry', () => {
  const double = resolveWindowComposerEntry(createEmptyComposition(), 'DEMO-WINDOW-DOUBLE', null)
  const triple = resolveWindowComposerEntry(double.composition, 'DEMO-WINDOW-TRIPLE', double.seededTemplateId)
  assert.equal(triple.seededTemplateId, 'DEMO-WINDOW-TRIPLE')
  assert.equal(triple.composition.templateId, 'DEMO-WINDOW-TRIPLE')
  assert.equal(triple.composition.fields.length, 3)
})

test('removing a previously explicit WINDOW preset returns the composer to a genuinely empty entry', () => {
  const explicit = resolveWindowComposerEntry(createEmptyComposition(), 'DEMO-WINDOW-QUADRUPLE', null)
  const generic = resolveWindowComposerEntry(explicit.composition, null, explicit.seededTemplateId)
  assert.equal(generic.seededTemplateId, null)
  assert.equal(generic.composition.templateId, null)
  assert.equal(generic.composition.fields.length, 0)
})

test('generic WINDOW entry preserves a template chosen locally from the composer library', () => {
  const locallyChosen = applyComposerTemplate(createEmptyComposition(), 'DEMO-WINDOW-TRIPLE')
  const reopened = resolveWindowComposerEntry(locallyChosen, null, null)
  assert.equal(reopened.seededTemplateId, null)
  assert.equal(reopened.composition.templateId, 'DEMO-WINDOW-TRIPLE')
  assert.equal(reopened.composition.fields.length, 3)
})

test('explicit DOOR preset auto-seeds the matching DEMO composition while generic entry stays empty', () => {
  const double = createDoorComposerEntryComposition('DEMO-DOOR-DOUBLE-GLAZED')
  const triple = createDoorComposerEntryComposition('DEMO-DOOR-TRIPLE-SOLID')
  const generic = createDoorComposerEntryComposition(null)
  assert.equal(double.templateId, 'DEMO-DOOR-DOUBLE-GLAZED')
  assert.equal(double.fields.length, 2)
  assert.equal(triple.templateId, 'DEMO-DOOR-TRIPLE-SOLID')
  assert.equal(triple.fields.length, 3)
  assert.equal(generic.templateId, null)
  assert.equal(generic.fields.length, 0)
})

test('generic DOOR entry preserves local edits across back/reopen instead of resetting state', () => {
  const entry = resolveDoorComposerEntry(createDoorComposerEntryComposition(null), null, null)
  const selected = resolveDoorComposerEntry(entry.composition, 'DEMO-DOOR-DOUBLE-SOLID', null)
  const edited = setDoorOpening(selected.composition, 'leaf-1', 'LEFT', 'INWARD')
  const reopened = resolveDoorComposerEntry(edited, 'DEMO-DOOR-DOUBLE-SOLID', selected.seededTemplateId)
  assert.equal(reopened.composition.fields.find((field) => field.id === 'leaf-1')?.hingeSide, 'LEFT')
  assert.equal(reopened.composition.fields.find((field) => field.id === 'leaf-1')?.swing, 'INWARD')
  assert.equal(reopened.composition, edited)
})

test('removing or changing an explicit DOOR preset reseeds only when configuration topology changes', () => {
  const double = resolveDoorComposerEntry(createDoorComposerEntryComposition(null), 'DEMO-DOOR-DOUBLE-SOLID', null)
  const triple = resolveDoorComposerEntry(double.composition, 'DEMO-DOOR-TRIPLE-SOLID', double.seededTemplateId)
  assert.equal(triple.composition.fields.length, 3)
  assert.equal(triple.seededTemplateId, 'DEMO-DOOR-TRIPLE-SOLID')
  const generic = resolveDoorComposerEntry(triple.composition, null, triple.seededTemplateId)
  assert.equal(generic.composition.fields.length, 0)
  assert.equal(generic.seededTemplateId, null)
})

test('wrong-category composer template is rejected during structured configuration reconciliation', () => {
  const invalid = { ...createStructuredConfiguration('WINDOW'), composerTemplateId: 'DEMO-DOOR-DOUBLE-SOLID' }
  const reconciled = reconcileStructuredConfiguration(invalid, sampleCatalogueProfiles)
  assert.equal(reconciled.composerTemplateId, null)
  assert.equal(isComposerTemplateCompatible('WINDOW', 'DEMO-DOOR-DOUBLE-SOLID'), false)
})

test('wizard explicitly distinguishes preselected topology from generic blank composer entry', () => {
  const source = readFileSync('src/components/StructuredConfigurationWizard.tsx', 'utf8')
  for (const text of [
    'Тип / начална композиция за',
    'Без предварително избрана композиция',
    'ще се зареди автоматично във визуалния конструктор',
    'визуалният конструктор ще се отвори празен',
    'lockedTemplateId={configuration.composerTemplateId}',
    'initialTemplateId={configuration.composerTemplateId}',
    'initial={doorComposition}',
    'onChange={setDoorComposition}',
  ]) assert.equal(source.includes(text), true)
})

test('explicit composer entry locks topology switching and reset keeps the configured topology', () => {
  const windowSource = readFileSync('src/components/VisualTemplateComposer.tsx', 'utf8')
  const doorSource = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
  for (const source of [windowSource, doorSource]) {
    assert.equal(source.includes('Началната композиция е избрана в конфигурацията'), true)
    assert.equal(source.includes('За друг тип се върнете към стъпка „Размери“'), true)
    assert.equal(source.includes('Нулирай редакциите'), true)
    assert.equal(source.includes('Избрано в конфигурацията'), true)
  }
})
