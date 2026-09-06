import {
  applyFacadeFlowOfferModulesCommand,
  createFacadeFlowOfferModulesRuntime,
  type FacadeFlowOfferModulesRuntime,
} from './aiPromptOfferModulesRuntime'

export type FacadeFlowCommercialRuntimeStatus = 'EMPTY' | 'APPLIED' | 'REVIEW_REQUIRED'
export type FacadeFlowCommercialEventKind = 'OFFER_MODULE_COMMAND' | 'MODULE_QUANTITY' | 'COPY_QUANTITY' | 'SUMMARY_QUERY' | 'UNRESOLVED'
export type FacadeFlowCommercialQuantitySource = 'MODULE_FRAME' | 'COMMERCIAL_OVERRIDE' | 'COPY_INHERITED' | 'UNRESOLVED'

export interface FacadeFlowCommercialModuleQuantity {
  moduleNumber: number
  geometryQuantity: number | null
  effectiveQuantity: number | null
  source: FacadeFlowCommercialQuantitySource
  copiedFromModuleNumber: number | null
}

export interface FacadeFlowCommercialSummary {
  moduleCount: number
  modulesWithKnownQuantity: number
  modulesWithoutQuantity: number[]
  totalKnownQuantity: number
  totalQuantity: number | null
  complete: boolean
  summaryLabel: string
}

export interface FacadeFlowCommercialRuntimeEvent {
  step: number
  command: string
  kind: FacadeFlowCommercialEventKind
  status: FacadeFlowCommercialRuntimeStatus
  applied: boolean
  stateChanged: boolean
  targetModuleNumber: number | null
  quantity: number | null
  reason: string | null
}

export interface FacadeFlowOfferCommercialSummaryRuntime {
  schemaVersion: 'AI-PROMPT-OFFER-COMMERCIAL-SUMMARY-RUNTIME-01'
  mode: 'LOCAL_DETERMINISTIC_OFFER_COMMERCIAL_SUMMARY_DRAFT'
  interpretationId: string
  sourceText: string
  offerRuntime: FacadeFlowOfferModulesRuntime
  quantityOverrides: Record<number, number>
  quantityOverrideSources: Record<number, FacadeFlowCommercialQuantitySource>
  moduleQuantities: FacadeFlowCommercialModuleQuantity[]
  summary: FacadeFlowCommercialSummary
  events: FacadeFlowCommercialRuntimeEvent[]
  lastCommand: string | null
  lastCommandStatus: FacadeFlowCommercialRuntimeStatus
  lastCommandKind: FacadeFlowCommercialEventKind | null
  lastCommandReason: string | null
  visibleStateKey: string
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface MutableCommercialState {
  interpretationId: string
  offerRuntime: FacadeFlowOfferModulesRuntime
  quantityOverrides: Record<number, number>
  quantityOverrideSources: Record<number, FacadeFlowCommercialQuantitySource>
  events: FacadeFlowCommercialRuntimeEvent[]
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

function splitCommands(sourceText: string) {
  return sourceText.split(/\s*\|\s*|\r?\n+/g).map(normalize).filter(Boolean)
}

function moduleTarget(command: string) {
  const match = /(?:модул|module)\s*#?\s*(\d+)/iu.exec(command)
  return match ? Number(match[1]) : null
}

function copyRequest(command: string) {
  const match = /(?:копирай|дублирай|copy|duplicate)\s+(?:модул|module)\s*#?\s*(\d+)\s+(?:като|в|as|to)\s+(?:модул|module)\s*#?\s*(\d+)/iu.exec(command)
  if (!match) return null
  return { sourceModuleNumber: Number(match[1]), targetModuleNumber: Number(match[2]) }
}

function quantityFromCommand(command: string) {
  const scoped = /(?:количество|бройки?|quantity)\s+(?:за|for)\s+(?:модул|module)\s*#?\s*\d+\s*[:=]?\s*(\d+)/iu.exec(command)
  if (scoped) return Number(scoped[1])
  const explicit = /(?:количество|бройки?|quantity)\s*[:=]?\s*(\d+)/iu.exec(command)
  if (explicit) return Number(explicit[1])
  const pieces = /(\d+)\s*(?:бр\.?|броя|pcs?\.?|pieces?)/iu.exec(command)
  return pieces ? Number(pieces[1]) : null
}

function hasQuantityIntent(command: string) {
  return /(?:количество|бройки?|quantity|\d+\s*(?:бр\.?|броя|pcs?\.?|pieces?))/iu.test(command)
}

function isFrameCommand(command: string) {
  return /(?:каса|frame)\s*[:=-]?\s*\d/iu.test(command)
}

function isCopyCommand(command: string) {
  return /(?:копирай|дублирай|copy|duplicate)\s+(?:модул|module)/iu.test(command)
}

function isSummaryQuery(command: string) {
  return /(?:колко\s+(?:са|имаме)?\s*общо|общ\s+брой|общо\s+изделия|total\s+(?:quantity|pieces|items)|how\s+many\s+in\s+total)/iu.test(command)
}

function quantityOnlyCommand(command: string) {
  return hasQuantityIntent(command) && !isFrameCommand(command) && !isCopyCommand(command) && !isSummaryQuery(command)
}

function cloneNumberRecord(record: Record<number, number>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [Number(key), value])) as Record<number, number>
}

function cloneSourceRecord(record: Record<number, FacadeFlowCommercialQuantitySource>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [Number(key), value])) as Record<number, FacadeFlowCommercialQuantitySource>
}

function currentModuleQuantities(state: MutableCommercialState): FacadeFlowCommercialModuleQuantity[] {
  return state.offerRuntime.multiModule.modules
    .slice()
    .sort((left, right) => left.moduleNumber - right.moduleNumber)
    .map((entry) => {
      const geometryQuantity = entry.runtime.currentFrame?.quantity ?? null
      const override = state.quantityOverrides[entry.moduleNumber]
      return {
        moduleNumber: entry.moduleNumber,
        geometryQuantity,
        effectiveQuantity: override ?? geometryQuantity,
        source: override !== undefined
          ? state.quantityOverrideSources[entry.moduleNumber] ?? 'COMMERCIAL_OVERRIDE'
          : geometryQuantity !== null
            ? 'MODULE_FRAME'
            : 'UNRESOLVED',
        copiedFromModuleNumber: entry.copiedFromModuleNumber,
      }
    })
}

function commercialSummary(moduleQuantities: FacadeFlowCommercialModuleQuantity[]): FacadeFlowCommercialSummary {
  const missing = moduleQuantities.filter((entry) => entry.effectiveQuantity === null).map((entry) => entry.moduleNumber)
  const known = moduleQuantities.filter((entry): entry is FacadeFlowCommercialModuleQuantity & { effectiveQuantity: number } => entry.effectiveQuantity !== null)
  const totalKnownQuantity = known.reduce((sum, entry) => sum + entry.effectiveQuantity, 0)
  const complete = moduleQuantities.length > 0 && missing.length === 0
  return {
    moduleCount: moduleQuantities.length,
    modulesWithKnownQuantity: known.length,
    modulesWithoutQuantity: missing,
    totalKnownQuantity,
    totalQuantity: complete ? totalKnownQuantity : null,
    complete,
    summaryLabel: complete
      ? `${moduleQuantities.length} модула · ${totalKnownQuantity} изделия общо`
      : `${moduleQuantities.length} модула · известни ${totalKnownQuantity} изделия · липсват бройки за: ${missing.join(', ') || '—'}`,
  }
}

function stateKey(state: MutableCommercialState) {
  const quantities = currentModuleQuantities(state)
    .map((entry) => `${entry.moduleNumber}:${entry.effectiveQuantity ?? '?'}:${entry.source}`)
    .join('|')
  return `${state.offerRuntime.visibleStateKey}|commercial=${quantities}`
}

function pushEvent(
  state: MutableCommercialState,
  command: string,
  kind: FacadeFlowCommercialEventKind,
  status: FacadeFlowCommercialRuntimeStatus,
  applied: boolean,
  stateChanged: boolean,
  targetModuleNumber: number | null,
  quantity: number | null,
  reason: string | null,
) {
  state.events.push({
    step: state.events.length + 1,
    command,
    kind,
    status,
    applied,
    stateChanged,
    targetModuleNumber,
    quantity,
    reason,
  })
}

function effectiveQuantityFor(state: MutableCommercialState, moduleNumber: number) {
  const override = state.quantityOverrides[moduleNumber]
  if (override !== undefined) return override
  const entry = state.offerRuntime.multiModule.modules.find((module) => module.moduleNumber === moduleNumber)
  return entry?.runtime.currentFrame?.quantity ?? null
}

function applyOne(state: MutableCommercialState, rawCommand: string) {
  const command = normalize(rawCommand)
  if (!command) return
  const beforeKey = stateKey(state)

  if (isSummaryQuery(command)) {
    pushEvent(state, command, 'SUMMARY_QUERY', 'APPLIED', true, false, null, null, null)
    return
  }

  const copy = copyRequest(command)
  if (copy) {
    const sourceQuantityBefore = effectiveQuantityFor(state, copy.sourceModuleNumber)
    const explicitQuantity = quantityFromCommand(command)
    const nextOffer = applyFacadeFlowOfferModulesCommand(state.offerRuntime, command)
    if (nextOffer.lastCommandStatus === 'REVIEW_REQUIRED') {
      state.offerRuntime = nextOffer
      pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, copy.targetModuleNumber, explicitQuantity, nextOffer.lastCommandReason ?? 'Копирането изисква уточнение.')
      return
    }
    state.offerRuntime = nextOffer
    const copiedQuantity = explicitQuantity ?? sourceQuantityBefore
    if (copiedQuantity !== null && copiedQuantity > 0) {
      state.quantityOverrides[copy.targetModuleNumber] = copiedQuantity
      state.quantityOverrideSources[copy.targetModuleNumber] = explicitQuantity !== null ? 'COMMERCIAL_OVERRIDE' : 'COPY_INHERITED'
    }
    pushEvent(state, command, 'COPY_QUANTITY', 'APPLIED', true, beforeKey !== stateKey(state), copy.targetModuleNumber, copiedQuantity, null)
    return
  }

  if (quantityOnlyCommand(command)) {
    const target = moduleTarget(command)
    const quantity = quantityFromCommand(command)
    if (target === null) {
      pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, null, quantity, 'Количеството няма еднозначно посочен номер на модул.')
      return
    }
    if (!state.offerRuntime.multiModule.modules.some((entry) => entry.moduleNumber === target)) {
      pushEvent(state, command, 'MODULE_QUANTITY', 'REVIEW_REQUIRED', false, false, target, quantity, `Модул ${target} не съществува.`)
      return
    }
    if (quantity === null || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100000) {
      pushEvent(state, command, 'MODULE_QUANTITY', 'REVIEW_REQUIRED', false, false, target, quantity, 'Количеството трябва да е положително цяло число.')
      return
    }
    state.quantityOverrides[target] = quantity
    state.quantityOverrideSources[target] = 'COMMERCIAL_OVERRIDE'
    pushEvent(state, command, 'MODULE_QUANTITY', 'APPLIED', true, beforeKey !== stateKey(state), target, quantity, null)
    return
  }

  const target = moduleTarget(command)
  const quantity = quantityFromCommand(command)
  const nextOffer = applyFacadeFlowOfferModulesCommand(state.offerRuntime, command)
  state.offerRuntime = nextOffer
  const review = nextOffer.lastCommandStatus === 'REVIEW_REQUIRED'
  pushEvent(
    state,
    command,
    review ? 'UNRESOLVED' : 'OFFER_MODULE_COMMAND',
    review ? 'REVIEW_REQUIRED' : 'APPLIED',
    !review,
    beforeKey !== stateKey(state),
    target,
    quantity,
    review ? nextOffer.lastCommandReason ?? 'Командата изисква уточнение.' : null,
  )
}

function materialize(state: MutableCommercialState): FacadeFlowOfferCommercialSummaryRuntime {
  const moduleQuantities = currentModuleQuantities(state)
  const summary = commercialSummary(moduleQuantities)
  const last = state.events.at(-1) ?? null
  return {
    schemaVersion: 'AI-PROMPT-OFFER-COMMERCIAL-SUMMARY-RUNTIME-01',
    mode: 'LOCAL_DETERMINISTIC_OFFER_COMMERCIAL_SUMMARY_DRAFT',
    interpretationId: state.interpretationId,
    sourceText: state.events.map((event) => event.command).join(' | '),
    offerRuntime: state.offerRuntime,
    quantityOverrides: cloneNumberRecord(state.quantityOverrides),
    quantityOverrideSources: cloneSourceRecord(state.quantityOverrideSources),
    moduleQuantities,
    summary,
    events: state.events.map((event) => ({ ...event })),
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

function mutableFrom(runtime: FacadeFlowOfferCommercialSummaryRuntime): MutableCommercialState {
  return {
    interpretationId: runtime.interpretationId,
    offerRuntime: runtime.offerRuntime,
    quantityOverrides: cloneNumberRecord(runtime.quantityOverrides),
    quantityOverrideSources: cloneSourceRecord(runtime.quantityOverrideSources),
    events: runtime.events.map((event) => ({ ...event })),
  }
}

export function isFacadeFlowOfferCommercialSummaryCandidate(sourceText: string) {
  const normalized = normalize(sourceText)
  return /(?:оферта|offer)/iu.test(normalized)
    && /(?:модул|module)\s*#?\s*\d+/iu.test(normalized)
    && hasQuantityIntent(normalized)
}

export function createFacadeFlowOfferCommercialSummaryRuntime(
  initialSourceText = '',
  interpretationId = 'offer-commercial-summary-runtime',
): FacadeFlowOfferCommercialSummaryRuntime {
  const state: MutableCommercialState = {
    interpretationId,
    offerRuntime: createFacadeFlowOfferModulesRuntime('', `${interpretationId}-offer`),
    quantityOverrides: {},
    quantityOverrideSources: {},
    events: [],
  }
  for (const command of splitCommands(initialSourceText)) applyOne(state, command)
  return materialize(state)
}

export function applyFacadeFlowOfferCommercialSummaryCommand(
  runtime: FacadeFlowOfferCommercialSummaryRuntime,
  command: string,
): FacadeFlowOfferCommercialSummaryRuntime {
  const normalized = normalize(command)
  if (!normalized) return runtime
  const state = mutableFrom(runtime)
  applyOne(state, normalized)
  return materialize(state)
}

export function clearFacadeFlowOfferCommercialSummaryRuntime(runtime: FacadeFlowOfferCommercialSummaryRuntime) {
  return createFacadeFlowOfferCommercialSummaryRuntime('', runtime.interpretationId)
}
