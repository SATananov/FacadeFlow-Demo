import type { CombinedAnalysisJob, CombinedCandidate } from './combinedAnalysisTypes'
import { ocrLimits } from './ocrLimits'
import type { OcrRectangle } from './ocrTypes'
import type { DrawingReviewStatus } from './drawingImportTypes'

export interface ProvisionalFieldEvidence { confidence: number; warning?: string; candidateId?: string }
export interface RecognitionDerivedDraft {
  id: string
  projectReference: string
  productReference: string
  templateId: string
  width: number | null
  height: number | null
  quantity: number
  sourceFileName: string
  sourceSha256: string
  sourcePage: number
  sourceCrop: OcrRectangle
  sourceCropDataUrl: string
  status: DrawingReviewStatus
  recognitionDerived: true
  automaticallyPopulated: true
  humanVerified: boolean
  machineReady: false
  simulationOnly: true
  createdAt: string
  updatedAt: string
  evidence: Record<'templateId' | 'width' | 'height' | 'quantity' | 'productReference', ProvisionalFieldEvidence>
  unresolvedCandidateIds: string[]
}

const candidateFor = (job: CombinedAnalysisJob, type: CombinedCandidate['type']) => job.candidates.find((candidate) => candidate.type === type)
const numeric = (candidate?: CombinedCandidate) => { const value = Number(candidate?.normalizedValue.replace(',', '.')); return Number.isFinite(value) && value >= ocrLimits.minimumDimension && value <= ocrLimits.maximumDimension ? value : null }

export function generateProvisionalDraft(job: CombinedAnalysisJob, sourceFileName: string): RecognitionDerivedDraft {
  const scheme = job.schemeRankings[0], widthCandidate = candidateFor(job, 'OVERALL_WIDTH'), heightCandidate = candidateFor(job, 'OVERALL_HEIGHT'), quantityCandidate = candidateFor(job, 'QUANTITY'), referenceCandidate = candidateFor(job, 'PRODUCT_REFERENCE')
  const now = new Date().toISOString(), width = numeric(widthCandidate), height = numeric(heightCandidate), quantity = Math.max(1, Math.round(numeric(quantityCandidate) ?? 1))
  const schemeAmbiguous = Boolean(scheme && job.schemeRankings[1] && scheme.similarity - job.schemeRankings[1].similarity < 8)
  return {
    id: crypto.randomUUID(), projectReference: `Разпознаване от ${sourceFileName}`, productReference: referenceCandidate?.normalizedValue ?? '', templateId: scheme && !schemeAmbiguous ? scheme.templateId : '', width, height, quantity,
    sourceFileName, sourceSha256: job.sourceSha256, sourcePage: job.sourcePage, sourceCrop: job.crop, sourceCropDataUrl: job.evidenceImageDataUrl,
    status: 'NEEDS_REVIEW', recognitionDerived: true, automaticallyPopulated: true, humanVerified: false, machineReady: false, simulationOnly: true, createdAt: now, updatedAt: now,
    evidence: {
      templateId: { confidence: scheme?.similarity ?? 0, warning: schemeAmbiguous ? 'Схемата е двусмислена — сравнете алтернативите.' : scheme ? undefined : 'Липсва предложение за схема.' },
      width: { confidence: widthCandidate?.parserConfidence ?? 0, warning: widthCandidate?.warning ?? (width === null ? 'Липсва обща ширина.' : undefined), candidateId: widthCandidate?.id },
      height: { confidence: heightCandidate?.parserConfidence ?? 0, warning: heightCandidate?.warning ?? (height === null ? 'Липсва обща височина.' : undefined), candidateId: heightCandidate?.id },
      quantity: { confidence: quantityCandidate?.parserConfidence ?? 0, warning: quantityCandidate ? undefined : 'Не е открито количество; използвана е демонстрационна стойност 1.', candidateId: quantityCandidate?.id },
      productReference: { confidence: referenceCandidate?.parserConfidence ?? 0, warning: referenceCandidate ? undefined : 'Не е открита продуктова референция.', candidateId: referenceCandidate?.id },
    },
    unresolvedCandidateIds: job.candidates.filter((candidate) => ![widthCandidate?.id, heightCandidate?.id, quantityCandidate?.id, referenceCandidate?.id].includes(candidate.id)).map((candidate) => candidate.id),
  }
}

export function validateProvisionalDraft(draft: RecognitionDerivedDraft): string[] {
  const errors: string[] = []
  if (!draft.templateId) errors.push('Изберете референтна схема.')
  if (draft.width === null || !Number.isFinite(draft.width) || draft.width <= 0) errors.push('Въведете валидна положителна ширина.')
  if (draft.height === null || !Number.isFinite(draft.height) || draft.height <= 0) errors.push('Въведете валидна положителна височина.')
  if (!Number.isInteger(draft.quantity) || draft.quantity <= 0) errors.push('Количеството трябва да е положително цяло число.')
  return errors
}
