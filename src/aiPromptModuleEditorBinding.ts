import {
  interpretFacadeFlowModuleLivePreview,
  type FacadeFlowModuleLivePreviewFrame,
  type FacadeFlowModulePreviewStatus,
} from './aiPromptModuleLivePreview'

export type FacadeFlowModuleEditorStatus = 'EMPTY' | 'READY_FOR_HUMAN_REVIEW' | 'REVIEW_REQUIRED'

export interface FacadeFlowModuleEditorCellView {
  id: number
  label: string
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
  widthMm: number
  heightMm: number
  hasSash: boolean
  sashLabel: string | null
}

export interface FacadeFlowModuleEditorDividerView {
  id: number
  label: string
  orientation: 'VERTICAL' | 'HORIZONTAL'
  positionMm: number
  positionPct: number
}

export interface FacadeFlowModuleEditorTimelineItem {
  step: number
  command: string
  status: FacadeFlowModulePreviewStatus
  applied: boolean
  stateChanged: boolean
  unresolvedCount: number
}

export interface FacadeFlowModuleEditorFrameView {
  step: number
  command: string
  status: FacadeFlowModuleEditorStatus
  statusLabel: string
  applied: boolean
  stateChanged: boolean
  moduleNumber: number | null
  quantity: number | null
  frameWidthMm: number | null
  frameHeightMm: number | null
  title: string
  dimensionLabel: string
  quantityLabel: string
  cells: FacadeFlowModuleEditorCellView[]
  dividers: FacadeFlowModuleEditorDividerView[]
  retiredCellIds: number[]
  unresolvedCount: number
  visibleStateKey: string
}

export interface FacadeFlowModuleEditorBinding {
  schemaVersion: 'AI-PROMPT-MODULE-EDITOR-BINDING-01'
  mode: 'LOCAL_DETERMINISTIC_MODULE_EDITOR_UI_BINDING_DRAFT'
  sourceText: string
  eligibleForModulePreview: boolean
  currentStep: number
  frames: FacadeFlowModuleEditorFrameView[]
  currentFrame: FacadeFlowModuleEditorFrameView | null
  timeline: FacadeFlowModuleEditorTimelineItem[]
  safetyLabel: 'АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ'
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

function splitCommands(sourceText: string) {
  return sourceText
    .split(/\s*\|\s*|\r?\n+/g)
    .map(normalize)
    .filter(Boolean)
}

export function isFacadeFlowModuleCommandSessionCandidate(sourceText: string) {
  const commands = splitCommands(sourceText)
  if (commands.length < 2) return false
  const normalized = normalize(sourceText)
  const hasModuleAnchor = /(?:модул|module)\s*#?\s*\d+/iu.test(normalized)
    || /(?:каса|frame)[^|\n]*(?:\d+(?:[.,]\d+)?\s*(?:mm|мм|cm|см|m|м)?\s*[xх×]\s*\d+)/iu.test(normalized)
  const hasGeometryOperation = /(?:делител|divider|раздели|split|крило|sash|клетка|cell|премести|move|махни|премахни|delete|remove|върни|отмени|undo)/iu.test(normalized)
  return hasModuleAnchor && hasGeometryOperation
}

function sashLabel(opening: string | null, direction: string | null) {
  if (!opening) return null
  const openingLabel = opening === 'TILT_TURN' ? 'Двуосно' : 'Едноосно'
  const directionLabel = direction === 'RIGHT' ? 'дясно' : direction === 'LEFT' ? 'ляво' : ''
  return `${openingLabel}${directionLabel ? ` · ${directionLabel}` : ''}`
}

function frameStatus(frame: FacadeFlowModuleLivePreviewFrame): FacadeFlowModuleEditorStatus {
  return frame.status === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'READY_FOR_HUMAN_REVIEW'
}

function statusLabel(status: FacadeFlowModuleEditorStatus) {
  if (status === 'REVIEW_REQUIRED') return 'ИЗИСКВА УТОЧНЕНИЕ'
  if (status === 'READY_FOR_HUMAN_REVIEW') return 'АКТУАЛНА ЧЕРНОВА · ПРОВЕРИ'
  return 'НЯМА МОДУЛНА ЧЕРНОВА'
}

function toEditorFrame(frame: FacadeFlowModuleLivePreviewFrame): FacadeFlowModuleEditorFrameView {
  const status = frameStatus(frame)
  const moduleLabel = frame.moduleNumber === null ? 'Модул' : `Модул ${frame.moduleNumber}`
  const dimensionLabel = frame.frameWidthMm && frame.frameHeightMm
    ? `${frame.frameWidthMm} × ${frame.frameHeightMm} mm`
    : 'Размерът на касата не е зададен'
  const quantityLabel = frame.quantity === null ? 'Количество: неуточнено' : `Количество: ${frame.quantity} бр.`

  return {
    step: frame.step,
    command: frame.command,
    status,
    statusLabel: statusLabel(status),
    applied: frame.applied,
    stateChanged: frame.stateChanged,
    moduleNumber: frame.moduleNumber,
    quantity: frame.quantity,
    frameWidthMm: frame.frameWidthMm,
    frameHeightMm: frame.frameHeightMm,
    title: `${moduleLabel} · ${dimensionLabel}`,
    dimensionLabel,
    quantityLabel,
    cells: frame.cells.map((cell) => ({
      id: cell.id,
      label: cell.label,
      leftPct: cell.xPct,
      topPct: cell.yPct,
      widthPct: cell.widthPct,
      heightPct: cell.heightPct,
      widthMm: cell.widthMm,
      heightMm: cell.heightMm,
      hasSash: cell.hasSash,
      sashLabel: sashLabel(cell.sashOpening, cell.sashDirection),
    })),
    dividers: frame.dividers.map((divider) => ({
      id: divider.id,
      label: `Делител ${divider.id}`,
      orientation: divider.orientation,
      positionMm: divider.positionMm,
      positionPct: divider.positionPct,
    })),
    retiredCellIds: [...frame.retiredCellIds],
    unresolvedCount: frame.unresolvedCount,
    visibleStateKey: frame.visibleStateKey,
  }
}

export function buildFacadeFlowModuleEditorBinding(
  sourceText: string,
  interpretationId = 'module-editor-binding',
): FacadeFlowModuleEditorBinding {
  const eligibleForModulePreview = isFacadeFlowModuleCommandSessionCandidate(sourceText)
  const preview = interpretFacadeFlowModuleLivePreview(sourceText, `${interpretationId}-live-preview`)
  const frames = preview.frames.map(toEditorFrame)
  const currentFrame = frames.at(-1) ?? null

  return {
    schemaVersion: 'AI-PROMPT-MODULE-EDITOR-BINDING-01',
    mode: 'LOCAL_DETERMINISTIC_MODULE_EDITOR_UI_BINDING_DRAFT',
    sourceText: normalize(sourceText),
    eligibleForModulePreview,
    currentStep: currentFrame?.step ?? 0,
    frames,
    currentFrame,
    timeline: preview.frames.map((frame) => ({
      step: frame.step,
      command: frame.command,
      status: frame.status,
      applied: frame.applied,
      stateChanged: frame.stateChanged,
      unresolvedCount: frame.unresolvedCount,
    })),
    safetyLabel: 'АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ',
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

export function selectFacadeFlowModuleEditorFrame(binding: FacadeFlowModuleEditorBinding, step: number | null) {
  if (step === null) return binding.currentFrame
  return binding.frames.find((frame) => frame.step === step) ?? binding.currentFrame
}
