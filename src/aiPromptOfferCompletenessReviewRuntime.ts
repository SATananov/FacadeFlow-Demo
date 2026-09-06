import {
  applyFacadeFlowOfferCommercialSummaryCommand,
  createFacadeFlowOfferCommercialSummaryRuntime,
  type FacadeFlowOfferCommercialSummaryRuntime,
} from './aiPromptOfferCommercialSummaryRuntime'

export type FacadeFlowReviewGateRuntimeStatus = 'EMPTY' | 'APPLIED' | 'REVIEW_REQUIRED'
export type FacadeFlowReviewGateEventKind = 'OFFER_COMMAND' | 'COMPLETENESS_QUERY' | 'HUMAN_CONFIRM_MODULE' | 'HUMAN_CONFIRM_ALL_READY' | 'UNRESOLVED'
export type FacadeFlowCompletenessField = 'frameDimensions' | 'quantity' | 'system' | 'finish' | 'glazing' | 'hardware' | 'openingDisposition' | 'geometry'
export type FacadeFlowCompletenessCheckStatus = 'COMPLETE' | 'MISSING' | 'REVIEW_REQUIRED'
export type FacadeFlowModuleReviewStatus = 'INCOMPLETE' | 'READY_FOR_HUMAN_REVIEW' | 'HUMAN_CONFIRMED'
export type FacadeFlowOfferReviewStatus = 'EMPTY' | 'INCOMPLETE' | 'READY_FOR_HUMAN_REVIEW' | 'PARTIALLY_HUMAN_CONFIRMED' | 'HUMAN_CONFIRMED_REVIEW'

export interface FacadeFlowCompletenessCheck {
  field: FacadeFlowCompletenessField
  label: string
  status: FacadeFlowCompletenessCheckStatus
  value: string | null
  reason: string | null
}

export interface FacadeFlowCellDispositionReview {
  cellId: number
  status: 'FIXED' | 'SASH' | 'UNRESOLVED'
  label: string
}

export interface FacadeFlowModuleReviewGate {
  moduleNumber: number
  status: FacadeFlowModuleReviewStatus
  complete: boolean
  confirmed: boolean
  checks: FacadeFlowCompletenessCheck[]
  missingFields: FacadeFlowCompletenessField[]
  reviewFields: FacadeFlowCompletenessField[]
  cellDispositions: FacadeFlowCellDispositionReview[]
  unresolvedCellIds: number[]
  stateKey: string
}

export interface FacadeFlowOfferReviewSummary {
  status: FacadeFlowOfferReviewStatus
  moduleCount: number
  completeModules: number
  readyForReviewModules: number
  confirmedModules: number
  incompleteModules: number
  modulesRequiringAttention: number[]
  totalQuantity: number | null
  statusLabel: string
}

export interface FacadeFlowReviewGateEvent {
  step: number
  command: string
  kind: FacadeFlowReviewGateEventKind
  status: FacadeFlowReviewGateRuntimeStatus
  applied: boolean
  stateChanged: boolean
  targetModuleNumber: number | null
  invalidatedConfirmations: number[]
  reason: string | null
}

export interface FacadeFlowOfferCompletenessReviewRuntime {
  schemaVersion: 'AI-PROMPT-OFFER-COMPLETENESS-REVIEW-RUNTIME-01'
  mode: 'LOCAL_DETERMINISTIC_OFFER_COMPLETENESS_HUMAN_REVIEW_DRAFT'
  interpretationId: string
  sourceText: string
  commercialRuntime: FacadeFlowOfferCommercialSummaryRuntime
  confirmedModuleKeys: Record<number, string>
  moduleReviews: FacadeFlowModuleReviewGate[]
  summary: FacadeFlowOfferReviewSummary
  events: FacadeFlowReviewGateEvent[]
  lastCommand: string | null
  lastCommandStatus: FacadeFlowReviewGateRuntimeStatus
  lastCommandKind: FacadeFlowReviewGateEventKind | null
  lastCommandReason: string | null
  visibleStateKey: string
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface MutableReviewState {
  interpretationId: string
  commercialRuntime: FacadeFlowOfferCommercialSummaryRuntime
  confirmedModuleKeys: Record<number, string>
  events: FacadeFlowReviewGateEvent[]
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

function splitCommands(sourceText: string) {
  return sourceText.split(/\s*\|\s*|\r?\n+/g).map(normalize).filter(Boolean)
}

function moduleNumberFrom(command: string) {
  const match = /(?:модул|module)\s*#?\s*(\d+)/iu.exec(command)
  return match ? Number(match[1]) : null
}

function confirmModuleRequest(command: string) {
  const match = /^(?:потвърди|confirm|human\s*confirm)\s+(?:модул|module)\s*#?\s*(\d+)(?:\s+(?:за\s+преглед|за\s+review|review))?\s*$/iu.exec(command)
  return match ? Number(match[1]) : null
}

function isConfirmAllReady(command: string) {
  return /^(?:потвърди|confirm)\s+(?:всички\s+готови\s+модули|all\s+ready\s+modules)(?:\s+(?:за\s+преглед|for\s+review))?\s*$/iu.test(command)
}

function isCompletenessQuery(command: string) {
  return /(?:провери\s+(?:офертата|пълнотата)|какво\s+липсва|кои\s+модули\s+са\s+готови|готова\s+ли\s+е\s+офертата|готов\s+ли\s+е\s+модул|check\s+(?:offer|completeness)|what\s+is\s+missing|ready\s+for\s+review)/iu.test(command)
}

function explicitFixedCellIds(commands: string[]) {
  const ids = new Set<number>()
  for (const command of commands) {
    if (!/(?:фикс|фиксиран|fixed)/iu.test(command)) continue
    for (const match of command.matchAll(/(?:клетка|cell)\s*#?\s*(\d+)/giu)) ids.add(Number(match[1]))
    const group = /(?:клетки|cells)\s+([\d\s,иand]+?)\s+(?:са\s+|are\s+)?(?:фикс(?:ирани)?|фиксирани|fixed)/iu.exec(command)
    if (group) for (const match of group[1]!.matchAll(/\d+/g)) ids.add(Number(match[0]))
  }
  return ids
}

function cellDispositionReview(commands: string[], activeCellIds: number[], sashCellIds: number[]): FacadeFlowCellDispositionReview[] {
  const fixed = explicitFixedCellIds(commands)
  if (activeCellIds.length === 1 && commands.some((command) => /(?:фикс(?:иран[оа]?)?|fixed)/iu.test(command))) fixed.add(activeCellIds[0]!)
  const sashes = new Set(sashCellIds)
  return activeCellIds.slice().sort((left, right) => left - right).map((cellId) => {
    if (sashes.has(cellId)) return { cellId, status: 'SASH', label: `Клетка ${cellId}: отваряемо крило` }
    if (fixed.has(cellId)) return { cellId, status: 'FIXED', label: `Клетка ${cellId}: фиксирана` }
    return { cellId, status: 'UNRESOLVED', label: `Клетка ${cellId}: неуточнена` }
  })
}

function check(
  field: FacadeFlowCompletenessField,
  label: string,
  status: FacadeFlowCompletenessCheckStatus,
  value: string | null,
  reason: string | null = null,
): FacadeFlowCompletenessCheck {
  return { field, label, status, value, reason }
}

function moduleStateKey(runtime: FacadeFlowOfferCommercialSummaryRuntime, moduleNumber: number) {
  const moduleEntry = runtime.offerRuntime.multiModule.modules.find((entry) => entry.moduleNumber === moduleNumber)
  const settings = runtime.offerRuntime.moduleSettings.find((entry) => entry.moduleNumber === moduleNumber)?.effective ?? {}
  const quantity = runtime.moduleQuantities.find((entry) => entry.moduleNumber === moduleNumber)?.effectiveQuantity ?? null
  const geometryKey = moduleEntry?.runtime.currentFrame?.visibleStateKey ?? 'EMPTY'
  const activeCellIds = moduleEntry?.runtime.currentFrame?.cells.map((cell) => cell.id) ?? []
  const sashCellIds = moduleEntry?.runtime.currentFrame?.cells.filter((cell) => cell.hasSash).map((cell) => cell.id) ?? []
  const dispositionKey = cellDispositionReview(moduleEntry?.runtime.commands ?? [], activeCellIds, sashCellIds)
    .map((entry) => `${entry.cellId}:${entry.status}`)
    .join(',')
  return JSON.stringify({
    moduleNumber,
    quantity,
    system: settings.system ?? null,
    finish: settings.finish ?? null,
    glazing: settings.glazing ?? null,
    hardware: settings.hardware ?? null,
    handle: settings.handle ?? null,
    hinges: settings.hinges ?? null,
    hingeQuantity: settings.hingeQuantity ?? null,
    geometryKey,
    dispositionKey,
  })
}

function deriveModuleReview(
  commercialRuntime: FacadeFlowOfferCommercialSummaryRuntime,
  moduleNumber: number,
  confirmedModuleKeys: Record<number, string>,
): FacadeFlowModuleReviewGate {
  const moduleEntry = commercialRuntime.offerRuntime.multiModule.modules.find((entry) => entry.moduleNumber === moduleNumber)
  const frame = moduleEntry?.runtime.currentFrame ?? null
  const effective = commercialRuntime.offerRuntime.moduleSettings.find((entry) => entry.moduleNumber === moduleNumber)?.effective ?? {}
  const quantity = commercialRuntime.moduleQuantities.find((entry) => entry.moduleNumber === moduleNumber)?.effectiveQuantity ?? null
  const hasFrame = Boolean(frame && frame.frameWidthMm && frame.frameHeightMm && frame.frameWidthMm > 0 && frame.frameHeightMm > 0)
  const hasGeometry = Boolean(hasFrame && frame && frame.cells.length > 0 && moduleEntry?.runtime.lastCommandStatus !== 'REVIEW_REQUIRED')
  const activeCellIds = frame?.cells.map((cell) => cell.id) ?? []
  const sashCellIds = frame?.cells.filter((cell) => cell.hasSash).map((cell) => cell.id) ?? []
  const cellDispositions = cellDispositionReview(moduleEntry?.runtime.commands ?? [], activeCellIds, sashCellIds)
  const unresolvedCellIds = cellDispositions.filter((entry) => entry.status === 'UNRESOLVED').map((entry) => entry.cellId)
  const openingResolved = activeCellIds.length > 0 && unresolvedCellIds.length === 0
  const openingSummary = openingResolved
    ? cellDispositions.map((entry) => entry.status === 'SASH' ? `Клетка ${entry.cellId}: крило` : `Клетка ${entry.cellId}: фикс`).join(' · ')
    : null

  const checks: FacadeFlowCompletenessCheck[] = [
    check('frameDimensions', 'Размери на касата', hasFrame ? 'COMPLETE' : 'MISSING', hasFrame ? `${frame!.frameWidthMm} × ${frame!.frameHeightMm} mm` : null, hasFrame ? null : 'Липсват еднозначни размери на касата.'),
    check('quantity', 'Количество', quantity !== null && quantity > 0 ? 'COMPLETE' : 'MISSING', quantity !== null && quantity > 0 ? `${quantity} бр.` : null, quantity !== null && quantity > 0 ? null : 'Липсва валидно количество за модула.'),
    check('system', 'Профилна система', effective.system ? 'COMPLETE' : 'MISSING', effective.system ?? null, effective.system ? null : 'Липсва профилна система — обща или локална.'),
    check('finish', 'Цвят / финиш', effective.finish ? 'COMPLETE' : 'MISSING', effective.finish ?? null, effective.finish ? null : 'Липсва цвят или финиш — общ или локален.'),
    check('glazing', 'Стъклопакет', effective.glazing ? 'COMPLETE' : 'MISSING', effective.glazing ?? null, effective.glazing ? null : 'Липсва описание на стъклопакета.'),
    check('hardware', 'Обков', effective.hardware ? 'COMPLETE' : 'MISSING', effective.hardware ?? null, effective.hardware ? null : 'Липсва система/тип обков.'),
    check('openingDisposition', 'Отваряне / фиксирано поле', openingResolved ? 'COMPLETE' : 'MISSING', openingSummary, openingResolved ? null : unresolvedCellIds.length ? `Неуточнени активни клетки: ${unresolvedCellIds.join(', ')}. Всяка активна клетка трябва изрично да е FIXED или SASH.` : 'Няма активни клетки за проверка.'),
    check('geometry', 'Геометрична чернова', hasGeometry ? 'COMPLETE' : moduleEntry?.runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'MISSING', hasGeometry ? `${frame!.cells.length} активни клетки` : null, hasGeometry ? null : moduleEntry?.runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'Последната модулна команда изисква уточнение.' : 'Няма валидна текуща геометрична чернова.'),
  ]

  const missingFields = checks.filter((entry) => entry.status === 'MISSING').map((entry) => entry.field)
  const reviewFields = checks.filter((entry) => entry.status === 'REVIEW_REQUIRED').map((entry) => entry.field)
  const complete = missingFields.length === 0 && reviewFields.length === 0
  const stateKey = moduleStateKey(commercialRuntime, moduleNumber)
  const confirmed = complete && confirmedModuleKeys[moduleNumber] === stateKey
  return {
    moduleNumber,
    status: confirmed ? 'HUMAN_CONFIRMED' : complete ? 'READY_FOR_HUMAN_REVIEW' : 'INCOMPLETE',
    complete,
    confirmed,
    checks,
    missingFields,
    reviewFields,
    cellDispositions,
    unresolvedCellIds,
    stateKey,
  }
}

function deriveReviews(runtime: FacadeFlowOfferCommercialSummaryRuntime, confirmedModuleKeys: Record<number, string>) {
  return runtime.offerRuntime.multiModule.modules
    .map((entry) => deriveModuleReview(runtime, entry.moduleNumber, confirmedModuleKeys))
    .sort((left, right) => left.moduleNumber - right.moduleNumber)
}

function deriveSummary(runtime: FacadeFlowOfferCommercialSummaryRuntime, reviews: FacadeFlowModuleReviewGate[]): FacadeFlowOfferReviewSummary {
  const moduleCount = reviews.length
  const completeModules = reviews.filter((entry) => entry.complete).length
  const confirmedModules = reviews.filter((entry) => entry.confirmed).length
  const readyForReviewModules = reviews.filter((entry) => entry.status === 'READY_FOR_HUMAN_REVIEW').length
  const incompleteModules = reviews.filter((entry) => entry.status === 'INCOMPLETE').length
  const modulesRequiringAttention = reviews.filter((entry) => entry.status !== 'HUMAN_CONFIRMED').map((entry) => entry.moduleNumber)
  const status: FacadeFlowOfferReviewStatus = moduleCount === 0
    ? 'EMPTY'
    : incompleteModules > 0
      ? 'INCOMPLETE'
      : confirmedModules === moduleCount
        ? 'HUMAN_CONFIRMED_REVIEW'
        : confirmedModules > 0
          ? 'PARTIALLY_HUMAN_CONFIRMED'
          : 'READY_FOR_HUMAN_REVIEW'
  const statusLabel = status === 'EMPTY'
    ? 'Няма модули за преглед.'
    : status === 'INCOMPLETE'
      ? `${incompleteModules} от ${moduleCount} модула са непълни.`
      : status === 'READY_FOR_HUMAN_REVIEW'
        ? `Всички ${moduleCount} модула са готови за Human Review.`
        : status === 'PARTIALLY_HUMAN_CONFIRMED'
          ? `${confirmedModules} от ${moduleCount} модула са Human Confirmed.`
          : `Всички ${moduleCount} модула са Human Confirmed само за преглед.`
  return {
    status,
    moduleCount,
    completeModules,
    readyForReviewModules,
    confirmedModules,
    incompleteModules,
    modulesRequiringAttention,
    totalQuantity: runtime.summary.totalQuantity,
    statusLabel,
  }
}

function visibleStateKey(runtime: FacadeFlowOfferCommercialSummaryRuntime, confirmedModuleKeys: Record<number, string>) {
  const confirmed = Object.entries(confirmedModuleKeys)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([moduleNumber, key]) => `${moduleNumber}:${key}`)
    .join('|')
  return `${runtime.visibleStateKey}|confirmed=${confirmed}`
}

function pushEvent(
  state: MutableReviewState,
  command: string,
  kind: FacadeFlowReviewGateEventKind,
  status: FacadeFlowReviewGateRuntimeStatus,
  applied: boolean,
  stateChanged: boolean,
  targetModuleNumber: number | null,
  invalidatedConfirmations: number[],
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
    invalidatedConfirmations,
    reason,
  })
}

function invalidateChangedConfirmations(
  afterRuntime: FacadeFlowOfferCommercialSummaryRuntime,
  confirmedModuleKeys: Record<number, string>,
) {
  const next: Record<number, string> = {}
  const invalidated: number[] = []
  for (const [moduleText, confirmedKey] of Object.entries(confirmedModuleKeys)) {
    const moduleNumber = Number(moduleText)
    const stillExists = afterRuntime.offerRuntime.multiModule.modules.some((entry) => entry.moduleNumber === moduleNumber)
    const nextKey = stillExists ? moduleStateKey(afterRuntime, moduleNumber) : null
    if (stillExists && confirmedKey === nextKey) next[moduleNumber] = confirmedKey
    else invalidated.push(moduleNumber)
  }
  return { next, invalidated }
}

function applyOne(state: MutableReviewState, rawCommand: string) {
  const command = normalize(rawCommand)
  if (!command) return
  const beforeKey = visibleStateKey(state.commercialRuntime, state.confirmedModuleKeys)

  if (isCompletenessQuery(command)) {
    pushEvent(state, command, 'COMPLETENESS_QUERY', 'APPLIED', true, false, moduleNumberFrom(command), [], null)
    return
  }

  const confirmModuleNumber = confirmModuleRequest(command)
  if (confirmModuleNumber !== null) {
    const review = deriveModuleReview(state.commercialRuntime, confirmModuleNumber, state.confirmedModuleKeys)
    const exists = state.commercialRuntime.offerRuntime.multiModule.modules.some((entry) => entry.moduleNumber === confirmModuleNumber)
    if (!exists) {
      pushEvent(state, command, 'HUMAN_CONFIRM_MODULE', 'REVIEW_REQUIRED', false, false, confirmModuleNumber, [], `Модул ${confirmModuleNumber} не съществува.`)
      return
    }
    if (!review.complete) {
      pushEvent(state, command, 'HUMAN_CONFIRM_MODULE', 'REVIEW_REQUIRED', false, false, confirmModuleNumber, [], `Модул ${confirmModuleNumber} е непълен и не може да бъде Human Confirmed.`)
      return
    }
    state.confirmedModuleKeys[confirmModuleNumber] = review.stateKey
    pushEvent(state, command, 'HUMAN_CONFIRM_MODULE', 'APPLIED', true, beforeKey !== visibleStateKey(state.commercialRuntime, state.confirmedModuleKeys), confirmModuleNumber, [], null)
    return
  }

  if (isConfirmAllReady(command)) {
    const reviews = deriveReviews(state.commercialRuntime, state.confirmedModuleKeys)
    const ready = reviews.filter((entry) => entry.complete)
    if (ready.length === 0) {
      pushEvent(state, command, 'HUMAN_CONFIRM_ALL_READY', 'REVIEW_REQUIRED', false, false, null, [], 'Няма пълни модули, които могат да бъдат потвърдени.')
      return
    }
    for (const review of ready) state.confirmedModuleKeys[review.moduleNumber] = review.stateKey
    pushEvent(state, command, 'HUMAN_CONFIRM_ALL_READY', 'APPLIED', true, beforeKey !== visibleStateKey(state.commercialRuntime, state.confirmedModuleKeys), null, [], null)
    return
  }

  const beforeRuntime = state.commercialRuntime
  const afterRuntime = applyFacadeFlowOfferCommercialSummaryCommand(beforeRuntime, command)
  const invalidation = invalidateChangedConfirmations(afterRuntime, state.confirmedModuleKeys)
  state.commercialRuntime = afterRuntime
  state.confirmedModuleKeys = invalidation.next
  const reviewRequired = afterRuntime.lastCommandStatus === 'REVIEW_REQUIRED'
  pushEvent(
    state,
    command,
    reviewRequired ? 'UNRESOLVED' : 'OFFER_COMMAND',
    reviewRequired ? 'REVIEW_REQUIRED' : 'APPLIED',
    !reviewRequired,
    beforeKey !== visibleStateKey(state.commercialRuntime, state.confirmedModuleKeys),
    moduleNumberFrom(command),
    invalidation.invalidated,
    reviewRequired ? afterRuntime.lastCommandReason ?? 'Командата изисква уточнение.' : null,
  )
}

function materialize(state: MutableReviewState): FacadeFlowOfferCompletenessReviewRuntime {
  const moduleReviews = deriveReviews(state.commercialRuntime, state.confirmedModuleKeys)
  const summary = deriveSummary(state.commercialRuntime, moduleReviews)
  const last = state.events.at(-1) ?? null
  return {
    schemaVersion: 'AI-PROMPT-OFFER-COMPLETENESS-REVIEW-RUNTIME-01',
    mode: 'LOCAL_DETERMINISTIC_OFFER_COMPLETENESS_HUMAN_REVIEW_DRAFT',
    interpretationId: state.interpretationId,
    sourceText: state.events.map((event) => event.command).join(' | '),
    commercialRuntime: state.commercialRuntime,
    confirmedModuleKeys: { ...state.confirmedModuleKeys },
    moduleReviews,
    summary,
    events: state.events.map((event) => ({ ...event, invalidatedConfirmations: [...event.invalidatedConfirmations] })),
    lastCommand: last?.command ?? null,
    lastCommandStatus: last?.status ?? 'EMPTY',
    lastCommandKind: last?.kind ?? null,
    lastCommandReason: last?.reason ?? null,
    visibleStateKey: visibleStateKey(state.commercialRuntime, state.confirmedModuleKeys),
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

function mutableFrom(runtime: FacadeFlowOfferCompletenessReviewRuntime): MutableReviewState {
  return {
    interpretationId: runtime.interpretationId,
    commercialRuntime: runtime.commercialRuntime,
    confirmedModuleKeys: { ...runtime.confirmedModuleKeys },
    events: runtime.events.map((event) => ({ ...event, invalidatedConfirmations: [...event.invalidatedConfirmations] })),
  }
}

export function isFacadeFlowOfferCompletenessReviewCandidate(sourceText: string) {
  const normalized = normalize(sourceText)
  return /(?:оферта|offer)/iu.test(normalized)
}

export function createFacadeFlowOfferCompletenessReviewRuntime(
  initialSourceText = '',
  interpretationId = 'offer-completeness-review-runtime',
): FacadeFlowOfferCompletenessReviewRuntime {
  const state: MutableReviewState = {
    interpretationId,
    commercialRuntime: createFacadeFlowOfferCommercialSummaryRuntime('', `${interpretationId}-commercial`),
    confirmedModuleKeys: {},
    events: [],
  }
  for (const command of splitCommands(initialSourceText)) applyOne(state, command)
  return materialize(state)
}

export function applyFacadeFlowOfferCompletenessReviewCommand(
  runtime: FacadeFlowOfferCompletenessReviewRuntime,
  command: string,
) {
  const normalized = normalize(command)
  if (!normalized) return runtime
  const state = mutableFrom(runtime)
  applyOne(state, normalized)
  return materialize(state)
}

export function clearFacadeFlowOfferCompletenessReviewRuntime(runtime: FacadeFlowOfferCompletenessReviewRuntime) {
  return createFacadeFlowOfferCompletenessReviewRuntime('', runtime.interpretationId)
}
