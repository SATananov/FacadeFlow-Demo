import type { ProfileRole } from '../profileCatalogueTypes'
import { WP78_SYSTEM_LABEL, wp78RealSourceData, type Wp78SourceProfileRecord } from './wp78'

export type Wp78ProductCategory = 'WINDOW' | 'DOOR'
export type Wp78CatalogueBlocker = 'PROFILE_DIMENSIONS_UNKNOWN' | 'RULES_NOT_VALIDATED' | 'CATALOGUE_PROMOTION_PENDING'

export interface Wp78RoleApplicability {
  sourceRoleLabel: Wp78SourceProfileRecord['sourceRoleLabel']
  catalogueRole: ProfileRole
  code: string
  productCategory: 'WINDOW'
  dimensionsKnown: false
  selectableCatalogueProfile: false
}

export const wp78RoleApplicability: readonly Wp78RoleApplicability[] = Object.freeze(
  wp78RealSourceData.profiles.map((profile) => Object.freeze({
    sourceRoleLabel: profile.sourceRoleLabel,
    catalogueRole: profile.catalogueRole,
    code: profile.code,
    productCategory: 'WINDOW' as const,
    dimensionsKnown: false as const,
    selectableCatalogueProfile: false as const,
  })),
)

export const wp78CatalogueBlockers: readonly Wp78CatalogueBlocker[] = Object.freeze([
  'PROFILE_DIMENSIONS_UNKNOWN',
  'RULES_NOT_VALIDATED',
  'CATALOGUE_PROMOTION_PENDING',
])

export function wp78ProfilesForRole(role: ProfileRole): readonly Wp78SourceProfileRecord[] {
  return wp78RealSourceData.profiles.filter((profile) => profile.catalogueRole === role)
}

export function wp78IsProductCategorySourceSupported(category: Wp78ProductCategory): boolean {
  return category === 'WINDOW'
}

export function wp78CanEnterSelectableCatalogue(): false {
  return false
}

export const wp78ApplicabilitySummary = Object.freeze({
  system: WP78_SYSTEM_LABEL,
  sourceProfileCount: wp78RoleApplicability.length,
  supportedProductCategories: Object.freeze(['WINDOW'] as const),
  unsupportedProductCategories: Object.freeze(['DOOR'] as const),
  exactSourceCodesPreserved: true,
  dimensionsKnown: false,
  catalogueSelectable: false,
  rulesValidated: false,
  machineReady: false,
  productionApproved: false,
})
