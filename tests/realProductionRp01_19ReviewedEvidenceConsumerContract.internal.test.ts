import assert from 'node:assert/strict'
import { extname, join } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  extractSkyGlazingLteObservations,
  extractSkyGlazingXmlObservations,
} from '../src/realProduction/skyGlazingObservationExtraction'
import { aggregateSkyGlazingObservationPatterns } from '../src/realProduction/skyGlazingObservationAggregation'
import {
  buildProductionPatternCandidateSet,
} from '../src/realProduction/skyGlazingProductionPatternCandidates'
import { buildProductionPatternCrossProjectCorroboration } from '../src/realProduction/skyGlazingCrossProjectCorroboration'
import {
  buildCrossProjectHumanPromotionGateAssessmentSet,
} from '../src/realProduction/skyGlazingCrossProjectPromotionGate'
import {
  buildReviewedEvidenceReadModel,
} from '../src/realProduction/skyGlazingReviewedEvidenceReadModel'
import {
  assessReviewedEvidenceConsumerAction,
  buildReviewedEvidenceConsumerContract,
  type ReviewedEvidenceConsumerAction,
} from '../src/realProduction/skyGlazingReviewedEvidenceConsumerContract'
import type {
  ReviewedScenarioEvidenceQueryResult,
} from '../src/realProduction/skyGlazingReviewedScenarioEvidenceQuery'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.19 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadim = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)

function availableQuery(): ReviewedScenarioEvidenceQueryResult {
  return Object.freeze({
    queryGateType: 'REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE',
    queryGateVersion: 'RP01.17-EXACT-SCOPE-QUERY-V1',
    status: 'EVIDENCE_REFERENCE_AVAILABLE',
    reasons: Object.freeze([]),
    scenarioIdentityJson:
      '{"input":{"observedPatternMatches":true}}',
    exactScopeMatch: true,
    evidenceReference: Object.freeze({
      boundaryId: 'boundary-1',
      crossScenarioEvidenceGroupId: 'cross-scenario-group-1',
      scenarioConsistencyReviewRecordId:
        'scenario-consistency-review-1',
      scenarioIdentityJson:
        '{"input":{"observedPatternMatches":true}}',
      repeatabilityGroupId: 'repeatability-group-1',
      repeatabilityReviewRecordId: 'repeatability-review-1',
      repeatabilityEvidenceFingerprint:
        'repeatability-evidence-fingerprint-1',
      repeatabilityReviewFingerprint:
        'repeatability-review-fingerprint-1',
      observedResults: Object.freeze([true]),
      expectedResults: Object.freeze([true]),
      evidenceScope: 'EXACT_REVIEWED_SCENARIO_ONLY',
    }),
    reviewedSimulationEvidenceReferenceAvailable: true,
    automaticOutcomeInferenceAllowed: false,
    inferredOutcome: null,
    scenarioGeneralizationAllowed: false,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

function unavailableQuery(): ReviewedScenarioEvidenceQueryResult {
  return Object.freeze({
    queryGateType: 'REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE',
    queryGateVersion: 'RP01.17-EXACT-SCOPE-QUERY-V1',
    status: 'NO_REVIEWED_EVIDENCE',
    reasons: Object.freeze(['SCENARIO_OUTSIDE_REVIEWED_SCOPE']),
    scenarioIdentityJson:
      '{"input":{"observedPatternMatches":"UNSEEN"}}',
    exactScopeMatch: false,
    evidenceReference: null,
    reviewedSimulationEvidenceReferenceAvailable: false,
    automaticOutcomeInferenceAllowed: false,
    inferredOutcome: null,
    scenarioGeneralizationAllowed: false,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

test('RP01.19 current real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.19 activates a read-only UI/AI contract only from an available RP01.18 read model', () => {
  const readModel = buildReviewedEvidenceReadModel(availableQuery())
  const contract = buildReviewedEvidenceConsumerContract(readModel)

  assert.equal(
    contract.state,
    'READ_ONLY_CONSUMER_CONTRACT_ACTIVE',
  )
  assert.deepEqual(contract.reasons, [])
  assert.ok(contract.evidenceProjection)
  assert.equal(contract.ui.mayDisplayReviewedEvidence, true)
  assert.equal(
    contract.ui.mustLabelAsReviewedSimulationEvidence,
    true,
  )
  assert.equal(
    contract.ai.mayReceiveReviewedEvidenceContext,
    true,
  )
  assert.equal(contract.ai.contextPurpose, 'REFERENCE_ONLY')
})

test('RP01.19 unavailable read model creates no evidence-consumer capability', () => {
  const readModel = buildReviewedEvidenceReadModel(unavailableQuery())
  const contract = buildReviewedEvidenceConsumerContract(readModel)

  assert.equal(contract.state, 'NO_REVIEWED_EVIDENCE_CONTRACT')
  assert.equal(contract.evidenceProjection, null)
  assert.equal(contract.ui.mayDisplayReviewedEvidence, false)
  assert.equal(
    contract.ai.mayReceiveReviewedEvidenceContext,
    false,
  )
  assert.equal(contract.ai.contextPurpose, 'NO_EVIDENCE')
  assert.ok(contract.reasons.includes('READ_MODEL_UNAVAILABLE'))
  assert.ok(
    contract.reasons.includes('READ_MODEL_PROJECTION_MISSING'),
  )
})

test('RP01.19 permits only read-only evidence display and AI-context reference actions', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const display = assessReviewedEvidenceConsumerAction(
    contract,
    'DISPLAY_REVIEWED_EVIDENCE',
  )
  const aiContext = assessReviewedEvidenceConsumerAction(
    contract,
    'EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT',
  )

  assert.equal(display.decision, 'ALLOWED_READ_ONLY')
  assert.equal(display.reason, 'READ_ONLY_EVIDENCE_ACTION')
  assert.equal(aiContext.decision, 'ALLOWED_READ_ONLY')
  assert.equal(aiContext.reason, 'READ_ONLY_EVIDENCE_ACTION')
})

test('RP01.19 blocks prediction, generalization, engineering, production, and machine actions', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const forbidden: readonly ReviewedEvidenceConsumerAction[] = [
    'TREAT_EVIDENCE_AS_PREDICTION',
    'INFER_UNREVIEWED_SCENARIO_OUTCOME',
    'GENERALIZE_ACROSS_SCENARIOS',
    'CLAIM_ENGINEERING_VALIDATION',
    'CLAIM_PRODUCTION_READINESS',
    'GENERATE_MACHINE_INSTRUCTION',
  ]

  for (const action of forbidden) {
    const assessment = assessReviewedEvidenceConsumerAction(
      contract,
      action,
    )
    assert.equal(assessment.decision, 'BLOCKED')
  }
})

test('RP01.19 unavailable contract blocks even read-only display/context actions', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(unavailableQuery()),
  )

  for (const action of [
    'DISPLAY_REVIEWED_EVIDENCE',
    'EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT',
  ] as const) {
    const assessment = assessReviewedEvidenceConsumerAction(
      contract,
      action,
    )
    assert.equal(assessment.decision, 'BLOCKED')
    assert.equal(
      assessment.reason,
      'NO_REVIEWED_EVIDENCE_AVAILABLE',
    )
  }
})

test('RP01.19 contract never converts evidence into prediction, engineering authority, or production authority', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  assert.equal(contract.ui.mayPresentAsPrediction, false)
  assert.equal(contract.ui.mayPresentAsEngineeringApproval, false)
  assert.equal(contract.ui.mayPresentAsProductionApproval, false)
  assert.equal(
    contract.ui.mayTriggerMachineInstructionGeneration,
    false,
  )

  assert.equal(contract.ai.mayTreatEvidenceAsPrediction, false)
  assert.equal(
    contract.ai.mayInferUnreviewedScenarioOutcome,
    false,
  )
  assert.equal(contract.ai.mayGeneralizeAcrossScenarios, false)
  assert.equal(contract.ai.mayClaimEngineeringValidation, false)
  assert.equal(contract.ai.mayClaimProductionReadiness, false)
  assert.equal(contract.ai.mayGenerateMachineInstruction, false)

  assert.equal(contract.automaticOutcomeInferenceAllowed, false)
  assert.equal(contract.inferredOutcome, null)
  assert.equal(contract.scenarioGeneralizationAllowed, false)
  assert.equal(
    contract.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
  assert.equal(contract.engineeringRuleValidated, false)
  assert.equal(contract.engineeringAuthorityGranted, false)
  assert.equal(contract.automaticRulePromotionAllowed, false)
  assert.equal(contract.productionExecutable, false)
  assert.equal(contract.machineInstructionGenerated, false)
  assert.equal(contract.productionRuleCreated, false)
  assert.equal(contract.productionUnlockAllowed, false)
  assert.equal(contract.machineReady, false)
  assert.equal(contract.productionApproved, false)
  assert.equal(contract.productionAuthorityGranted, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingReviewedEvidenceConsumerContract.ts',
    'utf8',
  )
  assert.doesNotMatch(
    source,
    /mayPresentAsPrediction:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayPresentAsEngineeringApproval:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayPresentAsProductionApproval:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayTreatEvidenceAsPrediction:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayInferUnreviewedScenarioOutcome:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayGeneralizeAcrossScenarios:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayClaimEngineeringValidation:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayClaimProductionReadiness:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /mayGenerateMachineInstruction:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /automaticOutcomeInferenceAllowed:\s*true/,
  )
  assert.doesNotMatch(source, /inferredOutcome:\s*(true|false)/)
  assert.doesNotMatch(
    source,
    /scenarioGeneralizationAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /inferenceBeyondReviewedScenariosAllowed:\s*true/,
  )
  assert.doesNotMatch(source, /engineeringRuleValidated:\s*true/)
  assert.doesNotMatch(
    source,
    /engineeringAuthorityGranted:\s*true/,
  )
  assert.doesNotMatch(source, /automaticRulePromotionAllowed:\s*true/)
  assert.doesNotMatch(source, /productionExecutable:\s*true/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
  assert.doesNotMatch(
    source,
    /productionAuthorityGranted:\s*true/,
  )
})
