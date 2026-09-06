import { interpretFacadeFlowModuleSessionPrompt } from './aiPromptModuleSessionInterpreter'
import type {
  FacadeFlowModuleGeometryDirection,
  FacadeFlowModuleGeometryOpening,
  FacadeFlowModuleGeometryOrientation,
} from './aiPromptModuleGeometryInterpreter'

export type FacadeFlowModulePreviewStatus = 'APPLIED' | 'REVIEW_REQUIRED'

export interface FacadeFlowModulePreviewCell {
  id: number
  label: string
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
  hasSash: boolean
  sashOpening: FacadeFlowModuleGeometryOpening | null
  sashDirection: FacadeFlowModuleGeometryDirection | null
}

export interface FacadeFlowModulePreviewDivider {
  id: number
  targetCellId: number
  orientation: FacadeFlowModuleGeometryOrientation
  positionMm: number
  positionPct: number
}

export interface FacadeFlowModuleLivePreviewFrame {
  step: number
  command: string
  status: FacadeFlowModulePreviewStatus
  applied: boolean
  stateChanged: boolean
  moduleNumber: number | null
  quantity: number | null
  frameWidthMm: number | null
  frameHeightMm: number | null
  cells: FacadeFlowModulePreviewCell[]
  retiredCellIds: number[]
  dividers: FacadeFlowModulePreviewDivider[]
  unresolvedCount: number
  visibleStateKey: string
}

export interface FacadeFlowModuleLivePreviewResult {
  schemaVersion: 'AI-PROMPT-MODULE-LIVE-PREVIEW-01'
  mode: 'LOCAL_DETERMINISTIC_LIVE_MODULE_PREVIEW_DRAFT'
  sourceText: string
  commands: string[]
  frames: FacadeFlowModuleLivePreviewFrame[]
  currentFrame: FacadeFlowModuleLivePreviewFrame | null
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
const round = (value: number) => Math.round(value * 1_000_000) / 1_000_000

function splitCommands(sourceText: string) {
  return sourceText
    .split(/\s*\|\s*|\r?\n+/g)
    .map(normalize)
    .filter(Boolean)
}

function pct(value: number, total: number | null) {
  if (!total || total <= 0) return 0
  return round((value / total) * 100)
}

function buildFrame(prefix: string[], step: number, interpretationId: string): FacadeFlowModuleLivePreviewFrame {
  const sourceText = prefix.join(' | ')
  const session = interpretFacadeFlowModuleSessionPrompt(sourceText, `${interpretationId}-preview-${step}`)
  const sessionSnapshot = session.sessionSnapshots.at(-1)
  const frameWidthMm = session.frame?.widthMm ?? null
  const frameHeightMm = session.frame?.heightMm ?? null

  const cells = session.activeCells.map((cell): FacadeFlowModulePreviewCell => {
    const sash = session.sashes.find((candidate) => candidate.cellId === cell.id)
    return {
      id: cell.id,
      label: `Клетка ${cell.id}`,
      xMm: cell.xMm,
      yMm: cell.yMm,
      widthMm: cell.widthMm,
      heightMm: cell.heightMm,
      xPct: pct(cell.xMm, frameWidthMm),
      yPct: pct(cell.yMm, frameHeightMm),
      widthPct: pct(cell.widthMm, frameWidthMm),
      heightPct: pct(cell.heightMm, frameHeightMm),
      hasSash: Boolean(sash),
      sashOpening: sash?.opening ?? null,
      sashDirection: sash?.direction ?? null,
    }
  })

  const dividers = session.dividers.map((divider): FacadeFlowModulePreviewDivider => ({
    id: divider.id,
    targetCellId: divider.targetCellId,
    orientation: divider.orientation,
    positionMm: divider.positionMm,
    positionPct: pct(
      divider.positionMm,
      divider.orientation === 'VERTICAL' ? frameWidthMm : frameHeightMm,
    ),
  }))

  const visibleStateKey = JSON.stringify({
    moduleNumber: session.moduleNumber,
    quantity: session.quantity,
    frame: session.frame,
    cells: cells.map((cell) => ({
      id: cell.id,
      xMm: cell.xMm,
      yMm: cell.yMm,
      widthMm: cell.widthMm,
      heightMm: cell.heightMm,
      sashOpening: cell.sashOpening,
      sashDirection: cell.sashDirection,
    })),
    retiredCellIds: session.retiredCells.map((cell) => cell.id),
    dividers: dividers.map((divider) => ({
      id: divider.id,
      orientation: divider.orientation,
      positionMm: divider.positionMm,
    })),
  })

  return {
    step,
    command: prefix.at(-1) ?? '',
    status: sessionSnapshot?.applied ? 'APPLIED' : 'REVIEW_REQUIRED',
    applied: sessionSnapshot?.applied ?? false,
    stateChanged: sessionSnapshot?.stateChanged ?? false,
    moduleNumber: session.moduleNumber,
    quantity: session.quantity,
    frameWidthMm,
    frameHeightMm,
    cells,
    retiredCellIds: session.retiredCells.map((cell) => cell.id),
    dividers,
    unresolvedCount: session.unresolvedCommands.length,
    visibleStateKey,
  }
}

export function interpretFacadeFlowModuleLivePreview(
  sourceText: string,
  interpretationId = 'module-live-preview',
): FacadeFlowModuleLivePreviewResult {
  const commands = splitCommands(sourceText)
  const frames = commands.map((_, index) => buildFrame(commands.slice(0, index + 1), index + 1, interpretationId))

  return {
    schemaVersion: 'AI-PROMPT-MODULE-LIVE-PREVIEW-01',
    mode: 'LOCAL_DETERMINISTIC_LIVE_MODULE_PREVIEW_DRAFT',
    sourceText: normalize(sourceText),
    commands,
    frames,
    currentFrame: frames.at(-1) ?? null,
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}
