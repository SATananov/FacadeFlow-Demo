import {
  createFacadeFlowRealDataIntakeDraft,
  setFacadeFlowRealDataIntakeField,
  type FacadeFlowRealDataIntakeRecord,
} from './aiRealDataIntake'
import {
  buildFacadeFlowMappedDataCandidate,
  confirmFacadeFlowStagingHumanMapping,
  createFacadeFlowRealDataStagingRecord,
  setFacadeFlowStagingMappingDecision,
  type FacadeFlowMappedDataCandidate,
  type FacadeFlowRealDataStagingRecord,
} from './aiRealDataStaging'

export type FacadeFlowRealDataDryRunStep =
  | 'EMPTY'
  | 'INTAKE_READY'
  | 'STAGED'
  | 'MAPPING_READY'
  | 'HUMAN_CONFIRMED'
  | 'ACTIVATION_CANDIDATE'

export interface FacadeFlowRealDataDryRunState {
  step: FacadeFlowRealDataDryRunStep
  intake: FacadeFlowRealDataIntakeRecord | null
  staging: FacadeFlowRealDataStagingRecord | null
  candidate: FacadeFlowMappedDataCandidate | null
  dryRunOnly: true
  realDataCount: 0
  activeDataCount: 0
  autoMappingAllowed: false
  persistenceAllowed: false
  rulesValidated: false
  productionLocked: true
  machineReady: false
}

const lockedDryRun = (state: Pick<FacadeFlowRealDataDryRunState, 'step' | 'intake' | 'staging' | 'candidate'>): FacadeFlowRealDataDryRunState => ({
  ...state,
  dryRunOnly: true,
  realDataCount: 0,
  activeDataCount: 0,
  autoMappingAllowed: false,
  persistenceAllowed: false,
  rulesValidated: false,
  productionLocked: true,
  machineReady: false,
})

export function createFacadeFlowRealDataDryRunState(): FacadeFlowRealDataDryRunState {
  return lockedDryRun({ step: 'EMPTY', intake: null, staging: null, candidate: null })
}

export function createFacadeFlowDryRunDemoIntake(): FacadeFlowRealDataIntakeRecord {
  let record = createFacadeFlowRealDataIntakeDraft('DEMO-DRY-RUN-001')
  const resolved: Array<[Parameters<typeof setFacadeFlowRealDataIntakeField>[1], string]> = [
    ['sourceKind', 'XML'],
    ['sourceReference', 'DEMO_DRY_RUN_SOURCE.xml'],
    ['sourceRevision', 'sha256:DEMO-DRY-RUN-NOT-REAL'],
    ['sourceLocation', 'position:DEMO-DRY-W-01'],
    ['recordKind', 'PRODUCT'],
    ['externalReference', 'DEMO-DRY-W-01'],
    ['productType', 'WINDOW'],
    ['profileSystem', 'DEMO SOURCE SYSTEM'],
    ['profileCode', 'DEMO-SOURCE-PROFILE-01'],
    ['dimensions', '1400 × 1200 mm'],
    ['glassFill', 'DEMO-SOURCE-GLAZING'],
    ['projectPosition', 'DEMO FLOOR 1 → ROOM A → DEMO-DRY-W-01'],
  ]
  for (const [fieldId, value] of resolved) {
    record = setFacadeFlowRealDataIntakeField(record, fieldId, value, 'RESOLVED', [`demo:evidence:${fieldId}`])
  }
  return record
}

export function loadFacadeFlowDryRunDemoIntake(_state: FacadeFlowRealDataDryRunState): FacadeFlowRealDataDryRunState {
  const intake = createFacadeFlowDryRunDemoIntake()
  return lockedDryRun({ step: 'INTAKE_READY', intake, staging: null, candidate: null })
}

export function stageFacadeFlowDryRunDemoRecord(state: FacadeFlowRealDataDryRunState): FacadeFlowRealDataDryRunState {
  if (!state.intake || state.step !== 'INTAKE_READY') return state
  const staging = createFacadeFlowRealDataStagingRecord(state.intake)
  if (!staging) return state
  return lockedDryRun({ step: 'STAGED', intake: state.intake, staging, candidate: null })
}

export function applyFacadeFlowDryRunDemoMappingChoices(state: FacadeFlowRealDataDryRunState): FacadeFlowRealDataDryRunState {
  if (!state.staging || state.step !== 'STAGED') return state
  let staging = state.staging
  for (const mapping of staging.mappings) {
    if (mapping.sourceState === 'UNRESOLVED') {
      staging = setFacadeFlowStagingMappingDecision(staging, mapping.fieldId, 'ACKNOWLEDGED_UNRESOLVED', null, 'DEMO dry-run: изрично оставено неуточнено')
      continue
    }
    if (mapping.fieldId === 'profileSystem') {
      staging = setFacadeFlowStagingMappingDecision(staging, mapping.fieldId, 'MAP_TO_CANONICAL', 'DEMO CANONICAL SYSTEM', 'DEMO dry-run: тестово човешко съпоставяне')
      continue
    }
    if (mapping.fieldId === 'profileCode') {
      staging = setFacadeFlowStagingMappingDecision(staging, mapping.fieldId, 'MAP_TO_CANONICAL', 'DEMO-CANONICAL-PROFILE-01', 'DEMO dry-run: тестово човешко съпоставяне')
      continue
    }
    staging = setFacadeFlowStagingMappingDecision(staging, mapping.fieldId, 'KEEP_SOURCE', null, 'DEMO dry-run: тестово запазване на източника')
  }
  return lockedDryRun({ step: 'MAPPING_READY', intake: state.intake, staging, candidate: null })
}

export function confirmFacadeFlowDryRunHumanMapping(
  state: FacadeFlowRealDataDryRunState,
  reviewer: string,
  reviewedAt: string,
): FacadeFlowRealDataDryRunState {
  if (!state.staging || state.step !== 'MAPPING_READY') return state
  const staging = confirmFacadeFlowStagingHumanMapping(state.staging, reviewer, reviewedAt)
  if (staging.humanReviewStatus !== 'HUMAN_CONFIRMED') return state
  return lockedDryRun({ step: 'HUMAN_CONFIRMED', intake: state.intake, staging, candidate: null })
}

export function buildFacadeFlowDryRunActivationCandidate(state: FacadeFlowRealDataDryRunState): FacadeFlowRealDataDryRunState {
  if (!state.staging || state.step !== 'HUMAN_CONFIRMED') return state
  const candidate = buildFacadeFlowMappedDataCandidate(state.staging)
  if (!candidate) return state
  return lockedDryRun({ step: 'ACTIVATION_CANDIDATE', intake: state.intake, staging: state.staging, candidate })
}
