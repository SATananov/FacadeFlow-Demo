import { compatibleProfiles, type StructuredProfileConfiguration } from './hybridProductDesigner'
import type { CatalogueProfile } from './profileCatalogueTypes'

export interface DoorComposerEligibility {
  eligible: boolean
  blockers: string[]
  warnings: string[]
  thresholdStatus: 'UNRESOLVED'
}

export function getDoorComposerEligibility(configuration: StructuredProfileConfiguration, acknowledged: boolean, profiles: CatalogueProfile[]): DoorComposerEligibility {
  const blockers: string[] = []
  const positive = (value: string) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0
  if (configuration.productCategory !== 'DOOR') blockers.push('Конструкторът е достъпен само за изделие „Врата“.')
  if (!configuration.productName.trim()) blockers.push('Въведете име на изделието.')
  if (!positive(configuration.overallWidth) || !positive(configuration.overallHeight)) blockers.push('Въведете валидни положителни общи размери.')
  if (configuration.profileSystem !== 'DEMO SYSTEM') blockers.push('Изберете изрично DEMO SYSTEM.')
  if (!compatibleProfiles(profiles, configuration.profileSystem, 'FRAME').some(p => p.id === configuration.frameProfileId)) blockers.push('Изберете съвместим DEMO профил за каса.')
  if (!compatibleProfiles(profiles, configuration.profileSystem, 'SASH').some(p => p.id === configuration.sashProfileId)) blockers.push('Изберете съвместим DEMO профил за крило.')
  if (!acknowledged) blockers.push('Потвърдете, че прагът остава неразрешен и композицията не е производствено одобрена.')
  return { eligible: blockers.length === 0, blockers, warnings: ['Прагът остава НЕРАЗРЕШЕН.', 'Концептуална DEMO композиция — без производствено или машинно одобрение.'], thresholdStatus: 'UNRESOLVED' }
}
