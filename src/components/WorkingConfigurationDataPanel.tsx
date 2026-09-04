import { compatibleProfiles, deriveActiveProfileSystems, type StructuredProfileConfiguration } from '../hybridProductDesigner'
import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'

type WorkingConfigurationPatch = Partial<Pick<StructuredProfileConfiguration, 'profileSystem' | 'frameProfileId' | 'sashProfileId' | 'mullionProfileId'>>

interface Props {
  configuration: StructuredProfileConfiguration
  profiles: CatalogueProfile[]
  onUpdate: (patch: WorkingConfigurationPatch) => void
}

const systemLabel = (system: string) => system === 'DEMO SYSTEM' ? 'Примерна система (служебна)' : system
const profileOptionLabel = (profile: CatalogueProfile) => profile.status === 'DEMONSTRATION'
  ? `${profile.code} — служебен примерен профил`
  : `${profile.code} — ${profile.nameBg}`

const selectedCount = (configuration: StructuredProfileConfiguration) => [
  configuration.profileSystem,
  configuration.frameProfileId,
  configuration.sashProfileId,
  configuration.mullionProfileId,
].filter(Boolean).length

export function WorkingConfigurationDataPanel({ configuration, profiles, onUpdate }: Props) {
  const systems = deriveActiveProfileSystems(profiles)
  const filled = selectedCount(configuration)
  const status = `Известни профилни стойности: ${filled}/4`
  const roleSelect = (label: string, role: ProfileRole, key: 'frameProfileId' | 'sashProfileId' | 'mullionProfileId', confirmationRequired = false) => {
    const options = configuration.profileSystem ? compatibleProfiles(profiles, configuration.profileSystem, role, configuration.productCategory) : []
    const updateRole = (value: string) => onUpdate({ [key]: value } as WorkingConfigurationPatch)
    return <label>{label}{confirmationRequired ? ' *' : ''}<select value={configuration[key]} disabled={!configuration.profileSystem} onChange={(event) => updateRole(event.target.value)}><option value="">{configuration.profileSystem ? 'Не е избрано' : 'Първо изберете система'}</option>{options.map((profile) => <option key={profile.id} value={profile.id}>{profileOptionLabel(profile)}</option>)}</select>{configuration.profileSystem && options.length === 0 && <small>За тази роля няма потвърден съвместим профил в текущия каталог.</small>}</label>
  }
  return <section className="working-configuration-data" aria-label="Технически данни на работната конфигурация">
    <header><div><b>Технически данни на изделието</b><span>{status}</span></div><strong className={filled === 4 ? 'complete' : 'incomplete'}>{filled === 0 ? 'Не са въведени' : filled === 4 ? 'Попълнени' : 'Частично попълнени'}</strong></header>
    <p>Попълвайте само това, което знаете. Празните полета остават празни и не се допълват автоматично.</p>
    <label>Профилна система<select value={configuration.profileSystem} onChange={(event) => onUpdate({ profileSystem: event.target.value })}><option value="">Не е избрана</option>{systems.map((system) => <option key={system} value={system}>{systemLabel(system)}</option>)}</select></label>
    {configuration.profileSystem === 'DEMO SYSTEM' && <small className="working-configuration-service-note">Служебната примерна система е само помощен запис за тестове и не представлява реални каталожни данни.</small>}
    <div className="working-configuration-profile-grid">
      {roleSelect('Каса', 'FRAME', 'frameProfileId', true)}
      {roleSelect('Крило', 'SASH', 'sashProfileId')}
      {roleSelect('Делител', 'MULLION', 'mullionProfileId')}
    </div>
    <div className="working-configuration-deferred"><b>Стъклопакет / стъклодържател</b><span>Още не се моделират в този слой. Стойности 20/22 mm не се добавят или изчисляват автоматично.</span></div>
    {configuration.productCategory === 'DOOR' && <div className="working-configuration-deferred warning"><b>Праг</b><span>НЕРАЗРЕШЕН — може да работите по композицията, но това не е производствена готовност.</span></div>}
    <small>* Касата е необходима за пълно техническо потвърждение, но не блокира работната композиция.</small>
  </section>
}
