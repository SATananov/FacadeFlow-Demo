import type {
  ProductionPatternCandidate,
  ProductionPatternCandidateKind,
  ProductionPatternCandidateSet,
} from './skyGlazingProductionPatternCandidates'

export const CROSS_PROJECT_CORROBORATION_EVIDENCE = 'CROSS_PROJECT_CORROBORATION_EVIDENCE' as const

export type ProductionPatternCrossProjectState =
  | 'SINGLE_PROJECT_ONLY'
  | 'CROSS_PROJECT_CORROBORATED'

export interface ProductionPatternProjectEvidence {
  sourceProject: string
  candidateOccurrenceCount: number
  candidateIds: readonly string[]
  evidenceCountTotal: number
  evidenceCounts: readonly number[]
}

export interface ProductionPatternCrossProjectCorroboration {
  id: string
  evidenceType: typeof CROSS_PROJECT_CORROBORATION_EVIDENCE
  profileCode: string
  kind: ProductionPatternCandidateKind
  sourcePatternKey: string
  operationName: string | null
  distinctProjectCount: number
  sourceProjects: readonly string[]
  projectEvidence: readonly ProductionPatternProjectEvidence[]
  totalEvidenceCountAcrossProjects: number
  state: ProductionPatternCrossProjectState
  singleProjectOnly: boolean
  crossProjectCorroborated: boolean
  exactPatternIdentityRequired: true
  minimumDistinctProjectsForCorroboration: 2
  repeatedWithinOneProjectDoesNotCreateCrossProjectCorroboration: true
  humanReviewStillRequired: true
  automaticRulePromotionAllowed: false
  candidateIsProductionRule: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface ProductionPatternCrossProjectCorroborationSet {
  evidenceType: typeof CROSS_PROJECT_CORROBORATION_EVIDENCE
  inputProjectSetCount: number
  distinctInputProjectCount: number
  sourceProjects: readonly string[]
  patternCount: number
  singleProjectOnlyCount: number
  crossProjectCorroboratedCount: number
  patterns: readonly ProductionPatternCrossProjectCorroboration[]
  realProjectInferencePerformed: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

interface MutableProjectEvidence {
  sourceProject: string
  candidateIds: string[]
  evidenceCounts: number[]
}

interface MutablePatternEvidence {
  profileCode: string
  kind: ProductionPatternCandidateKind
  sourcePatternKey: string
  operationName: string | null
  projects: Map<string, MutableProjectEvidence>
}

function exactPatternIdentity(candidate: ProductionPatternCandidate): string {
  return JSON.stringify({
    profileCode: candidate.profileCode,
    kind: candidate.kind,
    sourcePatternKey: candidate.sourcePatternKey,
    operationName: candidate.operationName,
  })
}

function projectEvidence(
  evidence: MutableProjectEvidence,
): ProductionPatternProjectEvidence {
  return Object.freeze({
    sourceProject: evidence.sourceProject,
    candidateOccurrenceCount: evidence.candidateIds.length,
    candidateIds: Object.freeze([...evidence.candidateIds]),
    evidenceCountTotal: evidence.evidenceCounts.reduce((sum, count) => sum + count, 0),
    evidenceCounts: Object.freeze([...evidence.evidenceCounts]),
  })
}

function corroborationRecord(
  pattern: MutablePatternEvidence,
): ProductionPatternCrossProjectCorroboration {
  const projects = [...pattern.projects.values()]
    .map(projectEvidence)
    .sort((a, b) => a.sourceProject < b.sourceProject ? -1 : a.sourceProject > b.sourceProject ? 1 : 0)

  const distinctProjectCount = projects.length
  const crossProjectCorroborated = distinctProjectCount >= 2

  return Object.freeze({
    id: [
      'rp01-5',
      encodeURIComponent(pattern.profileCode),
      pattern.kind,
      encodeURIComponent(pattern.sourcePatternKey),
      encodeURIComponent(pattern.operationName ?? ''),
    ].join(':'),
    evidenceType: CROSS_PROJECT_CORROBORATION_EVIDENCE,
    profileCode: pattern.profileCode,
    kind: pattern.kind,
    sourcePatternKey: pattern.sourcePatternKey,
    operationName: pattern.operationName,
    distinctProjectCount,
    sourceProjects: Object.freeze(projects.map((project) => project.sourceProject)),
    projectEvidence: Object.freeze(projects),
    totalEvidenceCountAcrossProjects: projects.reduce(
      (sum, project) => sum + project.evidenceCountTotal,
      0,
    ),
    state: crossProjectCorroborated
      ? 'CROSS_PROJECT_CORROBORATED'
      : 'SINGLE_PROJECT_ONLY',
    singleProjectOnly: !crossProjectCorroborated,
    crossProjectCorroborated,
    exactPatternIdentityRequired: true,
    minimumDistinctProjectsForCorroboration: 2,
    repeatedWithinOneProjectDoesNotCreateCrossProjectCorroboration: true,
    humanReviewStillRequired: true,
    automaticRulePromotionAllowed: false,
    candidateIsProductionRule: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function buildProductionPatternCrossProjectCorroboration(
  candidateSets: readonly ProductionPatternCandidateSet[],
): ProductionPatternCrossProjectCorroborationSet {
  const groups = new Map<string, MutablePatternEvidence>()
  const inputProjects = candidateSets.map((set) => set.sourceProject)
  const distinctInputProjects = [...new Set(inputProjects)]
    .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)

  for (const candidateSet of candidateSets) {
    for (const candidate of candidateSet.candidates) {
      const identity = exactPatternIdentity(candidate)
      let pattern = groups.get(identity)

      if (!pattern) {
        pattern = {
          profileCode: candidate.profileCode,
          kind: candidate.kind,
          sourcePatternKey: candidate.sourcePatternKey,
          operationName: candidate.operationName,
          projects: new Map(),
        }
        groups.set(identity, pattern)
      }

      const projectName = candidate.sourceProject
      let project = pattern.projects.get(projectName)

      if (!project) {
        project = {
          sourceProject: projectName,
          candidateIds: [],
          evidenceCounts: [],
        }
        pattern.projects.set(projectName, project)
      }

      project.candidateIds.push(candidate.id)
      project.evidenceCounts.push(candidate.evidenceCount)
    }
  }

  const patterns = [...groups.values()]
    .map(corroborationRecord)
    .sort((a, b) =>
      a.profileCode.localeCompare(b.profileCode, 'en', { numeric: true })
      || a.kind.localeCompare(b.kind)
      || a.sourcePatternKey.localeCompare(b.sourcePatternKey),
    )

  return Object.freeze({
    evidenceType: CROSS_PROJECT_CORROBORATION_EVIDENCE,
    inputProjectSetCount: candidateSets.length,
    distinctInputProjectCount: distinctInputProjects.length,
    sourceProjects: Object.freeze(distinctInputProjects),
    patternCount: patterns.length,
    singleProjectOnlyCount: patterns.filter((pattern) => pattern.singleProjectOnly).length,
    crossProjectCorroboratedCount: patterns.filter(
      (pattern) => pattern.crossProjectCorroborated,
    ).length,
    patterns: Object.freeze(patterns),
    realProjectInferencePerformed: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}
