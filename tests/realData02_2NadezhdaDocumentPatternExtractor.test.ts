import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  extractNadezhdaDocumentPatterns,
  type NadezhdaDocumentPatternCandidateKind,
} from '../src/realData/nadezhdaDocumentPatternExtractor'

function extract(text: string) {
  return extractNadezhdaDocumentPatterns({
    sourceId: 'synthetic-001',
    sourceKind: 'DOCX',
    sourceReference: 'SYNTHETIC_NADEZHDA_PATTERN_FIXTURE.docx',
    text,
  })
}

function values(text: string, kind: NadezhdaDocumentPatternCandidateKind) {
  return extract(text).candidates.filter((item) => item.kind === kind).map((item) => item.value)
}

test('REAL DATA 02.2 is read-only, evidence-only and production locked', () => {
  const result = extract('Модул: 1\nБрой: 1\nL = 1200 mm\nH = 1400 mm')
  assert.equal(result.extractorVersion, 'REALDATA02.2')
  assert.equal(result.safety.privateSource, true)
  assert.equal(result.safety.readOnly, true)
  assert.equal(result.safety.sourceEvidenceOnly, true)
  assert.equal(result.safety.automaticDraftCreationAllowed, false)
  assert.equal(result.safety.automaticAttributeInferenceAllowed, false)
  assert.equal(result.safety.automaticModuleMergeAllowed, false)
  assert.equal(result.safety.productionLocked, true)
  assert.equal(result.safety.machineReady, false)
  assert.equal(result.safety.productionApproved, false)
})

test('REAL DATA 02.2 extracts an explicit object/site line without inventing a project name', () => {
  assert.deepEqual(values('обект : Синтетичен тестов обект', 'SITE_LOCATION'), ['Синтетичен тестов обект'])
  assert.equal(extract('Тестов текст без обект').candidates.some((item) => item.kind === 'SITE_LOCATION'), false)
})

test('REAL DATA 02.2 extracts explicit offer variants and preserves their context', () => {
  const result = extract('Вариант 1:\nPVC дограма\nМодул: 1\nВариант 2:\nAL дограма\nМодул: 2')
  assert.deepEqual(result.candidates.filter((item) => item.kind === 'OFFER_VARIANT').map((item) => item.value), ['Вариант 1', 'Вариант 2'])
  const modules = result.candidates.filter((item) => item.kind === 'MODULE_REFERENCE')
  assert.equal(modules[0]?.context.offerVariantLabel, 'Вариант 1')
  assert.equal(modules[1]?.context.offerVariantLabel, 'Вариант 2')
})

test('REAL DATA 02.2 recognizes PVC and aluminium product groups without converting them into templates', () => {
  const result = extract('PVC дограма\nМодул: 1\nAL дограма\nМодул: 2')
  const groups = result.candidates.filter((item) => item.kind === 'PRODUCT_GROUP')
  assert.deepEqual(groups.map((item) => item.value), ['PVC дограма', 'AL дограма'])
  const modules = result.candidates.filter((item) => item.kind === 'MODULE_REFERENCE')
  assert.equal(modules[0]?.context.material, 'PVC')
  assert.equal(modules[1]?.context.material, 'ALUMINIUM')
})

test('REAL DATA 02.2 keeps aluminium doors as a distinct explicit product group', () => {
  const result = extract('AL дограма\nМодул: 1\nAL врати\nМодул: D-1')
  const groups = result.candidates.filter((item) => item.kind === 'PRODUCT_GROUP')
  assert.deepEqual(groups.map((item) => item.value), ['AL дограма', 'AL врати'])
  const doorModule = result.candidates.filter((item) => item.kind === 'MODULE_REFERENCE')[1]
  assert.equal(doorModule?.context.productGroupLabel, 'AL врати')
  assert.equal(doorModule?.context.material, 'ALUMINIUM')
})

test('REAL DATA 02.2 carries explicit floor placement to subsequent module observations', () => {
  const result = extract('Етаж 2\nМодул: 8\nБрой: 1\nL = 2380 mm\nH = 1900 mm')
  const module = result.candidates.find((item) => item.kind === 'MODULE_REFERENCE')
  const width = result.candidates.find((item) => item.kind === 'WIDTH_MM')
  assert.deepEqual(module?.context.placement, [{ kind: 'FLOOR', label: 'Етаж 2' }])
  assert.deepEqual(width?.context.placement, [{ kind: 'FLOOR', label: 'Етаж 2' }])
})

test('REAL DATA 02.2 supports optional section placement without requiring a floor', () => {
  const result = extract('Секция A\nМодул: A-01\nL = 900 mm\nH = 2100 mm')
  const module = result.candidates.find((item) => item.kind === 'MODULE_REFERENCE')
  assert.deepEqual(module?.context.placement, [{ kind: 'SECTION', label: 'Секция A' }])
})

test('REAL DATA 02.2 extracts module reference, quantity, L and H from explicit lines', () => {
  const result = extract('Модул: M-12\nБрой: 4\nL =1650 mm\nH = 1400 mm')
  assert.deepEqual(result.candidates.filter((item) => ['MODULE_REFERENCE', 'QUANTITY', 'WIDTH_MM', 'HEIGHT_MM'].includes(item.kind)).map((item) => item.value), ['M-12', 4, 1650, 1400])
})

test('REAL DATA 02.2 accepts common whitespace, non-breaking spaces and decimal commas in numeric patterns', () => {
  const result = extract('Модул: 1\nБрой: 2\nL = 1\u00a0650 mm\nH = 1400,5 mm')
  assert.deepEqual(values('Брой: 2', 'QUANTITY'), [2])
  assert.equal(result.candidates.find((item) => item.kind === 'WIDTH_MM')?.value, 1650)
  assert.equal(result.candidates.find((item) => item.kind === 'HEIGHT_MM')?.value, 1400.5)
})

test('REAL DATA 02.2 keeps same-size module positions distinct', () => {
  const result = extract('Модул: 4\nL =1900 mm\nH =2520 mm\nМодул: 6\nL =1900 mm\nH =2520 mm')
  const modules = result.candidates.filter((item) => item.kind === 'MODULE_REFERENCE')
  assert.deepEqual(modules.map((item) => item.value), ['4', '6'])
  assert.equal(result.safety.automaticModuleMergeAllowed, false)
})

test('REAL DATA 02.2 extracts explicit system, color, glazing, hardware and reinforcement text', () => {
  const result = extract([
    'Профил: PVC система SYNTH-70',
    'Цвят: RAL 7016',
    'Стъклопакет: 4S+Б/24 мм',
    'Обков „TEST-HARDWARE”',
    'Армировка 1,5 мм',
  ].join('\n'))
  assert.equal(result.candidates.find((item) => item.kind === 'SYSTEM')?.value, 'PVC система SYNTH-70')
  assert.equal(result.candidates.find((item) => item.kind === 'COLOR')?.value, 'RAL 7016')
  assert.equal(result.candidates.find((item) => item.kind === 'GLAZING')?.value, '4S+Б/24 мм')
  assert.equal(result.candidates.find((item) => item.kind === 'HARDWARE')?.value, 'TEST-HARDWARE')
  assert.equal(result.candidates.find((item) => item.kind === 'REINFORCEMENT')?.value, '1,5 мм')
})

test('REAL DATA 02.2 does not infer system, glazing or hardware when the source does not state them', () => {
  const result = extract('Модул: 1\nБрой: 1\nL = 1200 mm\nH = 1400 mm')
  assert.equal(result.candidates.some((item) => item.kind === 'SYSTEM'), false)
  assert.equal(result.candidates.some((item) => item.kind === 'GLAZING'), false)
  assert.equal(result.candidates.some((item) => item.kind === 'HARDWARE'), false)
})

test('REAL DATA 02.2 does not derive opening direction or construction from dimensions', () => {
  const result = extract('Модул: 1\nL = 2000 mm\nH = 2600 mm')
  assert.equal(result.candidates.some((item) => /OPEN|SASH|DIVIDER|CONSTRUCTION/i.test(item.kind)), false)
  assert.equal(result.safety.automaticAttributeInferenceAllowed, false)
})

test('REAL DATA 02.2 captures included and excluded commercial items only inside explicit sections', () => {
  const result = extract([
    'В цената са включени :',
    'Носещ профил от долната страна',
    'Външна мембрана',
    '',
    'В посочената цена не са включени :',
    'Комарници',
  ].join('\n'))
  assert.deepEqual(result.candidates.filter((item) => item.kind === 'INCLUDED_ITEM').map((item) => item.value), ['Носещ профил от долната страна', 'Външна мембрана'])
  assert.deepEqual(result.candidates.filter((item) => item.kind === 'EXCLUDED_ITEM').map((item) => item.value), ['Комарници'])
})

test('REAL DATA 02.2 preserves price lines as evidence text and recognizes explicit VAT wording', () => {
  const included = extract('ЦЕНА : 9 043 € с ДДС')
  assert.equal(included.candidates.find((item) => item.kind === 'PRICE_TEXT')?.value, 'ЦЕНА : 9 043 € с ДДС')
  assert.equal(included.candidates.find((item) => item.kind === 'VAT_MODE')?.value, 'INCLUDED')
  const excluded = extract('Обща цена: 21 766 лв. без ДДС')
  assert.equal(excluded.candidates.find((item) => item.kind === 'VAT_MODE')?.value, 'EXCLUDED')
})

test('REAL DATA 02.2 creates deterministic private evidence locators for every candidate', () => {
  const result = extract('Модул: 1\nБрой: 2\nL = 1000 mm\nH = 1200 mm')
  assert.equal(result.candidates.length, 4)
  assert.ok(result.candidates.every((item) => item.evidence.privateSource === true))
  assert.deepEqual(result.candidates.map((item) => item.evidence.locator), ['line:1', 'line:2', 'line:3', 'line:4'])
  assert.equal(new Set(result.candidates.map((item) => item.evidence.id)).size, 4)
})

test('REAL DATA 02.2 preserves source kind and source reference without executing source content', () => {
  const result = extractNadezhdaDocumentPatterns({
    sourceId: 'synthetic-pdf',
    sourceKind: 'PDF',
    sourceReference: 'SYNTHETIC_SOURCE.pdf',
    text: 'Модул: 1',
  })
  assert.equal(result.sourceKind, 'PDF')
  assert.equal(result.sourceReference, 'SYNTHETIC_SOURCE.pdf')
  assert.equal(result.candidates[0]?.evidence.sourceKind, 'PDF')
  assert.equal(result.candidates[0]?.evidence.sourceReference, 'SYNTHETIC_SOURCE.pdf')
})

test('REAL DATA 02.2 warns rather than inventing module structure for unrelated text', () => {
  const result = extract('Общи търговски условия и срок за доставка.')
  assert.equal(result.candidates.some((item) => item.kind === 'MODULE_REFERENCE'), false)
  assert.ok(result.warnings.some((item) => item.includes('Модул:')))
})

test('REAL DATA 02.2 warns when explicit modules have no explicit dimensions', () => {
  const result = extract('Модул: 1\nБрой: 2')
  assert.ok(result.warnings.some((item) => item.includes('без явни L/H')))
})

test('REAL DATA 02.2 empty text remains a safe no-op', () => {
  const result = extract('   \n\n')
  assert.deepEqual(result.candidates, [])
  assert.ok(result.warnings.some((item) => item.includes('няма текст')))
  assert.equal(result.safety.machineReady, false)
})

test('REAL DATA 02.2 tracked fixtures remain synthetic and contain no private project corpus names', () => {
  const source = readFileSync('tests/realData02_2NadezhdaDocumentPatternExtractor.test.ts', 'utf8')
  for (const privateMarker of ['Крум' + 'овград', 'Де' + 'вин', 'Яго' + 'дово', 'Мо' + 'нек', 'Пламен' + ' Данев', 'Момин' + 'ско', 'ВЕНИ' + ' 97']) {
    assert.equal(source.includes(privateMarker), false)
  }
})
