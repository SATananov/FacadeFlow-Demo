import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildFacadeFlowQuickOfferModulePlan,
  buildFacadeFlowQuickProductPrompt,
  buildFacadeFlowQuickStructuredSelection,
  facadeFlowQuickVisualPresets,
  nextFacadeFlowQuickModuleNumber,
} from '../src/aiProductQuickSelect'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { createFacadeFlowOfferCompletenessReviewRuntime, applyFacadeFlowOfferCompletenessReviewCommand } from '../src/aiPromptOfferCompletenessReviewRuntime'
import { buildFacadeFlowParametricConstructionProposal } from '../src/aiParametricConstructionProposal'
import { applyFacadeFlowQuickStructuredSelection, createFacadeFlowAiSession, updateFacadeFlowJobMetadata } from '../src/aiWorkspaceState'

const root = process.cwd()

test('quick product prompt creates a structured three-field window without requiring free writing', () => {
  const result = buildFacadeFlowQuickProductPrompt({
    scope: 'SINGLE_PRODUCT',
    productType: 'WINDOW',
    configuration: 'THREE_FIELD',
    presetId: 'THREE_FIXED_TTR_FIXED',
    widthMm: 1200,
    heightMm: 1400,
    quantity: 3,
    system: 'PRELUDE 60',
    finish: 'RAL 7016',
    glazing: 'двоен стъклопакет',
    hardware: 'ROTO NX',
  })
  assert.ok(result.prompt)
  assert.match(result.prompt!, /Прозорец 1200 x 1400 mm/)
  assert.match(result.prompt!, /Количество: 3/)
  assert.match(result.prompt!, /Първото поле е фиксирано/)
  assert.match(result.prompt!, /Второто поле е осово-откидно дясно/)
  assert.match(result.prompt!, /Третото поле е фиксирано/)
  const parsed = interpretFacadeFlowPrompt(result.prompt!, 'quick-select-test')
  assert.equal(parsed.intent.category, 'WINDOW')
  assert.equal(parsed.intent.dimensions.widthMm, 1200)
  assert.equal(parsed.intent.dimensions.heightMm, 1400)
  assert.equal(parsed.intent.quantity, 3)
  assert.equal(parsed.intent.fields.length, 3)
  assert.equal(parsed.intent.profiles.system, 'PRELUDE 60')
})


test('quick selection binds directly to canonical intent without NLP reparsing and preserves FIX / tilt-turn right / FIX', () => {
  const result = buildFacadeFlowQuickStructuredSelection({
    scope: 'SINGLE_PRODUCT',
    productType: 'WINDOW',
    configuration: 'THREE_FIELD',
    presetId: 'THREE_FIXED_TTR_FIXED',
    widthMm: 1200,
    heightMm: 1400,
    quantity: 3,
    system: 'PRELUDE 60',
    finish: 'RAL 7016',
    glazing: 'двоен стъклопакет',
    hardware: 'ROTO NX',
  }, 'quick-direct-test')
  assert.ok(result.selection)
  const selection = result.selection!
  assert.equal(selection.directStructuredBinding, true)
  assert.equal(selection.nlpReparseRequired, false)
  assert.equal(selection.intent.aiGenerated, false)
  assert.equal(selection.intent.sourceKind, 'MANUAL')
  assert.equal(selection.intent.category, 'WINDOW')
  assert.equal(selection.intent.dimensions.widthMm, 1200)
  assert.equal(selection.intent.dimensions.heightMm, 1400)
  assert.equal(selection.intent.quantity, 3)
  assert.equal(selection.intent.profiles.system, 'PRELUDE 60')
  assert.deepEqual(selection.intent.fields.map((field) => [field.role, field.openingType, field.openingDirection]), [
    ['FIXED', 'FIXED', 'UNRESOLVED'],
    ['OPENING_SASH', 'TILT_TURN', 'RIGHT'],
    ['FIXED', 'FIXED', 'UNRESOLVED'],
  ])
  assert.equal(selection.intent.unresolved.length, 0)

  const proposal = buildFacadeFlowParametricConstructionProposal(selection.intent)
  assert.equal(proposal.status, 'NEEDS_REVIEW')
  assert.equal(proposal.geometryBasis, 'EQUAL_DISTRIBUTION_PROPOSAL')
  assert.deepEqual(proposal.fields.map((field) => [field.role, field.openingType, field.openingDirection]), [
    ['FIXED', 'FIXED', 'UNRESOLVED'],
    ['OPENING_SASH', 'TILT_TURN', 'RIGHT'],
    ['FIXED', 'FIXED', 'UNRESOLVED'],
  ])
  assert.equal(proposal.automaticAcceptedGeometry, false)
  assert.equal(proposal.machineReady, false)
})

test('quick selection is stored in session structured state and manual text editing releases the direct intent', () => {
  const result = buildFacadeFlowQuickStructuredSelection({
    scope: 'SINGLE_PRODUCT', productType: 'WINDOW', configuration: 'THREE_FIELD', presetId: 'THREE_FIXED_TTR_FIXED',
    widthMm: 1200, heightMm: 1400, quantity: 3, system: 'PRELUDE 60', finish: 'RAL 7016', glazing: 'двоен стъклопакет', hardware: 'ROTO NX',
  }, 'quick-session-test')
  assert.ok(result.selection)
  const applied = applyFacadeFlowQuickStructuredSelection(createFacadeFlowAiSession('quick-session'), result.selection!)
  assert.equal(applied.job.quickProductIntent?.id, 'quick-session-test')
  assert.equal(applied.job.quickProductIntent?.fields[1]?.openingType, 'TILT_TURN')
  assert.equal(applied.job.quickProductIntent?.fields[1]?.openingDirection, 'RIGHT')
  assert.equal(applied.job.intakeStatus, 'NEEDS_REVIEW')
  assert.ok(applied.job.products.some((product) => product.id === 'quick-session-test-specification'))

  const edited = updateFacadeFlowJobMetadata(applied, { description: `${applied.job.description} Смени средното на ляво.` })
  assert.equal(edited.job.quickProductIntent, null)
  assert.equal(edited.job.intakeStatus, 'SOURCE_CAPTURED')
})

test('quick visual presets expose standard and sliding families without pretending sliding offer geometry is supported', () => {
  const standard = facadeFlowQuickVisualPresets('WINDOW', 'THREE_FIELD')
  const sliding = facadeFlowQuickVisualPresets('SLIDING_SYSTEM', 'TWO_FIELD')
  assert.ok(standard.some((item) => item.id === 'THREE_FIXED_TTR_FIXED'))
  assert.ok(sliding.some((item) => item.id === 'TWO_SLIDE_MEET'))
  assert.equal(sliding.every((item) => item.supportedInOfferModuleRuntime === false), true)
})

test('quick offer module plan uses the next free module number and inherits offer defaults', () => {
  assert.equal(nextFacadeFlowQuickModuleNumber([1, 2, 4]), 3)
  const plan = buildFacadeFlowQuickOfferModulePlan({
    existingModuleNumbers: [1, 2, 4],
    productType: 'WINDOW',
    configuration: 'THREE_FIELD',
    presetId: 'THREE_FIXED_TTR_FIXED',
    widthMm: 1200,
    heightMm: 1400,
    quantity: 3,
  })
  assert.equal(plan.moduleNumber, 3)
  assert.deepEqual(plan.commands, [
    'Модул 3, 3 броя, каса 1200 х 1400 mm',
    'Раздели клетка 1 вертикално на 3 равни части',
    'Клетка 2 е фиксирана',
    'Постави крило в клетка 3, отваряемо и падащо, дясно',
    'Клетка 4 е фиксирана',
  ])
  assert.equal(plan.inheritsOfferDefaults, true)
  assert.equal(plan.humanReviewRequired, true)
  assert.equal(plan.rulesValidated, false)
  assert.equal(plan.automaticGeometryAllowed, false)
  assert.equal(plan.machineReady, false)
  assert.equal(plan.productionApproved, false)
})

test('quick offer module command plan materializes as a reviewable FIX / tilt-turn right / FIX module', () => {
  const plan = buildFacadeFlowQuickOfferModulePlan({
    existingModuleNumbers: [],
    productType: 'WINDOW',
    configuration: 'THREE_FIELD',
    presetId: 'THREE_FIXED_TTR_FIXED',
    widthMm: 1200,
    heightMm: 1400,
    quantity: 3,
  })
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта | За цялата оферта Система PRELUDE 60 | За цялата оферта Цвят RAL 7016 | За цялата оферта Стъклопакет двоен стъклопакет | За цялата оферта Обков ROTO NX', 'quick-offer-test')
  for (const command of plan.commands) runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, command)
  const offer = runtime.commercialRuntime.offerRuntime
  const module = offer.multiModule.modules.find((entry) => entry.moduleNumber === 1)
  const review = runtime.moduleReviews.find((entry) => entry.moduleNumber === 1)
  const settings = offer.moduleSettings.find((entry) => entry.moduleNumber === 1)
  assert.ok(module?.runtime.currentFrame)
  assert.deepEqual(module?.runtime.currentFrame?.cells.map((cell) => cell.id), [2, 3, 4])
  assert.deepEqual(review?.cellDispositions.map((cell) => [cell.cellId, cell.status]), [[2, 'FIXED'], [3, 'SASH'], [4, 'FIXED']])
  assert.equal(module?.runtime.currentFrame?.cells.find((cell) => cell.id === 3)?.sashLabel, 'Двуосно · дясно')
  assert.equal(settings?.effective.system, 'PRELUDE 60')
  assert.equal(settings?.effective.finish, 'RAL 7016')
  assert.equal(settings?.effective.glazing, 'двоен стъклопакет')
  assert.equal(settings?.effective.hardware, 'ROTO NX')
  assert.equal(review?.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(review?.confirmed, false)
})

test('sliding quick module selection routes to AI/manual flow instead of inventing unsupported module runtime geometry', () => {
  const plan = buildFacadeFlowQuickOfferModulePlan({
    existingModuleNumbers: [],
    productType: 'SLIDING_SYSTEM',
    configuration: 'TWO_FIELD',
    presetId: 'TWO_SLIDE_MEET',
    widthMm: 2400,
    heightMm: 2200,
    quantity: 1,
  })
  assert.equal(plan.commands.length, 0)
  assert.equal(plan.moduleNumber, null)
  assert.match(plan.reason ?? '', /още не прилага плъзгаща геометрия/)
  assert.equal(plan.machineReady, false)
})

test('workspace wiring exposes Quick Select first while preserving AI text and guided editor fallbacks', () => {
  const workspace = readFileSync(`${root}/src/components/FacadeFlowAIWorkspace.tsx`, 'utf8')
  const offerPanel = readFileSync(`${root}/src/components/OfferModulesInteractiveRuntimePanel.tsx`, 'utf8')
  const quickStart = readFileSync(`${root}/src/components/AiProductQuickStart.tsx`, 'utf8')
  const moduleQuick = readFileSync(`${root}/src/components/OfferModuleQuickSelect.tsx`, 'utf8')
  assert.match(workspace, /⚡ Бърз избор/)
  assert.match(workspace, /Опиши изделието с AI/)
  assert.match(workspace, /AiProductQuickStart/)
  assert.match(workspace, /applyFacadeFlowQuickStructuredSelection/)
  assert.match(workspace, /!quickIntent && hasDescription/)
  assert.match(workspace, /NLP reparse: НЕ/)
  assert.match(offerPanel, /OfferModuleQuickSelect/)
  assert.match(offerPanel, /GuidedAiCommandBuilder/)
  assert.match(offerPanel, /Разширен режим: свободно писане/)
  assert.match(quickStart, /Технически настройки · по желание/)
  assert.match(quickStart, /DIRECT STRUCTURED BINDING: ДА/)
  assert.match(moduleQuick, /НАСЛЕДЯВА ОТ ОФЕРТАТА/)
})
