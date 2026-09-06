export type FacadeFlowModuleGeometryOrientation = 'VERTICAL' | 'HORIZONTAL'
export type FacadeFlowModuleGeometryDirection = 'LEFT' | 'RIGHT'
export type FacadeFlowModuleGeometryOpening = 'TURN' | 'TILT_TURN'

export interface FacadeFlowModuleFrame {
  widthMm: number
  heightMm: number
}

export interface FacadeFlowModuleCell {
  id: number
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  parentCellId: number | null
  createdAtStep: number
}

export interface FacadeFlowRetiredCell extends FacadeFlowModuleCell {
  retiredAtStep: number
}

export interface FacadeFlowModuleDivider {
  id: number
  targetCellId: number
  orientation: FacadeFlowModuleGeometryOrientation
  positionMm: number
  source: 'EXPLICIT_OFFSET' | 'EQUAL_SPLIT'
  createdAtStep: number
}

export interface FacadeFlowModuleSash {
  cellId: number
  opening: FacadeFlowModuleGeometryOpening
  direction: FacadeFlowModuleGeometryDirection
  createdAtStep: number
}

export interface FacadeFlowModuleGeometrySnapshot {
  step: number
  command: string
  applied: boolean
  moduleNumber: number | null
  quantity: number | null
  frame: FacadeFlowModuleFrame | null
  activeCells: FacadeFlowModuleCell[]
  retiredCellIds: number[]
  dividers: FacadeFlowModuleDivider[]
  sashes: FacadeFlowModuleSash[]
}

export interface FacadeFlowModuleGeometryInterpretationResult {
  schemaVersion: 'AI-PROMPT-MODULE-GEOMETRY-01'
  mode: 'LOCAL_DETERMINISTIC_MODULE_GEOMETRY_DRAFT'
  sourceText: string
  moduleNumber: number | null
  quantity: number | null
  frame: FacadeFlowModuleFrame | null
  activeCells: FacadeFlowModuleCell[]
  retiredCells: FacadeFlowRetiredCell[]
  dividers: FacadeFlowModuleDivider[]
  sashes: FacadeFlowModuleSash[]
  snapshots: FacadeFlowModuleGeometrySnapshot[]
  unresolvedCommands: string[]
  warnings: string[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface MutableState {
  moduleNumber: number | null
  quantity: number | null
  frame: FacadeFlowModuleFrame | null
  activeCells: FacadeFlowModuleCell[]
  retiredCells: FacadeFlowRetiredCell[]
  dividers: FacadeFlowModuleDivider[]
  sashes: FacadeFlowModuleSash[]
  nextCellId: number
  nextDividerId: number
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
const roundMm = (value: number) => Math.round(value * 1_000_000) / 1_000_000

function unitToMm(value: number, unit?: string) {
  const normalized = (unit ?? 'mm').toLocaleLowerCase('bg')
  if (normalized === 'm' || normalized === 'м') return roundMm(value * 1000)
  if (normalized === 'cm' || normalized === 'см') return roundMm(value * 10)
  return roundMm(value)
}

function numberValue(raw: string) {
  return Number(raw.replace(',', '.'))
}

function cloneCell(cell: FacadeFlowModuleCell): FacadeFlowModuleCell {
  return { ...cell }
}

function snapshot(state: MutableState, step: number, command: string, applied: boolean): FacadeFlowModuleGeometrySnapshot {
  return {
    step,
    command,
    applied,
    moduleNumber: state.moduleNumber,
    quantity: state.quantity,
    frame: state.frame ? { ...state.frame } : null,
    activeCells: state.activeCells.map(cloneCell),
    retiredCellIds: state.retiredCells.map((cell) => cell.id),
    dividers: state.dividers.map((divider) => ({ ...divider })),
    sashes: state.sashes.map((sash) => ({ ...sash })),
  }
}

function parseParts(command: string) {
  const numeric = /(?:на\s+)?(\d+)\s+(?:равни\s+)?(?:части|полета|клетки|parts?|fields?|cells?)/iu.exec(command)
  if (numeric) return Number(numeric[1])
  const tokens = normalize(command).toLocaleLowerCase('bg').split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  const wordValues: Record<string, number> = {
    две: 2,
    два: 2,
    три: 3,
    четири: 4,
    пет: 5,
    шест: 6,
  }
  for (const token of tokens) {
    const value = wordValues[token]
    if (value !== undefined) return value
  }
  return null
}

function targetCellId(command: string) {
  const match = /(?:клетка|cell)\s*#?\s*(\d+)/iu.exec(command)
  return match ? Number(match[1]) : null
}

function chooseTargetCell(state: MutableState, command: string) {
  const requested = targetCellId(command)
  if (requested !== null) return state.activeCells.find((cell) => cell.id === requested) ?? null
  return state.activeCells.length === 1 ? state.activeCells[0]! : null
}

function retireCell(state: MutableState, cell: FacadeFlowModuleCell, step: number) {
  state.activeCells = state.activeCells.filter((candidate) => candidate.id !== cell.id)
  state.retiredCells.push({ ...cell, retiredAtStep: step })
  state.sashes = state.sashes.filter((sash) => sash.cellId !== cell.id)
}

function addChildren(state: MutableState, parent: FacadeFlowModuleCell, children: Omit<FacadeFlowModuleCell, 'id' | 'parentCellId' | 'createdAtStep'>[], step: number) {
  const created = children.map((child) => ({
    ...child,
    id: state.nextCellId++,
    parentCellId: parent.id,
    createdAtStep: step,
  }))
  state.activeCells.push(...created)
  state.activeCells.sort((left, right) => left.id - right.id)
  return created
}

function explicitDivider(state: MutableState, command: string, step: number) {
  const lower = command.toLocaleLowerCase('bg')
  const orientation: FacadeFlowModuleGeometryOrientation | null = /вертикал|vertical/iu.test(lower)
    ? 'VERTICAL'
    : /хоризонтал|horizontal/iu.test(lower)
      ? 'HORIZONTAL'
      : null
  if (!orientation) return { applied: false, reason: 'Не е разпозната ориентация на делителя.' }

  const target = chooseTargetCell(state, command)
  if (!target) {
    const requested = targetCellId(command)
    return {
      applied: false,
      reason: requested !== null
        ? `Клетка ${requested} не е активна и делителят не е приложен.`
        : 'Делителят няма еднозначно посочена активна клетка.',
    }
  }

  const offsetMatch = /(?:на|at)\s*(\d+(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?/iu.exec(command)
  if (!offsetMatch) return { applied: false, reason: 'Липсва еднозначен размер за позицията на делителя.' }
  const offsetMm = unitToMm(numberValue(offsetMatch[1]!), offsetMatch[2])

  if (orientation === 'VERTICAL') {
    const fromRight = /от\s*дясно|from\s+right/iu.test(command)
    const localX = fromRight ? roundMm(target.widthMm - offsetMm) : offsetMm
    if (!(localX > 0 && localX < target.widthMm)) return { applied: false, reason: `Вертикалният делител е извън активната клетка ${target.id}.` }
    retireCell(state, target, step)
    addChildren(state, target, [
      { xMm: target.xMm, yMm: target.yMm, widthMm: localX, heightMm: target.heightMm },
      { xMm: roundMm(target.xMm + localX), yMm: target.yMm, widthMm: roundMm(target.widthMm - localX), heightMm: target.heightMm },
    ], step)
    state.dividers.push({
      id: state.nextDividerId++,
      targetCellId: target.id,
      orientation,
      positionMm: roundMm(target.xMm + localX),
      source: 'EXPLICIT_OFFSET',
      createdAtStep: step,
    })
    return { applied: true, reason: '' }
  }

  const fromBottom = /от\s*долу|from\s+bottom/iu.test(command)
  const localY = fromBottom ? roundMm(target.heightMm - offsetMm) : offsetMm
  if (!(localY > 0 && localY < target.heightMm)) return { applied: false, reason: `Хоризонталният делител е извън активната клетка ${target.id}.` }
  retireCell(state, target, step)
  addChildren(state, target, [
    { xMm: target.xMm, yMm: target.yMm, widthMm: target.widthMm, heightMm: localY },
    { xMm: target.xMm, yMm: roundMm(target.yMm + localY), widthMm: target.widthMm, heightMm: roundMm(target.heightMm - localY) },
  ], step)
  state.dividers.push({
    id: state.nextDividerId++,
    targetCellId: target.id,
    orientation,
    positionMm: roundMm(target.yMm + localY),
    source: 'EXPLICIT_OFFSET',
    createdAtStep: step,
  })
  return { applied: true, reason: '' }
}

function equalSplit(state: MutableState, command: string, step: number) {
  const orientation: FacadeFlowModuleGeometryOrientation | null = /вертикал|vertical/iu.test(command)
    ? 'VERTICAL'
    : /хоризонтал|horizontal/iu.test(command)
      ? 'HORIZONTAL'
      : null
  if (!orientation) return { applied: false, reason: 'Не е разпозната ориентация за равномерното разделяне.' }
  const parts = parseParts(command)
  if (!parts || parts < 2) return { applied: false, reason: 'Не е разпознат валиден брой равни части.' }
  const target = chooseTargetCell(state, command)
  if (!target) {
    const requested = targetCellId(command)
    return {
      applied: false,
      reason: requested !== null
        ? `Клетка ${requested} не е активна и равномерното разделяне не е приложено.`
        : 'Равномерното разделяне няма еднозначно посочена активна клетка.',
    }
  }

  retireCell(state, target, step)
  if (orientation === 'VERTICAL') {
    const width = roundMm(target.widthMm / parts)
    const children = Array.from({ length: parts }, (_, index) => ({
      xMm: roundMm(target.xMm + width * index),
      yMm: target.yMm,
      widthMm: index === parts - 1 ? roundMm(target.widthMm - width * (parts - 1)) : width,
      heightMm: target.heightMm,
    }))
    addChildren(state, target, children, step)
    for (let index = 1; index < parts; index += 1) {
      state.dividers.push({
        id: state.nextDividerId++,
        targetCellId: target.id,
        orientation,
        positionMm: roundMm(target.xMm + width * index),
        source: 'EQUAL_SPLIT',
        createdAtStep: step,
      })
    }
    return { applied: true, reason: '' }
  }

  const height = roundMm(target.heightMm / parts)
  const children = Array.from({ length: parts }, (_, index) => ({
    xMm: target.xMm,
    yMm: roundMm(target.yMm + height * index),
    widthMm: target.widthMm,
    heightMm: index === parts - 1 ? roundMm(target.heightMm - height * (parts - 1)) : height,
  }))
  addChildren(state, target, children, step)
  for (let index = 1; index < parts; index += 1) {
    state.dividers.push({
      id: state.nextDividerId++,
      targetCellId: target.id,
      orientation,
      positionMm: roundMm(target.yMm + height * index),
      source: 'EQUAL_SPLIT',
      createdAtStep: step,
    })
  }
  return { applied: true, reason: '' }
}

export function parseFacadeFlowModuleOpening(command: string): FacadeFlowModuleGeometryOpening | null {
  if (/(?:двуос(?:но)?|осов[оа]?[\p{L}-]*\s*[-–— ]?\s*откид[\p{L}-]*|отваряем[\p{L}-]*\s*(?:и|\/|\+|[-–—])\s*(?:падащ[\p{L}-]*|откид[\p{L}-]*)|(?:падащ[\p{L}-]*|откид[\p{L}-]*)\s*(?:и|\/|\+|[-–—])\s*отваряем[\p{L}-]*|tilt\s*[-–— ]?\s*turn)/iu.test(command)) return 'TILT_TURN'
  if (/(?:едноос(?:но)?|отваряем[\p{L}-]*|(?:^|[^\p{L}])turn(?:$|[^\p{L}]))/iu.test(command)) return 'TURN'
  return null
}

export function parseFacadeFlowModuleDirection(command: string): FacadeFlowModuleGeometryDirection | null {
  if (/дяс|дес|right/iu.test(command)) return 'RIGHT'
  if (/ляв|left/iu.test(command)) return 'LEFT'
  return null
}

function addSash(state: MutableState, command: string, step: number) {
  const requested = targetCellId(command)
  if (requested === null) return { applied: false, reason: 'Крилото няма еднозначно посочен номер на клетка.' }
  const target = state.activeCells.find((cell) => cell.id === requested)
  if (!target) return { applied: false, reason: `Клетка ${requested} не е активна и крилото не е приложено.` }
  const opening = parseFacadeFlowModuleOpening(command)
  const direction = parseFacadeFlowModuleDirection(command)
  if (!opening || !direction) return { applied: false, reason: `Клетка ${requested} е намерена, но механизмът или посоката не са еднозначни.` }
  state.sashes = state.sashes.filter((sash) => sash.cellId !== requested)
  state.sashes.push({ cellId: requested, opening, direction, createdAtStep: step })
  state.sashes.sort((left, right) => left.cellId - right.cellId)
  return { applied: true, reason: '' }
}

function initializeFrame(state: MutableState, command: string, step: number) {
  const moduleMatch = /(?:модул|module)\s*(\d+)/iu.exec(command)
  if (moduleMatch) state.moduleNumber = Number(moduleMatch[1])
  const quantityMatch = /(\d+)\s*(?:бр\.?|броя|pcs?\.?|pieces?)/iu.exec(command)
  if (quantityMatch) state.quantity = Number(quantityMatch[1])
  const frameMatch = /(?:каса|frame)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*(?:x|х|×|на)\s*(\d+(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?/iu.exec(command)
  if (!frameMatch) return { applied: false, reason: 'Липсва еднозначен размер на касата.' }
  const widthMm = unitToMm(numberValue(frameMatch[1]!), frameMatch[3])
  const heightMm = unitToMm(numberValue(frameMatch[2]!), frameMatch[3])
  if (!(widthMm > 0 && heightMm > 0)) return { applied: false, reason: 'Размерът на касата трябва да е положителен.' }

  state.frame = { widthMm, heightMm }
  state.activeCells = [{ id: 1, xMm: 0, yMm: 0, widthMm, heightMm, parentCellId: null, createdAtStep: step }]
  state.retiredCells = []
  state.dividers = []
  state.sashes = []
  state.nextCellId = 2
  state.nextDividerId = 1
  return { applied: true, reason: '' }
}

function splitCommands(sourceText: string) {
  return sourceText
    .split(/\s*\|\s*|\r?\n+/g)
    .map(normalize)
    .filter(Boolean)
}

export function interpretFacadeFlowModuleGeometryPrompt(sourceText: string, _interpretationId = 'module-geometry'): FacadeFlowModuleGeometryInterpretationResult {
  const state: MutableState = {
    moduleNumber: null,
    quantity: null,
    frame: null,
    activeCells: [],
    retiredCells: [],
    dividers: [],
    sashes: [],
    nextCellId: 1,
    nextDividerId: 1,
  }
  const unresolvedCommands: string[] = []
  const warnings: string[] = []
  const snapshots: FacadeFlowModuleGeometrySnapshot[] = []
  const commands = splitCommands(sourceText)

  commands.forEach((command, index) => {
    const step = index + 1
    let outcome: { applied: boolean; reason: string }
    if (/(?:каса|frame)\s*[:=-]?\s*\d/iu.test(command)) {
      outcome = initializeFrame(state, command, step)
    } else if (/(?:раздели|split).*(?:равн|equal)/iu.test(command)) {
      outcome = equalSplit(state, command, step)
    } else if (/(?:делител|mullion|divider)/iu.test(command)) {
      outcome = explicitDivider(state, command, step)
    } else if (/(?:сложи|постави|add|place).*(?:крило|sash)/iu.test(command)) {
      outcome = addSash(state, command, step)
    } else {
      outcome = { applied: false, reason: 'Командата не е разпозната като безопасна модулна геометрична операция.' }
    }
    if (!outcome.applied) unresolvedCommands.push(`Стъпка ${step}: ${outcome.reason} Команда: ${command}`)
    else warnings.push(`Стъпка ${step} е приложена само към simulation/draft state и остава за Human Review.`)
    snapshots.push(snapshot(state, step, command, outcome.applied))
  })

  return {
    schemaVersion: 'AI-PROMPT-MODULE-GEOMETRY-01',
    mode: 'LOCAL_DETERMINISTIC_MODULE_GEOMETRY_DRAFT',
    sourceText: normalize(sourceText),
    moduleNumber: state.moduleNumber,
    quantity: state.quantity,
    frame: state.frame ? { ...state.frame } : null,
    activeCells: state.activeCells.map(cloneCell),
    retiredCells: state.retiredCells.map((cell) => ({ ...cell })),
    dividers: state.dividers.map((divider) => ({ ...divider })),
    sashes: state.sashes.map((sash) => ({ ...sash })),
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
