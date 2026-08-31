import type { CatalogueProfile } from './profileCatalogueTypes'
import { catalogueProfileIsSelectable } from './profileCatalogueState'

export interface CatalogueValidation { valid: boolean; errors: string[] }

export function validateCatalogueProfile(profile: CatalogueProfile, all: CatalogueProfile[]): CatalogueValidation {
  const errors: string[] = []
  if (!profile.code.trim()) errors.push('Кодът на профила е задължителен.')
  if (!profile.role) errors.push('Ролята на профила е задължителна.')
  if (!profile.system.trim()) errors.push('Производителят / системата е задължителен.')
  if (!profile.nameBg.trim()) errors.push('Българското име е задължително.')
  if (!Number.isFinite(profile.dimensionA) || profile.dimensionA <= 0) errors.push('Размер A трябва да е положително крайно число.')
  if (!Number.isFinite(profile.dimensionB) || profile.dimensionB <= 0) errors.push('Размер B трябва да е положително крайно число.')
  if (profile.sourceEvidenceId && profile.humanRoleReviewStatus === 'HUMAN_CONFIRMED' && !profile.humanRoleConfirmedBy?.trim()) errors.push('За HUMAN CONFIRMED роля е задължително кой човек / технолог я е потвърдил.')
  if (all.some((item) => item.id !== profile.id && item.system.trim().toLocaleLowerCase('bg') === profile.system.trim().toLocaleLowerCase('bg') && item.code.trim().toLocaleLowerCase('bg') === profile.code.trim().toLocaleLowerCase('bg'))) errors.push('Кодът трябва да е уникален в рамките на профилната система.')
  return { valid: errors.length === 0, errors }
}

export function catalogueHasRequiredRoles(profiles: CatalogueProfile[]): boolean {
  return (['FRAME', 'SASH', 'MULLION'] as const).every((role) => profiles.some((item) => item.role === role && catalogueProfileIsSelectable(item)))
}

