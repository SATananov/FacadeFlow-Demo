import { createFacadeFlowOfferCommercialSummaryRuntime } from './aiPromptOfferCommercialSummaryRuntime'

export type FacadeFlowPromptCorpus15Track = 'INITIAL_MODULE_QUANTITIES' | 'QUANTITY_REVISION' | 'COPY_WITH_QUANTITY' | 'COMMERCIAL_SUMMARY_SAFETY'

export interface FacadeFlowPromptCorpus15Case {
  id: string
  track: FacadeFlowPromptCorpus15Track
  prompt: string
  expectedTotal: number | null
  expectedKnownTotal: number
  expectedMissingModules: number[]
  expectedModuleQuantities: Record<number, number | null>
  expectedReview: boolean
}

const offerDefaults = 'Оферта за Клиент, PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX'
const frame = (moduleNumber: number, quantity: number | null, width: number, height: number) => `Модул ${moduleNumber}${quantity === null ? '' : `, ${quantity} броя`}, каса ${width} x ${height} mm`

function initialCases(): FacadeFlowPromptCorpus15Case[] {
  return Array.from({ length: 50 }, (_, index) => {
    const q1 = 1 + (index % 5)
    const q2 = 2 + (index % 4)
    return {
      id: `C15-I-${String(index + 1).padStart(3, '0')}`,
      track: 'INITIAL_MODULE_QUANTITIES',
      prompt: `${offerDefaults}, case C15-I-${index + 1} | ${frame(1, q1, 1200 + index * 5, 1400)} | ${frame(2, q2, 900, 2100)}`,
      expectedTotal: q1 + q2,
      expectedKnownTotal: q1 + q2,
      expectedMissingModules: [],
      expectedModuleQuantities: { 1: q1, 2: q2 },
      expectedReview: false,
    }
  })
}

function revisionCases(): FacadeFlowPromptCorpus15Case[] {
  return Array.from({ length: 50 }, (_, index) => {
    const q1 = 2 + (index % 3)
    const q2 = 1 + (index % 4)
    const revised = 5 + (index % 6)
    const wording = index % 3 === 0
      ? `Модул 2 да стане ${revised} бр.`
      : index % 3 === 1
        ? `Модул 2, количество ${revised}`
        : `Количество за Модул 2: ${revised}`
    return {
      id: `C15-R-${String(index + 1).padStart(3, '0')}`,
      track: 'QUANTITY_REVISION',
      prompt: `${offerDefaults}, case C15-R-${index + 1} | ${frame(1, q1, 1500, 1400)} | ${frame(2, q2, 1100, 1400)} | ${wording}`,
      expectedTotal: q1 + revised,
      expectedKnownTotal: q1 + revised,
      expectedMissingModules: [],
      expectedModuleQuantities: { 1: q1, 2: revised },
      expectedReview: false,
    }
  })
}

function copyCases(): FacadeFlowPromptCorpus15Case[] {
  return Array.from({ length: 50 }, (_, index) => {
    const sourceQuantity = 2 + (index % 5)
    const targetQuantity = 4 + (index % 7)
    const inheritAfterRevision = index % 2 === 1
    const commands = inheritAfterRevision
      ? `${offerDefaults}, case C15-C-${index + 1} | ${frame(1, sourceQuantity, 1800, 1400)} | Модул 1 да стане ${targetQuantity} бр. | Копирай Модул 1 като Модул 3`
      : `${offerDefaults}, case C15-C-${index + 1} | ${frame(1, sourceQuantity, 1800, 1400)} | Копирай Модул 1 като Модул 3, ${targetQuantity} броя`
    return {
      id: `C15-C-${String(index + 1).padStart(3, '0')}`,
      track: 'COPY_WITH_QUANTITY',
      prompt: commands,
      expectedTotal: inheritAfterRevision ? targetQuantity * 2 : sourceQuantity + targetQuantity,
      expectedKnownTotal: inheritAfterRevision ? targetQuantity * 2 : sourceQuantity + targetQuantity,
      expectedMissingModules: [],
      expectedModuleQuantities: { 1: inheritAfterRevision ? targetQuantity : sourceQuantity, 3: targetQuantity },
      expectedReview: false,
    }
  })
}

function safetyCases(): FacadeFlowPromptCorpus15Case[] {
  return Array.from({ length: 50 }, (_, index): FacadeFlowPromptCorpus15Case => {
    const variant = index % 5
    if (variant === 0) {
      return {
        id: `C15-S-${String(index + 1).padStart(3, '0')}`,
        track: 'COMMERCIAL_SUMMARY_SAFETY',
        prompt: `${offerDefaults}, case C15-S-${index + 1} | ${frame(1, 3, 1400, 1400)} | ${frame(2, null, 900, 2100)}`,
        expectedTotal: null,
        expectedKnownTotal: 3,
        expectedMissingModules: [2],
        expectedModuleQuantities: { 1: 3, 2: null },
        expectedReview: false,
      }
    }
    if (variant === 1) {
      return {
        id: `C15-S-${String(index + 1).padStart(3, '0')}`,
        track: 'COMMERCIAL_SUMMARY_SAFETY',
        prompt: `${offerDefaults}, case C15-S-${index + 1} | ${frame(1, 3, 1400, 1400)} | Направи го 5 броя`,
        expectedTotal: 3,
        expectedKnownTotal: 3,
        expectedMissingModules: [],
        expectedModuleQuantities: { 1: 3 },
        expectedReview: true,
      }
    }
    if (variant === 2) {
      return {
        id: `C15-S-${String(index + 1).padStart(3, '0')}`,
        track: 'COMMERCIAL_SUMMARY_SAFETY',
        prompt: `${offerDefaults}, case C15-S-${index + 1} | ${frame(12, 2, 1600, 1400)} | Модул 12 да стане 3 бр.`,
        expectedTotal: 3,
        expectedKnownTotal: 3,
        expectedMissingModules: [],
        expectedModuleQuantities: { 12: 3 },
        expectedReview: false,
      }
    }
    if (variant === 3) {
      return {
        id: `C15-S-${String(index + 1).padStart(3, '0')}`,
        track: 'COMMERCIAL_SUMMARY_SAFETY',
        prompt: `${offerDefaults}, case C15-S-${index + 1} | ${frame(1, 2, 1200, 1400)} | Модул 1 да стане 0 бр.`,
        expectedTotal: 2,
        expectedKnownTotal: 2,
        expectedMissingModules: [],
        expectedModuleQuantities: { 1: 2 },
        expectedReview: true,
      }
    }
    return {
      id: `C15-S-${String(index + 1).padStart(3, '0')}`,
      track: 'COMMERCIAL_SUMMARY_SAFETY',
      prompt: `${offerDefaults}, case C15-S-${index + 1} | ${frame(1, 2, 1200, 1400)} | ${frame(2, 4, 900, 2100)} | Колко са общо?`,
      expectedTotal: 6,
      expectedKnownTotal: 6,
      expectedMissingModules: [],
      expectedModuleQuantities: { 1: 2, 2: 4 },
      expectedReview: false,
    }
  })
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_15: FacadeFlowPromptCorpus15Case[] = [
  ...initialCases(),
  ...revisionCases(),
  ...copyCases(),
  ...safetyCases(),
]

export interface FacadeFlowPromptCorpus15Evaluation {
  total: number
  passed: number
  failed: number
  failures: Array<{ id: string; reasons: string[] }>
}

export function evaluateFacadeFlowPromptKnowledgeCorpus15(): FacadeFlowPromptCorpus15Evaluation {
  const failures: Array<{ id: string; reasons: string[] }> = []
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_15) {
    const runtime = createFacadeFlowOfferCommercialSummaryRuntime(item.prompt, `corpus15-${item.id}`)
    const reasons: string[] = []
    if (runtime.summary.totalQuantity !== item.expectedTotal) reasons.push(`totalQuantity expected ${item.expectedTotal} got ${runtime.summary.totalQuantity}`)
    if (runtime.summary.totalKnownQuantity !== item.expectedKnownTotal) reasons.push(`totalKnownQuantity expected ${item.expectedKnownTotal} got ${runtime.summary.totalKnownQuantity}`)
    if (runtime.summary.modulesWithoutQuantity.join(',') !== item.expectedMissingModules.join(',')) reasons.push(`missing modules expected ${item.expectedMissingModules.join(',')} got ${runtime.summary.modulesWithoutQuantity.join(',')}`)
    for (const [moduleNumberText, expectedQuantity] of Object.entries(item.expectedModuleQuantities)) {
      const moduleNumber = Number(moduleNumberText)
      const actual = runtime.moduleQuantities.find((entry) => entry.moduleNumber === moduleNumber)?.effectiveQuantity ?? null
      if (actual !== expectedQuantity) reasons.push(`module ${moduleNumber} quantity expected ${expectedQuantity} got ${actual}`)
    }
    const reviewSeen = runtime.events.some((event) => event.status === 'REVIEW_REQUIRED')
    if (reviewSeen !== item.expectedReview) reasons.push(`review expected ${item.expectedReview} got ${reviewSeen}`)
    if (!runtime.humanReviewRequired || runtime.rulesValidated || runtime.automaticGeometryAllowed || !runtime.simulationOnly || runtime.machineReady || runtime.productionApproved) reasons.push('safety boundary changed')
    if (reasons.length) failures.push({ id: item.id, reasons })
  }
  return { total: AI_PROMPT_KNOWLEDGE_CORPUS_15.length, passed: AI_PROMPT_KNOWLEDGE_CORPUS_15.length - failures.length, failed: failures.length, failures }
}
