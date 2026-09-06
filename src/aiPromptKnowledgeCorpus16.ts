import { createFacadeFlowOfferCompletenessReviewRuntime } from './aiPromptOfferCompletenessReviewRuntime'
import type { FacadeFlowCompletenessField, FacadeFlowModuleReviewStatus, FacadeFlowOfferReviewStatus } from './aiPromptOfferCompletenessReviewRuntime'

export type FacadeFlowPromptCorpus16Track = 'COMPLETE_READY_FOR_REVIEW' | 'INCOMPLETE_FIELD_DISCOVERY' | 'HUMAN_CONFIRM_GATE' | 'CONFIRMATION_INVALIDATION_SAFETY'

export interface FacadeFlowPromptCorpus16Case {
  id: string
  track: FacadeFlowPromptCorpus16Track
  prompt: string
  expectedOfferStatus: FacadeFlowOfferReviewStatus
  expectedModuleStatus: Partial<Record<number, FacadeFlowModuleReviewStatus>>
  expectedMissingFields: Partial<Record<number, FacadeFlowCompletenessField[]>>
  expectedConfirmedModules: number[]
  expectedReviewEvent: boolean
}

const defaults = (suffix = '') => `Оферта за Клиент${suffix}, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX`
const fixedModule = (moduleNumber: number, quantity: number, width: number, height: number) => `Модул ${moduleNumber}, ${quantity} броя, каса ${width} x ${height} mm, фикс`

function completeCases(): FacadeFlowPromptCorpus16Case[] {
  return Array.from({ length: 50 }, (_, index) => {
    const q1 = 1 + (index % 5)
    const q2 = 2 + (index % 4)
    const width = 1200 + index * 5
    return {
      id: `C16-C-${String(index + 1).padStart(3, '0')}`,
      track: 'COMPLETE_READY_FOR_REVIEW',
      prompt: `${defaults(` ${index + 1}`)}, case C16-C-${index + 1} | ${fixedModule(1, q1, width, 1400)} | ${fixedModule(2, q2, 900, 2100)} | Провери офертата`,
      expectedOfferStatus: 'READY_FOR_HUMAN_REVIEW',
      expectedModuleStatus: { 1: 'READY_FOR_HUMAN_REVIEW', 2: 'READY_FOR_HUMAN_REVIEW' },
      expectedMissingFields: { 1: [], 2: [] },
      expectedConfirmedModules: [],
      expectedReviewEvent: false,
    }
  })
}

function incompleteCases(): FacadeFlowPromptCorpus16Case[] {
  const fields: FacadeFlowCompletenessField[] = ['quantity', 'system', 'finish', 'glazing', 'hardware', 'openingDisposition']
  return Array.from({ length: 50 }, (_, index) => {
    const missing = fields[index % fields.length]!
    const parts: string[] = []
    if (missing === 'system') parts.push('Оферта за Клиент, цвят RAL 7016, двоен стъклопакет, обков ROTO NX')
    else if (missing === 'finish') parts.push('Оферта за Клиент, система PRELUDE 60, двоен стъклопакет, обков ROTO NX')
    else if (missing === 'glazing') parts.push('Оферта за Клиент, система PRELUDE 60, цвят RAL 7016, обков ROTO NX')
    else if (missing === 'hardware') parts.push('Оферта за Клиент, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет')
    else parts.push(defaults())

    parts[0] = `${parts[0]}, case C16-I-${index + 1}`

    if (missing === 'quantity') parts.push('Модул 1, каса 1500 x 1400 mm, фикс')
    else if (missing === 'openingDisposition') parts.push('Модул 1, 2 броя, каса 1500 x 1400 mm')
    else parts.push(fixedModule(1, 2, 1500, 1400))
    parts.push('Какво липсва за Модул 1?')

    return {
      id: `C16-I-${String(index + 1).padStart(3, '0')}`,
      track: 'INCOMPLETE_FIELD_DISCOVERY',
      prompt: parts.join(' | '),
      expectedOfferStatus: 'INCOMPLETE',
      expectedModuleStatus: { 1: 'INCOMPLETE' },
      expectedMissingFields: { 1: [missing] },
      expectedConfirmedModules: [],
      expectedReviewEvent: false,
    }
  })
}

function confirmCases(): FacadeFlowPromptCorpus16Case[] {
  return Array.from({ length: 50 }, (_, index) => {
    if (index % 5 === 4) {
      return {
        id: `C16-H-${String(index + 1).padStart(3, '0')}`,
        track: 'HUMAN_CONFIRM_GATE',
        prompt: `${defaults()}, case C16-H-${index + 1} | Модул 1, 2 броя, каса 1500 x 1400 mm | Потвърди Модул 1`,
        expectedOfferStatus: 'INCOMPLETE',
        expectedModuleStatus: { 1: 'INCOMPLETE' },
        expectedMissingFields: { 1: ['openingDisposition'] },
        expectedConfirmedModules: [],
        expectedReviewEvent: true,
      }
    }
    const confirmAll = index % 2 === 0
    return {
      id: `C16-H-${String(index + 1).padStart(3, '0')}`,
      track: 'HUMAN_CONFIRM_GATE',
      prompt: `${defaults()}, case C16-H-${index + 1} | ${fixedModule(1, 2 + (index % 3), 1500, 1400)} | ${fixedModule(2, 1 + (index % 4), 900, 2100)} | ${confirmAll ? 'Потвърди всички готови модули' : 'Потвърди Модул 1 | Потвърди Модул 2'}`,
      expectedOfferStatus: 'HUMAN_CONFIRMED_REVIEW',
      expectedModuleStatus: { 1: 'HUMAN_CONFIRMED', 2: 'HUMAN_CONFIRMED' },
      expectedMissingFields: { 1: [], 2: [] },
      expectedConfirmedModules: [1, 2],
      expectedReviewEvent: false,
    }
  })
}

function invalidationCases(): FacadeFlowPromptCorpus16Case[] {
  return Array.from({ length: 50 }, (_, index) => {
    const variant = index % 5
    if (variant === 0) {
      return {
        id: `C16-S-${String(index + 1).padStart(3, '0')}`,
        track: 'CONFIRMATION_INVALIDATION_SAFETY',
        prompt: `${defaults()}, case C16-S-${index + 1} | ${fixedModule(1, 2, 1500, 1400)} | Потвърди Модул 1 | Модул 1, цвят RAL 9016`,
        expectedOfferStatus: 'READY_FOR_HUMAN_REVIEW',
        expectedModuleStatus: { 1: 'READY_FOR_HUMAN_REVIEW' },
        expectedMissingFields: { 1: [] },
        expectedConfirmedModules: [],
        expectedReviewEvent: false,
      }
    }
    if (variant === 1) {
      return {
        id: `C16-S-${String(index + 1).padStart(3, '0')}`,
        track: 'CONFIRMATION_INVALIDATION_SAFETY',
        prompt: `${defaults()}, case C16-S-${index + 1} | ${fixedModule(1, 2, 1500, 1400)} | Потвърди Модул 1 | Модул 1 да стане 5 бр.`,
        expectedOfferStatus: 'READY_FOR_HUMAN_REVIEW',
        expectedModuleStatus: { 1: 'READY_FOR_HUMAN_REVIEW' },
        expectedMissingFields: { 1: [] },
        expectedConfirmedModules: [],
        expectedReviewEvent: false,
      }
    }
    if (variant === 2) {
      return {
        id: `C16-S-${String(index + 1).padStart(3, '0')}`,
        track: 'CONFIRMATION_INVALIDATION_SAFETY',
        prompt: `${defaults()}, case C16-S-${index + 1} | ${fixedModule(1, 2, 1500, 1400)} | Потвърди Модул 1 | Направи го 5 броя`,
        expectedOfferStatus: 'HUMAN_CONFIRMED_REVIEW',
        expectedModuleStatus: { 1: 'HUMAN_CONFIRMED' },
        expectedMissingFields: { 1: [] },
        expectedConfirmedModules: [1],
        expectedReviewEvent: true,
      }
    }
    if (variant === 3) {
      return {
        id: `C16-S-${String(index + 1).padStart(3, '0')}`,
        track: 'CONFIRMATION_INVALIDATION_SAFETY',
        prompt: `${defaults()}, case C16-S-${index + 1} | ${fixedModule(1, 2, 1500, 1400)} | ${fixedModule(2, 3, 900, 2100)} | Потвърди всички готови модули | За цялата оферта цветът да е RAL 9005`,
        expectedOfferStatus: 'READY_FOR_HUMAN_REVIEW',
        expectedModuleStatus: { 1: 'READY_FOR_HUMAN_REVIEW', 2: 'READY_FOR_HUMAN_REVIEW' },
        expectedMissingFields: { 1: [], 2: [] },
        expectedConfirmedModules: [],
        expectedReviewEvent: false,
      }
    }
    return {
      id: `C16-S-${String(index + 1).padStart(3, '0')}`,
      track: 'CONFIRMATION_INVALIDATION_SAFETY',
      prompt: `${defaults()}, case C16-S-${index + 1} | ${fixedModule(1, 2, 1500, 1400)} | ${fixedModule(2, 3, 900, 2100)} | Модул 2, цвят RAL 9016 | Потвърди всички готови модули | За цялата оферта цветът да е RAL 9005`,
      expectedOfferStatus: 'PARTIALLY_HUMAN_CONFIRMED',
      expectedModuleStatus: { 1: 'READY_FOR_HUMAN_REVIEW', 2: 'HUMAN_CONFIRMED' },
      expectedMissingFields: { 1: [], 2: [] },
      expectedConfirmedModules: [2],
      expectedReviewEvent: false,
    }
  })
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_16: FacadeFlowPromptCorpus16Case[] = [
  ...completeCases(),
  ...incompleteCases(),
  ...confirmCases(),
  ...invalidationCases(),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_16_EXPECTED_COUNTS = {
  TOTAL: 200,
  COMPLETE_READY_FOR_REVIEW: 50,
  INCOMPLETE_FIELD_DISCOVERY: 50,
  HUMAN_CONFIRM_GATE: 50,
  CONFIRMATION_INVALIDATION_SAFETY: 50,
} as const

export interface FacadeFlowPromptCorpus16Evaluation {
  total: number
  passed: number
  failed: number
  failures: Array<{ id: string; reasons: string[] }>
}

export function evaluateFacadeFlowPromptKnowledgeCorpus16(): FacadeFlowPromptCorpus16Evaluation {
  const failures: Array<{ id: string; reasons: string[] }> = []
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_16) {
    const runtime = createFacadeFlowOfferCompletenessReviewRuntime(item.prompt, `corpus16-${item.id}`)
    const reasons: string[] = []
    if (runtime.summary.status !== item.expectedOfferStatus) reasons.push(`offer status expected ${item.expectedOfferStatus} got ${runtime.summary.status}`)
    for (const [moduleText, expectedStatus] of Object.entries(item.expectedModuleStatus)) {
      const moduleNumber = Number(moduleText)
      const actual = runtime.moduleReviews.find((entry) => entry.moduleNumber === moduleNumber)
      if (!actual) {
        reasons.push(`module ${moduleNumber} missing from review`)
        continue
      }
      if (actual.status !== expectedStatus) reasons.push(`module ${moduleNumber} status expected ${expectedStatus} got ${actual.status}`)
      const expectedMissing = item.expectedMissingFields[moduleNumber] ?? []
      if (actual.missingFields.join(',') !== expectedMissing.join(',')) reasons.push(`module ${moduleNumber} missing expected ${expectedMissing.join(',')} got ${actual.missingFields.join(',')}`)
    }
    const confirmed = runtime.moduleReviews.filter((entry) => entry.confirmed).map((entry) => entry.moduleNumber)
    if (confirmed.join(',') !== item.expectedConfirmedModules.join(',')) reasons.push(`confirmed expected ${item.expectedConfirmedModules.join(',')} got ${confirmed.join(',')}`)
    const reviewSeen = runtime.events.some((event) => event.status === 'REVIEW_REQUIRED')
    if (reviewSeen !== item.expectedReviewEvent) reasons.push(`review event expected ${item.expectedReviewEvent} got ${reviewSeen}`)
    if (!runtime.humanReviewRequired || runtime.rulesValidated || runtime.automaticGeometryAllowed || !runtime.simulationOnly || runtime.machineReady || runtime.productionApproved) reasons.push('safety boundary changed')
    if (reasons.length) failures.push({ id: item.id, reasons })
  }
  return { total: AI_PROMPT_KNOWLEDGE_CORPUS_16.length, passed: AI_PROMPT_KNOWLEDGE_CORPUS_16.length - failures.length, failed: failures.length, failures }
}
