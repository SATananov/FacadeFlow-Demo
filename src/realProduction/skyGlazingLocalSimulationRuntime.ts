import type { CrossProjectPromotionGateAssessment } from './skyGlazingCrossProjectPromotionGate'
import type {
  HumanPromotionReviewRecord,
  NonExecutableRuleDraftArtifact,
} from './skyGlazingHumanPromotionReview'
import type { RuleDraftEngineeringValidationRecord } from './skyGlazingRuleDraftEngineeringValidation'
import type { ExecutableRuleReviewGateAssessment } from './skyGlazingExecutableRuleReviewGate'
import type {
  HumanExecutableRuleReviewRecord,
  NonProductionExecutableRuleDraftArtifact,
} from './skyGlazingHumanExecutableRuleReview'
import {
  assessSimulationExecutionGate,
  simulationDraftEvidenceFingerprint,
  type SimulationExecutionGateAssessment,
  type SimulationValidationRecord,
} from './skyGlazingSimulationExecutionGate'

export const LOCAL_SIMULATION_RUNTIME_ADAPTER =
  'LOCAL_SIMULATION_RUNTIME_ADAPTER' as const
export const LOCAL_SIMULATION_DRY_RUN_RECORD =
  'LOCAL_SIMULATION_DRY_RUN_RECORD' as const
export const RP01_12_RUNTIME_ADAPTER_VERSION =
  'RP01.12-DECLARATIVE-BOOLEAN-V1' as const
export const RP01_12_EXECUTION_FINGERPRINT_VERSION =
  'RP01.12-EXECUTION-V1' as const

export type SimulationInputScalar = boolean | number | string | null
export type SimulationInput = Readonly<Record<string, SimulationInputScalar>>

export type LocalSimulationAdapterFailureReason =
  | 'SIMULATION_GATE_NOT_ELIGIBLE'
  | 'SIMULATION_GATE_CHANGED'
  | 'EXECUTABLE_DRAFT_SOURCE_MISMATCH'

export type LocalSimulationExecutionFailureReason =
  | 'RUNTIME_ADAPTER_NOT_CURRENT'
  | 'SIMULATION_GATE_NOT_ELIGIBLE'
  | 'EXECUTION_TIMESTAMP_REQUIRED'
  | 'UNSUPPORTED_SIMULATION_EXPRESSION'
  | 'SIMULATION_INPUT_IDENTIFIER_MISSING'
  | 'SIMULATION_INPUT_VALUE_UNSUPPORTED'

export interface LocalSimulationRuntimeAdapter {
  id: string
  adapterType: typeof LOCAL_SIMULATION_RUNTIME_ADAPTER
  adapterVersion: typeof RP01_12_RUNTIME_ADAPTER_VERSION
  executableDraftArtifactId: string
  simulationExecutionGateId: string
  validationRecordId: string
  executableExpression: string
  sourceDraftFingerprint: string
  sourceGateState: 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
  supportedGrammar:
    'RETURN_IDENTIFIER_STRICT_EQUALITY_LITERAL_OR_INEQUALITY_LITERAL'
  runtimeAdapterCreated: true
  localOnly: true
  dryRunOnly: true
  sideEffectsAllowed: false
  dynamicCodeEvaluationAllowed: false
  networkAccessAllowed: false
  fileSystemAccessAllowed: false
  processAccessAllowed: false
  machineInstructionGenerated: false
  automaticMachineTranslationAllowed: false
  productionExecutable: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CreateLocalSimulationRuntimeAdapterResult {
  status: 'CREATED' | 'NOT_CREATED'
  reasons: readonly LocalSimulationAdapterFailureReason[]
  adapter: LocalSimulationRuntimeAdapter | null
}

export interface LocalSimulationExecutionFingerprint {
  version: typeof RP01_12_EXECUTION_FINGERPRINT_VERSION
  value: string
}

export interface LocalSimulationDryRunRecord {
  id: string
  recordType: typeof LOCAL_SIMULATION_DRY_RUN_RECORD
  adapterId: string
  adapterVersion: typeof RP01_12_RUNTIME_ADAPTER_VERSION
  executableDraftArtifactId: string
  simulationExecutionGateId: string
  validationRecordId: string
  executedAt: string
  executableExpression: string
  normalizedExpression: string
  inputSnapshot: SimulationInput
  inputIdentifier: string
  comparisonOperator: '===' | '!=='
  expectedLiteral: SimulationInputScalar
  actualValue: SimulationInputScalar
  result: boolean
  executionFingerprint: LocalSimulationExecutionFingerprint
  dryRunCompleted: true
  localSimulationExecutionCompleted: true
  sideEffectsObserved: false
  dynamicCodeEvaluationUsed: false
  networkAccessUsed: false
  fileSystemAccessUsed: false
  processAccessUsed: false
  machineInstructionGenerated: false
  automaticMachineTranslationAllowed: false
  productionExecutable: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface ExecuteLocalSimulationDryRunResult {
  status: 'EXECUTED' | 'NOT_EXECUTED'
  reasons: readonly LocalSimulationExecutionFailureReason[]
  record: LocalSimulationDryRunRecord | null
}

interface ParsedSimulationExpression {
  normalizedExpression: string
  identifier: string
  operator: '===' | '!=='
  literal: SimulationInputScalar
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function canonicalInput(input: SimulationInput): SimulationInput {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(input).sort(([a], [b]) => compareText(a, b)),
    ),
  ) as SimulationInput
}

function isSupportedInputValue(value: unknown): value is SimulationInputScalar {
  return (
    value === null
    || typeof value === 'boolean'
    || typeof value === 'number'
    || typeof value === 'string'
  )
}

function parseLiteral(raw: string): SimulationInputScalar | undefined {
  const value = raw.trim()
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null

  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const quoted = value.match(/^(['"])(.*)\1$/)
  if (quoted) {
    const inner = quoted[2]
    if (inner.includes('\\')) return undefined
    return inner
  }

  return undefined
}

function parseSimulationExpression(
  expression: string,
): ParsedSimulationExpression | null {
  const normalizedSource = expression
    .trim()
    .replace(/^return\s+/, '')
    .replace(/;\s*$/, '')
    .trim()

  const match = normalizedSource.match(
    /^([A-Za-z_$][A-Za-z0-9_$]*)\s*(===|!==)\s*(.+)$/,
  )
  if (!match) return null

  const literal = parseLiteral(match[3])
  if (literal === undefined) return null

  return Object.freeze({
    normalizedExpression:
      `${match[1]} ${match[2]} ${JSON.stringify(literal)}`,
    identifier: match[1],
    operator: match[2] as '===' | '!==',
    literal,
  })
}

function currentDraftFingerprint(
  draft: NonProductionExecutableRuleDraftArtifact,
  executableReview: HumanExecutableRuleReviewRecord,
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
): string {
  return simulationDraftEvidenceFingerprint(
    draft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  ).value
}

function gateMatchesDraft(
  gate: SimulationExecutionGateAssessment,
  draft: NonProductionExecutableRuleDraftArtifact,
  validation: SimulationValidationRecord,
): boolean {
  return (
    gate.executableDraftArtifactId === draft.id
    && gate.validationRecordId === validation.id
    && gate.profileCode === draft.profileCode
    && gate.candidateKind === draft.candidateKind
    && gate.sourcePatternKey === draft.sourcePatternKey
    && gate.operationName === draft.operationName
  )
}

export function createLocalSimulationRuntimeAdapter(
  suppliedGate: SimulationExecutionGateAssessment,
  validation: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
  executableReview: HumanExecutableRuleReviewRecord,
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
): CreateLocalSimulationRuntimeAdapterResult {
  const reasons: LocalSimulationAdapterFailureReason[] = []

  const currentGate = assessSimulationExecutionGate(
    validation,
    draft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  if (
    suppliedGate.state !== 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
    || !suppliedGate.localSimulationExecutionCanStart
    || currentGate.state !== 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
  ) {
    reasons.push('SIMULATION_GATE_NOT_ELIGIBLE')
  }

  if (
    suppliedGate.id !== currentGate.id
    || suppliedGate.validationRecordId !== currentGate.validationRecordId
    || suppliedGate.executableDraftArtifactId !==
      currentGate.executableDraftArtifactId
    || suppliedGate.state !== currentGate.state
  ) {
    reasons.push('SIMULATION_GATE_CHANGED')
  }

  if (!gateMatchesDraft(suppliedGate, draft, validation)) {
    reasons.push('EXECUTABLE_DRAFT_SOURCE_MISMATCH')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_CREATED',
      reasons: Object.freeze(reasons),
      adapter: null,
    })
  }

  const fingerprint = currentDraftFingerprint(
    draft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  const adapter: LocalSimulationRuntimeAdapter = Object.freeze({
    id: `rp01-12-adapter:${encodeURIComponent(draft.id)}:${encodeURIComponent(fingerprint)}`,
    adapterType: LOCAL_SIMULATION_RUNTIME_ADAPTER,
    adapterVersion: RP01_12_RUNTIME_ADAPTER_VERSION,
    executableDraftArtifactId: draft.id,
    simulationExecutionGateId: suppliedGate.id,
    validationRecordId: validation.id,
    executableExpression: draft.executableExpression,
    sourceDraftFingerprint: fingerprint,
    sourceGateState: 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION',
    supportedGrammar:
      'RETURN_IDENTIFIER_STRICT_EQUALITY_LITERAL_OR_INEQUALITY_LITERAL',
    runtimeAdapterCreated: true,
    localOnly: true,
    dryRunOnly: true,
    sideEffectsAllowed: false,
    dynamicCodeEvaluationAllowed: false,
    networkAccessAllowed: false,
    fileSystemAccessAllowed: false,
    processAccessAllowed: false,
    machineInstructionGenerated: false,
    automaticMachineTranslationAllowed: false,
    productionExecutable: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })

  return Object.freeze({
    status: 'CREATED',
    reasons: Object.freeze([]),
    adapter,
  })
}

export function localSimulationExecutionFingerprint(
  adapter: LocalSimulationRuntimeAdapter,
  simulationGate: SimulationExecutionGateAssessment,
  input: SimulationInput,
  executedAt: string,
): LocalSimulationExecutionFingerprint {
  return Object.freeze({
    version: RP01_12_EXECUTION_FINGERPRINT_VERSION,
    value: JSON.stringify({
      version: RP01_12_EXECUTION_FINGERPRINT_VERSION,
      adapterId: adapter.id,
      adapterVersion: adapter.adapterVersion,
      executableDraftArtifactId: adapter.executableDraftArtifactId,
      simulationExecutionGateId: simulationGate.id,
      validationRecordId: simulationGate.validationRecordId,
      executableExpression: adapter.executableExpression,
      sourceDraftFingerprint: adapter.sourceDraftFingerprint,
      input: canonicalInput(input),
      executedAt,
    }),
  })
}

export function executeLocalSimulationDryRun(
  adapter: LocalSimulationRuntimeAdapter,
  suppliedGate: SimulationExecutionGateAssessment,
  validation: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
  executableReview: HumanExecutableRuleReviewRecord,
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
  input: SimulationInput,
  executedAt: string,
): ExecuteLocalSimulationDryRunResult {
  const reasons: LocalSimulationExecutionFailureReason[] = []

  const currentGate = assessSimulationExecutionGate(
    validation,
    draft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )
  const draftFingerprint = currentDraftFingerprint(
    draft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  if (
    adapter.executableDraftArtifactId !== draft.id
    || adapter.simulationExecutionGateId !== suppliedGate.id
    || adapter.validationRecordId !== validation.id
    || adapter.executableExpression !== draft.executableExpression
    || adapter.sourceDraftFingerprint !== draftFingerprint
  ) {
    reasons.push('RUNTIME_ADAPTER_NOT_CURRENT')
  }

  if (
    suppliedGate.state !== 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
    || !suppliedGate.localSimulationExecutionCanStart
    || currentGate.state !== 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
    || suppliedGate.id !== currentGate.id
  ) {
    reasons.push('SIMULATION_GATE_NOT_ELIGIBLE')
  }

  if (!executedAt.trim()) {
    reasons.push('EXECUTION_TIMESTAMP_REQUIRED')
  }

  const parsed = parseSimulationExpression(adapter.executableExpression)
  if (!parsed) {
    reasons.push('UNSUPPORTED_SIMULATION_EXPRESSION')
  }

  if (
    parsed
    && !Object.prototype.hasOwnProperty.call(input, parsed.identifier)
  ) {
    reasons.push('SIMULATION_INPUT_IDENTIFIER_MISSING')
  }

  if (parsed && Object.prototype.hasOwnProperty.call(input, parsed.identifier)) {
    const candidate = input[parsed.identifier]
    if (!isSupportedInputValue(candidate)) {
      reasons.push('SIMULATION_INPUT_VALUE_UNSUPPORTED')
    }
  }

  if (reasons.length > 0 || !parsed) {
    return Object.freeze({
      status: 'NOT_EXECUTED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const canonical = canonicalInput(input)
  const actualValue = canonical[parsed.identifier]
  if (!isSupportedInputValue(actualValue)) {
    return Object.freeze({
      status: 'NOT_EXECUTED',
      reasons: Object.freeze([
        'SIMULATION_INPUT_VALUE_UNSUPPORTED',
      ] as const),
      record: null,
    })
  }

  const equal = actualValue === parsed.literal
  const result = parsed.operator === '===' ? equal : !equal
  const executionFingerprint = localSimulationExecutionFingerprint(
    adapter,
    suppliedGate,
    canonical,
    executedAt,
  )

  const record: LocalSimulationDryRunRecord = Object.freeze({
    id: [
      'rp01-12-execution',
      encodeURIComponent(adapter.id),
      encodeURIComponent(executedAt),
      encodeURIComponent(executionFingerprint.value),
    ].join(':'),
    recordType: LOCAL_SIMULATION_DRY_RUN_RECORD,
    adapterId: adapter.id,
    adapterVersion: adapter.adapterVersion,
    executableDraftArtifactId: draft.id,
    simulationExecutionGateId: suppliedGate.id,
    validationRecordId: validation.id,
    executedAt,
    executableExpression: adapter.executableExpression,
    normalizedExpression: parsed.normalizedExpression,
    inputSnapshot: canonical,
    inputIdentifier: parsed.identifier,
    comparisonOperator: parsed.operator,
    expectedLiteral: parsed.literal,
    actualValue,
    result,
    executionFingerprint,
    dryRunCompleted: true,
    localSimulationExecutionCompleted: true,
    sideEffectsObserved: false,
    dynamicCodeEvaluationUsed: false,
    networkAccessUsed: false,
    fileSystemAccessUsed: false,
    processAccessUsed: false,
    machineInstructionGenerated: false,
    automaticMachineTranslationAllowed: false,
    productionExecutable: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })

  return Object.freeze({
    status: 'EXECUTED',
    reasons: Object.freeze([]),
    record,
  })
}
