import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'

export const roleLabels: Record<ProfileRole, string> = { FRAME: 'Каса', SASH: 'Крило', MULLION: 'Делител' }
export const profileStatusLabels = { DEMONSTRATION: 'Демонстрационен', EXPERT_CONFIRMED: 'Потвърден от експерт', ARCHIVED: 'Архивиран' } as const

export function duplicateCatalogueProfile(source: CatalogueProfile, id: string, now: string): CatalogueProfile {
  return { ...source, id, code: `${source.code}-COPY`, nameBg: `${source.nameBg} — копие`, status: 'DEMONSTRATION', createdAt: now, updatedAt: now }
}

export function catalogueExport(profiles: CatalogueProfile[]) {
  const payload = { schemaVersion: '1.0', simulationOnly: true, machineReady: false, requiresHumanApproval: true, warning: 'Демонстрационен каталог. Не е одобрен за производство.', profiles, generatedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob), anchor = document.createElement('a')
  anchor.href = url; anchor.download = 'facadeflow.profile-catalogue.simulation.json'; anchor.click(); URL.revokeObjectURL(url)
}

