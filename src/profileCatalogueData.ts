import type { CatalogueProfile } from './profileCatalogueTypes'

const SAMPLE_TIME = '2026-01-01T00:00:00.000Z'

export const sampleCatalogueProfiles: CatalogueProfile[] = [
  { id: 'profile-demo-frame-01', role: 'FRAME', system: 'DEMO SYSTEM', code: 'DEMO-FRAME-01', nameBg: 'Демонстрационна каса', dimensionA: 60, dimensionB: 40, description: 'Заместващи примерни стойности — не са реални каталожни данни.', status: 'DEMONSTRATION', createdAt: SAMPLE_TIME, updatedAt: SAMPLE_TIME, simulationOnly: true, requiresHumanApproval: true },
  { id: 'profile-demo-sash-01', role: 'SASH', system: 'DEMO SYSTEM', code: 'DEMO-SASH-01', nameBg: 'Демонстрационно крило', dimensionA: 52, dimensionB: 36, description: 'Заместващи примерни стойности — не са реални каталожни данни.', status: 'DEMONSTRATION', createdAt: SAMPLE_TIME, updatedAt: SAMPLE_TIME, simulationOnly: true, requiresHumanApproval: true },
  { id: 'profile-demo-mullion-01', role: 'MULLION', system: 'DEMO SYSTEM', code: 'DEMO-MULLION-01', nameBg: 'Демонстрационен делител', dimensionA: 60, dimensionB: 38, description: 'Заместващи примерни стойности — не са реални каталожни данни.', status: 'DEMONSTRATION', createdAt: SAMPLE_TIME, updatedAt: SAMPLE_TIME, simulationOnly: true, requiresHumanApproval: true },
]

