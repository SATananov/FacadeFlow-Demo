import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'

export const roleLabels: Record<ProfileRole, string> = { FRAME: 'Каса', SASH: 'Крило', MULLION: 'Делител' }
export const profileStatusLabels = { DEMONSTRATION: 'Демонстрационен', SOURCE_EVIDENCE: 'Реален източник', EXPERT_CONFIRMED: 'Потвърден от експерт', ARCHIVED: 'Архивиран' } as const

export function catalogueProfileIsSelectable(profile: CatalogueProfile) {
  return profile.status !== 'ARCHIVED' && (profile.status !== 'SOURCE_EVIDENCE' || profile.humanRoleReviewStatus === 'HUMAN_CONFIRMED')
}

export function catalogueProfileIsReal(profile: CatalogueProfile) {
  return catalogueProfileIsSelectable(profile) && profile.status !== 'DEMONSTRATION'
}

export function catalogueProfileIsDemonstration(profile: CatalogueProfile) {
  return profile.status === 'DEMONSTRATION'
}

export function duplicateCatalogueProfile(source: CatalogueProfile, id: string, now: string): CatalogueProfile {
  return { ...source, id, code: `${source.code}-COPY`, nameBg: `${source.nameBg} — копие`, status: 'DEMONSTRATION', createdAt: now, updatedAt: now, sourceEvidenceId: undefined, sourceEvidenceLabel: undefined, sourceEvidenceSha256: undefined, humanRoleReviewStatus: undefined, humanRoleConfirmedBy: undefined, humanRoleConfirmedAt: undefined, humanRoleConfirmationNote: undefined }
}

export function catalogueExport(profiles: CatalogueProfile[]) {
  const payload = { schemaVersion: '1.0', simulationOnly: true, machineReady: false, requiresHumanApproval: true, warning: 'Симулационен каталог с демонстрационни записи и записи от реални източници. Не е одобрен за производство.', profiles, generatedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob), anchor = document.createElement('a')
  anchor.href = url; anchor.download = 'facadeflow.profile-catalogue.simulation.json'; anchor.click(); URL.revokeObjectURL(url)
}
