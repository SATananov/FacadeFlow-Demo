import type { FacadeFlowConstructionDrawing } from '../aiConstructionDrawing'
import { facadeFlowConstructionDrawingSignature } from '../aiConstructionDrawing'
import type { FacadeFlowConstructionGraph } from '../aiConstructionGraph'

export const AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_VERSION = 'AI05.3.3' as const

export type FacadeFlowDrawingHumanReviewDecision = 'CONFIRM' | 'CORRECT' | 'REJECT'
export type FacadeFlowDrawingLearningState =
  | 'ELIGIBLE_HUMAN_CONFIRMED_EXAMPLE'
  | 'REJECTED_EXAMPLE'
  | 'REVIEW_REQUIRED'
  | 'STALE_REVIEW_REQUIRED'

export interface FacadeFlowDrawingHumanReviewInput {
  reviewId: string
  reviewerRole: 'TECHNICAL_REVIEWER'
  reviewedAt: string
  decision: FacadeFlowDrawingHumanReviewDecision
  correctionNote?: string
  correctedSignature?: readonly string[]
}

export interface FacadeFlowHumanReviewedDrawingLearningRecord {
  schemaVersion: typeof AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_VERSION
  sourceIntentId: string
  sourceGraphVersion: 'AI05.2'
  sourceDrawingVersion: 'AI05.3'
  sourceDrawingStateKey: string
  sourceSignature: readonly string[]
  acceptedSignature: readonly string[] | null
  reviewId: string
  reviewerRole: 'TECHNICAL_REVIEWER'
  reviewedAt: string
  decision: FacadeFlowDrawingHumanReviewDecision
  correctionNote: string | null
  learningState: FacadeFlowDrawingLearningState
  humanConfirmed: boolean
  humanCorrected: boolean
  eligibleForCuratedTrainingDataset: boolean
  containsRawPromptText: false
  containsClientIdentity: false
  automaticModelWeightUpdateAllowed: false
  automaticGeometryAllowed: false
  rulesValidated: false
  exactProfileContourApplied: false
  machineReady: false
  productionApproved: false
}

function normalizeSignature(values: readonly string[] | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean)
}

export function facadeFlowConstructionDrawingLearningStateKey(
  drawing: FacadeFlowConstructionDrawing,
  graph: FacadeFlowConstructionGraph,
): string {
  return JSON.stringify({
    intentId: drawing.sourceIntentId,
    drawingStatus: drawing.status,
    graphStatus: graph.status,
    dimensions: drawing.dimensions,
    basis: drawing.basis,
    signature: facadeFlowConstructionDrawingSignature(drawing),
    blockers: drawing.blockers,
    graphBlockers: graph.blockers,
  })
}

export function createFacadeFlowHumanReviewedDrawingLearningRecord(
  drawing: FacadeFlowConstructionDrawing,
  graph: FacadeFlowConstructionGraph,
  review: FacadeFlowDrawingHumanReviewInput,
): FacadeFlowHumanReviewedDrawingLearningRecord {
  const sourceSignature = facadeFlowConstructionDrawingSignature(drawing)
  const correctionNote = review.correctionNote?.trim() || null
  const correctedSignature = normalizeSignature(review.correctedSignature)
  const canReview = drawing.status === 'READY_FOR_HUMAN_REVIEW' && graph.status === 'READY_FOR_HUMAN_REVIEW'

  let acceptedSignature: readonly string[] | null = null
  let learningState: FacadeFlowDrawingLearningState = 'REVIEW_REQUIRED'
  let humanConfirmed = false
  let humanCorrected = false

  if (canReview && review.decision === 'CONFIRM') {
    acceptedSignature = sourceSignature
    learningState = 'ELIGIBLE_HUMAN_CONFIRMED_EXAMPLE'
    humanConfirmed = true
  } else if (canReview && review.decision === 'CORRECT' && correctionNote && correctedSignature.length > 0) {
    acceptedSignature = correctedSignature
    learningState = 'ELIGIBLE_HUMAN_CONFIRMED_EXAMPLE'
    humanConfirmed = true
    humanCorrected = true
  } else if (review.decision === 'REJECT') {
    learningState = 'REJECTED_EXAMPLE'
  }

  return Object.freeze({
    schemaVersion: AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_VERSION,
    sourceIntentId: drawing.sourceIntentId,
    sourceGraphVersion: 'AI05.2',
    sourceDrawingVersion: 'AI05.3',
    sourceDrawingStateKey: facadeFlowConstructionDrawingLearningStateKey(drawing, graph),
    sourceSignature: Object.freeze([...sourceSignature]),
    acceptedSignature: acceptedSignature ? Object.freeze([...acceptedSignature]) : null,
    reviewId: review.reviewId.trim(),
    reviewerRole: review.reviewerRole,
    reviewedAt: review.reviewedAt.trim(),
    decision: review.decision,
    correctionNote,
    learningState,
    humanConfirmed,
    humanCorrected,
    eligibleForCuratedTrainingDataset: learningState === 'ELIGIBLE_HUMAN_CONFIRMED_EXAMPLE',
    containsRawPromptText: false,
    containsClientIdentity: false,
    automaticModelWeightUpdateAllowed: false,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    exactProfileContourApplied: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function invalidateFacadeFlowHumanReviewedDrawingLearningRecord(
  record: FacadeFlowHumanReviewedDrawingLearningRecord,
  drawing: FacadeFlowConstructionDrawing,
  graph: FacadeFlowConstructionGraph,
): FacadeFlowHumanReviewedDrawingLearningRecord {
  const nextKey = facadeFlowConstructionDrawingLearningStateKey(drawing, graph)
  if (nextKey === record.sourceDrawingStateKey) return record
  return Object.freeze({
    ...record,
    sourceDrawingStateKey: nextKey,
    sourceSignature: Object.freeze([...facadeFlowConstructionDrawingSignature(drawing)]),
    acceptedSignature: null,
    learningState: 'STALE_REVIEW_REQUIRED',
    humanConfirmed: false,
    humanCorrected: false,
    eligibleForCuratedTrainingDataset: false,
  })
}

export const AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_SAFETY = Object.freeze({
  humanReviewRequired: true,
  curatedDatasetOnly: true,
  rawPrivatePromptRetentionAllowed: false,
  automaticModelWeightUpdateAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  exactProfileContourApplied: false,
  machineReady: false,
  productionApproved: false,
})
