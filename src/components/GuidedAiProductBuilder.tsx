import type { ReactNode } from 'react'
import {
  GUIDED_COLOR_MODE_LABELS,
  GUIDED_DIRECTION_LABELS,
  GUIDED_FILL_LABELS,
  GUIDED_HANDLE_LABELS,
  GUIDED_HARDWARE_LABELS,
  GUIDED_INWARD_OUTWARD_LABELS,
  GUIDED_OPENING_LABELS,
  GUIDED_PRODUCT_TYPE_LABELS,
  activeGuidedProfileSystems,
  activeRealGuidedProfileSystems,
  effectiveGuidedProfileSystem,
  guidedProductCompletion,
  guidedProductUnresolved,
  guidedProductWarnings,
  guidedProfilesForRole,
  guidedRealProfilesForRole,
} from '../aiGuidedProduct'
import { applyFacadeFlowGuidedDemo, confirmFacadeFlowGuidedProduct, prepareFacadeFlowGuidedProduct, setFacadeFlowGuidedReviewAccepted, updateFacadeFlowGuidedProduct } from '../aiWorkspaceState'
import type {
  FacadeFlowAiSession,
  FacadeFlowGuidedColorMode,
  FacadeFlowGuidedFillType,
  FacadeFlowGuidedHandleType,
  FacadeFlowGuidedHardwareType,
  FacadeFlowGuidedInwardOutward,
  FacadeFlowGuidedOpeningDirection,
  FacadeFlowGuidedOpeningType,
  FacadeFlowGuidedProductDraft,
  FacadeFlowGuidedProductType,
} from '../aiWorkspaceTypes'
import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { GuidedNadezhdaEvidencePreview } from './GuidedNadezhdaEvidencePreview'

interface Props {
  session: FacadeFlowAiSession
  profiles: CatalogueProfile[]
  setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void
  onOpenProfileCatalogue: () => void
}

const productTypes = Object.entries(GUIDED_PRODUCT_TYPE_LABELS) as [Exclude<FacadeFlowGuidedProductType, ''>, string][]
const fillTypes = Object.entries(GUIDED_FILL_LABELS) as [Exclude<FacadeFlowGuidedFillType, ''>, string][]
const colorModes = Object.entries(GUIDED_COLOR_MODE_LABELS) as [Exclude<FacadeFlowGuidedColorMode, ''>, string][]
const hardwareTypes = Object.entries(GUIDED_HARDWARE_LABELS) as [Exclude<FacadeFlowGuidedHardwareType, ''>, string][]
const handleTypes = Object.entries(GUIDED_HANDLE_LABELS) as [Exclude<FacadeFlowGuidedHandleType, ''>, string][]
const directions = Object.entries(GUIDED_DIRECTION_LABELS) as [Exclude<FacadeFlowGuidedOpeningDirection, ''>, string][]
const inwardOutwardOptions = Object.entries(GUIDED_INWARD_OUTWARD_LABELS) as [Exclude<FacadeFlowGuidedInwardOutward, ''>, string][]

function openingOptions(type: FacadeFlowGuidedProductType) {
  const allowed: Exclude<FacadeFlowGuidedOpeningType, ''>[] = type === 'DOOR'
    ? ['TURN', 'DOUBLE_LEAF', 'SLIDING', 'OTHER']
    : ['FIXED', 'TURN', 'TILT', 'TILT_TURN', 'SLIDING', 'OTHER']
  return allowed.map((value) => [value, GUIDED_OPENING_LABELS[value]] as const)
}

const validPositive = (value: string) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0

export function GuidedAiProductBuilder({ session, profiles, setSession, onOpenProfileCatalogue }: Props) {
  const draft = session.job.guidedProduct
  const usesDemoCatalogue = draft.name.startsWith('DEMO-') || draft.profileSystem === 'DEMO SYSTEM' || [draft.frameProfileId, draft.sashProfileId, draft.mullionProfileId].some((id) => profiles.some((profile) => profile.id === id && profile.status === 'DEMONSTRATION'))
  const systems = usesDemoCatalogue ? activeGuidedProfileSystems(profiles) : activeRealGuidedProfileSystems(profiles)
  const unresolved = guidedProductUnresolved(draft, profiles)
  const completion = guidedProductCompletion(draft, profiles)
  const warnings = guidedProductWarnings(draft, profiles)
  const proposal = session.job.products.find((product) => product.id === `${session.job.id}-guided-product`)
  const canPrepare = Boolean(draft.productType) && validPositive(draft.width) && validPositive(draft.height)
  const canConfirm = Boolean(proposal) && draft.reviewAccepted && unresolved.length === 0
  const update = (patch: Partial<FacadeFlowGuidedProductDraft>) => setSession((current) => updateFacadeFlowGuidedProduct(current, patch, profiles))
  const system = effectiveGuidedProfileSystem(draft)
  const humanConfirmedSourceEvidenceCount = profiles.filter((profile) => profile.status === 'SOURCE_EVIDENCE' && profile.humanRoleReviewStatus === 'HUMAN_CONFIRMED').length

  return <section className="ff-guided-builder" aria-labelledby="ff-guided-builder-title">
    <div className="ff-guided-head">
      <div><span>ВОДЕНА AI СПЕЦИФИКАЦИЯ · БЕЗ AI INFERENCE</span><h3 id="ff-guided-builder-title">Води ме стъпка по стъпка</h3><p>Попълни изделието структурирано. FacadeFlow използва само въведеното от теб и активния каталог; липсващото остава неуточнено.</p></div>
      <div className="ff-guided-head-tools"><button type="button" className="ff-guided-demo-button" onClick={() => setSession((current) => applyFacadeFlowGuidedDemo(current, profiles))}>ДЕМО · {draft.productType === 'DOOR' ? 'ВРАТА' : 'ПРОЗОРЕЦ'}</button><small>Попълва примерни стойности само за тест. Human Gate остава задължителен.</small><div className="ff-guided-progress" aria-label={`Попълване ${completion}%`}><b>{completion}%</b><span><i style={{ width: `${completion}%` }}/></span><small>{unresolved.length === 0 ? 'Готово за човешка проверка' : `${unresolved.length} неуточнени полета`}</small></div></div>
    </div>

    {draft.name.startsWith('DEMO-') && <div className="ff-guided-demo-banner"><b>ДЕМО ДАННИ</b><span>Примерът е попълнен автоматично за бърза проверка. Не е реален проект, не е проверен по правила и не е готов за машина.</span></div>}

    <div className="ff-guided-sections">
      <GuidedGroup number="01" title="Изделие" hint="Какво конфигурираме">
        <label>Тип изделие *<select value={draft.productType} onChange={(event) => update({ productType: event.target.value as FacadeFlowGuidedProductType })}><option value="">Избери тип</option>{productTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Име / позиция<input value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Напр. W-01 / Входна врата"/></label>
        <label>Количество *<input inputMode="numeric" value={draft.quantity} onChange={(event) => update({ quantity: event.target.value })} placeholder="1"/></label>
      </GuidedGroup>

      <GuidedGroup number="02" title="Размери" hint="Крайни общи размери в mm">
        <label>Ширина (mm) *<input inputMode="decimal" value={draft.width} onChange={(event) => update({ width: event.target.value })} placeholder="1400"/></label>
        <label>Височина (mm) *<input inputMode="decimal" value={draft.height} onChange={(event) => update({ height: event.target.value })} placeholder="1200"/></label>
        <div className="ff-guided-readout"><span>Текущ размер</span><b>{draft.width || '—'} × {draft.height || '—'} mm</b><small>Няма приложени производствени min/max ограничения.</small></div>
      </GuidedGroup>

      <div data-source-evidence-legacy="НАДЕЖДА · SOURCE EVIDENCE · Няма автоматично разпознаване на каса / крило / делител" data-human-role-summary={`${humanConfirmedSourceEvidenceCount} с HUMAN CONFIRMED роля`}><GuidedGroup number="03" title="Профили" hint="Каталогът филтрира каса, крило и делител">
        <label>Профилна система<select value={draft.profileSystem} onChange={(event) => update({ profileSystem: event.target.value, manualProfileSystem: event.target.value ? '' : draft.manualProfileSystem })}><option value="">{usesDemoCatalogue ? 'Не е избрана от каталога' : systems.length > 0 ? 'Избери HUMAN CONFIRMED реална система' : 'Няма HUMAN CONFIRMED реална система'}</option>{systems.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Ръчна система / код<input value={draft.manualProfileSystem} disabled={Boolean(draft.profileSystem)} onChange={(event) => update({ manualProfileSystem: event.target.value })} placeholder="Само ако липсва в каталога"/></label>
        <button type="button" className="ff-guided-catalogue-button" onClick={onOpenProfileCatalogue}>Отвори каталога</button>
        <GuidedNadezhdaEvidencePreview profiles={profiles} onOpenCatalogue={onOpenProfileCatalogue}/>
        <ProfileField label="Каса" role="FRAME" required draft={draft} profiles={profiles} allowDemonstration={usesDemoCatalogue} onUpdate={update}/>
        <ProfileField label="Крило" role="SASH" draft={draft} profiles={profiles} allowDemonstration={usesDemoCatalogue} onUpdate={update}/>
        <ProfileField label="Делител" role="MULLION" draft={draft} profiles={profiles} allowDemonstration={usesDemoCatalogue} onUpdate={update}/>
        {system && !draft.profileSystem && <p className="ff-guided-warning">Ръчно въведената система остава НЕПОТВЪРДЕНА, докато не бъде добавена/сверена в каталога.</p>}
      </GuidedGroup></div>

      <GuidedGroup number="04" title="Функция и отваряемост" hint="Показват се само релевантните полета">
        <label>Тип отваряемост *<select value={draft.openingType} disabled={!draft.productType} onChange={(event) => update({ openingType: event.target.value as FacadeFlowGuidedOpeningType })}><option value="">{draft.productType ? 'Избери отваряемост' : 'Първо избери изделие'}</option>{openingOptions(draft.productType).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {['TURN', 'TILT', 'TILT_TURN', 'DOUBLE_LEAF'].includes(draft.openingType) && <><label>Ляво / дясно *<select value={draft.openingDirection} onChange={(event) => update({ openingDirection: event.target.value as FacadeFlowGuidedOpeningDirection })}><option value="">Не е избрано</option>{directions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Навътре / навън *<select value={draft.inwardOutward} onChange={(event) => update({ inwardOutward: event.target.value as FacadeFlowGuidedInwardOutward })}><option value="">Не е избрано</option>{inwardOutwardOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></>}
        {draft.productType === 'DOOR' && <label className="ff-guided-wide">Праг / долен възел *<input value={draft.thresholdDescription} onChange={(event) => update({ thresholdDescription: event.target.value })} placeholder="Точен профил / код / описание от проекта"/></label>}
      </GuidedGroup>

      <GuidedGroup number="05" title="Стъкло, пълнеж и цвят" hint="Без предположение за допустимост по система">
        <label>Пълнеж / стъкло *<select value={draft.fillType} onChange={(event) => update({ fillType: event.target.value as FacadeFlowGuidedFillType })}><option value="">Не е избрано</option>{fillTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="ff-guided-wide">Точно описание *<input value={draft.fillDescription} onChange={(event) => update({ fillDescription: event.target.value })} placeholder="Напр. състав / дебелина / код от спецификацията"/></label>
        <label>Режим на цвета *<select value={draft.colorMode} onChange={(event) => update({ colorMode: event.target.value as FacadeFlowGuidedColorMode })}><option value="">Не е избран</option>{colorModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Външен цвят / код *<input value={draft.exteriorColor} onChange={(event) => update({ exteriorColor: event.target.value })} placeholder="Напр. RAL / декор / код"/></label>
        {draft.colorMode === 'DIFFERENT_SIDES' && <label>Вътрешен цвят / код *<input value={draft.interiorColor} onChange={(event) => update({ interiorColor: event.target.value })} placeholder="RAL / декор / код"/></label>}
      </GuidedGroup>

      {draft.openingType && draft.openingType !== 'FIXED' && <GuidedGroup number="06" title="Обков и дръжки" hint="Марка/код се въвежда от човек, не се измисля">
        <label>Тип обков *<select value={draft.hardwareType} onChange={(event) => update({ hardwareType: event.target.value as FacadeFlowGuidedHardwareType })}><option value="">Не е избран</option>{hardwareTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="ff-guided-wide">Обков — система / код *<input value={draft.hardwareDescription} onChange={(event) => update({ hardwareDescription: event.target.value })} placeholder="Точна марка, серия или код"/></label>
        <label>Тип дръжка *<select value={draft.handleType} onChange={(event) => update({ handleType: event.target.value as FacadeFlowGuidedHandleType })}><option value="">Не е избрана</option>{handleTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Дръжка — модел / код *<input value={draft.handleDescription} onChange={(event) => update({ handleDescription: event.target.value })} placeholder="Точен модел / код"/></label>
        <label>Брой панти<input inputMode="numeric" value={draft.hingeQuantity} onChange={(event) => update({ hingeQuantity: event.target.value })} placeholder="Ако е зададен"/></label>
      </GuidedGroup>}

      <GuidedGroup number={draft.openingType && draft.openingType !== 'FIXED' ? '07' : '06'} title="Допълнителни указания" hint="Само информация, въведена от човек">
        <label className="ff-guided-wide">Бележки<textarea rows={4} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="Разположение на делител, особености, монтажна бележка, изискване от проект..."/></label>
      </GuidedGroup>
    </div>

    <section className="ff-guided-review-box">
      <div><span>HUMAN GATE</span><h4>Подготви структурирана чернова</h4><p>Това не създава геометрия и не активира AI. Създава само симулационна спецификация за проверка.</p></div>
      <button type="button" className="primary-button" disabled={!canPrepare} onClick={() => setSession((current) => prepareFacadeFlowGuidedProduct(current, profiles))}>Подготви за човешка проверка</button>
      {!canPrepare && <small>За начало са нужни тип изделие и положителни общи размери.</small>}
      {proposal && <div className="ff-guided-proposal" aria-live="polite"><strong>Черновата е подготвена.</strong><span>Статус: {proposal.status === 'HUMAN_CONFIRMED' ? 'ПОТВЪРДЕНА ОТ ЧОВЕК' : 'ИЗИСКВА ПРОВЕРКА'}</span><span>Неуточнени: {unresolved.length}</span>{unresolved.length > 0 && <ul>{unresolved.map((item) => <li key={item}>{item}</li>)}</ul>}{warnings.length > 0 && <div className="ff-guided-proposal-warnings"><b>Ще останат за проверка по правила:</b>{warnings.map((item) => <span key={item}>{item}</span>)}</div>}</div>}
      {proposal && <label className="ff-guided-human-check"><input type="checkbox" checked={draft.reviewAccepted} onChange={(event) => setSession((current) => setFacadeFlowGuidedReviewAccepted(current, event.target.checked))}/> Проверих всички въведени стойности и разбирам, че това остава симулационна чернова.</label>}
      {proposal && <button type="button" className="ff-guided-confirm" disabled={!canConfirm} onClick={() => setSession((current) => confirmFacadeFlowGuidedProduct(current, profiles))}>Потвърди човешката чернова</button>}
      {proposal && unresolved.length === 0 && !draft.reviewAccepted && <small>Отбележи човешката проверка, за да потвърдиш черновата.</small>}
      {draft.status === 'HUMAN_CONFIRMED' && <div className="ff-guided-confirmed"><b>✓ HUMAN CONFIRMED</b><span>Правилата и производствената готовност остават отделно заключени.</span></div>}
    </section>
  </section>
}

function GuidedGroup({ number, title, hint, children }: { number: string; title: string; hint: string; children: ReactNode }) {
  return <fieldset className="ff-guided-group"><legend><b>{number}</b><span><strong>{title}</strong><small>{hint}</small></span></legend><div className="ff-guided-field-grid">{children}</div></fieldset>
}

function ProfileField({ label, role, required = false, draft, profiles, allowDemonstration = false, onUpdate }: { label: string; role: ProfileRole; required?: boolean; draft: FacadeFlowGuidedProductDraft; profiles: CatalogueProfile[]; allowDemonstration?: boolean; onUpdate: (patch: Partial<FacadeFlowGuidedProductDraft>) => void }) {
  const options = allowDemonstration ? guidedProfilesForRole(profiles, draft.profileSystem, role) : guidedRealProfilesForRole(profiles, draft.profileSystem, role)
  const idKey = role === 'FRAME' ? 'frameProfileId' : role === 'SASH' ? 'sashProfileId' : 'mullionProfileId'
  const manualKey = role === 'FRAME' ? 'manualFrameProfile' : role === 'SASH' ? 'manualSashProfile' : 'manualMullionProfile'
  return <div className="ff-guided-profile-pair"><label>{label}{required ? ' *' : ''}<select value={draft[idKey]} disabled={!draft.profileSystem} onChange={(event) => onUpdate({ [idKey]: event.target.value, [manualKey]: event.target.value ? '' : draft[manualKey] })}><option value="">{draft.profileSystem ? 'Не е избран от каталога' : 'Първо избери каталожна система'}</option>{options.map((profile) => <option key={profile.id} value={profile.id}>{profile.code} — {profile.nameBg}</option>)}</select></label><label>Ръчен код за {label.toLowerCase()}<input value={draft[manualKey]} disabled={Boolean(draft[idKey])} onChange={(event) => onUpdate({ [manualKey]: event.target.value })} placeholder="Ако липсва в каталога"/></label></div>
}
