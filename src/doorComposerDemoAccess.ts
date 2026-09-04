import type { StructuredProfileConfiguration } from './hybridProductDesigner'
import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'

export interface DoorComposerDemoAccess {
  eligible: boolean
  blockers: string[]
  warnings: string[]
  thresholdStatus: 'UNRESOLVED'
  demoProfileSystem: 'DEMO SYSTEM'
  sourceProfileSystem: string
}

const positive = (value: string) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0
const activeDemoProfile = (profiles: CatalogueProfile[], role: ProfileRole) => profiles.find((profile) => profile.system === 'DEMO SYSTEM' && profile.role === role && profile.status === 'DEMONSTRATION')

export function getDoorComposerDemoAccess(
  configuration: StructuredProfileConfiguration,
  thresholdAcknowledged: boolean,
  demoModeAcknowledged: boolean,
  profiles: CatalogueProfile[],
): DoorComposerDemoAccess {
  const blockers: string[] = []
  if (configuration.productCategory !== 'DOOR') blockers.push('DEMO конструкторът е достъпен само за изделие „Врата“.')
  if (!configuration.productName.trim()) blockers.push('Въведете име на изделието.')
  if (!positive(configuration.overallWidth) || !positive(configuration.overallHeight)) blockers.push('Въведете валидни положителни общи размери.')
  if (!activeDemoProfile(profiles, 'FRAME')) blockers.push('Липсва демонстрационен профил за каса в DEMO SYSTEM.')
  if (!activeDemoProfile(profiles, 'SASH')) blockers.push('Липсва демонстрационен профил за крило в DEMO SYSTEM.')
  if (!thresholdAcknowledged) blockers.push('Потвърдете, че прагът остава неразрешен и вратата не е производствено одобрена.')
  if (!demoModeAcknowledged) blockers.push('Потвърдете отделния DEMO режим за концептуален тест.')

  const sourceProfileSystem = configuration.profileSystem.trim()
  return {
    eligible: blockers.length === 0,
    blockers,
    warnings: [
      'Прагът остава НЕРАЗРЕШЕН.',
      `DEMO режимът не променя текущата конфигурация${sourceProfileSystem ? ` (${sourceProfileSystem})` : ''}.`,
      'Концептуалният конструктор използва DEMO SYSTEM и примерни профили — без производствено или машинно одобрение.',
    ],
    thresholdStatus: 'UNRESOLVED',
    demoProfileSystem: 'DEMO SYSTEM',
    sourceProfileSystem,
  }
}

export function createDoorComposerDemoConfiguration(
  configuration: StructuredProfileConfiguration,
  profiles: CatalogueProfile[],
): StructuredProfileConfiguration | null {
  if (configuration.productCategory !== 'DOOR') return null
  const frame = activeDemoProfile(profiles, 'FRAME')
  const sash = activeDemoProfile(profiles, 'SASH')
  if (!frame || !sash) return null
  const mullion = activeDemoProfile(profiles, 'MULLION')
  return {
    ...configuration,
    profileSystem: 'DEMO SYSTEM',
    frameProfileId: frame.id,
    sashProfileId: sash.id,
    mullionProfileId: mullion?.id ?? '',
    thresholdStatus: 'UNRESOLVED',
    validationErrors: ['DEMO-only концептуална конфигурация.', 'Прагът остава НЕРАЗРЕШЕН.'],
    humanReviewChecked: false,
    status: 'NEEDS_REVIEW',
    sessionOnly: true,
    simulationOnly: true,
    machineReady: false,
    geometryCreated: false,
    exportAvailable: false,
  }
}
