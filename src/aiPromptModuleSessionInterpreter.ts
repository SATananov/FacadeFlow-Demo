import {
  interpretFacadeFlowModuleCorrectionPrompt,
  type FacadeFlowModuleCorrectionResult,
} from './aiPromptModuleCorrectionInterpreter'
import {
  interpretFacadeFlowModuleGeometryPrompt,
  type FacadeFlowModuleCell,
  type FacadeFlowModuleDivider,
  type FacadeFlowModuleFrame,
  type FacadeFlowModuleSash,
  type FacadeFlowRetiredCell,
} from './aiPromptModuleGeometryInterpreter'

export type FacadeFlowModuleSessionEngine = 'GEOMETRY' | 'CORRECTION'

export interface FacadeFlowModuleSessionSnapshot {
  step: number
  command: string
  engine: FacadeFlowModuleSessionEngine
  applied: boolean
  stateChanged: boolean
  moduleNumber: number | null
  quantity: number | null
  frame: FacadeFlowModuleFrame | null
  activeCellIds: number[]
  retiredCellIds: number[]
  dividerPositions: number[]
  sashCellIds: number[]
  unresolvedCount: number
}

export interface FacadeFlowModuleSessionResult {
  schemaVersion: 'AI-PROMPT-MODULE-SESSION-01'
  mode: 'LOCAL_DETERMINISTIC_SEQUENTIAL_MODULE_SESSION_DRAFT'
  sourceText: string
  commands: string[]
  moduleNumber: number | null
  quantity: number | null
  frame: FacadeFlowModuleFrame | null
  activeCells: FacadeFlowModuleCell[]
  retiredCells: FacadeFlowRetiredCell[]
  dividers: FacadeFlowModuleDivider[]
  sashes: FacadeFlowModuleSash[]
  sessionSnapshots: FacadeFlowModuleSessionSnapshot[]
  unresolvedCommands: string[]
  warnings: string[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

type SessionStateResult = ReturnType<typeof interpretFacadeFlowModuleGeometryPrompt> | FacadeFlowModuleCorrectionResult

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

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

function correctionStarted(commands: string[]) {
  return commands.some(isCorrectionCommand)
}

function evaluatePrefix(commands: string[], interpretationId: string): { result: SessionStateResult; engine: FacadeFlowModuleSessionEngine; applied: boolean } {
  const text = commands.join(' | ')
  if (correctionStarted(commands)) {
    const result = interpretFacadeFlowModuleCorrectionPrompt(text, `${interpretationId}-correction`)
    return {
      result,
      engine: 'CORRECTION',
      applied: result.snapshots.at(-1)?.applied ?? false,
    }
  }
  const result = interpretFacadeFlowModuleGeometryPrompt(text, `${interpretationId}-geometry`)
  return {
    result,
    engine: 'GEOMETRY',
    applied: result.snapshots.at(-1)?.applied ?? false,
  }
}

function visibleStateSignature(result: SessionStateResult) {
  return JSON.stringify({
    moduleNumber: result.moduleNumber,
    quantity: result.quantity,
    frame: result.frame,
    activeCells: result.activeCells,
    retiredCells: result.retiredCells,
    dividers: result.dividers,
    sashes: result.sashes,
  })
}

function cloneCell(cell: FacadeFlowModuleCell): FacadeFlowModuleCell {
  return { ...cell }
}

function cloneRetiredCell(cell: FacadeFlowRetiredCell): FacadeFlowRetiredCell {
  return { ...cell }
}

function cloneDivider(divider: FacadeFlowModuleDivider): FacadeFlowModuleDivider {
  return { ...divider }
}

function cloneSash(sash: FacadeFlowModuleSash): FacadeFlowModuleSash {
  return { ...sash }
}

export function interpretFacadeFlowModuleSessionPrompt(sourceText: string, interpretationId = 'module-session'): FacadeFlowModuleSessionResult {
  const commands = splitCommands(sourceText)
  const sessionSnapshots: FacadeFlowModuleSessionSnapshot[] = []
  let previousSignature = ''
  let finalResult: SessionStateResult = interpretFacadeFlowModuleGeometryPrompt('', `${interpretationId}-empty`)

  commands.forEach((command, index) => {
    const prefix = commands.slice(0, index + 1)
    const evaluated = evaluatePrefix(prefix, `${interpretationId}-step-${index + 1}`)
    finalResult = evaluated.result
    const signature = visibleStateSignature(evaluated.result)
    const stateChanged = signature !== previousSignature
    previousSignature = signature

    sessionSnapshots.push({
      step: index + 1,
      command,
      engine: evaluated.engine,
      applied: evaluated.applied,
      stateChanged,
      moduleNumber: evaluated.result.moduleNumber,
      quantity: evaluated.result.quantity,
      frame: evaluated.result.frame ? { ...evaluated.result.frame } : null,
      activeCellIds: evaluated.result.activeCells.map((cell) => cell.id),
      retiredCellIds: evaluated.result.retiredCells.map((cell) => cell.id),
      dividerPositions: evaluated.result.dividers.map((divider) => divider.positionMm),
      sashCellIds: evaluated.result.sashes.map((sash) => sash.cellId),
      unresolvedCount: evaluated.result.unresolvedCommands.length,
    })
  })

  return {
    schemaVersion: 'AI-PROMPT-MODULE-SESSION-01',
    mode: 'LOCAL_DETERMINISTIC_SEQUENTIAL_MODULE_SESSION_DRAFT',
    sourceText: normalize(sourceText),
    commands,
    moduleNumber: finalResult.moduleNumber,
    quantity: finalResult.quantity,
    frame: finalResult.frame ? { ...finalResult.frame } : null,
    activeCells: finalResult.activeCells.map(cloneCell),
    retiredCells: finalResult.retiredCells.map(cloneRetiredCell),
    dividers: finalResult.dividers.map(cloneDivider),
    sashes: finalResult.sashes.map(cloneSash),
    sessionSnapshots,
    unresolvedCommands: [...finalResult.unresolvedCommands],
    warnings: [
      ...finalResult.warnings,
      'Sequential session snapshots are simulation/draft state only and require Human Review after every command.',
    ],
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}
