import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  FACADEFLOW_QUICK_CONFIGURATION_LABELS,
  FACADEFLOW_QUICK_PRODUCT_LABELS,
  buildFacadeFlowQuickOfferModulePlan,
  facadeFlowQuickStateShortLabel,
  facadeFlowQuickVisualPresets,
  type FacadeFlowQuickConfiguration,
  type FacadeFlowQuickProductType,
} from '../aiProductQuickSelect'
import type { FacadeFlowOfferSettings } from '../aiPromptOfferModulesRuntime'

const productTypes: FacadeFlowQuickProductType[] = ['WINDOW', 'DOOR', 'BALCONY_DOOR', 'SLIDING_SYSTEM']
const configurations: FacadeFlowQuickConfiguration[] = ['ONE_FIELD', 'TWO_FIELD', 'THREE_FIELD', 'FOUR_FIELD', 'FIVE_FIELD', 'CUSTOM']
const quantityOptions = [1, 2, 3, 4, 5, 6, 10]

function positiveNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function defaultsSummary(defaults: FacadeFlowOfferSettings) {
  return [
    ['Система', defaults.system],
    ['Цвят', defaults.finish],
    ['Стъклопакет', defaults.glazing],
    ['Обков', defaults.hardware],
  ] as const
}

export function OfferModuleQuickSelect({ existingModuleNumbers, offerDefaults, onApplyPlan, onUseGuidedEditor }: {
  existingModuleNumbers: readonly number[]
  offerDefaults: FacadeFlowOfferSettings
  onApplyPlan: (commands: string[], moduleNumber: number) => void
  onUseGuidedEditor: () => void
}) {
  const [productType, setProductType] = useState<FacadeFlowQuickProductType>('WINDOW')
  const [configuration, setConfiguration] = useState<FacadeFlowQuickConfiguration>('THREE_FIELD')
  const [presetId, setPresetId] = useState('THREE_FIXED_TTR_FIXED')
  const [widthMm, setWidthMm] = useState('1200')
  const [heightMm, setHeightMm] = useState('1400')
  const [quantity, setQuantity] = useState('1')
  const presets = useMemo(() => facadeFlowQuickVisualPresets(productType, configuration), [configuration, productType])

  useEffect(() => {
    if (presets.some((preset) => preset.id === presetId)) return
    setPresetId(presets[0]?.id ?? '')
  }, [presetId, presets])

  const plan = buildFacadeFlowQuickOfferModulePlan({
    existingModuleNumbers,
    productType,
    configuration,
    presetId,
    widthMm: positiveNumber(widthMm),
    heightMm: positiveNumber(heightMm),
    quantity: positiveNumber(quantity),
  })

  return <section className="ff-offer-quick-module" aria-label="Бързо добавяне на модул">
    <header><div><span>БЪРЗ ИЗБОР · НОВ МОДУЛ</span><strong>Изделие → схема → размер → брой</strong><small>Новият модул автоматично наследява общите настройки на офертата. Локална промяна се прави след създаването.</small></div><button type="button" onClick={onUseGuidedEditor}>Фина редакция</button></header>

    <div className="ff-offer-quick-inherited"><b>НАСЛЕДЯВА ОТ ОФЕРТАТА</b>{defaultsSummary(offerDefaults).map(([label, value]) => <span key={label}><small>{label}</small><strong>{value ?? 'НЕУТОЧНЕНО'}</strong></span>)}</div>

    <div className="ff-offer-quick-fields">
      <label><span>Изделие</span><select value={productType} onChange={(event: ChangeEvent<HTMLSelectElement>) => setProductType(event.target.value as FacadeFlowQuickProductType)}>{productTypes.map((type) => <option key={type} value={type}>{FACADEFLOW_QUICK_PRODUCT_LABELS[type]}</option>)}</select></label>
      <label><span>Конфигурация</span><select value={configuration} onChange={(event: ChangeEvent<HTMLSelectElement>) => setConfiguration(event.target.value as FacadeFlowQuickConfiguration)}>{configurations.map((item) => <option key={item} value={item}>{FACADEFLOW_QUICK_CONFIGURATION_LABELS[item]}</option>)}</select></label>
      <label><span>Ширина (mm)</span><input inputMode="numeric" value={widthMm} onChange={(event) => setWidthMm(event.target.value)}/></label>
      <label><span>Височина (mm)</span><input inputMode="numeric" value={heightMm} onChange={(event) => setHeightMm(event.target.value)}/></label>
      <label><span>Количество</span><select value={quantity} onChange={(event) => setQuantity(event.target.value)}>{quantityOptions.map((value) => <option key={value} value={value}>{value} бр.</option>)}</select></label>
    </div>

    {presets.length ? <div className="ff-offer-quick-schemes">{presets.map((preset) => <button type="button" key={preset.id} className={preset.id === presetId ? 'selected' : ''} aria-pressed={preset.id === presetId} onClick={() => setPresetId(preset.id)}><span className={`ff-ai-quick-scheme fields-${preset.fieldCount}`}>{preset.states.map((state, index) => <i key={`${preset.id}-${index}`} data-state={state}>{facadeFlowQuickStateShortLabel(state)}</i>)}</span><strong>{preset.labelBg}</strong></button>)}</div> : <div className="ff-offer-quick-route"><b>Нестандартна схема</b><span>Използвай водения редактор или свободното AI описание. Не се създава автоматична геометрия по предположение.</span></div>}

    <div className={`ff-offer-quick-plan ${plan.commands.length ? 'ready' : 'review'}`}>
      <div><span>{plan.moduleNumber ? `ЩЕ СЕ СЪЗДАДЕ МОДУЛ ${plan.moduleNumber}` : 'ИЗБОРЪТ ЧАКА УТОЧНЕНИЕ'}</span><strong>{plan.commands.length ? plan.commands.join(' → ') : plan.reason}</strong><small>{plan.commands.length ? 'Командите се прилагат последователно само към офертната чернова.' : 'Нищо не е приложено.'}</small></div>
      <button type="button" disabled={!plan.moduleNumber || !plan.commands.length} onClick={() => plan.moduleNumber && plan.commands.length && onApplyPlan(plan.commands, plan.moduleNumber)}>＋ Добави модула</button>
    </div>
    <footer>НАСЛЕДЯВАНЕ: ДА · HUMAN REVIEW: ЗАДЪЛЖИТЕЛЕН · АВТОМАТИЧНА PRODUCTION ГЕОМЕТРИЯ: НЕ</footer>
  </section>
}
