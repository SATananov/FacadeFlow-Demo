export type ProfileRole = 'FRAME' | 'SASH' | 'MULLION'
export type CatalogueProfileStatus = 'DEMONSTRATION' | 'EXPERT_CONFIRMED' | 'ARCHIVED'

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
}

export interface ProfileCatalogueFilters {
  role: ProfileRole | 'ALL'
  system: string
  status: CatalogueProfileStatus | 'ALL'
}

export type ActiveProfileSelection = Partial<Record<ProfileRole, string>>

