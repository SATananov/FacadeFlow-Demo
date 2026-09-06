import {
  buildFacadeFlowModuleEditorBinding,
  type FacadeFlowModuleEditorBinding,
  type FacadeFlowModuleEditorFrameView,
} from './aiPromptModuleEditorBinding'

export type FacadeFlowInteractiveCommandStatus = 'EMPTY' | 'APPLIED' | 'REVIEW_REQUIRED'

export interface FacadeFlowModuleInteractiveRuntime {
  schemaVersion: 'AI-PROMPT-MODULE-INTERACTIVE-RUNTIME-01'
  mode: 'LOCAL_DETERMINISTIC_INTERACTIVE_MODULE_RUNTIME_DRAFT'
  interpretationId: string
  commands: string[]
  sourceText: string
  currentStep: number
  currentFrame: FacadeFlowModuleEditorFrameView | null
  binding: FacadeFlowModuleEditorBinding
  lastCommand: string | null
  lastCommandStatus: FacadeFlowInteractiveCommandStatus
  lastCommandApplied: boolean
  lastCommandStateChanged: boolean
  lastCommandUnresolvedCount: number
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

function commandSource(commands: string[]) {
  return commands.join(' | ')
}

function runtimeFromCommands(commands: string[], interpretationId: string): FacadeFlowModuleInteractiveRuntime {
  const sourceText = commandSource(commands)
  const binding = buildFacadeFlowModuleEditorBinding(sourceText, `${interpretationId}-binding`)
  const currentFrame = binding.currentFrame
  const lastCommand = commands.at(-1) ?? null
  const lastCommandStatus: FacadeFlowInteractiveCommandStatus = !lastCommand
    ? 'EMPTY'
    : currentFrame?.status === 'REVIEW_REQUIRED'
      ? 'REVIEW_REQUIRED'
      : 'APPLIED'

  return {
    schemaVersion: 'AI-PROMPT-MODULE-INTERACTIVE-RUNTIME-01',
    mode: 'LOCAL_DETERMINISTIC_INTERACTIVE_MODULE_RUNTIME_DRAFT',
    interpretationId,
    commands: [...commands],
    sourceText,
    currentStep: currentFrame?.step ?? 0,
    currentFrame,
    binding,
    lastCommand,
    lastCommandStatus,
    lastCommandApplied: currentFrame?.applied ?? false,
    lastCommandStateChanged: currentFrame?.stateChanged ?? false,
    lastCommandUnresolvedCount: currentFrame?.unresolvedCount ?? 0,
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

export function isFacadeFlowInteractiveModuleRuntimeCandidate(sourceText: string) {
  const normalized = normalize(sourceText)
  if (!normalized) return false
  return /(?:модул|module)\s*#?\s*\d+/iu.test(normalized)
    || /(?:каса|frame)[^|\n]*(?:\d+(?:[.,]\d+)?\s*(?:mm|мм|cm|см|m|м)?\s*[xх×]\s*\d+)/iu.test(normalized)
}

export function createFacadeFlowModuleInteractiveRuntime(
  initialSourceText = '',
  interpretationId = 'module-interactive-runtime',
): FacadeFlowModuleInteractiveRuntime {
  return runtimeFromCommands(splitCommands(initialSourceText), interpretationId)
}

export function applyFacadeFlowModuleInteractiveCommand(
  runtime: FacadeFlowModuleInteractiveRuntime,
  command: string,
): FacadeFlowModuleInteractiveRuntime {
  const normalized = normalize(command)
  if (!normalized) return runtime
  return runtimeFromCommands([...runtime.commands, normalized], runtime.interpretationId)
}

export function reloadFacadeFlowModuleInteractiveRuntime(
  runtime: FacadeFlowModuleInteractiveRuntime,
  sourceText: string,
): FacadeFlowModuleInteractiveRuntime {
  return runtimeFromCommands(splitCommands(sourceText), runtime.interpretationId)
}

export function clearFacadeFlowModuleInteractiveRuntime(
  runtime: FacadeFlowModuleInteractiveRuntime,
): FacadeFlowModuleInteractiveRuntime {
  return runtimeFromCommands([], runtime.interpretationId)
}
