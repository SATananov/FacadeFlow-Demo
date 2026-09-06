import { interpretFacadeFlowPrompt } from './aiPromptInterpreter'
import {
  applyFacadeFlowMultiModuleCommand,
  createFacadeFlowMultiModuleInteractiveRuntime,
  type FacadeFlowMultiModuleInteractiveRuntime,
} from './aiPromptMultiModuleInteractiveRuntime'

export type FacadeFlowOfferRuntimeStatus = 'EMPTY' | 'APPLIED' | 'REVIEW_REQUIRED'
export type FacadeFlowOfferRuntimeEventKind = 'OFFER_CONTEXT' | 'OFFER_DEFAULTS' | 'OFFER_REVISION' | 'MODULE_OVERRIDE' | 'MULTI_MODULE_COMMAND' | 'UNRESOLVED'
export type FacadeFlowOfferSettingField = 'system' | 'finish' | 'glazing' | 'hardware' | 'handle' | 'hinges' | 'hingeQuantity'

export interface FacadeFlowOfferSettings {
  system?: string
  finish?: string
  glazing?: string
  hardware?: string
  handle?: string
  hinges?: string
  hingeQuantity?: number
}

export interface FacadeFlowOfferModuleSettingsView {
  moduleNumber: number
  overrides: FacadeFlowOfferSettings
  effective: FacadeFlowOfferSettings
  inheritedFields: FacadeFlowOfferSettingField[]
  overrideFields: FacadeFlowOfferSettingField[]
}

export interface FacadeFlowOfferRuntimeEvent {
  step: number
  command: string
  kind: FacadeFlowOfferRuntimeEventKind
  status: FacadeFlowOfferRuntimeStatus
  applied: boolean
  stateChanged: boolean
  targetModuleNumber: number | null
  fields: FacadeFlowOfferSettingField[]
  reason: string | null
}

export interface FacadeFlowOfferModulesRuntime {
  schemaVersion: 'AI-PROMPT-OFFER-MODULES-RUNTIME-01'
  mode: 'LOCAL_DETERMINISTIC_OFFER_MODULES_RUNTIME_DRAFT'
  interpretationId: string
  sourceText: string
  customerName: string | null
  offerReference: string | null
  defaults: FacadeFlowOfferSettings
  defaultsRevision: number
  moduleOverrides: Record<number, FacadeFlowOfferSettings>
  moduleSettings: FacadeFlowOfferModuleSettingsView[]
  multiModule: FacadeFlowMultiModuleInteractiveRuntime
  events: FacadeFlowOfferRuntimeEvent[]
  lastCommand: string | null
  lastCommandStatus: FacadeFlowOfferRuntimeStatus
  lastCommandKind: FacadeFlowOfferRuntimeEventKind | null
  lastCommandReason: string | null
  visibleStateKey: string
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface MutableOfferState {
  interpretationId: string
  customerName: string | null
  offerReference: string | null
  defaults: FacadeFlowOfferSettings
  defaultsRevision: number
  moduleOverrides: Record<number, FacadeFlowOfferSettings>
  multiModule: FacadeFlowMultiModuleInteractiveRuntime
  events: FacadeFlowOfferRuntimeEvent[]
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
const SETTING_FIELDS: FacadeFlowOfferSettingField[] = ['system', 'finish', 'glazing', 'hardware', 'handle', 'hinges', 'hingeQuantity']

function splitCommands(sourceText: string) {
  return sourceText.split(/\s*\|\s*|\r?\n+/g).map(normalize).filter(Boolean)
}

function parseCustomer(command: string) {
  const match = /(?:оферта|offer)\s+(?:за|for)\s+([^,;|]+)/iu.exec(command)
  return match?.[1]?.trim() || null
}

function parseOfferReference(command: string) {
  const match = /(?:оферта|offer)\s*(?:№|#|no\.?|номер)?\s*([A-ZА-Я0-9][A-ZА-Я0-9._/-]{1,30})/iu.exec(command)
  if (!match) return null
  const value = match[1]?.trim() || null
  if (!value || /^(?:за|for)$/iu.test(value)) return null
  return value
}

function moduleTarget(command: string) {
  const match = /(?:модул|module)\s*#?\s*(\d+)/iu.exec(command)
  return match ? Number(match[1]) : null
}

function isOfferScope(command: string) {
  return /(?:за\s+цялата\s+оферта|цялата\s+оферта|общите\s+настройки|offer-wide|whole\s+offer|offer\s+defaults)/iu.test(command)
    || (/(?:оферта|offer)/iu.test(command) && moduleTarget(command) === null)
}

function isModuleGeometryCommand(command: string) {
  return /(?:каса|frame|делител|divider|mullion|раздели|split|крило|sash|клетка|cell|премести|move|махни|премахни|delete|remove|върни|отмени|undo|фикс|fixed|създай\s+модул|create\s+module|отвори\s+модул|open\s+module|копирай\s+модул|copy\s+module|дублирай\s+модул|duplicate\s+module)/iu.test(command)
}

function sharedSettings(command: string) {
  const parsed = interpretFacadeFlowPrompt(command, 'offer-runtime-settings')
  const recognized = new Set(parsed.recognized.map((entry) => entry.id))
  const settings: FacadeFlowOfferSettings = {}
  const fields: FacadeFlowOfferSettingField[] = []
  if (recognized.has('system') && parsed.intent.profiles.system) { settings.system = parsed.intent.profiles.system; fields.push('system') }
  if (recognized.has('finish') && parsed.intent.finish.exterior) { settings.finish = parsed.intent.finish.exterior; fields.push('finish') }
  if (recognized.has('glazing') && parsed.intent.glazing.description) { settings.glazing = parsed.intent.glazing.description; fields.push('glazing') }
  if (recognized.has('hardware') && parsed.intent.hardwareDefaults.mechanism) { settings.hardware = parsed.intent.hardwareDefaults.mechanism; fields.push('hardware') }
  if (recognized.has('handle') && parsed.intent.hardwareDefaults.handle) { settings.handle = parsed.intent.hardwareDefaults.handle; fields.push('handle') }
  if (recognized.has('hinges') && parsed.intent.hardwareDefaults.hinges) { settings.hinges = parsed.intent.hardwareDefaults.hinges; fields.push('hinges') }
  if (recognized.has('hinge-quantity') && parsed.intent.hardwareDefaults.hingeQuantity) { settings.hingeQuantity = parsed.intent.hardwareDefaults.hingeQuantity; fields.push('hingeQuantity') }
  const conflict = parsed.unresolved.some((item) => /Конфликт за/iu.test(item))
  return { settings, fields: [...new Set(fields)], conflict }
}

function mergeSettings(base: FacadeFlowOfferSettings, patch: FacadeFlowOfferSettings) {
  return { ...base, ...patch }
}

function cloneSettings(settings: FacadeFlowOfferSettings) {
  return { ...settings }
}

function effectiveSettings(defaults: FacadeFlowOfferSettings, overrides: FacadeFlowOfferSettings) {
  return { ...defaults, ...overrides }
}

function fieldsPresent(settings: FacadeFlowOfferSettings) {
  return SETTING_FIELDS.filter((field) => settings[field] !== undefined)
}

function settingsKey(settings: FacadeFlowOfferSettings) {
  return SETTING_FIELDS.map((field) => `${field}=${settings[field] ?? ''}`).join(',')
}

function stateKey(state: MutableOfferState) {
  const overrideKey = Object.entries(state.moduleOverrides)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([moduleNumber, overrides]) => `${moduleNumber}[${settingsKey(overrides)}]`)
    .join('|')
  return `rev=${state.defaultsRevision}|defaults=${settingsKey(state.defaults)}|multi=${state.multiModule.visibleStateKey}|overrides=${overrideKey}`
}

function pushEvent(
  state: MutableOfferState,
  command: string,
  kind: FacadeFlowOfferRuntimeEventKind,
  status: FacadeFlowOfferRuntimeStatus,
  applied: boolean,
  stateChanged: boolean,
  targetModuleNumber: number | null,
  fields: FacadeFlowOfferSettingField[],
  reason: string | null,
) {
  state.events.push({ step: state.events.length + 1, command, kind, status, applied, stateChanged, targetModuleNumber, fields, reason })
}

function copyOverridesIfNeeded(
  before: FacadeFlowMultiModuleInteractiveRuntime,
  after: FacadeFlowMultiModuleInteractiveRuntime,
  overrides: Record<number, FacadeFlowOfferSettings>,
) {
  const event = after.events.at(-1)
  if (event?.kind !== 'COPY_MODULE' || event.status !== 'APPLIED' || event.targetModuleNumber === null) return overrides
  const commandMatch = /(?:копирай|дублирай|copy|duplicate)\s+(?:модул|module)\s*#?\s*(\d+)\s+(?:като|в|as|to)\s+(?:модул|module)\s*#?\s*(\d+)/iu.exec(event.command)
  if (!commandMatch) return overrides
  const source = Number(commandMatch[1])
  const target = Number(commandMatch[2])
  if (before.modules.some((entry) => entry.moduleNumber === target)) return overrides
  return { ...overrides, [target]: cloneSettings(overrides[source] ?? {}) }
}

function applyOne(state: MutableOfferState, rawCommand: string) {
  const command = normalize(rawCommand)
  if (!command) return
  const beforeKey = stateKey(state)
  const parsedSettings = sharedSettings(command)
  const targetModuleNumber = moduleTarget(command)

  const customer = parseCustomer(command)
  if (customer) state.customerName = customer
  const reference = parseOfferReference(command)
  if (reference) state.offerReference = reference

  const opensOfferContext = /(?:нова\s+оферта|new\s+offer)/iu.test(command)
  if (parsedSettings.fields.length === 0 && targetModuleNumber === null && opensOfferContext) {
    pushEvent(state, command, 'OFFER_CONTEXT', 'APPLIED', true, false, null, [], null)
    return
  }

  if (parsedSettings.conflict) {
    pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, targetModuleNumber, parsedSettings.fields, 'Командата съдържа конфликтни общи настройки и не е приложена.')
    return
  }

  const offerContextActive = state.events.some((event) => event.kind === 'OFFER_CONTEXT')
    || state.customerName !== null
    || state.offerReference !== null

  if (parsedSettings.fields.length > 0 && (isOfferScope(command) || (targetModuleNumber === null && state.multiModule.modules.length === 0 && offerContextActive))) {
    state.defaults = mergeSettings(state.defaults, parsedSettings.settings)
    state.defaultsRevision += 1
    pushEvent(state, command, state.defaultsRevision === 1 ? 'OFFER_DEFAULTS' : 'OFFER_REVISION', 'APPLIED', true, beforeKey !== stateKey(state), null, parsedSettings.fields, null)
    return
  }

  if (parsedSettings.fields.length > 0 && targetModuleNumber !== null) {
    const beforeMulti = state.multiModule
    if (isModuleGeometryCommand(command)) {
      state.multiModule = applyFacadeFlowMultiModuleCommand(state.multiModule, command)
      if (state.multiModule.lastCommandStatus === 'REVIEW_REQUIRED') {
        pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, targetModuleNumber, parsedSettings.fields, state.multiModule.lastCommandReason ?? 'Модулната команда изисква уточнение.')
        return
      }
      state.moduleOverrides = copyOverridesIfNeeded(beforeMulti, state.multiModule, state.moduleOverrides)
    } else if (!state.multiModule.modules.some((entry) => entry.moduleNumber === targetModuleNumber)) {
      pushEvent(state, command, 'MODULE_OVERRIDE', 'REVIEW_REQUIRED', false, false, targetModuleNumber, parsedSettings.fields, `Модул ${targetModuleNumber} не съществува.`)
      return
    }
    state.moduleOverrides = {
      ...state.moduleOverrides,
      [targetModuleNumber]: mergeSettings(state.moduleOverrides[targetModuleNumber] ?? {}, parsedSettings.settings),
    }
    pushEvent(state, command, 'MODULE_OVERRIDE', 'APPLIED', true, beforeKey !== stateKey(state), targetModuleNumber, parsedSettings.fields, null)
    return
  }

  if (parsedSettings.fields.length > 0) {
    pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, null, parsedSettings.fields, 'Настройката няма еднозначен scope: цяла оферта или конкретен модул.')
    return
  }

  if (isModuleGeometryCommand(command) || /(?:модул|module)/iu.test(command)) {
    const beforeMulti = state.multiModule
    const nextMulti = applyFacadeFlowMultiModuleCommand(state.multiModule, command)
    state.multiModule = nextMulti
    state.moduleOverrides = copyOverridesIfNeeded(beforeMulti, nextMulti, state.moduleOverrides)
    const review = nextMulti.lastCommandStatus === 'REVIEW_REQUIRED'
    pushEvent(state, command, 'MULTI_MODULE_COMMAND', review ? 'REVIEW_REQUIRED' : 'APPLIED', !review, beforeKey !== stateKey(state), nextMulti.activeModuleNumber, [], review ? nextMulti.lastCommandReason : null)
    return
  }

  pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, null, [], 'Командата не е разпозната като безопасна offer/module операция.')
}

function materialize(state: MutableOfferState): FacadeFlowOfferModulesRuntime {
  const moduleSettings: FacadeFlowOfferModuleSettingsView[] = state.multiModule.modules.map((entry) => {
    const overrides = cloneSettings(state.moduleOverrides[entry.moduleNumber] ?? {})
    const overrideFields = fieldsPresent(overrides)
    return {
      moduleNumber: entry.moduleNumber,
      overrides,
      effective: effectiveSettings(state.defaults, overrides),
      inheritedFields: fieldsPresent(state.defaults).filter((field) => !overrideFields.includes(field)),
      overrideFields,
    }
  })
  const last = state.events.at(-1) ?? null
  return {
    schemaVersion: 'AI-PROMPT-OFFER-MODULES-RUNTIME-01',
    mode: 'LOCAL_DETERMINISTIC_OFFER_MODULES_RUNTIME_DRAFT',
    interpretationId: state.interpretationId,
    sourceText: state.events.map((event) => event.command).join(' | '),
    customerName: state.customerName,
    offerReference: state.offerReference,
    defaults: cloneSettings(state.defaults),
    defaultsRevision: state.defaultsRevision,
    moduleOverrides: Object.fromEntries(Object.entries(state.moduleOverrides).map(([key, value]) => [Number(key), cloneSettings(value)])),
    moduleSettings,
    multiModule: state.multiModule,
    events: state.events.map((event) => ({ ...event, fields: [...event.fields] })),
    lastCommand: last?.command ?? null,
    lastCommandStatus: last?.status ?? 'EMPTY',
    lastCommandKind: last?.kind ?? null,
    lastCommandReason: last?.reason ?? null,
    visibleStateKey: stateKey(state),
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

function mutableFrom(runtime: FacadeFlowOfferModulesRuntime): MutableOfferState {
  return {
    interpretationId: runtime.interpretationId,
    customerName: runtime.customerName,
    offerReference: runtime.offerReference,
    defaults: cloneSettings(runtime.defaults),
    defaultsRevision: runtime.defaultsRevision,
    moduleOverrides: Object.fromEntries(Object.entries(runtime.moduleOverrides).map(([key, value]) => [Number(key), cloneSettings(value)])),
    multiModule: runtime.multiModule,
    events: runtime.events.map((event) => ({ ...event, fields: [...event.fields] })),
  }
}

export function isFacadeFlowOfferModulesRuntimeCandidate(sourceText: string) {
  return /(?:оферта|offer)/iu.test(sourceText)
}

export function createFacadeFlowOfferModulesRuntime(initialSourceText = '', interpretationId = 'offer-modules-runtime') {
  const state: MutableOfferState = {
    interpretationId,
    customerName: null,
    offerReference: null,
    defaults: {},
    defaultsRevision: 0,
    moduleOverrides: {},
    multiModule: createFacadeFlowMultiModuleInteractiveRuntime('', `${interpretationId}-multi`),
    events: [],
  }
  for (const command of splitCommands(initialSourceText)) applyOne(state, command)
  return materialize(state)
}

export function applyFacadeFlowOfferModulesCommand(runtime: FacadeFlowOfferModulesRuntime, command: string) {
  const normalized = normalize(command)
  if (!normalized) return runtime
  const state = mutableFrom(runtime)
  applyOne(state, normalized)
  return materialize(state)
}

export function clearFacadeFlowOfferModulesRuntime(runtime: FacadeFlowOfferModulesRuntime) {
  return createFacadeFlowOfferModulesRuntime('', runtime.interpretationId)
}
