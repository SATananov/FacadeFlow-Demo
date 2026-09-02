import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'
import { catalogueProfileIsSelectable } from './profileCatalogueState'

export interface NadezhdaProfileEvidence {
  id: string
  project: 'Вадим-2'
  code: string
  sourceGroup: '78'
  maxY: number
  maxZ: number
  xmlPieceCount: number
  lteRecordCount: number
  machiningCount: number
  minLength: number
  maxLength: number
  role: 'UNCONFIRMED'
  xmlLteBarcodeMatch: true
  sourceBacked: true
}

export const NADEZHDA_EVIDENCE_SYSTEM_LABEL = 'НАДЕЖДА · ГРУПА 78 · СИСТЕМА НЕПОТВЪРДЕНА'

export const nadezhdaSourceEvidence = {
  project: 'Вадим-2',
  source: 'Надежда · реален проект',
  generatedBy: 'SkyGlazing',
  unit: 'mm',
  xmlSha256: '1FAFBDE7A13A28936EDC9FE9382DB5F50DA6B22D8168CF5959D95AE053E8DF08',
  lteSha256: '6D753E558A1EA330573F2555F34603CD406EC9C6842A4CAB4EE210D1450A272A',
  xmlPieceCount: 46,
  lteRecordCount: 84,
  matchedXmlBarcodesInLte: 46,
  machiningCount: 220,
  roleInferenceAllowed: false,
  productionApproval: false,
  machineReady: false,
} as const

export const nadezhdaProfileEvidence: NadezhdaProfileEvidence[] = [
  { id: 'nadezhda-vadim2-78-01', project: 'Вадим-2', code: '78.01', sourceGroup: '78', maxY: 70, maxZ: 57, xmlPieceCount: 29, lteRecordCount: 49, machiningCount: 83, minLength: 570, maxLength: 2770, role: 'UNCONFIRMED', xmlLteBarcodeMatch: true, sourceBacked: true },
  { id: 'nadezhda-vadim2-78-27', project: 'Вадим-2', code: '78.27', sourceGroup: '78', maxY: 78, maxZ: 96, xmlPieceCount: 6, lteRecordCount: 24, machiningCount: 15, minLength: 2166, maxLength: 2166, role: 'UNCONFIRMED', xmlLteBarcodeMatch: true, sourceBacked: true },
  { id: 'nadezhda-vadim2-78-33', project: 'Вадим-2', code: '78.33', sourceGroup: '78', maxY: 79, maxZ: 70, xmlPieceCount: 8, lteRecordCount: 8, machiningCount: 122, minLength: 1100, maxLength: 2158, role: 'UNCONFIRMED', xmlLteBarcodeMatch: true, sourceBacked: true },
  { id: 'nadezhda-vadim2-78-51', project: 'Вадим-2', code: '78.51', sourceGroup: '78', maxY: 74, maxZ: 61, xmlPieceCount: 3, lteRecordCount: 3, machiningCount: 0, minLength: 2131, maxLength: 2131, role: 'UNCONFIRMED', xmlLteBarcodeMatch: true, sourceBacked: true },
]

function baseCatalogueProfileFromNadezhdaEvidence(evidence: NadezhdaProfileEvidence, role: ProfileRole, now: string): CatalogueProfile {
  return {
    id: `catalogue-${evidence.id}-${role.toLowerCase()}`,
    role,
    system: NADEZHDA_EVIDENCE_SYSTEM_LABEL,
    code: evidence.code,
    nameBg: `${evidence.code} · роля за човешко потвърждение`,
    dimensionA: evidence.maxY,
    dimensionB: evidence.maxZ,
    description: `Реални данни от източника ${evidence.project}: XML ${evidence.xmlPieceCount} детайла · LTE ${evidence.lteRecordCount} записа · обработки ${evidence.machiningCount}. Ролята остава отделно човешко решение и не е производствено одобрение.`,
    status: 'SOURCE_EVIDENCE',
    createdAt: now,
    updatedAt: now,
    simulationOnly: true,
    requiresHumanApproval: true,
    sourceEvidenceId: evidence.id,
    sourceEvidenceLabel: `Надежда · ${evidence.project} · XML + LTE`,
    sourceEvidenceSha256: `${nadezhdaSourceEvidence.xmlSha256}:${nadezhdaSourceEvidence.lteSha256}`,
  }
}

export function createPendingCatalogueProfileReviewFromNadezhdaEvidence(evidence: NadezhdaProfileEvidence, role: ProfileRole, now: string): CatalogueProfile {
  return { ...baseCatalogueProfileFromNadezhdaEvidence(evidence, role, now), humanRoleReviewStatus: 'PENDING' }
}

export function confirmCatalogueProfileHumanRole(profile: CatalogueProfile, confirmedBy: string, note: string, now: string): CatalogueProfile {
  return {
    ...profile,
    humanRoleReviewStatus: 'HUMAN_CONFIRMED',
    humanRoleConfirmedBy: confirmedBy.trim(),
    humanRoleConfirmedAt: now,
    humanRoleConfirmationNote: note.trim() || undefined,
    updatedAt: now,
    description: `${profile.description ?? ''} Роля, потвърдена от човек: ${profile.role}. Експертната проверка, правилата и производствената готовност остават отделно непотвърдени.`.trim(),
  }
}

// Backward-compatible 06C.2 helper: passing an explicit role is itself an explicit human role assignment.
// The catalogue UI in 06C.2.1 uses the pending-review helper above and requires a named reviewer before save.
export function createCatalogueProfileFromNadezhdaEvidence(evidence: NadezhdaProfileEvidence, role: ProfileRole, now: string): CatalogueProfile {
  return confirmCatalogueProfileHumanRole(baseCatalogueProfileFromNadezhdaEvidence(evidence, role, now), 'EXPLICIT_ROLE_ASSIGNMENT', '', now)
}
export interface GuidedNadezhdaEvidencePreviewRow {
  evidenceId: string
  code: string
  section: string
  xmlPieceCount: number
  lteRecordCount: number
  state: 'LOCKED' | 'AVAILABLE'
  profileId?: string
  role?: ProfileRole
  system?: string
  humanConfirmedBy?: string
}

export function guidedNadezhdaEvidencePreview(profiles: CatalogueProfile[]): GuidedNadezhdaEvidencePreviewRow[] {
  return nadezhdaProfileEvidence.map((evidence) => {
    const profile = profiles.find((item) => item.sourceEvidenceId === evidence.id && item.status !== 'ARCHIVED')
    const available = Boolean(profile && catalogueProfileIsSelectable(profile))
    return {
      evidenceId: evidence.id,
      code: evidence.code,
      section: `${evidence.maxY} × ${evidence.maxZ} mm`,
      xmlPieceCount: evidence.xmlPieceCount,
      lteRecordCount: evidence.lteRecordCount,
      state: available ? 'AVAILABLE' : 'LOCKED',
      ...(available && profile ? {
        profileId: profile.id,
        role: profile.role,
        system: profile.system,
        humanConfirmedBy: profile.humanRoleConfirmedBy,
      } : {}),
    }
  })
}
