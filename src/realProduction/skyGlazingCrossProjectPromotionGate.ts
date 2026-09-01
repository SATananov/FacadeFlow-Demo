import type {
  ProductionPatternCandidate,
  ProductionPatternCandidateSet,
} from './skyGlazingProductionPatternCandidates'
import {
  assessProductionPatternCandidateReviewEntry,
  type ProductionPatternCandidateReviewLedgerEntry,
} from './skyGlazingProductionPatternReviewLedger'
import type {
  ProductionPatternCrossProjectCorroboration,
  ProductionPatternCrossProjectCorroborationSet,
} from './skyGlazingCrossProjectCorroboration'

export const CROSS_PROJECT_HUMAN_PROMOTION_GATE =
  'CROSS_PROJECT_HUMAN_PROMOTION_GATE' as const

export type CrossProjectPromotionGateState =
  | 'BLOCKED'
  | 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW'

export type CrossProjectPromotionGateBlockReason =
  | 'NOT_CROSS_PROJECT_CORROBORATED'
  | 'DISTINCT_PROJECT_COUNT_BELOW_MINIMUM'
  | 'CURRENT_CANDIDATE_MISSING_FOR_PROJECT'
  | 'CURRENT_CONFIRMED_REVIEW_MISSING_FOR_PROJECT'
  | 'CURRENT_REJECTION_PRESENT'

export interface CrossProjectPromotionProjectQualification {
  sourceProject: string
  candidateIds: readonly string[]
  currentCandidateCount: number
  currentConfirmedReviewCount: number
  currentRejectedReviewCount: number
  staleReviewEntryCount: number
  currentConfirmedReviewPresent: boolean
  currentRejectionPresent: boolean
  qualifiedForHumanPromotionReview: boolean
}

export interface CrossProjectPromotionGateAssessment {
  id: string
  gateType: typeof CROSS_PROJECT_HUMAN_PROMOTION_GATE
  corroborationId: string
  profileCode: string
  candidateKind: ProductionPatternCrossProjectCorroboration['kind']
  sourcePatternKey: string
  operationName: string | null
  corroborationState: ProductionPatternCrossProjectCorroboration['state']
  distinctProjectCount: number
  sourceProjects: readonly string[]
  projectQualifications: readonly CrossProjectPromotionProjectQualification[]
  state: CrossProjectPromotionGateState
  reasons: readonly CrossProjectPromotionGateBlockReason[]
  allDistinctProjectsHaveCurrentConfirmedCandidateReview: boolean
  anyCurrentCandidateRejectionPresent: boolean
  humanPromotionReviewCanStart: boolean
  humanPromotionReviewCompleted: false
  ruleDraftCreated: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CrossProjectPromotionGateAssessmentSet {
  gateType: typeof CROSS_PROJECT_HUMAN_PROMOTION_GATE
  assessmentCount: number
  blockedCount: number
  eligibleForHumanPromotionReviewCount: number
  assessments: readonly CrossProjectPromotionGateAssessment[]
  realProjectInferencePerformed: false
  humanPromotionReviewCompleted: false
  ruleDraftCreated: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function candidateKey(sourceProject: string, candidateId: string): string {
  return `${encodeURIComponent(sourceProject)}::${candidateId}`
}

function currentCandidatesByProjectAndId(
  candidateSets: readonly ProductionPatternCandidateSet[],
): Map<string, ProductionPatternCandidate> {
  const candidates = new Map<string, ProductionPatternCandidate>()

  for (const candidateSet of candidateSets) {
    for (const candidate of candidateSet.candidates) {
      candidates.set(candidateKey(candidate.sourceProject, candidate.id), candidate)
    }
  }

  return candidates
}

function qualifyProject(
  sourceProject: string,
  corroboration: ProductionPatternCrossProjectCorroboration,
  currentCandidates: Map<string, ProductionPatternCandidate>,
  reviewEntries: readonly ProductionPatternCandidateReviewLedgerEntry[],
): CrossProjectPromotionProjectQualification {
  const projectEvidence = corroboration.projectEvidence.find(
    (project) => project.sourceProject === sourceProject,
  )
  const candidateIds = projectEvidence
    ? [...new Set(projectEvidence.candidateIds)]
    : []

  const projectCandidates = candidateIds
    .map((candidateId) => currentCandidates.get(candidateKey(sourceProject, candidateId)) ?? null)
    .filter((candidate): candidate is ProductionPatternCandidate => candidate !== null)

  let currentConfirmedReviewCount = 0
  let currentRejectedReviewCount = 0
  let staleReviewEntryCount = 0

  for (const entry of reviewEntries) {
    if (entry.sourceProject !== sourceProject || !candidateIds.includes(entry.candidateId)) {
      continue
    }

    const currentCandidate =
      currentCandidates.get(candidateKey(sourceProject, entry.candidateId)) ?? null
    const assessment = assessProductionPatternCandidateReviewEntry(entry, currentCandidate)

    if (assessment.state === 'STALE_REQUIRES_REVIEW') {
      staleReviewEntryCount += 1
      continue
    }

    if (entry.decision === 'CONFIRMED_AS_CANDIDATE') {
      currentConfirmedReviewCount += 1
    } else {
      currentRejectedReviewCount += 1
    }
  }

  const currentConfirmedReviewPresent = currentConfirmedReviewCount > 0
  const currentRejectionPresent = currentRejectedReviewCount > 0
  const qualifiedForHumanPromotionReview =
    projectCandidates.length > 0
    && currentConfirmedReviewPresent
    && !currentRejectionPresent

  return Object.freeze({
    sourceProject,
    candidateIds: Object.freeze(candidateIds),
    currentCandidateCount: projectCandidates.length,
    currentConfirmedReviewCount,
    currentRejectedReviewCount,
    staleReviewEntryCount,
    currentConfirmedReviewPresent,
    currentRejectionPresent,
    qualifiedForHumanPromotionReview,
  })
}

export function assessCrossProjectHumanPromotionGate(
  corroboration: ProductionPatternCrossProjectCorroboration,
  candidateSets: readonly ProductionPatternCandidateSet[],
  reviewEntries: readonly ProductionPatternCandidateReviewLedgerEntry[],
): CrossProjectPromotionGateAssessment {
  const currentCandidates = currentCandidatesByProjectAndId(candidateSets)
  const projectQualifications = corroboration.sourceProjects
    .map((sourceProject) =>
      qualifyProject(sourceProject, corroboration, currentCandidates, reviewEntries),
    )
    .sort((a, b) => compareText(a.sourceProject, b.sourceProject))

  const reasons: CrossProjectPromotionGateBlockReason[] = []

  if (!corroboration.crossProjectCorroborated) {
    reasons.push('NOT_CROSS_PROJECT_CORROBORATED')
  }

  if (corroboration.distinctProjectCount < corroboration.minimumDistinctProjectsForCorroboration) {
    reasons.push('DISTINCT_PROJECT_COUNT_BELOW_MINIMUM')
  }

  if (projectQualifications.some((project) => project.currentCandidateCount === 0)) {
    reasons.push('CURRENT_CANDIDATE_MISSING_FOR_PROJECT')
  }

  if (projectQualifications.some((project) => !project.currentConfirmedReviewPresent)) {
    reasons.push('CURRENT_CONFIRMED_REVIEW_MISSING_FOR_PROJECT')
  }

  if (projectQualifications.some((project) => project.currentRejectionPresent)) {
    reasons.push('CURRENT_REJECTION_PRESENT')
  }

  const allDistinctProjectsHaveCurrentConfirmedCandidateReview =
    projectQualifications.length === corroboration.distinctProjectCount
    && projectQualifications.length >= corroboration.minimumDistinctProjectsForCorroboration
    && projectQualifications.every((project) => project.currentConfirmedReviewPresent)

  const anyCurrentCandidateRejectionPresent =
    projectQualifications.some((project) => project.currentRejectionPresent)

  const state: CrossProjectPromotionGateState =
    reasons.length === 0
      ? 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW'
      : 'BLOCKED'

  return Object.freeze({
    id: `rp01-6:${corroboration.id}`,
    gateType: CROSS_PROJECT_HUMAN_PROMOTION_GATE,
    corroborationId: corroboration.id,
    profileCode: corroboration.profileCode,
    candidateKind: corroboration.kind,
    sourcePatternKey: corroboration.sourcePatternKey,
    operationName: corroboration.operationName,
    corroborationState: corroboration.state,
    distinctProjectCount: corroboration.distinctProjectCount,
    sourceProjects: Object.freeze([...corroboration.sourceProjects]),
    projectQualifications: Object.freeze(projectQualifications),
    state,
    reasons: Object.freeze(reasons),
    allDistinctProjectsHaveCurrentConfirmedCandidateReview,
    anyCurrentCandidateRejectionPresent,
    humanPromotionReviewCanStart: state === 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW',
    humanPromotionReviewCompleted: false,
    ruleDraftCreated: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function buildCrossProjectHumanPromotionGateAssessmentSet(
  corroborationSet: ProductionPatternCrossProjectCorroborationSet,
  candidateSets: readonly ProductionPatternCandidateSet[],
  reviewEntries: readonly ProductionPatternCandidateReviewLedgerEntry[],
): CrossProjectPromotionGateAssessmentSet {
  const assessments = corroborationSet.patterns.map((corroboration) =>
    assessCrossProjectHumanPromotionGate(corroboration, candidateSets, reviewEntries),
  )

  return Object.freeze({
    gateType: CROSS_PROJECT_HUMAN_PROMOTION_GATE,
    assessmentCount: assessments.length,
    blockedCount: assessments.filter((assessment) => assessment.state === 'BLOCKED').length,
    eligibleForHumanPromotionReviewCount: assessments.filter(
      (assessment) => assessment.state === 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW',
    ).length,
    assessments: Object.freeze(assessments),
    realProjectInferencePerformed: false,
    humanPromotionReviewCompleted: false,
    ruleDraftCreated: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}
