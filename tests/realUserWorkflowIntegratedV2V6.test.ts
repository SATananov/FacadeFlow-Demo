import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import type { FacadeFlowRealUserWorkflowV1State } from '../src/aiWorkspaceTypes'
import {
  applyFacadeFlowRealUserConversationalEdit,
  buildFacadeFlowRealUserIntegratedSnapshot,
  markFacadeFlowExplicitConstructorHandoff,
  REAL_USER_WORKFLOW_V2_V6_SAFETY,
  reviewFacadeFlowRealUserConceptualDrawing,
  startFacadeFlowRealUserWorkflowV2V6,
} from '../src/aiRealUserWorkflowIntegratedV2V6'

function fixtureWorkflow(): FacadeFlowRealUserWorkflowV1State {
  const sourceText = 'Трикрилен прозорец 1800 × 1400 mm, PRELUDE 60, крайните фиксирани, средното двуосно наляво, каса 482.30, крило 482.05, делител 482.21.'
  const intent = createFacadeFlowProductIntent({ id: 'fixture-intent', sourceKind: 'PROMPT', sourceText })
  intent.category = 'WINDOW'
  intent.dimensions = { widthMm: 1800, heightMm: 1400 }
  intent.profiles = { system: 'PRELUDE 60', frame: '482.30', sash: '482.05', mullion: '482.21' }
  intent.fields = [
    { id: 'f1', order: 0, role: 'FIXED', openingType: 'FIXED', evidenceIds: [], unresolved: [] },
    { id: 'f2', order: 1, role: 'OPENING_SASH', openingType: 'TILT_TURN', openingDirection: 'LEFT', evidenceIds: [], unresolved: [] },
    { id: 'f3', order: 2, role: 'FIXED', openingType: 'FIXED', evidenceIds: [], unresolved: [] },
  ]
  intent.glazing = { description: 'двоен стъклопакет' }
  intent.hardwareDefaults = { handle: 'черна дръжка' }
  intent.status = 'NEEDS_REVIEW'
  const currentInterpretation = {
    schemaVersion: 'AI01.2' as const,
    mode: 'LOCAL_DETERMINISTIC' as const,
    sourceText,
    intent,
    recognized: [],
    unresolved: [],
    warnings: [],
    validForHumanReview: true,
    humanReviewRequired: true as const,
    rulesValidated: false as const,
    automaticGeometryAllowed: false as const,
    simulationOnly: true as const,
    machineReady: false as const,
    productionApproved: false as const,
  }
  return {
    version: 'REAL_USER_WORKFLOW_V1',
    sourceText,
    augmentedSourceText: sourceText,
    intentId: intent.id,
    currentInterpretation,
    status: 'READY_FOR_HUMAN_REVIEW',
    questions: [],
    answers: [],
    declaredUnknownTargets: [],
    knowledgeFacts: [],
    knowledgeGaps: [],
    requiredQuestionCount: 0,
    optionalQuestionCount: 0,
    humanClarificationRequired: false,
    humanReviewRequired: true,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

test('V2 starts with a conceptual proposal that requires human review', () => {
  const state = startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow())
  const snapshot = buildFacadeFlowRealUserIntegratedSnapshot(state, [])
  assert.equal(state.drawingReviewStatus, 'NEEDS_REVIEW')
  assert.equal(snapshot.v2.conceptualDrawingAvailable, true)
  assert.equal(snapshot.v2.humanReviewed, false)
  assert.equal(snapshot.v2.assumptionCount, 1)
  assert.equal(snapshot.v4.status, 'BLOCKED')
})

test('V2 explicit human review unlocks only the editable constructor preparation', () => {
  const initial = startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow())
  const reviewed = reviewFacadeFlowRealUserConceptualDrawing(initial, { topologyChecked: true, assumptionsAccepted: true, reviewedAt: '2026-09-07T12:00:00.000Z' })
  const snapshot = buildFacadeFlowRealUserIntegratedSnapshot(reviewed, [])
  assert.equal(reviewed.drawingReviewStatus, 'HUMAN_REVIEWED')
  assert.equal(snapshot.v4.status, 'READY_FOR_EXPLICIT_CONSTRUCTOR_HANDOFF')
  assert.equal(snapshot.handoff.rulesValidated, false)
  assert.equal(snapshot.handoff.machineReady, false)
})

test('V3 conversational edit changes middle opening direction and invalidates drawing review', () => {
  const initial = reviewFacadeFlowRealUserConceptualDrawing(startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow()), { topologyChecked: true, assumptionsAccepted: true })
  const edited = applyFacadeFlowRealUserConversationalEdit(initial, 'средното да е надясно', { now: '2026-09-07T12:01:00.000Z' })
  assert.equal(edited.workingIntent.fields[1]?.openingDirection, 'RIGHT')
  assert.equal(edited.drawingReviewStatus, 'NEEDS_REVIEW')
  assert.equal(edited.editHistory.at(-1)?.status, 'APPLIED_CANDIDATE')
  assert.equal(edited.rulesValidated, false)
})

test('V3 supports explicit dimension and glazing candidate edits without production promotion', () => {
  const state = startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow())
  const dimensionEdit = applyFacadeFlowRealUserConversationalEdit(state, 'размерът да е 2000 × 1500 mm')
  const glazingEdit = applyFacadeFlowRealUserConversationalEdit(dimensionEdit, 'стъклопакетът да е троен стъклопакет')
  assert.deepEqual(glazingEdit.workingIntent.dimensions, { widthMm: 2000, heightMm: 1500 })
  assert.equal(glazingEdit.workingIntent.glazing.description, 'троен стъклопакет')
  assert.equal(glazingEdit.machineReady, false)
  assert.equal(glazingEdit.productionApproved, false)
})

test('V3 unsupported command fails closed and does not mutate the candidate intent', () => {
  const state = startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow())
  const next = applyFacadeFlowRealUserConversationalEdit(state, 'направи го както е най-добре')
  assert.equal(next.editHistory.at(-1)?.status, 'NEEDS_CLARIFICATION')
  assert.deepEqual(next.workingIntent.dimensions, state.workingIntent.dimensions)
  assert.equal(next.workingIntent.fields[1]?.openingDirection, 'LEFT')
})

test('V4 exposes PRELUDE 60 reviewed working semantics but never exact contour authority', () => {
  const reviewed = reviewFacadeFlowRealUserConceptualDrawing(startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow()), { topologyChecked: true, assumptionsAccepted: true })
  const snapshot = buildFacadeFlowRealUserIntegratedSnapshot(reviewed, [])
  const frame = snapshot.v4.profileRoles.find((row) => row.role === 'FRAME')
  const sash = snapshot.v4.profileRoles.find((row) => row.role === 'SASH')
  const mullion = snapshot.v4.profileRoles.find((row) => row.role === 'MULLION')
  assert.equal(frame?.workingSemantic, '64 mm работен размер · 42 mm видима ширина')
  assert.equal(sash?.workingSemantic, '78 mm работен размер · 56 mm видима ширина')
  assert.equal(mullion?.workingSemantic, '84 mm работен размер · 40 mm видима ширина')
  assert.match(frame?.safetyNote ?? '', /exact contour/i)
})

test('V5 is integrated but production validation stays locked without validated rules', () => {
  const reviewed = reviewFacadeFlowRealUserConceptualDrawing(startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow()), { topologyChecked: true, assumptionsAccepted: true })
  const snapshot = buildFacadeFlowRealUserIntegratedSnapshot(reviewed, [])
  assert.equal(snapshot.v5.status, 'LOCKED')
  assert.equal(snapshot.v5.rulesValidated, false)
  assert.equal(snapshot.v5.productionCompatibilityValidated, false)
  assert.equal(snapshot.v5.productionUnlockAllowed, false)
  assert.ok(snapshot.v5.blockers.some((item) => item.includes('Production deductions')))
})

test('V6 is integrated but has no export or machine connectivity', () => {
  const state = startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow())
  const snapshot = buildFacadeFlowRealUserIntegratedSnapshot(state, [])
  assert.equal(snapshot.v6.status, 'LOCKED')
  assert.deepEqual(snapshot.v6.futureTargets, ['DWG', 'DXF', 'MACHINE_JOB'])
  assert.equal(snapshot.v6.automaticExportAllowed, false)
  assert.equal(snapshot.v6.machineConnectivityAllowed, false)
  assert.equal(snapshot.v6.machineReady, false)
})

test('explicit constructor handoff is counted only after drawing human review', () => {
  const initial = startFacadeFlowRealUserWorkflowV2V6(fixtureWorkflow())
  assert.equal(markFacadeFlowExplicitConstructorHandoff(initial).explicitConstructorHandoffCount, 0)
  const reviewed = reviewFacadeFlowRealUserConceptualDrawing(initial, { topologyChecked: true, assumptionsAccepted: true })
  assert.equal(markFacadeFlowExplicitConstructorHandoff(reviewed).explicitConstructorHandoffCount, 1)
})

test('V2-V6 safety constants fail closed across profiles, geometry, production and machine handoff', () => {
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.exactProfileContourApplied, false)
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.productionDeductionsApplied, false)
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.manufacturingToleranceApplied, false)
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.rulesValidated, false)
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.productionUnlockAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.automaticManufacturingExportAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V2_V6_SAFETY.machineReady, false)
})

test('integrated V2-V6 panel is wired into the real prompt workflow and milestones reset with source changes', () => {
  const promptPanel = readFileSync(resolve(process.cwd(), 'src/components/PromptInterpretationPanel.tsx'), 'utf8')
  const stateSource = readFileSync(resolve(process.cwd(), 'src/aiWorkspaceState.ts'), 'utf8')
  const uiSource = readFileSync(resolve(process.cwd(), 'src/components/RealUserWorkflowV2ToV6Panel.tsx'), 'utf8')
  assert.match(promptPanel, /RealUserWorkflowV2ToV6Panel/)
  assert.match(promptPanel, /setFacadeFlowRealUserMilestonesV2V6/)
  assert.match(stateSource, /realUserMilestones: null/)
  assert.match(stateSource, /clearPromptDerivedState[\s\S]*realUserMilestones: null/)
  assert.match(uiSource, /V5 · PRODUCTION VALIDATION/)
  assert.match(uiSource, /V6 · MANUFACTURING HANDOFF/)
})
