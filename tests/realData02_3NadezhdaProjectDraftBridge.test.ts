import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { extractNadezhdaDocumentPatterns } from '../src/realData/nadezhdaDocumentPatternExtractor'
import { bridgeNadezhdaExtractionToProjectDraft } from '../src/realData/nadezhdaProjectDraftBridge'

function bridge(text: string) {
  const extraction = extractNadezhdaDocumentPatterns({
    sourceId: 'synthetic-bridge',
    sourceKind: 'DOCX',
    sourceReference: 'SYNTHETIC_BRIDGE_SOURCE.docx',
    text,
  })
  return bridgeNadezhdaExtractionToProjectDraft(extraction, 'draft-synthetic-001')
}

test('REAL DATA 02.3 creates SOURCE_DRAFT only and keeps production locked', () => {
  const result = bridge('Модул: 1\nБрой: 1\nL = 1200 mm\nH = 1400 mm')
  assert.equal(result.bridgeVersion, 'REALDATA02.3')
  assert.equal(result.draft.status, 'SOURCE_DRAFT')
  assert.equal(result.draft.humanReviewStatus, 'NOT_REVIEWED')
  assert.equal(result.safety.createsLifecycleProject, false)
  assert.equal(result.safety.createsSourceDraftOnly, true)
  assert.equal(result.safety.machineReady, false)
  assert.equal(result.safety.productionApproved, false)
  assert.equal(result.draft.safety.machineReady, false)
  assert.equal(result.draft.safety.productionApproved, false)
})

test('REAL DATA 02.3 preserves every extractor evidence item as private project evidence', () => {
  const result = bridge('Модул: 1\nБрой: 2\nL = 1000 mm\nH = 1200 mm')
  assert.equal(result.draft.evidence.length, 4)
  assert.ok(result.draft.evidence.every((item) => item.privateSource === true))
  assert.ok(result.draft.evidence.every((item) => item.sourceReference === 'SYNTHETIC_BRIDGE_SOURCE.docx'))
})

test('REAL DATA 02.3 maps site location but leaves project name and reference unresolved', () => {
  const result = bridge('обект : Синтетичен обект\nМодул: 1')
  assert.equal(result.draft.siteLocation.state, 'RESOLVED')
  assert.equal(result.draft.siteLocation.value, 'Синтетичен обект')
  assert.equal(result.draft.projectName.state, 'UNRESOLVED')
  assert.equal(result.draft.projectReference.state, 'UNRESOLVED')
})

test('REAL DATA 02.3 maps module reference, quantity, width and height with evidence refs', () => {
  const result = bridge('Модул: M-12\nБрой: 4\nL = 1650 mm\nH = 1400 mm')
  assert.equal(result.draft.modules.length, 1)
  const module = result.draft.modules[0]!
  assert.equal(module.externalReference.value, 'M-12')
  assert.equal(module.quantity.value, 4)
  assert.equal(module.widthMm.value, 1650)
  assert.equal(module.heightMm.value, 1400)
  assert.ok(module.externalReference.evidenceRefs.length > 0)
  assert.ok(module.quantity.evidenceRefs.length > 0)
  assert.ok(module.widthMm.evidenceRefs.length > 0)
  assert.ok(module.heightMm.evidenceRefs.length > 0)
})

test('REAL DATA 02.3 keeps two equal-size module positions as two distinct module records', () => {
  const result = bridge('Модул: 4\nL = 1900 mm\nH = 2520 mm\nМодул: 6\nL = 1900 mm\nH = 2520 mm')
  assert.equal(result.draft.modules.length, 2)
  assert.notEqual(result.draft.modules[0]?.id, result.draft.modules[1]?.id)
  assert.deepEqual(result.draft.modules.map((item) => item.externalReference.value), ['4', '6'])
  assert.ok(result.warnings.some((item) => item.includes('еднакви L/H')))
})

test('REAL DATA 02.3 preserves explicit floor placement on modules', () => {
  const result = bridge('Етаж 2\nМодул: 8\nБрой: 1\nL = 2380 mm\nH = 1900 mm')
  assert.equal(result.draft.modules[0]?.placement[0]?.kind, 'FLOOR')
  assert.equal(result.draft.modules[0]?.placement[0]?.label.value, 'Етаж 2')
  assert.ok((result.draft.modules[0]?.placement[0]?.label.evidenceRefs.length ?? 0) > 0)
})

test('REAL DATA 02.3 supports section placement without requiring a floor', () => {
  const result = bridge('Секция A\nМодул: A-01\nL = 900 mm\nH = 2100 mm')
  assert.equal(result.draft.modules[0]?.placement[0]?.kind, 'SECTION')
  assert.equal(result.draft.modules[0]?.placement[0]?.label.value, 'Секция A')
})

test('REAL DATA 02.3 creates explicit offer variant containers from source-backed variant headings', () => {
  const result = bridge('Вариант 1:\nPVC дограма\nМодул: 1\nВариант 2:\nAL дограма\nМодул: 2')
  assert.equal(result.draft.offerVariants.length, 2)
  assert.deepEqual(result.draft.offerVariants.map((item) => item.label.value), ['Вариант 1', 'Вариант 2'])
})

test('REAL DATA 02.3 uses an unresolved structural wrapper when source has groups but no explicit variant', () => {
  const result = bridge('PVC дограма\nМодул: 1\nL = 1000 mm\nH = 1200 mm')
  assert.equal(result.draft.offerVariants.length, 1)
  assert.equal(result.draft.offerVariants[0]?.id, 'variant-unscoped-source')
  assert.equal(result.draft.offerVariants[0]?.label.state, 'UNRESOLVED')
})

test('REAL DATA 02.3 maps explicit PVC and aluminium groups without template promotion', () => {
  const result = bridge('PVC дограма\nМодул: 1\nAL дограма\nМодул: 2')
  const groups = result.draft.offerVariants[0]?.productGroups ?? []
  assert.deepEqual(groups.map((item) => item.label.value), ['PVC дограма', 'AL дограма'])
  assert.deepEqual(groups.map((item) => item.material.value), ['PVC', 'ALUMINIUM'])
  assert.equal(result.draft.safety.templatePromotionAllowed, false)
})

test('REAL DATA 02.3 associates modules with their explicit product groups', () => {
  const result = bridge('PVC дограма\nМодул: 1\nAL дограма\nМодул: 2')
  const groups = result.draft.offerVariants[0]?.productGroups ?? []
  assert.equal(groups[0]?.moduleIds.length, 1)
  assert.equal(groups[1]?.moduleIds.length, 1)
  assert.notEqual(groups[0]?.moduleIds[0], groups[1]?.moduleIds[0])
})

test('REAL DATA 02.3 maps explicit group-level system/color/glazing/hardware/reinforcement', () => {
  const result = bridge([
    'PVC дограма',
    'Профил: PVC система SYNTH-70',
    'Цвят: RAL 7016',
    'Стъклопакет: 4S+Б/24 мм',
    'Обков „TEST-HARDWARE”',
    'Армировка 1,5 мм',
    'Модул: 1',
  ].join('\n'))
  const group = result.draft.offerVariants[0]?.productGroups[0]
  assert.equal(group?.system.value, 'PVC система SYNTH-70')
  assert.equal(group?.color.value, 'RAL 7016')
  assert.equal(group?.glazing.value, '4S+Б/24 мм')
  assert.equal(group?.hardware.value, 'TEST-HARDWARE')
  assert.equal(group?.reinforcement.value, '1,5 мм')
})

test('REAL DATA 02.3 maps explicit module-context attributes as overrides, not global defaults', () => {
  const result = bridge('PVC дограма\nМодул: 1\nСтъклопакет: SPECIAL-44\nМодул: 2')
  const group = result.draft.offerVariants[0]?.productGroups[0]
  assert.equal(group?.glazing.state, 'UNRESOLVED')
  assert.equal(group?.moduleOverrides.length, 1)
  assert.equal(group?.moduleOverrides[0]?.moduleId, group?.moduleIds[0])
  assert.equal(group?.moduleOverrides[0]?.glazing?.value, 'SPECIAL-44')
})

test('REAL DATA 02.3 maps explicit included and excluded items to the active offer variant', () => {
  const result = bridge([
    'Вариант 1:',
    'В цената са включени :',
    'Носещ профил',
    '',
    'В посочената цена не са включени :',
    'Комарници',
  ].join('\n'))
  const variant = result.draft.offerVariants[0]
  assert.deepEqual(variant?.includedItems.map((item) => item.value), ['Носещ профил'])
  assert.deepEqual(variant?.excludedItems.map((item) => item.value), ['Комарници'])
})

test('REAL DATA 02.3 maps explicit VAT wording but does not invent numeric pricing', () => {
  const result = bridge('Вариант 1:\nЦЕНА : 9 043 € с ДДС')
  const variant = result.draft.offerVariants[0]
  assert.equal(variant?.vatIncluded.value, true)
  assert.equal(variant?.totalPrice.state, 'UNRESOLVED')
  assert.equal(variant?.currency.state, 'UNRESOLVED')
  assert.ok(result.warnings.some((item) => item.includes('не извлича автоматично числова цена/валута')))
})

test('REAL DATA 02.3 reports conflicting repeated site values instead of choosing one', () => {
  const result = bridge('обект : Обект A\nобект : Обект B')
  assert.equal(result.draft.siteLocation.state, 'CONFLICT')
  assert.equal(result.draft.siteLocation.value, null)
  assert.equal(result.draft.siteLocation.evidenceRefs.length, 2)
})

test('REAL DATA 02.3 reports conflicting repeated module dimensions instead of choosing one', () => {
  const result = bridge('Модул: 1\nL = 1000 mm\nL = 1100 mm\nH = 1200 mm')
  assert.equal(result.draft.modules[0]?.widthMm.state, 'CONFLICT')
  assert.equal(result.draft.modules[0]?.widthMm.value, null)
  assert.ok(result.warnings.some((item) => item.includes('конфликтни')))
})

test('REAL DATA 02.3 leaves absent quantity and dimensions unresolved', () => {
  const result = bridge('Модул: 1')
  const module = result.draft.modules[0]
  assert.equal(module?.quantity.state, 'UNRESOLVED')
  assert.equal(module?.widthMm.state, 'UNRESOLVED')
  assert.equal(module?.heightMm.state, 'UNRESOLVED')
})

test('REAL DATA 02.3 does not infer opening, sash, divider or profile component geometry', () => {
  const result = bridge('Модул: 1\nL = 2000 mm\nH = 2600 mm')
  const serialized = JSON.stringify(result.draft)
  assert.equal(/openingDirection|sash|divider|frameProfile|machineCode/i.test(serialized), false)
  assert.equal(result.safety.automaticAttributeInferenceAllowed, false)
})

test('REAL DATA 02.3 does not create a lifecycle ProjectRecord or human-confirm source fields', () => {
  const result = bridge('обект : Синтетичен обект\nМодул: 1')
  assert.equal(result.safety.createsLifecycleProject, false)
  assert.equal(result.draft.siteLocation.humanConfirmed, false)
  assert.equal(result.draft.modules[0]?.externalReference.humanConfirmed, false)
})

test('REAL DATA 02.3 returns canonical schema validation errors instead of bypassing validation', () => {
  const result = bridge('Модул: 1\nБрой: 0\nL = 1000 mm\nH = 1200 mm')
  assert.ok(result.validationErrors.some((item) => item.includes('Невалиден брой')))
  assert.equal(result.readyForHumanReview, false)
})

test('REAL DATA 02.3 valid synthetic geometry is ready for human review even with unresolved non-source fields', () => {
  const result = bridge('Модул: 1\nБрой: 1\nL = 1000 mm\nH = 1200 mm')
  assert.deepEqual(result.validationErrors, [])
  assert.equal(result.readyForHumanReview, true)
  assert.ok(result.warnings.some((item) => item.includes('неуточнени стойности')))
})

test('REAL DATA 02.3 empty source remains a safe empty SOURCE_DRAFT', () => {
  const result = bridge('')
  assert.equal(result.draft.modules.length, 0)
  assert.equal(result.draft.offerVariants.length, 0)
  assert.equal(result.draft.status, 'SOURCE_DRAFT')
  assert.equal(result.safety.machineReady, false)
})

test('REAL DATA 02.3 tracked fixtures remain synthetic and contain no private project corpus names', () => {
  const source = readFileSync('tests/realData02_3NadezhdaProjectDraftBridge.test.ts', 'utf8')
  for (const privateMarker of ['Крум' + 'овград', 'Де' + 'вин', 'Яго' + 'дово', 'Мо' + 'нек', 'Пламен' + ' Данев', 'Момин' + 'ско', 'ВЕНИ' + ' 97']) {
    assert.equal(source.includes(privateMarker), false)
  }
})
