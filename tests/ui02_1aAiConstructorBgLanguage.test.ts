import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createFacadeFlowProductIntent, validateFacadeFlowProductIntent } from '../src/aiProductIntent'
import { aiUiMessageBg } from '../src/aiUiLanguageBg'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { buildFacadeFlowParametricConstructionProposal } from '../src/aiParametricConstructionProposal'

const read = (path: string) => readFileSync(path, 'utf8')
const workspace = read('src/components/FacadeFlowAIWorkspace.tsx')
const prompt = read('src/components/PromptInterpretationPanel.tsx')
const documents = read('src/components/ProjectDocumentIntelligencePanel.tsx')
const proposal = read('src/components/ParametricConstructionProposalPanel.tsx')
const guided = read('src/components/GuidedAiProductBuilder.tsx')
const evidence = read('src/components/GuidedNadezhdaEvidencePreview.tsx')
const structure = read('src/components/ProjectStructureBuilder.tsx')
const constructor = read('src/components/DetailDraftingPlaceholder.tsx')
const customDesigner = read('src/components/CustomProductDesigner.tsx')
const app = read('src/App.tsx')
const promptBridge = read('src/aiPromptGuidedBridge.ts')
const documentBridge = read('src/aiDocumentGuidedBridge.ts')

const stripInternalAttributes = (source: string) => source
  .replace(/\sdata-[\w-]+=(?:"[^"]*"|\{`[^`]*`\})/g, '')
  .replace(/const AI03_SAFETY_MARKERS = '[^']*'/g, '')

const visible = stripInternalAttributes([workspace, prompt, documents, proposal, guided, evidence, structure, constructor, customDesigner, app].join('\n'))

test('UI02.1A presents AI01 prompt flow in Bulgarian while keeping AI/CAD technical identifiers', () => {
  for (const marker of [
    'ЛОКАЛНО РАЗЧИТАНЕ НА ОПИСАНИЕ',
    'СВОБОДНО ОПИСАНИЕ / РАЗЧИТАНЕ НА ТЕКСТ',
    'ИЗИСКВА ПРОВЕРКА',
    'НЕВАЛИДНА ЧЕРНОВА',
    'АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ',
    'ПРАВИЛА ВАЛИДИРАНИ: НЕ',
    'ГОТОВО ЗА МАШИНА: НЕ',
  ]) assert.ok(visible.includes(marker), marker)
})

test('UI02.1A presents AI02 document intelligence and evidence terminology in Bulgarian', () => {
  for (const marker of [
    'ПРОЕКТНИ ДОКУМЕНТИ · ЛОКАЛНО РАЗЧИТАНЕ',
    'САМО ПРОСЛЕДИМОСТ',
    'КОНФЛИКТ — ЧОВЕШКА ПРОВЕРКА',
    'Източници и проследимост',
    'Покажи доказателствата от източника',
    '04 · БЕЗОПАСЕН ПРЕХОД',
    'ДОКУМЕНТИТЕ ОСТАВАТ ЛОКАЛНИ',
  ]) assert.ok(visible.includes(marker), marker)
})

test('UI02.1A presents proposal review and constructor continuation with user-facing names', () => {
  for (const marker of [
    'ПРЕГЛЕД НА ПРЕДЛОЖЕНИЕТО',
    'структурираните продуктови данни',
    'Следващият преход остава отделен и изричен.',
    'редактируема симулационна чернова',
    'ПРОДЪЛЖИ В КОНСТРУКТОРА',
    'АВТОМАТИЧЕН ПРЕХОД КЪМ КОНСТРУКТОРА: НЕ',
    'ПРЕДЛОЖЕНИЕТО Е ОДОБРЕНО ОТ ЧОВЕК: ДА',
  ]) assert.ok(visible.includes(marker), marker)
})

test('UI02.1A presents guided AI and constructor handoff status labels in Bulgarian', () => {
  for (const marker of [
    'ЧОВЕШКА ПРОВЕРКА',
    '✓ ПОТВЪРДЕНО ОТ ЧОВЕК',
    'Вадим-2 · доказателства от източника',
    'ПОТВЪРДЕНО ОТ ЧОВЕК',
    'СТРУКТУРА · ПО ЖЕЛАНИЕ',
    'AI → ПРЕХОД КЪМ КОНСТРУКТОРА',
    'ИЗТОЧНИК, ПОТВЪРДЕН ОТ ЧОВЕК',
    'БЕЗ АВТОМАТИЧНО AI ИЗВЕЖДАНЕ',
    'ДЕМО ЦЕНТЪР · ЦЯЛАТА AI СЕКЦИЯ',
    'Предложение, одобрено от човек',
    'Доказателства:',
  ]) assert.ok(visible.includes(marker), marker)
})

test('UI02.1A keeps internal AI01-AI04 phase ids out of user-facing labels and generated notes', () => {
  const phaseInJsxText = [...visible.matchAll(/>([^<>{}]*AI0[1-4][^<>{}]*)</g)].map((match) => match[1]?.trim()).filter(Boolean)
  const phaseInQuotedUiText = [...visible.matchAll(/(['"`])([^'"`\n]*AI0[1-4][^'"`\n]*)\1/g)].map((match) => match[2]?.trim()).filter(Boolean)
  assert.deepEqual(phaseInJsxText, [])
  assert.deepEqual(phaseInQuotedUiText, [])
  assert.equal(promptBridge.includes("'AI01 ИЗТОЧНИК ОТ ОПИСАНИЕ"), false)
  assert.equal(documentBridge.includes("'AI02 ДОКУМЕНТЕН ИЗТОЧНИК"), false)
  for (const label of ['Опиши изделието с нормален език', 'ПРОЕКТНИ ДОКУМЕНТИ · ЛОКАЛНО РАЗЧИТАНЕ', 'ПРЕГЛЕД НА ПРЕДЛОЖЕНИЕТО', 'ПРОДЪЛЖИ В КОНСТРУКТОРА']) assert.ok(visible.includes(label), label)
})

test('UI02.1A removes the audited mixed-language phrases from the visible AI/constructor presentation layer', () => {
  for (const oldPhrase of [
    'AI01 LOCAL INTERPRETER',
    'PROMPT INTELLIGENCE',
    'NEEDS REVIEW',
    'НЕВАЛИДЕН DRAFT',
    'PROJECT DOCUMENT INTELLIGENCE',
    'Източници и provenance',
    'Покажи source evidence',
    'SAFE HANDOFF',
    'editable simulation draft',
    'Human-approved proposal',
    'Автоматичен handoff',
    'AI → CONSTRUCTOR HANDOFF',
    'HUMAN CONFIRMED чернова',
    'placeholder профила',
    'нормалните dropdown-и',
    'AI INFERENCE',
    'AI03 blocker:',
    'AI01 · ЛОКАЛЕН ИНТЕРПРЕТАТОР',
    'AI02 · ПРОЕКТНИ ДОКУМЕНТИ · ЛОКАЛНО',
    'AI03 · ПАРАМЕТРИЧНО ПРЕДЛОЖЕНИЕ',
    'AI04 · ЕКСПЛИЦИТЕН ПРЕХОД КЪМ РЕДАКТИРУЕМА ГЕОМЕТРИЯ',
    'AI04 · РЕДАКТИРУЕМА ГЕОМЕТРИЯ ОТ ЧОВЕШКИ ПРЕГЛЕДАНО ПРЕДЛОЖЕНИЕ',
  ]) assert.equal(visible.includes(oldPhrase), false, oldPhrase)
})

test('UI02.1A returns Bulgarian validation and proposal blockers without changing internal status contracts', () => {
  const intent = createFacadeFlowProductIntent({ id: 'ui02-1a', sourceKind: 'PROMPT', sourceText: 'прозорец' })
  const validation = validateFacadeFlowProductIntent(intent)
  assert.ok(validation.warnings.includes('Overall width is unresolved.'))
  assert.equal(aiUiMessageBg('Overall width is unresolved.'), 'Общата ширина не е уточнена.')
  assert.equal(aiUiMessageBg('Overall height is unresolved.'), 'Общата височина не е уточнена.')
  assert.equal(aiUiMessageBg('Field topology is unresolved.'), 'Топологията на полетата не е уточнена.')
  assert.equal(aiUiMessageBg('AI03 V1 поддържа предложения само за прозорец или врата.'), 'Параметрично предложение може да се подготви само за прозорец или врата.')
  assert.equal(aiUiMessageBg('AI04 изисква AI03 предложението да е изрично прегледано от човек.'), 'Преходът към конструктора изисква предложението да е изрично прегледано от човек.')
  assert.equal(aiUiMessageBg('Форматът не е поддържан от AI02 V1.'), 'Форматът не е поддържан от текущия локален анализ.')
  const proposalResult = buildFacadeFlowParametricConstructionProposal(intent)
  assert.ok(proposalResult.blockers.some((item) => item.startsWith('Нужна е обща ширина')))
  assert.ok(proposalResult.blockers.some((item) => item.startsWith('Нужна е обща височина')))
  assert.equal(proposalResult.machineReady, false)
  assert.equal(proposalResult.rulesValidated, false)
  assert.equal(proposalResult.automaticAcceptedGeometry, false)
})

test('UI02.1A translates recognized prompt values for opening direction without changing canonical intent enums', () => {
  const result = interpretFacadeFlowPrompt('прозорец 1200x1400 mm, 1 field, tilt-turn, opening left, inward, RAL 7016')
  assert.equal(result.intent.fields[0]?.openingType, 'TILT_TURN')
  assert.equal(result.intent.fields[0]?.openingDirection, 'LEFT')
  assert.equal(result.intent.fields[0]?.swing, 'INWARD')
  assert.ok(result.recognized.some((item) => item.label === 'Отваряемост' && item.value === 'Осово-откидно'))
  assert.ok(result.recognized.some((item) => item.label === 'Посока' && item.value === 'Ляво'))
  assert.ok(result.recognized.some((item) => item.label === 'Навътре / навън' && item.value === 'Навътре'))
})

test('UI02.1A changes presentation/messages only and keeps all production authority locked', () => {
  const files = [
    read('src/aiProductIntent.ts'), read('src/aiPromptInterpreter.ts'), read('src/aiDocumentIntelligence.ts'),
    read('src/aiParametricConstructionProposal.ts'), read('src/ai04ConstructorHandoff.ts'), read('src/aiConstructorHandoff.ts'),
    workspace, prompt, documents, proposal, constructor, customDesigner,
  ].join('\n')
  for (const forbidden of ['machineReady: true', 'productionApproved: true', 'automaticGeometryAllowed: true', 'automaticConstructorHandoff: true', 'productionExecutable: true']) {
    assert.equal(files.includes(forbidden), false, forbidden)
  }
  for (const required of ['machineReady: false', 'productionApproved: false', 'automaticConstructorHandoff: false']) assert.ok(files.includes(required), required)
})
