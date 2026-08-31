export type ProfileRole = 'FRAME' | 'SASH' | 'MULLION'
export type CatalogueProfileStatus = 'DEMONSTRATION' | 'SOURCE_EVIDENCE' | 'EXPERT_CONFIRMED' | 'ARCHIVED'
export type CatalogueHumanRoleReviewStatus = 'PENDING' | 'HUMAN_CONFIRMED'

export interface CatalogueProfile {
  id: string
  role: ProfileRole
  system: string
  code: string
  nameBg: string
  dimensionA: number
  dimensionB: number
  description?: string
  status: CatalogueProfileStatus
  createdAt: string
  updatedAt: string
  simulationOnly: true
  requiresHumanApproval: true
  sourceEvidenceId?: string
  sourceEvidenceLabel?: string
  sourceEvidenceSha256?: string
  humanRoleReviewStatus?: CatalogueHumanRoleReviewStatus
  humanRoleConfirmedBy?: string
  humanRoleConfirmedAt?: string
  humanRoleConfirmationNote?: string
}

export interface ProfileCatalogueFilters {
  role: ProfileRole | 'ALL'
  system: string
  status: CatalogueProfileStatus | 'ALL'
}

export type ActiveProfileSelection = Partial<Record<ProfileRole, string>>

