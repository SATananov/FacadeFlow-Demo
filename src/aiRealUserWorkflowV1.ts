import { interpretFacadeFlowPrompt, type FacadeFlowPromptInterpretationResult } from './aiPromptInterpreter'
import type {
  FacadeFlowRealUserWorkflowAnswer,
  FacadeFlowRealUserWorkflowKnowledgeFact,
  FacadeFlowRealUserWorkflowKnowledgeGap,
  FacadeFlowRealUserWorkflowQuestion,
  FacadeFlowRealUserWorkflowV1State,
} from './aiWorkspaceTypes'
import { isExplicitPrelude60System } from './profileData/prelude60CanonicalProfileIdentity'
import { PRELUDE_60_PROFILE_CODES } from './profileData/prelude60BaseProfiles'
import { resolvePrelude60CanonicalTechnicalSemantics } from './profileData/prelude60CanonicalTechnicalSemantics'

export const REAL_USER_WORKFLOW_V1_VERSION = 'REAL_USER_WORKFLOW_V1' as const

export const REAL_USER_WORKFLOW_V1_SAFETY = Object.freeze({
  humanClarificationOnly: true,
  clarificationAnswersAreCandidateInputOnly: true,
  automaticProfileSelectionAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  automaticKnowledgeResolutionAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})

const unique = <T,>(items: readonly T[]) => [...new Set(items)]
const clean = (value: string) => value.replace(/\s+/g, ' ').trim()

function question(input: Omit<FacadeFlowRealUserWorkflowQuestion, 'id'> & { id?: string }): FacadeFlowRealUserWorkflowQuestion {
  return { ...input, id: input.id ?? input.target }
}

function hasDeferred(answers: readonly FacadeFlowRealUserWorkflowAnswer[], target: string) {
  return answers.some((answer) => answer.target === target && answer.deferred)
}

function fieldTarget(index: number, kind: 'ROLE' | 'OPENING_TYPE' | 'DIRECTION') {
  return `FIELD:${index + 1}:${kind}`
}

function answerFragment(target: string, answerText: string) {
  const value = clean(answerText)
  if (!value) return ''
  if (target === 'CATEGORY') return value
  if (target === 'DIMENSIONS') return `размер ${value}`
  if (target === 'QUANTITY') return `${value} броя`
  if (target === 'PROFILE_SYSTEM') return `система ${value}`
  if (target === 'PROFILE_FRAME') return `каса ${value}`
  if (target === 'PROFILE_SASH') return `крило ${value}`
  if (target === 'PROFILE_MULLION') return `делител ${value}`
  if (target === 'GLAZING') return `стъкло ${value}`
  if (target === 'FINISH') return `цвят ${value}`
  if (target === 'TOPOLOGY') return value
  const fieldMatch = target.match(/^FIELD:(\d+):(ROLE|OPENING_TYPE|DIRECTION)$/)
  if (fieldMatch) return `поле ${fieldMatch[1]} ${value}`
  return value
}

function buildAugmentedSourceText(sourceText: string, answers: readonly FacadeFlowRealUserWorkflowAnswer[]) {
  const fragments = answers.filter((answer) => !answer.deferred && answer.fragment).map((answer) => answer.fragment)
  if (!fragments.length) return clean(sourceText)
  return `${clean(sourceText)}. Уточнения от човек: ${fragments.join('; ')}.`
}

function technicalFact(role: 'FRAME' | 'SASH' | 'MULLION', code: string | undefined): FacadeFlowRealUserWorkflowKnowledgeFact | null {
  if (!code) return null
  const resolved = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: code, role })
  if (resolved.state !== 'RESOLVED_HUMAN_CONFIRMED' || !resolved.semantics) return null
  const s = resolved.semantics
  return {
    id: `PRELUDE60:${role}:${code}`,
    label: `${s.roleLabelBg} ${s.profileCode}`,
    value: `работен размер ${s.workingDimensions.fullWorkingDimensionMm} mm · видима ширина ${s.workingDimensions.visibleWidthMm} mm`,
    authority: 'HUMAN_CONFIRMED_WORKING_SEMANTICS',
    safetyNote: 'Работна семантика за човешка проверка; не е exact section contour, production deduction или machine-ready geometry.',
  }
}

function buildKnowledgeFacts(interpretation: FacadeFlowPromptInterpretationResult): FacadeFlowRealUserWorkflowKnowledgeFact[] {
  const intent = interpretation.intent
  const facts: FacadeFlowRealUserWorkflowKnowledgeFact[] = []
  if (intent.category !== 'UNRESOLVED') facts.push({
    id: 'USER:CATEGORY', label: 'Изделие', value: intent.category,
    authority: 'EXPLICIT_USER_INPUT', safetyNote: 'Разпознато от текущия потребителски prompt; изисква human review.',
  })
  if (intent.dimensions.widthMm && intent.dimensions.heightMm) facts.push({
    id: 'USER:DIMENSIONS', label: 'Размери', value: `${intent.dimensions.widthMm} × ${intent.dimensions.heightMm} mm`,
    authority: 'EXPLICIT_USER_INPUT', safetyNote: 'Разпознато от текущия потребителски prompt; не е производствена геометрия.',
  })
  if (intent.profiles.system) facts.push({
    id: 'USER:SYSTEM', label: 'Профилна система', value: intent.profiles.system,
    authority: 'EXPLICIT_USER_INPUT', safetyNote: 'Потребителски зададена система; не разрешава автоматичен избор на профили.',
  })
  if (isExplicitPrelude60System(intent.profiles.system)) {
    const candidates = [
      technicalFact('FRAME', intent.profiles.frame),
      technicalFact('SASH', intent.profiles.sash),
      technicalFact('MULLION', intent.profiles.mullion),
    ].filter((item): item is FacadeFlowRealUserWorkflowKnowledgeFact => Boolean(item))
    facts.push(...candidates)
  }
  return facts
}

function buildKnowledgeGaps(interpretation: FacadeFlowPromptInterpretationResult): FacadeFlowRealUserWorkflowKnowledgeGap[] {
  const intent = interpretation.intent
  const gaps: FacadeFlowRealUserWorkflowKnowledgeGap[] = []
  if (intent.profiles.system && !isExplicitPrelude60System(intent.profiles.system)) {
    gaps.push({
      id: 'SYSTEM_NOT_COVERED',
      label: intent.profiles.system,
      message: 'PROFILE DATA V1 в този checkpoint има canonical technical semantics за PRELUDE 60. За тази система липсва reviewed knowledge coverage и AI не трябва да измисля технически стойности.',
      authorityNeeded: 'manufacturer catalogue / reviewed technical source',
    })
  }
  if (isExplicitPrelude60System(intent.profiles.system)) {
    const roleChecks = [
      ['FRAME', intent.profiles.frame],
      ['SASH', intent.profiles.sash],
      ['MULLION', intent.profiles.mullion],
    ] as const
    for (const [role, code] of roleChecks) {
      if (!code) continue
      const resolved = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: code, role })
      if (resolved.state !== 'RESOLVED_HUMAN_CONFIRMED') gaps.push({
        id: `PRELUDE60:${role}:${resolved.state}`,
        label: `${role} ${code}`,
        message: `Кодът е разпознат от prompt-а, но PROFILE DATA V1 не го приема като reviewed ${role} technical semantic (${resolved.state}).`,
        authorityNeeded: 'human profile review / canonical profile source',
      })
    }
  }
  return gaps
}

function buildQuestions(
  interpretation: FacadeFlowPromptInterpretationResult,
  answers: readonly FacadeFlowRealUserWorkflowAnswer[],
): FacadeFlowRealUserWorkflowQuestion[] {
  const intent = interpretation.intent
  const items: FacadeFlowRealUserWorkflowQuestion[] = []
  const add = (item: FacadeFlowRealUserWorkflowQuestion) => {
    if (hasDeferred(answers, item.target) && item.priority === 'OPTIONAL') return
    items.push(item)
  }

  if (intent.category === 'UNRESOLVED') add(question({
    target: 'CATEGORY', label: 'Тип изделие', questionBg: 'Какво изделие е това — прозорец, врата или друго?', priority: 'REQUIRED', source: 'PROMPT_GAP', answerHint: 'Напр. „прозорец“',
  }))
  if (intent.dimensions.widthMm === undefined || intent.dimensions.heightMm === undefined) add(question({
    target: 'DIMENSIONS', label: 'Общи размери', questionBg: 'Какви са общите ширина × височина?', priority: 'REQUIRED', source: 'PROMPT_GAP', answerHint: 'Напр. „1800 × 1400 mm“',
  }))
  if (!intent.quantity) add(question({
    target: 'QUANTITY', label: 'Количество', questionBg: 'Колко броя са нужни?', priority: 'OPTIONAL', source: 'PROMPT_GAP', suggestedAnswer: '1', suggestionReason: 'За единично изделие можеш да потвърдиш 1; стойността не се прилага без твое действие.', answerHint: 'Напр. „1“ или „4“',
  }))
  if (!intent.profiles.system) add(question({
    target: 'PROFILE_SYSTEM', label: 'Профилна система', questionBg: 'Коя профилна система трябва да се използва?', priority: 'REQUIRED', source: 'PROMPT_GAP', answerHint: 'Напр. „PRELUDE 60“',
  }))

  if (!intent.fields.length) {
    add(question({
      target: 'TOPOLOGY', label: 'Разпределение на полетата', questionBg: 'Колко полета има и какво е всяко поле?', priority: 'REQUIRED', source: 'PROMPT_GAP', answerHint: 'Напр. „три полета, крайните фиксирани, средното tilt-turn наляво“',
    }))
  } else {
    intent.fields.forEach((field, index) => {
      if (field.role === 'UNRESOLVED') add(question({
        target: fieldTarget(index, 'ROLE'), label: `Поле ${index + 1}`, questionBg: `Поле ${index + 1} фиксирано ли е или отваряемо?`, priority: 'REQUIRED', source: 'PROMPT_GAP', answerHint: 'Напр. „фиксирано“ или „tilt-turn наляво“',
      }))
      if (field.role === 'OPENING_SASH' && !field.openingType) add(question({
        target: fieldTarget(index, 'OPENING_TYPE'), label: `Тип отваряне · поле ${index + 1}`, questionBg: `Какъв е точният тип отваряне на поле ${index + 1}?`, priority: 'REQUIRED', source: 'PROMPT_GAP', answerHint: 'Напр. „turn“ или „tilt-turn наляво“',
      }))
      if (field.role === 'OPENING_SASH' && (field.openingType === 'TURN' || field.openingType === 'TILT_TURN') && !field.openingDirection) add(question({
        target: fieldTarget(index, 'DIRECTION'), label: `Посока · поле ${index + 1}`, questionBg: `Поле ${index + 1} отваря ли наляво или надясно?`, priority: 'REQUIRED', source: 'PROMPT_GAP', answerHint: '„наляво“ или „надясно“',
      }))
    })
  }

  if (!intent.glazing.description) add(question({
    target: 'GLAZING', label: 'Стъкло / пълнеж', questionBg: 'Какъв стъклопакет или пълнеж е нужен?', priority: 'OPTIONAL', source: 'PROMPT_GAP', answerHint: 'Напр. „двоен стъклопакет“',
  }))
  if (!intent.finish.exterior) add(question({
    target: 'FINISH', label: 'Цвят / покритие', questionBg: 'Има ли изискване за цвят или покритие?', priority: 'OPTIONAL', source: 'PROMPT_GAP', answerHint: 'Напр. „RAL 7016“; ако няма изискване, остави неуточнено.',
  }))

  if (isExplicitPrelude60System(intent.profiles.system)) {
    const anyOpenable = intent.fields.some((field) => field.role === 'OPENING_SASH' || field.role === 'SLIDING_SASH')
    const needsMullion = intent.fields.length > 1
    const frameResolution = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: intent.profiles.frame, role: 'FRAME' })
    if (frameResolution.state !== 'RESOLVED_HUMAN_CONFIRMED') add(question({
      target: 'PROFILE_FRAME', label: 'Профил за каса', questionBg: 'Кой точен профил за каса потвърждаваш за PRELUDE 60?', priority: 'OPTIONAL', source: 'PROFILE_DATA_V1', suggestedAnswer: PRELUDE_60_PROFILE_CODES.frame, suggestionReason: 'PROFILE DATA V1 познава 482.30 като canonical FRAME candidate. Това е предложение за човешко потвърждение, не автоматичен избор.', answerHint: `Напр. „${PRELUDE_60_PROFILE_CODES.frame}“`,
    }))
    if (anyOpenable) {
      const sashResolution = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: intent.profiles.sash, role: 'SASH' })
      if (sashResolution.state !== 'RESOLVED_HUMAN_CONFIRMED') add(question({
        target: 'PROFILE_SASH', label: 'Профил за крило', questionBg: 'Кой точен профил за крило потвърждаваш за PRELUDE 60?', priority: 'OPTIONAL', source: 'PROFILE_DATA_V1', suggestedAnswer: PRELUDE_60_PROFILE_CODES.sash, suggestionReason: 'PROFILE DATA V1 познава 482.05 като canonical SASH candidate. Прилага се само след твое потвърждение.', answerHint: `Напр. „${PRELUDE_60_PROFILE_CODES.sash}“`,
      }))
    }
    if (needsMullion) {
      const mullionResolution = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: intent.profiles.mullion, role: 'MULLION' })
      if (mullionResolution.state !== 'RESOLVED_HUMAN_CONFIRMED') add(question({
        target: 'PROFILE_MULLION', label: 'Профил за делител', questionBg: 'Кой точен профил за делител потвърждаваш за PRELUDE 60?', priority: 'OPTIONAL', source: 'PROFILE_DATA_V1', suggestedAnswer: PRELUDE_60_PROFILE_CODES.mullion, suggestionReason: 'PROFILE DATA V1 познава 482.21 като canonical MULLION candidate. Прилага се само след твое потвърждение.', answerHint: `Напр. „${PRELUDE_60_PROFILE_CODES.mullion}“`,
      }))
    }
  }

  return items
}

function buildState(input: {
  sourceText: string
  intentId: string
  answers: readonly FacadeFlowRealUserWorkflowAnswer[]
}): FacadeFlowRealUserWorkflowV1State {
  const augmentedSourceText = buildAugmentedSourceText(input.sourceText, input.answers)
  const currentInterpretation = interpretFacadeFlowPrompt(augmentedSourceText, input.intentId)
  const questions = buildQuestions(currentInterpretation, input.answers)
  const requiredQuestionCount = questions.filter((item) => item.priority === 'REQUIRED').length
  const optionalQuestionCount = questions.length - requiredQuestionCount
  const declaredUnknownTargets = unique(input.answers.filter((answer) => answer.deferred).map((answer) => answer.target))
  const knowledgeFacts = buildKnowledgeFacts(currentInterpretation)
  const knowledgeGaps = buildKnowledgeGaps(currentInterpretation)

  let status: FacadeFlowRealUserWorkflowV1State['status']
  if (!currentInterpretation.validForHumanReview) status = 'BLOCKED'
  else if (requiredQuestionCount > 0) status = 'NEEDS_HUMAN_CLARIFICATION'
  else if (optionalQuestionCount > 0 || declaredUnknownTargets.length > 0 || knowledgeGaps.length > 0) status = 'READY_FOR_HUMAN_REVIEW_WITH_GAPS'
  else status = 'READY_FOR_HUMAN_REVIEW'

  return {
    version: REAL_USER_WORKFLOW_V1_VERSION,
    sourceText: clean(input.sourceText),
    augmentedSourceText,
    intentId: input.intentId,
    currentInterpretation,
    status,
    questions,
    answers: [...input.answers],
    declaredUnknownTargets,
    knowledgeFacts,
    knowledgeGaps,
    requiredQuestionCount,
    optionalQuestionCount,
    humanClarificationRequired: requiredQuestionCount > 0,
    humanReviewRequired: true,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export function startFacadeFlowRealUserWorkflowV1(interpretation: FacadeFlowPromptInterpretationResult): FacadeFlowRealUserWorkflowV1State {
  return buildState({ sourceText: interpretation.sourceText, intentId: interpretation.intent.id, answers: [] })
}

export function answerFacadeFlowRealUserWorkflowV1(input: {
  workflow: FacadeFlowRealUserWorkflowV1State
  questionId: string
  answerText?: string
  defer?: boolean
  answeredAt?: string
}): FacadeFlowRealUserWorkflowV1State {
  const activeQuestion = input.workflow.questions.find((item) => item.id === input.questionId)
  if (!activeQuestion) throw new Error(`Real User Workflow V1 question ${input.questionId} is not active.`)
  const deferred = Boolean(input.defer)
  const answerText = clean(input.answerText ?? '')
  if (!deferred && !answerText) throw new Error('Human clarification answer cannot be empty. Use defer to keep the item explicitly unknown.')
  const answer: FacadeFlowRealUserWorkflowAnswer = {
    target: activeQuestion.target,
    questionId: activeQuestion.id,
    answerText,
    fragment: deferred ? '' : answerFragment(activeQuestion.target, answerText),
    answeredAt: input.answeredAt ?? new Date().toISOString(),
    answeredByRole: 'TECHNICAL_USER',
    deferred,
  }
  const answers = [...input.workflow.answers.filter((item) => item.target !== answer.target), answer]
  return buildState({ sourceText: input.workflow.sourceText, intentId: input.workflow.intentId, answers })
}

export function removeFacadeFlowRealUserWorkflowV1Answer(input: {
  workflow: FacadeFlowRealUserWorkflowV1State
  target: string
}): FacadeFlowRealUserWorkflowV1State {
  const answers = input.workflow.answers.filter((item) => item.target !== input.target)
  return buildState({ sourceText: input.workflow.sourceText, intentId: input.workflow.intentId, answers })
}
