import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  buildFacadeFlowGuidedCommand,
  guidedFacadeFlowActionAvailability,
  guidedFacadeFlowCellOptions,
  type FacadeFlowGuidedAction,
  type FacadeFlowGuidedCommandContext,
  type FacadeFlowGuidedDirection,
  type FacadeFlowGuidedOpening,
  type FacadeFlowGuidedOrientation,
  type FacadeFlowGuidedSettingField,
} from '../aiGuidedCommandBuilder'
import type { FacadeFlowOfferSettings } from '../aiPromptOfferModulesRuntime'

export interface FacadeFlowGuidedPreset {
  nonce: number
  action: FacadeFlowGuidedAction
  cellId?: number | null
  moduleNumber?: number | null
  sourceModuleNumber?: number | null
  settingField?: FacadeFlowGuidedSettingField | null
}

interface GuidedAiCommandBuilderProps {
  context: FacadeFlowGuidedCommandContext
  offerDefaults: FacadeFlowOfferSettings
  activeSettings: FacadeFlowOfferSettings | null
  preset?: FacadeFlowGuidedPreset | null
  onApplyCommand: (command: string) => void
  onPrepareCommand: (command: string) => void
  onOpenCatalogues?: () => void
}

const actionLabels: Record<FacadeFlowGuidedAction, string> = {
  CREATE_MODULE: 'Създай нов модул',
  SWITCH_MODULE: 'Отвори друг модул',
  COPY_MODULE: 'Копирай модул',
  SET_QUANTITY: 'Промени количество',
  SET_FRAME: 'Задай или промени размер на касата',
  SPLIT_CELL: 'Раздели клетка',
  SET_FIXED: 'Направи клетка фиксирана',
  ADD_SASH: 'Добави крило',
  CHANGE_SASH: 'Промени крило',
  MOVE_DIVIDER: 'Премести делител',
  DELETE_DIVIDER: 'Изтрий делител',
  SET_OFFER_SETTING: 'Промени обща настройка на офертата',
  SET_MODULE_SETTING: 'Промени настройка само на модул',
  UNDO: 'Върни последната корекция',
  SUMMARY: 'Покажи общ брой изделия',
}

const settingLabels: Record<FacadeFlowGuidedSettingField, string> = {
  system: 'Система',
  finish: 'Цвят',
  glazing: 'Стъклопакет',
  hardware: 'Обков',
  handle: 'Дръжка',
  hinges: 'Панти',
}

const actionHelp: Partial<Record<FacadeFlowGuidedAction, string>> = {
  CREATE_MODULE: 'Използвай това за нов прозорец, врата или друг отделен модул в офертата.',
  SWITCH_MODULE: 'Преминава към вече създаден модул, без да губи неговото състояние.',
  COPY_MODULE: 'Създава нов модул като копие на избран съществуващ модул. Новият модул остава независим.',
  SET_FRAME: 'Касата е външният размер на модула. Избери ширина и височина в милиметри.',
  SPLIT_CELL: 'Разделя само избраната активна клетка. Старият номер на разделената клетка се пенсионира, а новите клетки получават нови номера.',
  SET_FIXED: 'Фиксирана клетка няма отваряемо крило. Това е изрично решение, а не предположение на AI.',
  ADD_SASH: 'Добавя отваряемо крило само в избраната клетка.',
  CHANGE_SASH: 'Променя начина или посоката на отваряне на клетка, в която вече има крило.',
  MOVE_DIVIDER: 'Премества съществуващ делител, без да създава нов.',
  DELETE_DIVIDER: 'Премахва избран делител. Засегнатите клетки могат да получат нов номер според геометричната логика.',
  SET_OFFER_SETTING: 'Променя обща настройка за офертата. Модули с изрична локална промяна запазват своята стойност.',
  SET_MODULE_SETTING: 'Променя стойност само за избрания модул и не засяга останалите.',
  UNDO: 'Връща последната приложена корекция в активния модул.',
  SUMMARY: 'Показва обобщение на количествата, без да променя модули или геометрия.',
}

const helpText = {
  action: 'Започни оттук. Менюто показва само действията, които са възможни в текущото състояние.',
  module: 'Номерът служи за ясно адресиране на модулите в офертата. При нов модул се предлагат само свободни номера.',
  width: 'Избери ширина в милиметри. Ако точният размер не е в бързия списък, избери „Друг размер“ и го въведи.',
  height: 'Избери височина в милиметри. Ако точният размер не е в бързия списък, избери „Друг размер“ и го въведи.',
  quantity: 'Броят изделия от този модул в офертата. Това не променя геометрията.',
  cell: 'Предлагат се само активните клетки. Пенсионирани номера не се показват.',
  orientation: 'Вертикално разделяне създава части една до друга. Хоризонтално разделяне създава части една над друга.',
  parts: 'Броят равни части, на които ще бъде разделена избраната клетка.',
  opening: 'Избери как се отваря крилото. „Отваряемо и падащо“ е двуосно отваряне.',
  direction: 'Посоката се гледа според текущия работен модел. Тя остава за човешка проверка.',
  divider: 'Избери конкретния съществуващ делител по неговия номер.',
  position: 'Новата позиция е в милиметри. Ако не е в бързия списък, използвай „Друга позиция“.',
  setting: 'Избери какво искаш да промениш. Не се показват измислени каталогови варианти.',
  settingValue: 'Ако няма проверени варианти, приложението няма да измисля списък. Можеш да оставиш стойността неуточнена, да въведеш стойност, която знаеш, или да отвориш Данни и каталози.',
}

const dimensionOptions = [
  400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600,
  1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800,
  2900, 3000, 3200, 3500, 4000, 4500, 5000, 6000,
]
const quantityOptions = Array.from({ length: 20 }, (_, index) => index + 1)
const dividerPositionOptions = Array.from({ length: 59 }, (_, index) => (index + 2) * 50)
const CUSTOM_VALUE = '__CUSTOM__'

function numeric(value: string) {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function nextFreeModuleNumbers(existing: number[], count = 12) {
  const used = new Set(existing)
  const output: number[] = []
  for (let candidate = 1; output.length < count && candidate <= 999; candidate += 1) {
    if (!used.has(candidate)) output.push(candidate)
  }
  return output
}

function HelpButton({ id, text, openHelp, setOpenHelp }: { id: string; text: string; openHelp: string | null; setOpenHelp: (value: string | null) => void }) {
  const open = openHelp === id
  return <span className="ff-guided-help-wrap">
    <button type="button" className="ff-guided-help-button" aria-label="Покажи помощ" aria-expanded={open} onClick={() => setOpenHelp(open ? null : id)}>?</button>
    {open && <span className="ff-guided-help-popover" role="tooltip">{text}</span>}
  </span>
}

function FieldLabel({ title, helpId, help, openHelp, setOpenHelp, className, children }: { title: string; helpId: string; help: string; openHelp: string | null; setOpenHelp: (value: string | null) => void; className?: string; children?: ReactNode }) {
  return <label className={className}><span className="ff-guided-field-title">{title}<HelpButton id={helpId} text={help} openHelp={openHelp} setOpenHelp={setOpenHelp}/></span>{children}</label>
}

function SelectNumberOrCustom({ value, setValue, options, label, helpId, help, openHelp, setOpenHelp, customLabel = 'Друг размер', customPlaceholder = 'Въведи стойност' }: {
  value: string
  setValue: (value: string) => void
  options: number[]
  label: string
  helpId: string
  help: string
  openHelp: string | null
  setOpenHelp: (value: string | null) => void
  customLabel?: string
  customPlaceholder?: string
}) {
  const isPreset = options.some((option) => String(option) === value)
  const choice = value && !isPreset ? CUSTOM_VALUE : value
  return <FieldLabel title={label} helpId={helpId} help={help} openHelp={openHelp} setOpenHelp={setOpenHelp}>
    <select value={choice} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValue(event.target.value === CUSTOM_VALUE ? 'custom:' : event.target.value)}>
      <option value="">Избери</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
      <option value={CUSTOM_VALUE}>{customLabel}</option>
    </select>
    {choice === CUSTOM_VALUE && <input inputMode="decimal" value={value.startsWith('custom:') ? value.slice(7) : value} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(`custom:${event.target.value}`)} placeholder={customPlaceholder}/>} 
  </FieldLabel>
}

function resolvedNumericValue(value: string) {
  return numeric(value.startsWith('custom:') ? value.slice(7) : value)
}

export function GuidedAiCommandBuilder({ context, offerDefaults, activeSettings, preset, onApplyCommand, onPrepareCommand, onOpenCatalogues }: GuidedAiCommandBuilderProps) {
  const availability = guidedFacadeFlowActionAvailability(context)
  const firstEnabled = availability.find((entry) => entry.enabled)?.action ?? 'CREATE_MODULE'
  const freeModuleNumbers = useMemo(() => nextFreeModuleNumbers(context.moduleNumbers), [context.moduleNumbers])
  const [action, setAction] = useState<FacadeFlowGuidedAction>(context.activeModuleNumber === null ? 'CREATE_MODULE' : firstEnabled)
  const [moduleNumber, setModuleNumber] = useState(String(context.activeModuleNumber ?? freeModuleNumbers[0] ?? 1))
  const [sourceModuleNumber, setSourceModuleNumber] = useState(String(context.activeModuleNumber ?? context.moduleNumbers[0] ?? ''))
  const [targetModuleNumber, setTargetModuleNumber] = useState(String(freeModuleNumbers[0] ?? 1))
  const [widthMm, setWidthMm] = useState('')
  const [heightMm, setHeightMm] = useState('')
  const [quantity, setQuantity] = useState('')
  const [copyQuantity, setCopyQuantity] = useState('')
  const [cellId, setCellId] = useState('')
  const [orientation, setOrientation] = useState<FacadeFlowGuidedOrientation | ''>('')
  const [parts, setParts] = useState('')
  const [opening, setOpening] = useState<FacadeFlowGuidedOpening | ''>('')
  const [direction, setDirection] = useState<FacadeFlowGuidedDirection | ''>('')
  const [dividerId, setDividerId] = useState('')
  const [positionMm, setPositionMm] = useState('')
  const [settingField, setSettingField] = useState<FacadeFlowGuidedSettingField>('system')
  const [settingValue, setSettingValue] = useState('')
  const [settingChoice, setSettingChoice] = useState('')
  const [manualSettingMode, setManualSettingMode] = useState(false)
  const [openHelp, setOpenHelp] = useState<string | null>(null)

  const cellOptions = guidedFacadeFlowCellOptions(context)
  const selectedAvailability = availability.find((entry) => entry.action === action)
  const unresolvedCells = context.unresolvedCellIds ?? []

  const recommendedActions = useMemo(() => {
    if (action === 'CREATE_MODULE' || action === 'SET_OFFER_SETTING' || action === 'SET_MODULE_SETTING') return []
    const recommendations: FacadeFlowGuidedAction[] = []
    if (context.moduleNumbers.length === 0) recommendations.push('CREATE_MODULE')
    else if (context.activeModuleNumber === null) recommendations.push('SWITCH_MODULE')
    else if (context.cells.length === 0) recommendations.push('SET_FRAME')
    else if (unresolvedCells.length > 0) recommendations.push('SET_FIXED', 'ADD_SASH')
    else recommendations.push('SPLIT_CELL', 'CHANGE_SASH', 'SUMMARY')
    return recommendations.filter((candidate, index, items) => items.indexOf(candidate) === index && availability.find((entry) => entry.action === candidate)?.enabled).slice(0, 4)
  }, [action, availability, context.activeModuleNumber, context.cells.length, context.moduleNumbers.length, unresolvedCells.length])

  const currentSettingValue = useMemo(() => {
    const source = action === 'SET_OFFER_SETTING' ? offerDefaults : activeSettings ?? {}
    const value = source[settingField]
    return value === undefined || value === null || String(value).trim().length === 0 ? '' : String(value)
  }, [action, activeSettings, offerDefaults, settingField])

  const knownSettingValues = useMemo(() => {
    const values = [offerDefaults[settingField], activeSettings?.[settingField]]
      .filter((value): value is string => value !== undefined && value !== null && String(value).trim().length > 0)
      .map((value) => String(value))
    return [...new Set(values)]
  }, [activeSettings, offerDefaults, settingField])

  const alternativeSettingValues = useMemo(
    () => knownSettingValues.filter((value) => value !== currentSettingValue),
    [currentSettingValue, knownSettingValues],
  )

  useEffect(() => {
    if (action === 'CREATE_MODULE' && context.moduleNumbers.includes(Number(moduleNumber))) setModuleNumber(String(freeModuleNumbers[0] ?? ''))
    if (action === 'COPY_MODULE' && context.moduleNumbers.includes(Number(targetModuleNumber))) setTargetModuleNumber(String(freeModuleNumbers[0] ?? ''))
  }, [action, context.moduleNumbers, freeModuleNumbers, moduleNumber, targetModuleNumber])

  useEffect(() => {
    const hasPresetModule = preset?.action === action && preset.moduleNumber !== null && preset.moduleNumber !== undefined
    if (context.activeModuleNumber !== null && action !== 'CREATE_MODULE' && !hasPresetModule) setModuleNumber(String(context.activeModuleNumber))
    if (!sourceModuleNumber && context.moduleNumbers.length) setSourceModuleNumber(String(context.moduleNumbers[0]))
    if (!context.moduleNumbers.includes(Number(targetModuleNumber))) return
    setTargetModuleNumber(String(freeModuleNumbers[0] ?? ''))
  }, [action, context.activeModuleNumber, context.moduleNumbers, freeModuleNumbers, preset, sourceModuleNumber, targetModuleNumber])

  useEffect(() => {
    if (!preset) return
    setAction(preset.action)
    if (preset.cellId !== null && preset.cellId !== undefined) setCellId(String(preset.cellId))
    if (preset.moduleNumber !== null && preset.moduleNumber !== undefined) setModuleNumber(String(preset.moduleNumber))
    if (preset.sourceModuleNumber !== null && preset.sourceModuleNumber !== undefined) setSourceModuleNumber(String(preset.sourceModuleNumber))
    if (preset.settingField) setSettingField(preset.settingField)
  }, [preset])

  useEffect(() => {
    setSettingValue('')
    setSettingChoice('')
    setManualSettingMode(false)
  }, [action, settingField])

  useEffect(() => {
    const relevant = action === 'CHANGE_SASH' ? cellOptions.withSash : action === 'ADD_SASH' ? cellOptions.withoutSash : cellOptions.all
    if (relevant.length && !relevant.some((cell) => String(cell.id) === cellId)) setCellId(String(relevant[0]!.id))
    if (!relevant.length) setCellId('')
  }, [action, cellId, cellOptions.all, cellOptions.withSash, cellOptions.withoutSash])

  useEffect(() => {
    if (context.dividerIds.length && !context.dividerIds.some((id) => String(id) === dividerId)) setDividerId(String(context.dividerIds[0]))
    if (!context.dividerIds.length) setDividerId('')
  }, [context.dividerIds, dividerId])

  const effectiveSettingValue = settingChoice === CUSTOM_VALUE || manualSettingMode ? settingValue : settingChoice
  const result = buildFacadeFlowGuidedCommand({
    action,
    moduleNumber: numeric(moduleNumber),
    sourceModuleNumber: numeric(sourceModuleNumber),
    targetModuleNumber: numeric(targetModuleNumber),
    widthMm: resolvedNumericValue(widthMm),
    heightMm: resolvedNumericValue(heightMm),
    quantity: action === 'COPY_MODULE' ? resolvedNumericValue(copyQuantity) : resolvedNumericValue(quantity),
    cellId: numeric(cellId),
    orientation: orientation || null,
    parts: numeric(parts),
    opening: opening || null,
    direction: direction || null,
    dividerId: numeric(dividerId),
    positionMm: resolvedNumericValue(positionMm),
    settingField,
    settingValue: effectiveSettingValue,
  })

  const cellSelect = (cells: typeof cellOptions.all) => <FieldLabel title="Клетка" helpId="cell" help={helpText.cell} openHelp={openHelp} setOpenHelp={setOpenHelp}>
    <select value={cellId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setCellId(event.target.value)}>
      {cells.map((cell) => <option key={cell.id} value={cell.id}>Клетка {cell.id}{cell.hasSash ? ' · има крило' : unresolvedCells.includes(cell.id) ? ' · неуточнена' : ' · без крило'}</option>)}
    </select>
  </FieldLabel>

  const moduleSelect = (value: string, setter: (value: string) => void, title = 'Модул') => <FieldLabel title={title} helpId={`${title}-${action}`} help={helpText.module} openHelp={openHelp} setOpenHelp={setOpenHelp}>
    <select value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => setter(event.target.value)}>{context.moduleNumbers.map((number) => <option key={number} value={number}>Модул {number}</option>)}</select>
  </FieldLabel>

  return <section className="ff-guided-ai-builder" aria-label="AI помощник във воден режим">
    <header>
      <div><span>AI ПОМОЩНИК · ВОДЕН РЕЖИМ</span><h5>Избираш, проверяваш и прилагаш</h5><p>Не е нужно да знаеш техническите команди. Помощникът показва само възможните действия и наличните стойности от текущия контекст.</p></div>
      <b>САМО ЗА ЧОВЕШКИ ПРЕГЛЕД</b>
    </header>

    <div className="ff-guided-ai-steps" aria-label="Стъпки на водения режим">
      <span className="done"><b>1</b><strong>Избрано действие</strong></span>
      <span className={result.command ? 'done' : 'active'}><b>2</b><strong>Избери параметри</strong></span>
      <span className={result.command ? 'active' : ''}><b>3</b><strong>Провери и приложи</strong></span>
    </div>

    {recommendedActions.length > 0 && <div className="ff-guided-ai-recommendations"><span>ПРЕПОРЪЧАНИ СЛЕДВАЩИ ДЕЙСТВИЯ</span><div>{recommendedActions.map((candidate) => <button type="button" key={candidate} onClick={() => setAction(candidate)}>{actionLabels[candidate]}</button>)}</div></div>}

    <div className="ff-guided-ai-grid">
      <FieldLabel title="Какво искаш да направиш?" helpId="action" help={helpText.action} openHelp={openHelp} setOpenHelp={setOpenHelp} className="wide">
        <select value={action} onChange={(event: ChangeEvent<HTMLSelectElement>) => setAction(event.target.value as FacadeFlowGuidedAction)}>{availability.map((entry) => <option key={entry.action} value={entry.action} disabled={!entry.enabled}>{actionLabels[entry.action]}{entry.enabled ? '' : ` · ${entry.reason}`}</option>)}</select>
        {actionHelp[action] && <small className="ff-guided-inline-explanation">{actionHelp[action]}</small>}
      </FieldLabel>

      {action === 'CREATE_MODULE' && <>
        <FieldLabel title="Номер на новия модул" helpId="new-module" help={helpText.module} openHelp={openHelp} setOpenHelp={setOpenHelp}>
          <select value={moduleNumber} onChange={(event: ChangeEvent<HTMLSelectElement>) => setModuleNumber(event.target.value)}>{freeModuleNumbers.map((number) => <option key={number} value={number}>Модул {number}</option>)}</select>
          <small className="ff-guided-inline-explanation">{context.moduleNumbers.length ? `Следващият свободен номер е Модул ${freeModuleNumbers[0] ?? '—'}.` : 'Първият свободен номер е предложен автоматично.'}</small>
        </FieldLabel>
        <SelectNumberOrCustom value={widthMm} setValue={setWidthMm} options={dimensionOptions} label="Ширина (mm)" helpId="width" help={helpText.width} openHelp={openHelp} setOpenHelp={setOpenHelp}/>
        <SelectNumberOrCustom value={heightMm} setValue={setHeightMm} options={dimensionOptions} label="Височина (mm)" helpId="height" help={helpText.height} openHelp={openHelp} setOpenHelp={setOpenHelp}/>
        <SelectNumberOrCustom value={quantity} setValue={setQuantity} options={quantityOptions} label="Количество" helpId="quantity" help={helpText.quantity} openHelp={openHelp} setOpenHelp={setOpenHelp} customLabel="Друго количество" customPlaceholder="Въведи количество"/>
      </>}

      {action === 'SWITCH_MODULE' && moduleSelect(moduleNumber, setModuleNumber)}

      {action === 'COPY_MODULE' && <>
        {moduleSelect(sourceModuleNumber, setSourceModuleNumber, 'Копирай от')}
        <FieldLabel title="Нов модул" helpId="copy-target" help="Избери свободен номер за копието. Съществуващ модул няма да бъде презаписан." openHelp={openHelp} setOpenHelp={setOpenHelp}>
          <select value={targetModuleNumber} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTargetModuleNumber(event.target.value)}>{freeModuleNumbers.map((number) => <option key={number} value={number}>Модул {number}</option>)}</select>
        </FieldLabel>
        <SelectNumberOrCustom value={copyQuantity} setValue={setCopyQuantity} options={quantityOptions} label="Количество на копието (по желание)" helpId="copy-quantity" help={helpText.quantity} openHelp={openHelp} setOpenHelp={setOpenHelp} customLabel="Друго количество" customPlaceholder="Въведи количество"/>
      </>}

      {action === 'SET_QUANTITY' && <>{moduleSelect(moduleNumber, setModuleNumber)}<SelectNumberOrCustom value={quantity} setValue={setQuantity} options={quantityOptions} label="Количество" helpId="quantity-edit" help={helpText.quantity} openHelp={openHelp} setOpenHelp={setOpenHelp} customLabel="Друго количество" customPlaceholder="Въведи количество"/></>}

      {action === 'SET_FRAME' && <>
        {moduleSelect(moduleNumber, setModuleNumber)}
        <SelectNumberOrCustom value={widthMm} setValue={setWidthMm} options={dimensionOptions} label="Ширина (mm)" helpId="width-edit" help={helpText.width} openHelp={openHelp} setOpenHelp={setOpenHelp}/>
        <SelectNumberOrCustom value={heightMm} setValue={setHeightMm} options={dimensionOptions} label="Височина (mm)" helpId="height-edit" help={helpText.height} openHelp={openHelp} setOpenHelp={setOpenHelp}/>
      </>}

      {action === 'SPLIT_CELL' && <>
        {cellSelect(cellOptions.all)}
        <FieldLabel title="Посока на разделяне" helpId="orientation" help={helpText.orientation} openHelp={openHelp} setOpenHelp={setOpenHelp}><select value={orientation} onChange={(event: ChangeEvent<HTMLSelectElement>) => setOrientation(event.target.value as FacadeFlowGuidedOrientation)}><option value="">Избери посока</option><option value="VERTICAL">Вертикално</option><option value="HORIZONTAL">Хоризонтално</option></select></FieldLabel>
        <FieldLabel title="Равни части" helpId="parts" help={helpText.parts} openHelp={openHelp} setOpenHelp={setOpenHelp}><select value={parts} onChange={(event: ChangeEvent<HTMLSelectElement>) => setParts(event.target.value)}><option value="">Избери брой части</option><option value="2">2 части</option><option value="3">3 части</option><option value="4">4 части</option><option value="5">5 части</option><option value="6">6 части</option></select></FieldLabel>
      </>}

      {action === 'SET_FIXED' && cellSelect(cellOptions.all)}

      {(action === 'ADD_SASH' || action === 'CHANGE_SASH') && <>
        {cellSelect(action === 'ADD_SASH' ? cellOptions.withoutSash : cellOptions.withSash)}
        <FieldLabel title="Начин на отваряне" helpId="opening" help={helpText.opening} openHelp={openHelp} setOpenHelp={setOpenHelp}><select value={opening} onChange={(event: ChangeEvent<HTMLSelectElement>) => setOpening(event.target.value as FacadeFlowGuidedOpening)}><option value="">Избери начин</option><option value="TURN">Отваряемо</option><option value="TILT_TURN">Отваряемо и падащо (двуосно)</option></select></FieldLabel>
        <FieldLabel title="Посока" helpId="direction" help={helpText.direction} openHelp={openHelp} setOpenHelp={setOpenHelp}><select value={direction} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDirection(event.target.value as FacadeFlowGuidedDirection)}><option value="">Избери посока</option><option value="LEFT">Ляво</option><option value="RIGHT">Дясно</option></select></FieldLabel>
      </>}

      {(action === 'MOVE_DIVIDER' || action === 'DELETE_DIVIDER') && <FieldLabel title="Делител" helpId="divider" help={helpText.divider} openHelp={openHelp} setOpenHelp={setOpenHelp}><select value={dividerId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDividerId(event.target.value)}>{context.dividerIds.map((id) => <option key={id} value={id}>Делител {id}</option>)}</select></FieldLabel>}
      {action === 'MOVE_DIVIDER' && <SelectNumberOrCustom value={positionMm} setValue={setPositionMm} options={dividerPositionOptions} label="Нова позиция (mm)" helpId="position" help={helpText.position} openHelp={openHelp} setOpenHelp={setOpenHelp} customLabel="Друга позиция" customPlaceholder="Въведи позиция"/>}

      {(action === 'SET_OFFER_SETTING' || action === 'SET_MODULE_SETTING') && <>
        <FieldLabel title="Параметър" helpId="setting" help={helpText.setting} openHelp={openHelp} setOpenHelp={setOpenHelp}><select value={settingField} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSettingField(event.target.value as FacadeFlowGuidedSettingField)}>{Object.entries(settingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FieldLabel>
        {action === 'SET_MODULE_SETTING' && moduleSelect(moduleNumber, setModuleNumber)}
        <div className="ff-guided-catalog-fallback wide">
          <div className="ff-guided-catalog-fallback-head">
            <div><span>БЕЗОПАСЕН ИЗБОР</span><strong>{currentSettingValue ? `Текуща стойност: ${currentSettingValue}` : `${settingLabels[settingField]}: НЕУТОЧНЕНО`}</strong></div>
            <HelpButton id="setting-value" text="Когато няма проверени каталогови варианти, приложението не измисля списък. Можеш да оставиш стойността без промяна, да въведеш стойност, която знаеш, или да отвориш Данни и каталози." openHelp={openHelp} setOpenHelp={setOpenHelp}/>
          </div>
          {alternativeSettingValues.length > 0 ? <>
            <label><span>Избери налична известна стойност</span><select value={settingChoice} onChange={(event: ChangeEvent<HTMLSelectElement>) => { setManualSettingMode(false); setSettingChoice(event.target.value); setSettingValue('') }}><option value="">Избери стойност</option>{alternativeSettingValues.map((value) => <option key={value} value={value}>{value}</option>)}<option value={CUSTOM_VALUE}>Стойност, която знам</option></select></label>
          </> : <div className="ff-guided-no-catalogue-values"><b>Няма заредени други проверени варианти за {settingLabels[settingField].toLowerCase()}.</b><p>Няма да ти показваме измислени модели или стойности. Избери как искаш да продължиш.</p></div>}
          <div className="ff-guided-safe-choice-actions">
            <button type="button" onClick={() => { setManualSettingMode(false); setSettingChoice(''); setSettingValue('') }}>{currentSettingValue ? 'Остави без промяна' : 'Остави неуточнено'}</button>
            <button type="button" onClick={() => { setManualSettingMode(true); setSettingChoice(CUSTOM_VALUE); setSettingValue('') }}>Въведи стойност, която знам</button>
            <button type="button" onClick={onOpenCatalogues} disabled={!onOpenCatalogues}>Отвори Данни и каталози</button>
          </div>
          {(manualSettingMode || settingChoice === CUSTOM_VALUE) && <label className="ff-guided-known-value-entry"><span>Стойност, която знаеш</span><input value={settingValue} onChange={(event: ChangeEvent<HTMLInputElement>) => setSettingValue(event.target.value)} placeholder="Въведи само стойност, която имаш от клиент, документ или каталог"/><small>Тази стойност остава за човешка проверка и не става автоматично производствен факт.</small></label>}
        </div>
      </>}
    </div>

    <div className={`ff-guided-ai-preview ${result.command ? 'ready' : 'review'}`}>
      <div><span>ПРЕГЛЕД НА ИЗБОРА</span><strong>{result.command ?? 'Нужни са още параметри'}</strong><small>{result.reason ?? 'Провери какво ще бъде приложено към работната чернова.'}</small></div>
      <div className="ff-guided-preview-actions"><button type="button" className="primary" disabled={!result.command || selectedAvailability?.enabled === false} onClick={() => result.command && onApplyCommand(result.command)}>Приложи избора</button><details><summary>Допълнителни опции</summary><button type="button" disabled={!result.command || selectedAvailability?.enabled === false} onClick={() => result.command && onPrepareCommand(result.command)}>Прегледай като текст</button></details></div>
    </div>
    <footer>Менютата използват само текущия контекст и вече известните стойности. Непотвърдени каталогови варианти не се измислят. За нестандартна стойност остава възможност за ръчно въвеждане и човешка проверка.</footer>
  </section>
}
