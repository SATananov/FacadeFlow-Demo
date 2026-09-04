import { useEffect, useState } from 'react'
import { canOpenWorkingComposer, compatibleProfiles, confirmStructuredConfiguration, deriveActiveProfileSystems, getProductNameSuggestions, getProductSizeSuggestions, maximumAccessibleConfigurationStep, moveStructuredConfigurationStep, reconcileStructuredConfiguration, selectHybridStandardCategory, updateStructuredConfiguration, type HybridProductDesignerSession, type StructuredConfigurationStep, type StructuredProfileConfiguration } from '../hybridProductDesigner'
import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { createEmptyComposition } from '../visualComposerState'
import { emptyDoorComposition } from '../doorComposerState'
import { VisualTemplateComposer } from './VisualTemplateComposer'
import { DoorVisualComposer } from './DoorVisualComposer'
import { composerTemplateIdForProductPreset, composerTemplateLabel } from '../structuredComposerTemplateSelection'
import { resolveDoorComposerEntry, resolveWindowComposerEntry } from '../composerEntryConsistency'

interface Props { session: HybridProductDesignerSession; profiles: CatalogueProfile[]; onSession: (updater: (current: HybridProductDesignerSession) => HybridProductDesignerSession) => void; onCloseFacadeFlow: () => void; onOpenProfileCatalogue: () => void }
const labels = ['Тип изделие', 'Размери', 'Профилна система', 'Профили', 'Проверка'] as const
const systemLabel = (system: string) => system === 'DEMO SYSTEM' ? 'Примерна система (служебна)' : system
const profileOptionLabel = (profile: CatalogueProfile) => profile.status === 'DEMONSTRATION' ? `${profile.code} — служебен примерен профил` : `${profile.code} — ${profile.nameBg}`

export function StructuredConfigurationWizard({ session, profiles, onSession, onCloseFacadeFlow, onOpenProfileCatalogue }: Props) {
  const [composerOpen, setComposerOpen] = useState(false), [doorComposerOpen, setDoorComposerOpen] = useState(false), [composition, setComposition] = useState(createEmptyComposition), [compositionSeedTemplateId, setCompositionSeedTemplateId] = useState<string | null>(null), [doorComposition, setDoorComposition] = useState(emptyDoorComposition), [doorCompositionSeedTemplateId, setDoorCompositionSeedTemplateId] = useState<string | null>(null)
  useEffect(() => { if (!composerOpen && !doorComposerOpen) return; const frame = requestAnimationFrame(() => { const center = document.querySelector<HTMLElement>('.detail-drafting .visual-composer-stage'); if (center) { center.tabIndex=0; center.setAttribute('aria-label', 'Централна работна зона — превъртаемо съдържание'); center.scrollTop = 0 } }); return () => cancelAnimationFrame(frame) }, [composerOpen, doorComposerOpen])
  if (!session.configuration) return null
  const configuration = reconcileStructuredConfiguration(session.configuration, profiles)
  const update = (patch: Parameters<typeof updateStructuredConfiguration>[1]) => onSession((current) => ({ ...current, configuration: updateStructuredConfiguration(configuration, patch, profiles) }))
  const move = (step: StructuredConfigurationStep) => onSession((current) => ({ ...current, configuration: moveStructuredConfigurationStep(configuration, step, profiles) }))
  const confirm = () => onSession((current) => ({ ...current, configuration: confirmStructuredConfiguration(configuration, profiles) }))
  const openWindowComposer = () => {
    const entry = resolveWindowComposerEntry(composition, configuration.composerTemplateId, compositionSeedTemplateId)
    setComposition(entry.composition)
    setCompositionSeedTemplateId(entry.seededTemplateId)
    setComposerOpen(true)
  }
  const openDoorComposer = () => {
    const entry = resolveDoorComposerEntry(doorComposition, configuration.composerTemplateId, doorCompositionSeedTemplateId)
    setDoorComposition(entry.composition)
    setDoorCompositionSeedTemplateId(entry.seededTemplateId)
    setDoorComposerOpen(true)
  }
  const openWorkingComposer = () => configuration.productCategory === 'WINDOW' ? openWindowComposer() : openDoorComposer()
  if (composerOpen) return <VisualTemplateComposer configuration={configuration} profiles={profiles} initial={composition} onChange={setComposition} onConfigurationChange={update} lockedTemplateId={configuration.composerTemplateId} onBack={() => setComposerOpen(false)}/>
  if (doorComposerOpen) return <DoorVisualComposer configuration={configuration} profiles={profiles} onConfigurationChange={update} initial={doorComposition} onChange={setDoorComposition} initialTemplateId={configuration.composerTemplateId} onBack={() => setDoorComposerOpen(false)} onCloseFacadeFlow={onCloseFacadeFlow}/>
  return <main className="hybrid-screen hybrid-configuration"><div className="hybrid-screen-heading"><h3>Конфигурация на изделието</h3><p>Започнете с данните, които имате. Липсващите технически стойности могат да останат непопълнени и да се добавят по-късно.</p></div><StepIndicator configuration={configuration} profiles={profiles} onMove={move}/><section className="hybrid-wizard-panel">
    {configuration.wizardStep === 1 && <ProductTypeStep configuration={configuration} profiles={profiles} onSession={onSession} onNext={() => move(2)}/>}
    {configuration.wizardStep === 2 && <DimensionsStep configuration={configuration} onUpdate={update} onBack={() => move(1)} onNext={() => move(3)}/>}
    {configuration.wizardStep === 3 && <SystemStep configuration={configuration} profiles={profiles} onUpdate={update} onBack={() => move(2)} onNext={() => move(4)}/>}
    {configuration.wizardStep === 4 && <ProfilesStep configuration={configuration} profiles={profiles} onUpdate={update} onOpenProfileCatalogue={onOpenProfileCatalogue} onBack={() => move(3)} onNext={() => move(5)}/>}
    {configuration.wizardStep === 5 && <ReviewStep configuration={configuration} profiles={profiles} onUpdate={update} onConfirm={confirm} onOpenComposer={openWorkingComposer} onBack={() => move(4)}/>}
  </section></main>
}

function StepIndicator({ configuration, profiles, onMove }: { configuration: StructuredProfileConfiguration; profiles: CatalogueProfile[]; onMove: (step: StructuredConfigurationStep) => void }) {
  const maximum = maximumAccessibleConfigurationStep(configuration, profiles)
  return <ol className="hybrid-step-indicator" aria-label="Стъпки на конфигурацията">{labels.map((label, index) => { const step = (index + 1) as StructuredConfigurationStep; return <li key={label} className={configuration.wizardStep === step ? 'active' : step < configuration.wizardStep ? 'complete' : ''}><button type="button" aria-current={configuration.wizardStep === step ? 'step' : undefined} disabled={step > maximum} onClick={() => onMove(step)}><b>{step}</b><span>{label}</span></button></li> })}</ol>
}

function ProductTypeStep({ configuration, profiles, onSession, onNext }: { configuration: StructuredProfileConfiguration; profiles: CatalogueProfile[]; onSession: Props['onSession']; onNext: () => void }) {
  const change = (category: 'WINDOW' | 'DOOR') => onSession((current) => selectHybridStandardCategory({ ...current, configuration }, category, profiles))
  return <><h4>1. Тип изделие</h4><fieldset className="hybrid-type-choice"><legend>Изберете категория</legend><label><input type="radio" name="hybrid-category" checked={configuration.productCategory === 'WINDOW'} onChange={() => change('WINDOW')}/> Прозорец</label><label><input type="radio" name="hybrid-category" checked={configuration.productCategory === 'DOOR'} onChange={() => change('DOOR')}/> Врата</label></fieldset><Actions onNext={onNext}/></>
}

const validDimensions = (configuration: StructuredProfileConfiguration) => configuration.overallWidth.trim() !== '' && Number.isFinite(Number(configuration.overallWidth)) && Number(configuration.overallWidth) > 0 && configuration.overallHeight.trim() !== '' && Number.isFinite(Number(configuration.overallHeight)) && Number(configuration.overallHeight) > 0
function DimensionsStep({ configuration, onUpdate, onBack, onNext }: StepProps) {
  const explicitPresetName = composerTemplateLabel(configuration.productCategory, configuration.composerTemplateId)
  const [namePreset, setNamePreset] = useState(explicitPresetName ?? (configuration.productName ? 'OTHER' : ''))
  const [sizePreset, setSizePreset] = useState('')
  const valid = Boolean(configuration.productName.trim()) && validDimensions(configuration)
  const nameSuggestions = getProductNameSuggestions(configuration.productCategory)
  const sizeSuggestions = getProductSizeSuggestions(configuration.productCategory)
  const categoryLabel = configuration.productCategory === 'DOOR' ? 'врата' : 'прозорец'
  const applySize = () => { const preset = sizeSuggestions.find((item) => item.id === sizePreset); if (preset) onUpdate({ overallWidth: preset.width, overallHeight: preset.height }) }
  const selectNamePreset = (value: string) => {
    setNamePreset(value)
    if (value === 'OTHER') { onUpdate({ composerTemplateId: null }); return }
    if (!value) { onUpdate({ productName: '', composerTemplateId: null }); return }
    onUpdate({ productName: value, composerTemplateId: composerTemplateIdForProductPreset(configuration.productCategory, value) })
  }
  return <><h4>2. Размери</h4><div className="hybrid-field-grid"><label>Тип / начална композиция за {categoryLabel}<select aria-label={`Тип / начална композиция за ${categoryLabel}`} value={namePreset} onChange={(event) => selectNamePreset(event.target.value)}><option value="">Без предварително избрана композиция</option>{nameSuggestions.map((name) => <option key={name} value={name}>{name}</option>)}<option value="OTHER">Друго / само ръчно име</option></select></label><label>Име на изделието<input value={configuration.productName} onChange={(event) => onUpdate({ productName: event.target.value })}/></label><label>Примерен общ размер за {categoryLabel}<select aria-label={`Примерен общ размер за ${categoryLabel}`} value={sizePreset} onChange={(event) => setSizePreset(event.target.value)}><option value="">Не е избран</option>{sizeSuggestions.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}<option value="OTHER">Друг размер / ръчно</option></select></label><button type="button" disabled={!sizeSuggestions.some((item) => item.id === sizePreset)} onClick={applySize}>Приложи примерни размери</button><label>Обща ширина (mm)<input inputMode="decimal" value={configuration.overallWidth} onChange={(event) => { setSizePreset('OTHER'); onUpdate({ overallWidth: event.target.value }) }}/></label><label>Обща височина (mm)<input inputMode="decimal" value={configuration.overallHeight} onChange={(event) => { setSizePreset('OTHER'); onUpdate({ overallHeight: event.target.value }) }}/></label></div><p className="hybrid-dimension-warning">{configuration.composerTemplateId ? `Началната композиция „${composerTemplateLabel(configuration.productCategory, configuration.composerTemplateId)}“ ще се зареди автоматично във визуалния конструктор.` : 'Няма предварително избрана композиция — визуалният конструктор ще се отвори празен и шаблонът ще се избере от библиотеката.'}</p><p className="hybrid-neutral-status">Примерните размери са само удобни начални стойности. Използвайте реалните размери на изделието, когато ги знаете.</p>{!valid && <p className="hybrid-unresolved" role="alert">Въведете име и положителни крайни обща ширина и обща височина.</p>}<Actions onBack={onBack} onNext={onNext} nextDisabled={!valid}/></>
}

function SystemStep({ configuration, profiles, onUpdate, onBack, onNext }: StepProps & { profiles: CatalogueProfile[] }) {
  const systems = deriveActiveProfileSystems(profiles)
  return <><h4>3. Профилна система</h4><label>Профилна система<select value={configuration.profileSystem} onChange={(event) => onUpdate({ profileSystem: event.target.value })}><option value="">Не е избрана — ще я попълня по-късно</option>{systems.map((system) => <option key={system} value={system}>{systemLabel(system)}</option>)}</select></label>{systems.length === 0 && <p className="hybrid-unresolved" role="status">Няма активна профилна система в текущия каталог.</p>}{configuration.profileSystem === 'DEMO SYSTEM' && <p className="hybrid-demo-note">Избрана е служебна примерна система. Тя не представлява реални каталожни данни.</p>}{!configuration.profileSystem && <p className="hybrid-neutral-status">Можете да продължите без система. Работната композиция няма да измисля липсващи профилни данни.</p>}<Actions onBack={onBack} onNext={onNext}/></>
}

function ProfilesStep({ configuration, profiles, onUpdate, onOpenProfileCatalogue, onBack, onNext }: StepProps & { profiles: CatalogueProfile[]; onOpenProfileCatalogue: () => void }) {
  const frameValid = configuration.frameProfileId && compatibleProfiles(profiles, configuration.profileSystem, 'FRAME', configuration.productCategory).some(({ id }) => id === configuration.frameProfileId)
  return <><h4>4. Профили</h4><button type="button" className="primary-button hybrid-catalogue-action" onClick={onOpenProfileCatalogue}>Отвори каталога на профилите</button><div className="hybrid-role-selectors"><RoleSelect label="Каса" role="FRAME" required configuration={configuration} profiles={profiles} onChange={onUpdate}/><RoleSelect label="Крило" role="SASH" configuration={configuration} profiles={profiles} onChange={onUpdate}/><RoleSelect label="Делител" role="MULLION" configuration={configuration} profiles={profiles} onChange={onUpdate}/></div><p>Попълнете само профилите, които знаете. Празните роли остават неразрешени и могат да се попълнят и от работния конструктор.</p>{!configuration.profileSystem && <p className="hybrid-neutral-status">Няма избрана профилна система — профилите могат да останат празни.</p>}{configuration.profileSystem && !frameValid && <p className="hybrid-unresolved" role="status">Касата още не е избрана. Това блокира пълното техническо потвърждение, но не и работната композиция.</p>}<Actions onBack={onBack} onNext={onNext}/></>
}

function RoleSelect({ label, role, required = false, configuration, profiles, onChange }: { label: string; role: ProfileRole; required?: boolean; configuration: StructuredProfileConfiguration; profiles: CatalogueProfile[]; onChange: StepProps['onUpdate'] }) {
  const options = compatibleProfiles(profiles, configuration.profileSystem, role, configuration.productCategory), key = role === 'FRAME' ? 'frameProfileId' : role === 'SASH' ? 'sashProfileId' : 'mullionProfileId'
  return <label>{label}{required ? ' *' : ' (по избор)'}<select value={configuration[key]} disabled={!configuration.profileSystem} onChange={(event) => onChange({ [key]: event.target.value })}><option value="">{configuration.profileSystem ? 'Не е избрано' : 'Първо изберете система'}</option>{options.map((profile) => <option key={profile.id} value={profile.id}>{profileOptionLabel(profile)}</option>)}</select>{configuration.profileSystem && options.length === 0 && <small>За тази роля няма потвърден съвместим профил.</small>}</label>
}

function ReviewStep({ configuration, profiles, onUpdate, onConfirm, onOpenComposer, onBack }: { configuration: StructuredProfileConfiguration; profiles: CatalogueProfile[]; onUpdate: StepProps['onUpdate']; onConfirm: () => void; onOpenComposer: () => void; onBack: () => void }) {
  const canWork = canOpenWorkingComposer(configuration)
  return <><h4>5. Проверка</h4><Summary configuration={configuration} profiles={profiles}/><div className={configuration.thresholdStatus === 'UNRESOLVED' ? 'hybrid-unresolved' : 'hybrid-neutral-status'}><b>Праг</b><span>{configuration.thresholdStatus === 'UNRESOLVED' ? 'НЕРАЗРЕШЕНО — може да се работи по композицията, но няма производствено потвърждение' : 'Не е приложимо за прозорец'}</span></div><p className="hybrid-dimension-warning">Работният конструктор може да се използва и с непълни технически данни. Празните стойности остават видимо непопълнени.</p>{configuration.validationErrors.length > 0 && <div className="inline-errors" role="status"><b>За пълно техническо потвърждение още липсва:</b><ul>{configuration.validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<label className="hybrid-review-check"><input type="checkbox" checked={configuration.humanReviewChecked} onChange={(event) => onUpdate({ humanReviewChecked: event.target.checked })}/> Проверих всички въведени технически данни.</label><div className="hybrid-review-actions"><button type="button" onClick={onBack}>Назад</button><button type="button" className="primary-button" onClick={onConfirm}>Потвърди техническите данни</button></div><p className="hybrid-confirmation-result" aria-live="polite">{configuration.status === 'HUMAN_CONFIRMED' ? 'Въведените технически данни са потвърдени от човек.' : 'Пълното техническо потвърждение още не е завършено. Работният конструктор остава достъпен с наличните данни.'}</p><button type="button" className="primary-button" disabled={!canWork} onClick={onOpenComposer}>Отвори работния конструктор</button>{!canWork && <small>За работния конструктор са нужни име и положителни общи размери.</small>}</>
}

function Summary({ configuration, profiles }: { configuration: StructuredProfileConfiguration; profiles: CatalogueProfile[] }) {
  const profileLabel = (id: string) => { const profile = profiles.find((item) => item.id === id); return profile ? profileOptionLabel(profile) : 'Не е избрано' }, status = configuration.status === 'EMPTY' ? 'Празна' : configuration.status === 'NEEDS_REVIEW' ? 'Непълни / непотвърдени данни' : 'Потвърдена от човек'
  return <aside className="hybrid-configuration-summary"><h4>Обобщение на изделието</h4><dl><dt>Категория</dt><dd>{configuration.productCategory === 'WINDOW' ? 'Прозорец' : 'Врата'}</dd><dt>Име</dt><dd>{configuration.productName || 'Не е избрано'}</dd><dt>Начална композиция</dt><dd>{composerTemplateLabel(configuration.productCategory, configuration.composerTemplateId) ?? 'Не е избрана — избор в работния конструктор'}</dd><dt>Общи размери</dt><dd>{configuration.overallWidth || 'Не е избрано'} × {configuration.overallHeight || 'Не е избрано'} mm</dd><dt>Система</dt><dd>{configuration.profileSystem ? systemLabel(configuration.profileSystem) : 'Не е избрано'}</dd><dt>Каса</dt><dd>{profileLabel(configuration.frameProfileId)}</dd><dt>Крило</dt><dd>{profileLabel(configuration.sashProfileId)}</dd><dt>Делител</dt><dd>{profileLabel(configuration.mullionProfileId)}</dd><dt>Праг</dt><dd>{configuration.thresholdStatus === 'UNRESOLVED' ? 'Неразрешен' : 'Не е приложимо'}</dd><dt>Статус</dt><dd>{status}</dd><dt>Работна конфигурация</dt><dd>Да — непълни данни са допустими</dd><dt>Готово за машина</dt><dd>Не</dd></dl><p>Неизвестните технически данни не се допълват автоматично и не се приемат за потвърдени.</p></aside>
}

interface StepProps { configuration: StructuredProfileConfiguration; onUpdate: (patch: Parameters<typeof updateStructuredConfiguration>[1]) => void; onBack: () => void; onNext: () => void }
function Actions({ onBack, onNext, nextDisabled = false }: { onBack?: () => void; onNext: () => void; nextDisabled?: boolean }) { return <div className="hybrid-wizard-actions">{onBack && <button type="button" onClick={onBack}>Назад</button>}<button type="button" className="primary-button" disabled={nextDisabled} onClick={onNext}>Продължи</button></div> }
