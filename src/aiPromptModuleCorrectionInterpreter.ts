import {
  interpretFacadeFlowModuleGeometryPrompt,
  parseFacadeFlowModuleDirection,
  parseFacadeFlowModuleOpening,
  type FacadeFlowModuleCell,
  type FacadeFlowModuleDivider,
  type FacadeFlowModuleFrame,
  type FacadeFlowModuleGeometryDirection,
  type FacadeFlowModuleGeometryOpening,
  type FacadeFlowModuleSash,
  type FacadeFlowRetiredCell,
} from './aiPromptModuleGeometryInterpreter'

export type FacadeFlowModuleCorrectionKind =
  | 'MOVE_DIVIDER'
  | 'DELETE_DIVIDER'
  | 'UNDO'
  | 'CHANGE_SASH'
  | 'RETARGET_SASH'
  | 'SET_FIXED'
  | 'ADD_SASH'
  | 'UNKNOWN'

export interface FacadeFlowModuleCorrectionSnapshot {
  step: number
  command: string
  kind: FacadeFlowModuleCorrectionKind
  applied: boolean
  activeCells: FacadeFlowModuleCell[]
  retiredCellIds: number[]
  dividers: FacadeFlowModuleDivider[]
  sashes: FacadeFlowModuleSash[]
}

export interface FacadeFlowModuleCorrectionResult {
  schemaVersion: 'AI-PROMPT-MODULE-CORRECTION-01'
  mode: 'LOCAL_DETERMINISTIC_MODULE_CORRECTION_DRAFT'
  sourceText: string
  moduleNumber: number | null
  quantity: number | null
  frame: FacadeFlowModuleFrame | null
  activeCells: FacadeFlowModuleCell[]
  retiredCells: FacadeFlowRetiredCell[]
  dividers: FacadeFlowModuleDivider[]
  sashes: FacadeFlowModuleSash[]
  snapshots: FacadeFlowModuleCorrectionSnapshot[]
  unresolvedCommands: string[]
  warnings: string[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface MutableCorrectionState {
  moduleNumber: number | null
  quantity: number | null
  frame: FacadeFlowModuleFrame | null
  activeCells: FacadeFlowModuleCell[]
  retiredCells: FacadeFlowRetiredCell[]
  dividers: FacadeFlowModuleDivider[]
  sashes: FacadeFlowModuleSash[]
  nextCellId: number
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
const roundMm = (value: number) => Math.round(value * 1_000_000) / 1_000_000
const cloneCell = (cell: FacadeFlowModuleCell): FacadeFlowModuleCell => ({ ...cell })
const cloneRetired = (cell: FacadeFlowRetiredCell): FacadeFlowRetiredCell => ({ ...cell })
const cloneDivider = (divider: FacadeFlowModuleDivider): FacadeFlowModuleDivider => ({ ...divider })
const cloneSash = (sash: FacadeFlowModuleSash): FacadeFlowModuleSash => ({ ...sash })

function cloneState(state: MutableCorrectionState): MutableCorrectionState {
  return {
    moduleNumber: state.moduleNumber,
    quantity: state.quantity,
    frame: state.frame ? { ...state.frame } : null,
    activeCells: state.activeCells.map(cloneCell),
    retiredCells: state.retiredCells.map(cloneRetired),
    dividers: state.dividers.map(cloneDivider),
    sashes: state.sashes.map(cloneSash),
    nextCellId: state.nextCellId,
  }
}

function restoreState(target: MutableCorrectionState, source: MutableCorrectionState, minimumNextCellId: number) {
  target.moduleNumber = source.moduleNumber
  target.quantity = source.quantity
  target.frame = source.frame ? { ...source.frame } : null
  target.activeCells = source.activeCells.map(cloneCell)
  target.retiredCells = source.retiredCells.map(cloneRetired)
  target.dividers = source.dividers.map(cloneDivider)
  target.sashes = source.sashes.map(cloneSash)
  target.nextCellId = Math.max(source.nextCellId, minimumNextCellId)
}

function snapshot(state: MutableCorrectionState, step: number, command: string, kind: FacadeFlowModuleCorrectionKind, applied: boolean): FacadeFlowModuleCorrectionSnapshot {
  return {
    step,
    command,
    kind,
    applied,
    activeCells: state.activeCells.map(cloneCell),
    retiredCellIds: state.retiredCells.map((cell) => cell.id),
    dividers: state.dividers.map(cloneDivider),
    sashes: state.sashes.map(cloneSash),
  }
}

function splitCommands(sourceText: string) {
  return sourceText
    .split(/\s*\|\s*|\r?\n+/g)
    .map(normalize)
    .filter(Boolean)
}

function isCorrectionCommand(command: string) {
  return /(?:премести|move).*(?:делител|divider)/iu.test(command)
    || /(?:махни|премахни|изтрий|delete|remove).*(?:делител|divider)/iu.test(command)
    || /(?:върни|отмени|undo)/iu.test(command)
    || /(?:премести|move).*(?:крило|sash)/iu.test(command)
    || /(?:смени|промени|направи|change).*(?:крило|sash)/iu.test(command)
    || /(?:клетка|клетки|cell|cells).*?(?:фикс|фиксиран|fixed)/iu.test(command)
}

function classifyCorrection(command: string): FacadeFlowModuleCorrectionKind {
  if (/(?:премести|move).*(?:крило|sash)/iu.test(command)) return 'RETARGET_SASH'
  if (/(?:премести|move).*(?:делител|divider)/iu.test(command)) return 'MOVE_DIVIDER'
  if (/(?:махни|премахни|изтрий|delete|remove).*(?:делител|divider)/iu.test(command)) return 'DELETE_DIVIDER'
  if (/(?:върни|отмени|undo)/iu.test(command)) return 'UNDO'
  if (/(?:клетка|клетки|cell|cells).*?(?:фикс|фиксиран|fixed)/iu.test(command)) return 'SET_FIXED'
  if (/(?:сложи|постави|add|place).*(?:крило|sash)/iu.test(command)) return 'ADD_SASH'
  if (/(?:смени|промени|направи|change).*(?:крило|sash)/iu.test(command)) return 'CHANGE_SASH'
  return 'UNKNOWN'
}

function dividerId(command: string) {
  const match = /(?:делител|divider)\s*#?\s*(\d+)/iu.exec(command)
  return match ? Number(match[1]) : null
}

function cellIds(command: string) {
  return [...command.matchAll(/(?:клетка|cell)\s*#?\s*(\d+)/giu)].map((match) => Number(match[1]))
}

function fixedCellIds(command: string) {
  const explicit = cellIds(command)
  const group = /(?:клетки|cells)\s+([\d\s,иand]+?)\s+(?:са\s+|are\s+)?(?:фикс(?:ирани)?|фиксирани|fixed)/iu.exec(command)
  if (!group) return [...new Set(explicit)]
  const grouped = [...group[1]!.matchAll(/\d+/g)].map((match) => Number(match[0]))
  return [...new Set([...explicit, ...grouped])]
}

function numericMm(rawValue: string, rawUnit?: string) {
  const value = Number(rawValue.replace(',', '.'))
  const unit = (rawUnit ?? 'mm').toLocaleLowerCase('bg')
  if (unit === 'm' || unit === 'м') return roundMm(value * 1000)
  if (unit === 'cm' || unit === 'см') return roundMm(value * 10)
  return roundMm(value)
}

function requestedOffsetMm(command: string) {
  const match = /(?:на|to|at)\s*(\d+(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?/iu.exec(command)
  return match ? numericMm(match[1]!, match[2]) : null
}

function moveDivider(state: MutableCorrectionState, command: string) {
  const requestedId = dividerId(command)
  if (requestedId === null) return { applied: false, reason: 'Преместването няма еднозначно посочен номер на делител.' }
  const divider = state.dividers.find((candidate) => candidate.id === requestedId)
  if (!divider) return { applied: false, reason: `Делител ${requestedId} не съществува в актуалното състояние.` }
  const parent = state.retiredCells.find((cell) => cell.id === divider.targetCellId)
  if (!parent) return { applied: false, reason: `Родителската клетка на делител ${requestedId} не е намерена.` }
  const children = state.activeCells
    .filter((cell) => cell.parentCellId === parent.id)
    .sort(divider.orientation === 'VERTICAL' ? (a, b) => a.xMm - b.xMm : (a, b) => a.yMm - b.yMm)
  if (children.length !== 2) return { applied: false, reason: `Делител ${requestedId} не може безопасно да се премести, защото не граничи с точно две активни клетки.` }
  const offsetMm = requestedOffsetMm(command)
  if (offsetMm === null) return { applied: false, reason: `Липсва еднозначна нова позиция за делител ${requestedId}.` }

  if (divider.orientation === 'VERTICAL') {
    const fromRight = /от\s*дясно|from\s+right/iu.test(command)
    const globalPosition = fromRight ? roundMm(parent.xMm + parent.widthMm - offsetMm) : roundMm(parent.xMm + offsetMm)
    if (!(globalPosition > parent.xMm && globalPosition < parent.xMm + parent.widthMm)) {
      return { applied: false, reason: `Новата позиция на делител ${requestedId} е извън родителската клетка.` }
    }
    const left = children[0]!
    const right = children[1]!
    left.widthMm = roundMm(globalPosition - parent.xMm)
    right.xMm = globalPosition
    right.widthMm = roundMm(parent.xMm + parent.widthMm - globalPosition)
    divider.positionMm = globalPosition
    return { applied: true, reason: '' }
  }

  const fromBottom = /от\s*долу|from\s+bottom/iu.test(command)
  const globalPosition = fromBottom ? roundMm(parent.yMm + parent.heightMm - offsetMm) : roundMm(parent.yMm + offsetMm)
  if (!(globalPosition > parent.yMm && globalPosition < parent.yMm + parent.heightMm)) {
    return { applied: false, reason: `Новата позиция на делител ${requestedId} е извън родителската клетка.` }
  }
  const top = children[0]!
  const bottom = children[1]!
  top.heightMm = roundMm(globalPosition - parent.yMm)
  bottom.yMm = globalPosition
  bottom.heightMm = roundMm(parent.yMm + parent.heightMm - globalPosition)
  divider.positionMm = globalPosition
  return { applied: true, reason: '' }
}

function deleteDivider(state: MutableCorrectionState, command: string, step: number) {
  const requestedId = dividerId(command)
  if (requestedId === null) return { applied: false, reason: 'Премахването няма еднозначно посочен номер на делител.' }
  const divider = state.dividers.find((candidate) => candidate.id === requestedId)
  if (!divider) return { applied: false, reason: `Делител ${requestedId} не съществува в актуалното състояние.` }
  const parent = state.retiredCells.find((cell) => cell.id === divider.targetCellId)
  if (!parent) return { applied: false, reason: `Родителската клетка на делител ${requestedId} не е намерена.` }
  const children = state.activeCells.filter((cell) => cell.parentCellId === parent.id)
  if (children.length !== 2) return { applied: false, reason: `Делител ${requestedId} не може безопасно да се премахне, защото засегнатата структура вече е разделяна допълнително.` }

  for (const child of children) {
    state.activeCells = state.activeCells.filter((candidate) => candidate.id !== child.id)
    state.retiredCells.push({ ...child, retiredAtStep: step })
    state.sashes = state.sashes.filter((sash) => sash.cellId !== child.id)
  }
  state.dividers = state.dividers.filter((candidate) => candidate.id !== requestedId)
  state.activeCells.push({
    id: state.nextCellId++,
    xMm: parent.xMm,
    yMm: parent.yMm,
    widthMm: parent.widthMm,
    heightMm: parent.heightMm,
    parentCellId: parent.id,
    createdAtStep: step,
  })
  state.activeCells.sort((left, right) => left.id - right.id)
  return { applied: true, reason: '' }
}

function parseOpening(command: string): FacadeFlowModuleGeometryOpening | null {
  return parseFacadeFlowModuleOpening(command)
}

function parseDirection(command: string): FacadeFlowModuleGeometryDirection | null {
  return parseFacadeFlowModuleDirection(command)
}

function changeSash(state: MutableCorrectionState, command: string, step: number) {
  const ids = cellIds(command)
  if (ids.length !== 1) return { applied: false, reason: 'Промяната на крило няма еднозначно посочена активна клетка.' }
  const targetId = ids[0]!
  if (!state.activeCells.some((cell) => cell.id === targetId)) return { applied: false, reason: `Клетка ${targetId} не е активна.` }
  const current = state.sashes.find((sash) => sash.cellId === targetId)
  if (!current) return { applied: false, reason: `В клетка ${targetId} няма крило за промяна.` }
  const opening = parseOpening(command) ?? current.opening
  const direction = parseDirection(command) ?? current.direction
  state.sashes = state.sashes.filter((sash) => sash.cellId !== targetId)
  state.sashes.push({ cellId: targetId, opening, direction, createdAtStep: step })
  state.sashes.sort((left, right) => left.cellId - right.cellId)
  return { applied: true, reason: '' }
}

function retargetSash(state: MutableCorrectionState, command: string, step: number) {
  const ids = cellIds(command)
  if (ids.length !== 2) return { applied: false, reason: 'Преместването на крило изисква еднозначни изходна и целева клетка.' }
  const [sourceId, targetId] = ids
  if (!state.activeCells.some((cell) => cell.id === sourceId)) return { applied: false, reason: `Изходна клетка ${sourceId} не е активна.` }
  if (!state.activeCells.some((cell) => cell.id === targetId)) return { applied: false, reason: `Целева клетка ${targetId} не е активна.` }
  const current = state.sashes.find((sash) => sash.cellId === sourceId)
  if (!current) return { applied: false, reason: `В клетка ${sourceId} няма крило за преместване.` }
  if (state.sashes.some((sash) => sash.cellId === targetId)) return { applied: false, reason: `Клетка ${targetId} вече има крило и преместването не е приложено автоматично.` }
  state.sashes = state.sashes.filter((sash) => sash.cellId !== sourceId)
  state.sashes.push({ ...current, cellId: targetId, createdAtStep: step })
  state.sashes.sort((left, right) => left.cellId - right.cellId)
  return { applied: true, reason: '' }
}

function setFixed(state: MutableCorrectionState, command: string) {
  const ids = fixedCellIds(command)
  if (ids.length === 0) return { applied: false, reason: 'FIX промяната няма посочена активна клетка.' }
  const inactive = ids.filter((id) => !state.activeCells.some((cell) => cell.id === id))
  if (inactive.length) return { applied: false, reason: `Клетки ${inactive.join(', ')} не са активни.` }
  const fixed = new Set(ids)
  state.sashes = state.sashes.filter((sash) => !fixed.has(sash.cellId))
  return { applied: true, reason: '' }
}

function addSashCorrection(state: MutableCorrectionState, command: string, step: number) {
  const ids = cellIds(command)
  if (ids.length !== 1) return { applied: false, reason: 'Добавянето на крило няма еднозначно посочена активна клетка.' }
  const targetId = ids[0]!
  if (!state.activeCells.some((cell) => cell.id === targetId)) return { applied: false, reason: `Клетка ${targetId} не е активна.` }
  const opening = parseOpening(command)
  const direction = parseDirection(command)
  if (!opening || !direction) return { applied: false, reason: `Клетка ${targetId} е намерена, но механизмът или посоката не са еднозначни.` }
  state.sashes = state.sashes.filter((sash) => sash.cellId !== targetId)
  state.sashes.push({ cellId: targetId, opening, direction, createdAtStep: step })
  state.sashes.sort((left, right) => left.cellId - right.cellId)
  return { applied: true, reason: '' }
}

export function interpretFacadeFlowModuleCorrectionPrompt(sourceText: string, _interpretationId = 'module-correction'): FacadeFlowModuleCorrectionResult {
  const commands = splitCommands(sourceText)
  const firstCorrectionIndex = commands.findIndex(isCorrectionCommand)
  const geometryCommands = firstCorrectionIndex === -1 ? commands : commands.slice(0, firstCorrectionIndex)
  const correctionCommands = firstCorrectionIndex === -1 ? [] : commands.slice(firstCorrectionIndex)
  const base = interpretFacadeFlowModuleGeometryPrompt(geometryCommands.join(' | '), `${_interpretationId}-base`)
  const maxCellId = Math.max(0, ...base.activeCells.map((cell) => cell.id), ...base.retiredCells.map((cell) => cell.id))
  const state: MutableCorrectionState = {
    moduleNumber: base.moduleNumber,
    quantity: base.quantity,
    frame: base.frame ? { ...base.frame } : null,
    activeCells: base.activeCells.map(cloneCell),
    retiredCells: base.retiredCells.map(cloneRetired),
    dividers: base.dividers.map(cloneDivider),
    sashes: base.sashes.map(cloneSash),
    nextCellId: maxCellId + 1,
  }
  const unresolvedCommands = [...base.unresolvedCommands]
  const warnings = [...base.warnings]
  const snapshots: FacadeFlowModuleCorrectionSnapshot[] = []
  const history: MutableCorrectionState[] = []

  correctionCommands.forEach((command, index) => {
    const step = geometryCommands.length + index + 1
    const kind = classifyCorrection(command)
    const before = cloneState(state)
    let outcome: { applied: boolean; reason: string }

    if (kind === 'MOVE_DIVIDER') outcome = moveDivider(state, command)
    else if (kind === 'DELETE_DIVIDER') outcome = deleteDivider(state, command, step)
    else if (kind === 'CHANGE_SASH') outcome = changeSash(state, command, step)
    else if (kind === 'RETARGET_SASH') outcome = retargetSash(state, command, step)
    else if (kind === 'SET_FIXED') outcome = setFixed(state, command)
    else if (kind === 'ADD_SASH') outcome = addSashCorrection(state, command, step)
    else if (kind === 'UNDO') {
      const previous = history.pop()
      if (!previous) outcome = { applied: false, reason: 'Няма предишна приложена correction команда за Undo.' }
      else {
        const allocatorFloor = state.nextCellId
        restoreState(state, previous, allocatorFloor)
        outcome = { applied: true, reason: '' }
      }
    } else outcome = { applied: false, reason: 'Correction командата не е разпозната като безопасна операция.' }

    if (outcome.applied && kind !== 'UNDO') history.push(before)
    if (!outcome.applied) unresolvedCommands.push(`Стъпка ${step}: ${outcome.reason} Команда: ${command}`)
    else warnings.push(`Стъпка ${step} е приложена само към simulation/draft state и остава за Human Review.`)
    snapshots.push(snapshot(state, step, command, kind, outcome.applied))
  })

  return {
    schemaVersion: 'AI-PROMPT-MODULE-CORRECTION-01',
    mode: 'LOCAL_DETERMINISTIC_MODULE_CORRECTION_DRAFT',
    sourceText: normalize(sourceText),
    moduleNumber: state.moduleNumber,
    quantity: state.quantity,
    frame: state.frame ? { ...state.frame } : null,
    activeCells: state.activeCells.map(cloneCell),
    retiredCells: state.retiredCells.map(cloneRetired),
    dividers: state.dividers.map(cloneDivider),
    sashes: state.sashes.map(cloneSash),
    snapshots,
    unresolvedCommands: [...new Set(unresolvedCommands)],
    warnings: [...new Set(warnings)],
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}
