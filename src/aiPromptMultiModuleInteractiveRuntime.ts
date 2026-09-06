import {
  applyFacadeFlowModuleInteractiveCommand,
  createFacadeFlowModuleInteractiveRuntime,
  reloadFacadeFlowModuleInteractiveRuntime,
  type FacadeFlowModuleInteractiveRuntime,
} from './aiPromptModuleInteractiveRuntime'

export type FacadeFlowMultiModuleCommandStatus = 'EMPTY' | 'APPLIED' | 'REVIEW_REQUIRED'
export type FacadeFlowMultiModuleCommandKind = 'CREATE_MODULE' | 'SWITCH_MODULE' | 'COPY_MODULE' | 'MODULE_COMMAND' | 'UNRESOLVED'

export interface FacadeFlowMultiModuleEntry {
  moduleNumber: number
  runtime: FacadeFlowModuleInteractiveRuntime
  copiedFromModuleNumber: number | null
  createdAtStep: number
  updatedAtStep: number
}

export interface FacadeFlowMultiModuleEvent {
  step: number
  command: string
  kind: FacadeFlowMultiModuleCommandKind
  status: FacadeFlowMultiModuleCommandStatus
  applied: boolean
  stateChanged: boolean
  targetModuleNumber: number | null
  activeModuleNumberBefore: number | null
  activeModuleNumberAfter: number | null
  reason: string | null
}

export interface FacadeFlowMultiModuleInteractiveRuntime {
  schemaVersion: 'AI-PROMPT-MULTI-MODULE-INTERACTIVE-RUNTIME-01'
  mode: 'LOCAL_DETERMINISTIC_MULTI_MODULE_RUNTIME_DRAFT'
  interpretationId: string
  sourceText: string
  modules: FacadeFlowMultiModuleEntry[]
  activeModuleNumber: number | null
  currentModule: FacadeFlowMultiModuleEntry | null
  events: FacadeFlowMultiModuleEvent[]
  lastCommand: string | null
  lastCommandStatus: FacadeFlowMultiModuleCommandStatus
  lastCommandKind: FacadeFlowMultiModuleCommandKind | null
  lastCommandApplied: boolean
  lastCommandStateChanged: boolean
  lastCommandReason: string | null
  visibleStateKey: string
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface MutableMultiState {
  interpretationId: string
  modules: FacadeFlowMultiModuleEntry[]
  activeModuleNumber: number | null
  events: FacadeFlowMultiModuleEvent[]
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

function splitCommands(sourceText: string) {
  return sourceText
    .split(/\s*\|\s*|\r?\n+/g)
    .map(normalize)
    .filter(Boolean)
}

function commandSource(commands: string[]) {
  return commands.join(' | ')
}

function moduleNumberFrom(command: string) {
  const match = /(?:модул|module)\s*#?\s*(\d+)/iu.exec(command)
  return match ? Number(match[1]) : null
}

function createTargetFrom(command: string) {
  const match = /(?:създай|нов|create|new)\s+(?:модул|module)\s*#?\s*(\d+)/iu.exec(command)
  return match ? Number(match[1]) : null
}

function switchTargetFrom(command: string) {
  const patterns = [
    /(?:отвори|покажи|избери|open|show|select)\s+(?:модул|module)\s*#?\s*(\d+)/iu,
    /(?:върни\s+се\s+на|go\s+back\s+to|switch\s+to)\s+(?:модул|module)\s*#?\s*(\d+)/iu,
    /(?:запази[^|]*?и\s+отвори|save[^|]*?and\s+open)\s+(?:модул|module)\s*#?\s*(\d+)/iu,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(command)
    if (match) return Number(match[1])
  }
  return null
}

function copyRequestFrom(command: string) {
  const match = /(?:копирай|дублирай|copy|duplicate)\s+(?:модул|module)\s*#?\s*(\d+)\s+(?:като|в|as|to)\s+(?:модул|module)\s*#?\s*(\d+)/iu.exec(command)
  if (!match) return null
  const quantityMatch = /(?:,|\s)\s*(\d+)\s*(?:бр\.?|броя|pcs?\.?|pieces?)/iu.exec(command)
  return {
    sourceModuleNumber: Number(match[1]),
    targetModuleNumber: Number(match[2]),
    quantityOverride: quantityMatch ? Number(quantityMatch[1]) : null,
  }
}

function isFrameCommand(command: string) {
  return /(?:каса|frame)\s*[:=-]?\s*\d/iu.test(command)
}

function isModuleGeometryOrCorrectionCommand(command: string) {
  return /(?:каса|frame|делител|divider|mullion|раздели|split|крило|sash|клетка|cell|премести|move|махни|премахни|delete|remove|върни|отмени|undo|фикс|fixed)/iu.test(command)
}

function cloneEntry(entry: FacadeFlowMultiModuleEntry): FacadeFlowMultiModuleEntry {
  return {
    ...entry,
    runtime: reloadFacadeFlowModuleInteractiveRuntime(entry.runtime, entry.runtime.sourceText),
  }
}

function stateKey(modules: FacadeFlowMultiModuleEntry[], activeModuleNumber: number | null) {
  const moduleKeys = modules
    .slice()
    .sort((left, right) => left.moduleNumber - right.moduleNumber)
    .map((entry) => {
      const frame = entry.runtime.currentFrame
      return [
        entry.moduleNumber,
        entry.runtime.commands.length,
        frame?.visibleStateKey ?? 'EMPTY',
        frame?.quantity ?? 'Q?',
      ].join(':')
    })
  return `active=${activeModuleNumber ?? 'none'}|${moduleKeys.join('|')}`
}

function findModule(state: MutableMultiState, moduleNumber: number) {
  return state.modules.find((entry) => entry.moduleNumber === moduleNumber) ?? null
}

function replaceEntry(state: MutableMultiState, updated: FacadeFlowMultiModuleEntry) {
  state.modules = state.modules.map((entry) => entry.moduleNumber === updated.moduleNumber ? updated : entry)
  state.modules.sort((left, right) => left.moduleNumber - right.moduleNumber)
}

function ensureModuleAnchor(command: string, moduleNumber: number, isFirstCommand: boolean) {
  if (!isFirstCommand || /(?:модул|module)\s*#?\s*\d+/iu.test(command)) return command
  if (!isFrameCommand(command)) return command
  return `Модул ${moduleNumber}, ${command}`
}

function rewriteCopiedCommands(commands: string[], targetModuleNumber: number, quantityOverride: number | null) {
  const copied = [...commands]
  if (copied.length === 0) return copied
  const frameIndex = copied.findIndex(isFrameCommand)
  const index = frameIndex >= 0 ? frameIndex : 0
  let command = copied[index]!
  if (/(?:модул|module)\s*#?\s*\d+/iu.test(command)) {
    command = command.replace(/(?:модул|module)\s*#?\s*\d+/iu, `Модул ${targetModuleNumber}`)
  } else {
    command = `Модул ${targetModuleNumber}, ${command}`
  }
  if (quantityOverride !== null) {
    if (/\d+\s*(?:бр\.?|броя|pcs?\.?|pieces?)/iu.test(command)) {
      command = command.replace(/\d+\s*(?:бр\.?|броя|pcs?\.?|pieces?)/iu, `${quantityOverride} броя`)
    } else {
      command = `${command}, ${quantityOverride} броя`
    }
  }
  copied[index] = command
  return copied
}

function pushEvent(
  state: MutableMultiState,
  command: string,
  kind: FacadeFlowMultiModuleCommandKind,
  status: FacadeFlowMultiModuleCommandStatus,
  applied: boolean,
  stateChanged: boolean,
  targetModuleNumber: number | null,
  beforeActive: number | null,
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
    activeModuleNumberBefore: beforeActive,
    activeModuleNumberAfter: state.activeModuleNumber,
    reason,
  })
}

function applyOne(state: MutableMultiState, rawCommand: string) {
  const command = normalize(rawCommand)
  if (!command) return
  const beforeActive = state.activeModuleNumber
  const beforeKey = stateKey(state.modules, state.activeModuleNumber)

  const copy = copyRequestFrom(command)
  if (copy) {
    const source = findModule(state, copy.sourceModuleNumber)
    const target = findModule(state, copy.targetModuleNumber)
    if (!source) {
      pushEvent(state, command, 'COPY_MODULE', 'REVIEW_REQUIRED', false, false, copy.targetModuleNumber, beforeActive, `Модул ${copy.sourceModuleNumber} не съществува.`)
      return
    }
    if (target) {
      pushEvent(state, command, 'COPY_MODULE', 'REVIEW_REQUIRED', false, false, copy.targetModuleNumber, beforeActive, `Модул ${copy.targetModuleNumber} вече съществува.`)
      return
    }
    const copiedCommands = rewriteCopiedCommands(source.runtime.commands, copy.targetModuleNumber, copy.quantityOverride)
    const runtime = createFacadeFlowModuleInteractiveRuntime(commandSource(copiedCommands), `${state.interpretationId}-module-${copy.targetModuleNumber}`)
    state.modules.push({
      moduleNumber: copy.targetModuleNumber,
      runtime,
      copiedFromModuleNumber: copy.sourceModuleNumber,
      createdAtStep: state.events.length + 1,
      updatedAtStep: state.events.length + 1,
    })
    state.modules.sort((left, right) => left.moduleNumber - right.moduleNumber)
    state.activeModuleNumber = copy.targetModuleNumber
    pushEvent(state, command, 'COPY_MODULE', 'APPLIED', true, beforeKey !== stateKey(state.modules, state.activeModuleNumber), copy.targetModuleNumber, beforeActive, null)
    return
  }

  const switchTarget = switchTargetFrom(command)
  if (switchTarget !== null) {
    if (!findModule(state, switchTarget)) {
      pushEvent(state, command, 'SWITCH_MODULE', 'REVIEW_REQUIRED', false, false, switchTarget, beforeActive, `Модул ${switchTarget} не съществува.`)
      return
    }
    state.activeModuleNumber = switchTarget
    pushEvent(state, command, 'SWITCH_MODULE', 'APPLIED', true, beforeKey !== stateKey(state.modules, state.activeModuleNumber), switchTarget, beforeActive, null)
    return
  }

  const createTarget = createTargetFrom(command)
  if (createTarget !== null && !isFrameCommand(command)) {
    if (findModule(state, createTarget)) {
      pushEvent(state, command, 'CREATE_MODULE', 'REVIEW_REQUIRED', false, false, createTarget, beforeActive, `Модул ${createTarget} вече съществува.`)
      return
    }
    state.modules.push({
      moduleNumber: createTarget,
      runtime: createFacadeFlowModuleInteractiveRuntime('', `${state.interpretationId}-module-${createTarget}`),
      copiedFromModuleNumber: null,
      createdAtStep: state.events.length + 1,
      updatedAtStep: state.events.length + 1,
    })
    state.modules.sort((left, right) => left.moduleNumber - right.moduleNumber)
    state.activeModuleNumber = createTarget
    pushEvent(state, command, 'CREATE_MODULE', 'APPLIED', true, beforeKey !== stateKey(state.modules, state.activeModuleNumber), createTarget, beforeActive, null)
    return
  }

  const explicitModuleNumber = moduleNumberFrom(command)
  let targetModuleNumber = explicitModuleNumber ?? state.activeModuleNumber
  let target = targetModuleNumber === null ? null : findModule(state, targetModuleNumber)

  if (!target && explicitModuleNumber !== null && isFrameCommand(command)) {
    const runtime = createFacadeFlowModuleInteractiveRuntime(command, `${state.interpretationId}-module-${explicitModuleNumber}`)
    state.modules.push({
      moduleNumber: explicitModuleNumber,
      runtime,
      copiedFromModuleNumber: null,
      createdAtStep: state.events.length + 1,
      updatedAtStep: state.events.length + 1,
    })
    state.modules.sort((left, right) => left.moduleNumber - right.moduleNumber)
    state.activeModuleNumber = explicitModuleNumber
    const review = runtime.lastCommandStatus === 'REVIEW_REQUIRED'
    pushEvent(state, command, 'CREATE_MODULE', review ? 'REVIEW_REQUIRED' : 'APPLIED', !review, beforeKey !== stateKey(state.modules, state.activeModuleNumber), explicitModuleNumber, beforeActive, review ? 'Началната команда за модула изисква уточнение.' : null)
    return
  }

  if (!target) {
    const reason = explicitModuleNumber !== null
      ? `Модул ${explicitModuleNumber} не съществува.`
      : 'Няма активен модул и командата няма еднозначен номер на модул.'
    pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, explicitModuleNumber, beforeActive, reason)
    return
  }

  if (!isModuleGeometryOrCorrectionCommand(command)) {
    pushEvent(state, command, 'UNRESOLVED', 'REVIEW_REQUIRED', false, false, target.moduleNumber, beforeActive, 'Командата не е разпозната като безопасна multi-module операция.')
    return
  }

  targetModuleNumber = target.moduleNumber
  const commandForModule = ensureModuleAnchor(command, targetModuleNumber, target.runtime.commands.length === 0)
  const updatedRuntime = applyFacadeFlowModuleInteractiveCommand(target.runtime, commandForModule)
  const review = updatedRuntime.lastCommandStatus === 'REVIEW_REQUIRED'
  const updatedEntry: FacadeFlowMultiModuleEntry = {
    ...target,
    runtime: updatedRuntime,
    updatedAtStep: state.events.length + 1,
  }
  replaceEntry(state, updatedEntry)
  state.activeModuleNumber = targetModuleNumber
  pushEvent(
    state,
    command,
    'MODULE_COMMAND',
    review ? 'REVIEW_REQUIRED' : 'APPLIED',
    !review,
    beforeKey !== stateKey(state.modules, state.activeModuleNumber),
    targetModuleNumber,
    beforeActive,
    review ? 'Командата към модула изисква уточнение и не трябва да се приема като потвърдена промяна.' : null,
  )
}

function materialize(state: MutableMultiState): FacadeFlowMultiModuleInteractiveRuntime {
  const modules = state.modules.map(cloneEntry).sort((left, right) => left.moduleNumber - right.moduleNumber)
  const currentModule = state.activeModuleNumber === null
    ? null
    : modules.find((entry) => entry.moduleNumber === state.activeModuleNumber) ?? null
  const lastEvent = state.events.at(-1) ?? null
  return {
    schemaVersion: 'AI-PROMPT-MULTI-MODULE-INTERACTIVE-RUNTIME-01',
    mode: 'LOCAL_DETERMINISTIC_MULTI_MODULE_RUNTIME_DRAFT',
    interpretationId: state.interpretationId,
    sourceText: state.events.map((event) => event.command).join(' | '),
    modules,
    activeModuleNumber: state.activeModuleNumber,
    currentModule,
    events: state.events.map((event) => ({ ...event })),
    lastCommand: lastEvent?.command ?? null,
    lastCommandStatus: lastEvent?.status ?? 'EMPTY',
    lastCommandKind: lastEvent?.kind ?? null,
    lastCommandApplied: lastEvent?.applied ?? false,
    lastCommandStateChanged: lastEvent?.stateChanged ?? false,
    lastCommandReason: lastEvent?.reason ?? null,
    visibleStateKey: stateKey(modules, state.activeModuleNumber),
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

function mutableFrom(runtime: FacadeFlowMultiModuleInteractiveRuntime): MutableMultiState {
  return {
    interpretationId: runtime.interpretationId,
    modules: runtime.modules.map(cloneEntry),
    activeModuleNumber: runtime.activeModuleNumber,
    events: runtime.events.map((event) => ({ ...event })),
  }
}

export function isFacadeFlowMultiModuleRuntimeCandidate(sourceText: string) {
  const matches = [...normalize(sourceText).matchAll(/(?:модул|module)\s*#?\s*(\d+)/giu)]
  const unique = new Set(matches.map((match) => match[1]))
  return unique.size >= 2 || /(?:копирай|дублирай|copy|duplicate|отвори|switch\s+to|върни\s+се\s+на)\s+(?:модул|module)/iu.test(sourceText)
}

export function createFacadeFlowMultiModuleInteractiveRuntime(
  initialSourceText = '',
  interpretationId = 'multi-module-interactive-runtime',
): FacadeFlowMultiModuleInteractiveRuntime {
  const state: MutableMultiState = { interpretationId, modules: [], activeModuleNumber: null, events: [] }
  for (const command of splitCommands(initialSourceText)) applyOne(state, command)
  return materialize(state)
}

export function applyFacadeFlowMultiModuleCommand(
  runtime: FacadeFlowMultiModuleInteractiveRuntime,
  command: string,
): FacadeFlowMultiModuleInteractiveRuntime {
  const normalized = normalize(command)
  if (!normalized) return runtime
  const state = mutableFrom(runtime)
  applyOne(state, normalized)
  return materialize(state)
}

export function openFacadeFlowMultiModule(
  runtime: FacadeFlowMultiModuleInteractiveRuntime,
  moduleNumber: number,
): FacadeFlowMultiModuleInteractiveRuntime {
  return applyFacadeFlowMultiModuleCommand(runtime, `Отвори модул ${moduleNumber}`)
}

export function clearFacadeFlowMultiModuleRuntime(
  runtime: FacadeFlowMultiModuleInteractiveRuntime,
): FacadeFlowMultiModuleInteractiveRuntime {
  return createFacadeFlowMultiModuleInteractiveRuntime('', runtime.interpretationId)
}
