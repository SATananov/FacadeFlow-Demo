import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing, facadeFlowConstructionDrawingSignature } from '../src/aiConstructionDrawing'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import {
  AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_SAFETY,
  AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_VERSION,
  createFacadeFlowHumanReviewedDrawingLearningRecord,
  invalidateFacadeFlowHumanReviewedDrawingLearningRecord,
} from '../src/aiTraining/humanReviewedDrawingLearning'

function drawingFromPrompt(prompt: string, id: string) {
  const interpreted = interpretFacadeFlowPrompt(prompt, id)
  const graph = buildFacadeFlowConstructionGraph(interpreted.intent)
  const drawing = buildFacadeFlowConstructionDrawing(interpreted.intent, graph)
  return { graph, drawing }
}

test('AI05.3.3 captures a human-confirmed drawing as curated training data without auto-learning', () => {
  const { graph, drawing } = drawingFromPrompt(
    'Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, каса 482.30, крило 482.05, делител 482.21.',
    'ai05-3-3-confirm',
  )
  const record = createFacadeFlowHumanReviewedDrawingLearningRecord(drawing, graph, {
    reviewId: 'review-001',
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-06T10:00:00Z',
    decision: 'CONFIRM',
  })

  assert.equal(record.schemaVersion, AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_VERSION)
  assert.equal(record.learningState, 'ELIGIBLE_HUMAN_CONFIRMED_EXAMPLE')
  assert.equal(record.humanConfirmed, true)
  assert.equal(record.humanCorrected, false)
  assert.equal(record.eligibleForCuratedTrainingDataset, true)
  assert.deepEqual(record.acceptedSignature, facadeFlowConstructionDrawingSignature(drawing))
  assert.equal(record.containsRawPromptText, false)
  assert.equal(record.containsClientIdentity, false)
  assert.equal(record.automaticModelWeightUpdateAllowed, false)
  assert.equal(record.machineReady, false)
  assert.equal(record.productionApproved, false)
})

test('AI05.3.3 corrected review requires both correction note and corrected signature', () => {
  const { graph, drawing } = drawingFromPrompt('Прозорец 1200 x 1400 mm, две полета, лявото фиксирано, дясното отваряемо.', 'ai05-3-3-correct')
  const incomplete = createFacadeFlowHumanReviewedDrawingLearningRecord(drawing, graph, {
    reviewId: 'review-002', reviewerRole: 'TECHNICAL_REVIEWER', reviewedAt: '2026-09-06T10:01:00Z', decision: 'CORRECT', correctionNote: 'Коригирай посоката.',
  })
  assert.equal(incomplete.learningState, 'REVIEW_REQUIRED')
  assert.equal(incomplete.eligibleForCuratedTrainingDataset, false)

  const corrected = createFacadeFlowHumanReviewedDrawingLearningRecord(drawing, graph, {
    reviewId: 'review-003', reviewerRole: 'TECHNICAL_REVIEWER', reviewedAt: '2026-09-06T10:02:00Z', decision: 'CORRECT', correctionNote: 'Дясното поле трябва да е двуосно дясно.', correctedSignature: ['FRAME', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH:TILT_TURN:RIGHT'],
  })
  assert.equal(corrected.learningState, 'ELIGIBLE_HUMAN_CONFIRMED_EXAMPLE')
  assert.equal(corrected.humanCorrected, true)
  assert.equal(corrected.eligibleForCuratedTrainingDataset, true)
})

test('AI05.3.3 never promotes a blocked drawing through CONFIRM', () => {
  const { graph, drawing } = drawingFromPrompt('Прозорец, три полета, средното отваряемо, крайните фиксирани.', 'ai05-3-3-blocked')
  assert.equal(drawing.status, 'BLOCKED')
  const record = createFacadeFlowHumanReviewedDrawingLearningRecord(drawing, graph, {
    reviewId: 'review-004', reviewerRole: 'TECHNICAL_REVIEWER', reviewedAt: '2026-09-06T10:03:00Z', decision: 'CONFIRM',
  })
  assert.equal(record.learningState, 'REVIEW_REQUIRED')
  assert.equal(record.humanConfirmed, false)
  assert.equal(record.eligibleForCuratedTrainingDataset, false)
})

test('AI05.3.3 invalidates a confirmed learning record when drawing state changes', () => {
  const first = drawingFromPrompt('Прозорец 1200 x 1400 mm, две полета, лявото фиксирано, дясното отваряемо.', 'ai05-3-3-state')
  const confirmed = createFacadeFlowHumanReviewedDrawingLearningRecord(first.drawing, first.graph, {
    reviewId: 'review-005', reviewerRole: 'TECHNICAL_REVIEWER', reviewedAt: '2026-09-06T10:04:00Z', decision: 'CONFIRM',
  })
  const changed = drawingFromPrompt('Прозорец 1200 x 1400 mm, три полета, крайните фиксирани, средното отваряемо.', 'ai05-3-3-state')
  const invalidated = invalidateFacadeFlowHumanReviewedDrawingLearningRecord(confirmed, changed.drawing, changed.graph)
  assert.equal(invalidated.learningState, 'STALE_REVIEW_REQUIRED')
  assert.equal(invalidated.humanConfirmed, false)
  assert.equal(invalidated.acceptedSignature, null)
  assert.equal(invalidated.eligibleForCuratedTrainingDataset, false)
})

test('AI05.3.3 global learning safety remains locked', () => {
  assert.equal(AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_SAFETY.humanReviewRequired, true)
  assert.equal(AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_SAFETY.rawPrivatePromptRetentionAllowed, false)
  assert.equal(AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_SAFETY.automaticModelWeightUpdateAllowed, false)
  assert.equal(AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_SAFETY.machineReady, false)
  assert.equal(AI05_3_HUMAN_REVIEWED_DRAWING_LEARNING_SAFETY.productionApproved, false)
})
