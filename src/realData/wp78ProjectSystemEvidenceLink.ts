import {
  nadezhdaProfileEvidence,
  nadezhdaSourceEvidence,
  type NadezhdaProfileEvidence,
} from '../nadezhdaCatalogueEvidence'
import {
  WP78_SYSTEM_LABEL,
  wp78RealSourceData,
  type Wp78SourceProfileRecord,
} from './wp78'

export type Wp78ProjectSystemLinkState =
  | 'ROLE_AND_PROJECT_CODE_MATCH'
  | 'SOURCE_ONLY_NO_PROJECT_CODE_MATCH'
  | 'PROJECT_ONLY_ROLE_UNCONFIRMED'

export type Wp78ProjectSystemCandidateStatus = 'CANDIDATE_REQUIRES_HUMAN_CONFIRMATION'

export interface Wp78RoleProjectEvidenceLink {
  state: 'ROLE_AND_PROJECT_CODE_MATCH' | 'SOURCE_ONLY_NO_PROJECT_CODE_MATCH'
  sourceCodeLiteral: string
  projectCodeLiteral: string | null
  sourceRoleLabel: Wp78SourceProfileRecord['sourceRoleLabel']
  catalogueRole: Wp78SourceProfileRecord['catalogueRole']
  sourceBacked: true
  projectObserved: boolean
  projectEvidenceId: string | null
  projectXmlMaxY: number | null
  projectXmlMaxZ: number | null
  projectXmlPieceCount: number | null
  projectLteRecordCount: number | null
  projectMachiningCount: number | null
}

export interface Wp78ProjectOnlyEvidenceLink {
  state: 'PROJECT_ONLY_ROLE_UNCONFIRMED'
  sourceCodeLiteral: null
  projectCodeLiteral: string
  sourceRoleLabel: null
  catalogueRole: null
  sourceBacked: false
  projectObserved: true
  projectEvidenceId: string
  projectXmlMaxY: number
  projectXmlMaxZ: number
  projectXmlPieceCount: number
  projectLteRecordCount: number
  projectMachiningCount: number
  roleStatus: 'UNCONFIRMED'
}

/**
 * Evidence-link normalization only.
 * It makes the punctuation convention comparable (78,01 <-> 78.01)
 * while preserving both original literals on every link row.
 */
export function normalizeWp78EvidenceCode(code: string): string {
  return code.trim().replace(',', '.')
}

function projectEvidenceForSourceProfile(
  sourceProfile: Wp78SourceProfileRecord,
): NadezhdaProfileEvidence | undefined {
  const normalizedSourceCode = normalizeWp78EvidenceCode(sourceProfile.code)
  return nadezhdaProfileEvidence.find(
    (evidence) => normalizeWp78EvidenceCode(evidence.code) === normalizedSourceCode,
  )
}

export const wp78RoleProjectEvidenceLinks: readonly Wp78RoleProjectEvidenceLink[] = Object.freeze(
  wp78RealSourceData.profiles.map((sourceProfile) => {
    const projectEvidence = projectEvidenceForSourceProfile(sourceProfile)
    return Object.freeze({
      state: projectEvidence
        ? ('ROLE_AND_PROJECT_CODE_MATCH' as const)
        : ('SOURCE_ONLY_NO_PROJECT_CODE_MATCH' as const),
      sourceCodeLiteral: sourceProfile.code,
      projectCodeLiteral: projectEvidence?.code ?? null,
      sourceRoleLabel: sourceProfile.sourceRoleLabel,
      catalogueRole: sourceProfile.catalogueRole,
      sourceBacked: true as const,
      projectObserved: Boolean(projectEvidence),
      projectEvidenceId: projectEvidence?.id ?? null,
      projectXmlMaxY: projectEvidence?.maxY ?? null,
      projectXmlMaxZ: projectEvidence?.maxZ ?? null,
      projectXmlPieceCount: projectEvidence?.xmlPieceCount ?? null,
      projectLteRecordCount: projectEvidence?.lteRecordCount ?? null,
      projectMachiningCount: projectEvidence?.machiningCount ?? null,
    })
  }),
)

export const wp78ProjectOnlyEvidenceLinks: readonly Wp78ProjectOnlyEvidenceLink[] = Object.freeze(
  nadezhdaProfileEvidence
    .filter((projectEvidence) => !wp78RealSourceData.profiles.some(
      (sourceProfile) => normalizeWp78EvidenceCode(sourceProfile.code) === normalizeWp78EvidenceCode(projectEvidence.code),
    ))
    .map((projectEvidence) => Object.freeze({
      state: 'PROJECT_ONLY_ROLE_UNCONFIRMED' as const,
      sourceCodeLiteral: null,
      projectCodeLiteral: projectEvidence.code,
      sourceRoleLabel: null,
      catalogueRole: null,
      sourceBacked: false as const,
      projectObserved: true as const,
      projectEvidenceId: projectEvidence.id,
      projectXmlMaxY: projectEvidence.maxY,
      projectXmlMaxZ: projectEvidence.maxZ,
      projectXmlPieceCount: projectEvidence.xmlPieceCount,
      projectLteRecordCount: projectEvidence.lteRecordCount,
      projectMachiningCount: projectEvidence.machiningCount,
      roleStatus: 'UNCONFIRMED' as const,
    })),
)

const matchedRoleProjectLinks = wp78RoleProjectEvidenceLinks.filter(
  (link) => link.state === 'ROLE_AND_PROJECT_CODE_MATCH',
)
const sourceOnlyLinks = wp78RoleProjectEvidenceLinks.filter(
  (link) => link.state === 'SOURCE_ONLY_NO_PROJECT_CODE_MATCH',
)

export const wp78ProjectSystemEvidenceLink = Object.freeze({
  project: nadezhdaSourceEvidence.project,
  generatedBy: nadezhdaSourceEvidence.generatedBy,
  projectSourceGroup: '78' as const,
  candidateSystem: WP78_SYSTEM_LABEL,
  candidateStatus: 'CANDIDATE_REQUIRES_HUMAN_CONFIRMATION' as Wp78ProjectSystemCandidateStatus,
  sourceDocumentFileName: wp78RealSourceData.source.fileName,
  sourceDocumentSha256: wp78RealSourceData.source.sha256,
  projectXmlSha256: nadezhdaSourceEvidence.xmlSha256,
  projectLteSha256: nadezhdaSourceEvidence.lteSha256,
  roleProjectLinks: wp78RoleProjectEvidenceLinks,
  projectOnlyLinks: wp78ProjectOnlyEvidenceLinks,
  matchedRoleProjectCodeCount: matchedRoleProjectLinks.length,
  sourceOnlyCodeCount: sourceOnlyLinks.length,
  projectOnlyCodeCount: wp78ProjectOnlyEvidenceLinks.length,
  autoSystemConfirmationAllowed: false as const,
  autoRoleInferenceAllowed: false as const,
  xmlMaxYMaxZMeaningConfirmedAsCatalogueDimensions: false as const,
  catalogueSelectable: false as const,
  rulesValidated: false as const,
  machineReady: false as const,
  productionApproved: false as const,
})
