import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  FACADEFLOW_QUICK_CONFIGURATION_LABELS,
  FACADEFLOW_QUICK_PRODUCT_LABELS,
  buildFacadeFlowQuickStructuredSelection,
  facadeFlowQuickStateShortLabel,
  facadeFlowQuickVisualPresets,
  type FacadeFlowQuickConfiguration,
  type FacadeFlowQuickProductType,
  type FacadeFlowQuickScope,
  type FacadeFlowQuickStructuredSelection,
} from '../aiProductQuickSelect'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { PRELUDE_TECHNICAL_PROFILES } from '../profileData/preludeTechnicalInspector'
import { isPrelude60System } from '../aiDrawingProfileSections'

const productTypes = Object.keys(FACADEFLOW_QUICK_PRODUCT_LABELS) as FacadeFlowQuickProductType[]
const configurations = Object.keys(FACADEFLOW_QUICK_CONFIGURATION_LABELS) as FacadeFlowQuickConfiguration[]

const dimensionOptions = [600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000, 2100, 2400, 2600, 3000]
const quantityOptions = [1, 2, 3, 4, 5, 6, 10]

function numberOrNull(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function AiProductQuickStart({ profiles, onApplyStructuredSelection, onUseTextMode }: {
  profiles: CatalogueProfile[]
  onApplyStructuredSelection: (selection: FacadeFlowQuickStructuredSelection) => void
  onUseTextMode: () => void
}) {
  const [scope, setScope] = useState<FacadeFlowQuickScope>('SINGLE_PRODUCT')
  const [productType, setProductType] = useState<FacadeFlowQuickProductType>('WINDOW')
  const [configuration, setConfiguration] = useState<FacadeFlowQuickConfiguration>('THREE_FIELD')
  const [presetId, setPresetId] = useState('THREE_FIXED_TTR_FIXED')
  const [widthMm, setWidthMm] = useState('1200')
  const [heightMm, setHeightMm] = useState('1400')
  const [quantity, setQuantity] = useState('1')
  const [system, setSystem] = useState('')
  const [finish, setFinish] = useState('')
  const [glazing, setGlazing] = useState('')
  const [hardware, setHardware] = useState('')
  const [handle, setHandle] = useState('')
  const [frameProfile, setFrameProfile] = useState('')
  const [sashProfile, setSashProfile] = useState('')
  const [mullionProfile, setMullionProfile] = useState('')
  const presets = useMemo(() => facadeFlowQuickVisualPresets(productType, configuration), [configuration, productType])
  const realSystems = useMemo(() => [...new Set(profiles.filter((profile) => profile.status !== 'DEMONSTRATION').map((profile) => profile.system))].sort(), [profiles])
  const preludeProfileOptions = useMemo(() => ({
    frame: PRELUDE_TECHNICAL_PROFILES.filter((profile) => profile.role === 'FRAME'),
    sash: PRELUDE_TECHNICAL_PROFILES.filter((profile) => profile.role === 'SASH'),
    mullion: PRELUDE_TECHNICAL_PROFILES.filter((profile) => profile.role === 'MULLION'),
  }), [])
  const preludeSystemSelected = isPrelude60System(system)

  useEffect(() => {
    if (presets.some((preset) => preset.id === presetId)) return
    setPresetId(presets[0]?.id ?? '')
  }, [presetId, presets])

  useEffect(() => {
    if (preludeSystemSelected) return
    setFrameProfile('')
    setSashProfile('')
    setMullionProfile('')
  }, [preludeSystemSelected])

  const result = buildFacadeFlowQuickStructuredSelection({
    scope,
    productType,
    configuration,
    presetId,
    widthMm: numberOrNull(widthMm),
    heightMm: numberOrNull(heightMm),
    quantity: numberOrNull(quantity),
    system,
    finish,
    glazing,
    hardware,
    handle,
    frameProfile: preludeSystemSelected ? frameProfile : '',
    sashProfile: preludeSystemSelected ? sashProfile : '',
    mullionProfile: preludeSystemSelected ? mullionProfile : '',
  }, 'quick-select-product-intent')

  return <section className="ff-ai-quick-start" aria-label="Бърз избор на изделие">
    <header>
      <div><span>БЪРЗ СТАРТ · БЕЗ СВОБОДНО ОПИСАНИЕ</span><strong>Избери изделие, размер и готова схема</strong><small>FacadeFlow подготвя структурирано описание вместо теб. Нищо не се приема за production факт без човешка проверка.</small></div>
      <button type="button" className="ff-ai-quick-switch" onClick={onUseTextMode}>✨ Опиши изделието с AI</button>
    </header>

    <div className="ff-ai-quick-howto" aria-label="Как се използва Бърз избор">
      <div><b>1</b><span><strong>Какво е?</strong><small>Избери изделие, размер и количество.</small></span></div>
      <div><b>2</b><span><strong>Как изглежда?</strong><small>Избери готовата схема, която е най-близо до желаното.</small></span></div>
      <div><b>3</b><span><strong>Знаеш ли профилите?</strong><small>Отвори техническите настройки само ако имаш точни данни.</small></span></div>
      <div><b>4</b><span><strong>Готово?</strong><small>Натисни „Използвай този избор“ и провери скицата.</small></span></div>
    </div>

    <div className="ff-ai-quick-grid">
      <label><span>Работен контекст</span><select value={scope} onChange={(event: ChangeEvent<HTMLSelectElement>) => setScope(event.target.value as FacadeFlowQuickScope)}><option value="SINGLE_PRODUCT">Единично изделие</option><option value="OFFER">Оферта / модулна работа</option></select></label>
      <label><span>Изделие</span><select value={productType} onChange={(event: ChangeEvent<HTMLSelectElement>) => setProductType(event.target.value as FacadeFlowQuickProductType)}>{productTypes.map((type) => <option key={type} value={type}>{FACADEFLOW_QUICK_PRODUCT_LABELS[type]}</option>)}</select></label>
      <label><span>Конфигурация</span><select value={configuration} onChange={(event: ChangeEvent<HTMLSelectElement>) => setConfiguration(event.target.value as FacadeFlowQuickConfiguration)}>{configurations.map((item) => <option key={item} value={item}>{FACADEFLOW_QUICK_CONFIGURATION_LABELS[item]}</option>)}</select></label>
      <label><span>Ширина (mm)</span><input list="ff-quick-widths" inputMode="numeric" value={widthMm} onChange={(event) => setWidthMm(event.target.value)}/><datalist id="ff-quick-widths">{dimensionOptions.map((value) => <option key={value} value={value}/>)}</datalist></label>
      <label><span>Височина (mm)</span><input list="ff-quick-heights" inputMode="numeric" value={heightMm} onChange={(event) => setHeightMm(event.target.value)}/><datalist id="ff-quick-heights">{dimensionOptions.map((value) => <option key={value} value={value}/>)}</datalist></label>
      <label><span>Количество</span><select value={quantity} onChange={(event) => setQuantity(event.target.value)}>{quantityOptions.map((value) => <option key={value} value={value}>{value} бр.</option>)}</select></label>
    </div>

    <div className="ff-ai-quick-presets">
      <div className="ff-ai-quick-section-title"><span>ВИЗУАЛНА КОНФИГУРАЦИЯ</span><small>Избери близката схема. После можеш да коригираш отделна клетка с AI или от водения редактор.</small></div>
      {presets.length ? <div className="ff-ai-quick-preset-grid">{presets.map((preset) => <button type="button" key={preset.id} className={preset.id === presetId ? 'selected' : ''} aria-pressed={preset.id === presetId} onClick={() => setPresetId(preset.id)}><span className={`ff-ai-quick-scheme fields-${preset.fieldCount}`}>{preset.states.map((state, index) => <i key={`${preset.id}-${index}`} data-state={state}>{facadeFlowQuickStateShortLabel(state)}</i>)}</span><strong>{preset.labelBg}</strong></button>)}</div> : <div className="ff-ai-quick-custom-route"><b>Нестандартна конфигурация</b><span>Тук не генерираме геометрия по предположение. Премини към „Опиши с AI“ и кажи само нестандартната част.</span><button type="button" onClick={onUseTextMode}>Опиши нестандартната конфигурация</button></div>}
    </div>

    <details className="ff-ai-quick-technical" data-legacy-label="Технически настройки · по желание">
      <summary>3 · Технически настройки · ако ги знаеш</summary>
      <div>
        <label><span>Профилна система</span><select value={system} onChange={(event) => setSystem(event.target.value)}><option value="">Неуточнено</option>{realSystems.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Цвят</span><input value={finish} onChange={(event) => setFinish(event.target.value)} placeholder="напр. RAL 7016"/></label>
        <label><span>Стъклопакет</span><input value={glazing} onChange={(event) => setGlazing(event.target.value)} placeholder="напр. двоен стъклопакет"/></label>
        <label><span>Обков</span><input value={hardware} onChange={(event) => setHardware(event.target.value)} placeholder="напр. Siegenia"/></label>
        <label><span>Дръжка</span><input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="напр. черна"/></label>
        {preludeSystemSelected && <label className="ff-ai-quick-profile-code"><span>Каса · точен код</span><select value={frameProfile} onChange={(event) => setFrameProfile(event.target.value)}><option value="">Не избирай автоматично</option>{preludeProfileOptions.frame.map((profile) => <option key={profile.code} value={profile.code}>{profile.code} · {profile.roleLabelBg} · проверено каталогово сечение</option>)}</select></label>}
        {preludeSystemSelected && <label className="ff-ai-quick-profile-code"><span>Крило · точен код</span><select value={sashProfile} onChange={(event) => setSashProfile(event.target.value)}><option value="">Не избирай автоматично</option>{preludeProfileOptions.sash.map((profile) => <option key={profile.code} value={profile.code}>{profile.code} · {profile.roleLabelBg} · проверено каталогово сечение</option>)}</select></label>}
        {preludeSystemSelected && <label className="ff-ai-quick-profile-code"><span>Делител · точен код</span><select value={mullionProfile} onChange={(event) => setMullionProfile(event.target.value)}><option value="">Не избирай автоматично</option>{preludeProfileOptions.mullion.map((profile) => <option key={profile.code} value={profile.code}>{profile.code} · {profile.roleLabelBg} · проверено каталогово сечение</option>)}</select></label>}
      </div>
      <div className="ff-ai-quick-technical-help"><b>Не знаеш точния код?</b><span>Остави „Неуточнено“ / „Не избирай автоматично“. Това е правилно поведение — FacadeFlow няма да си измисли профил вместо теб.</span></div>
      <small>Списъкът за система използва само реални каталогови системи. За PRELUDE 60 точните кодове се избират изрично; FacadeFlow не приема автоматично, че всяка каса/крило/делител е 482.30 / 482.05 / 482.21.</small>
    </details>

    <div className={`ff-ai-quick-preview ${result.selection ? 'ready' : 'review'}`}>
      <div><span>ДИРЕКТНО СТРУКТУРИРАН ИЗБОР</span><strong>{result.selection?.description ?? 'Нужна е още информация'}</strong><small>{result.reason ?? 'Изборът ще се запише директно в Canonical Product Intent. NLP повторно разчитане не е необходимо; текстът остава само човешко описание.'}</small></div>
      <button type="button" disabled={!result.selection} onClick={() => result.selection && onApplyStructuredSelection(result.selection)}>Използвай този избор</button>
    </div>
    <footer>DIRECT STRUCTURED BINDING: ДА · NLP REPARSE: НЕ · АВТОМАТИЧНО ПРИЕМАНЕ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</footer>
  </section>
}
