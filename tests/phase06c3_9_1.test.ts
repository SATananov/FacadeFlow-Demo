import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  applyFacadeFlowDryRunDemoMappingChoices,
  buildFacadeFlowDryRunActivationCandidate,
  confirmFacadeFlowDryRunHumanMapping,
  createFacadeFlowRealDataDryRunState,
  createFacadeFlowDryRunDemoIntake,
  loadFacadeFlowDryRunDemoIntake,
  stageFacadeFlowDryRunDemoRecord,
} from '../src/aiRealDataDryRun'

test('06C.3.9.1 dry run starts empty and cannot activate or persist data', () => {
  const state = createFacadeFlowRealDataDryRunState()
  assert.equal(state.step, 'EMPTY')
  assert.equal(state.realDataCount, 0)
  assert.equal(state.activeDataCount, 0)
  assert.equal(state.autoMappingAllowed, false)
  assert.equal(state.persistenceAllowed, false)
  assert.equal(state.rulesValidated, false)
  assert.equal(state.productionLocked, true)
  assert.equal(state.machineReady, false)
})

test('06C.3.9.1 deterministic DEMO intake is clearly test-only and reaches READY_FOR_REVIEW without real data', () => {
  const intake = createFacadeFlowDryRunDemoIntake()
  assert.equal(intake.status, 'READY_FOR_REVIEW')
  assert.equal(intake.fields.sourceReference.value, 'DEMO_DRY_RUN_SOURCE.xml')
  assert.match(intake.fields.sourceRevision.value ?? '', /DEMO-DRY-RUN-NOT-REAL/)
  assert.equal(intake.acceptedIntoActiveData, false)
})

test('06C.3.9.1 explicit load and staging actions preserve quarantine and no-auto-mapping boundaries', () => {
  const loaded = loadFacadeFlowDryRunDemoIntake(createFacadeFlowRealDataDryRunState())
  assert.equal(loaded.step, 'INTAKE_READY')
  const staged = stageFacadeFlowDryRunDemoRecord(loaded)
  assert.equal(staged.step, 'STAGED')
  assert.equal(staged.staging?.status, 'MAPPING_INCOMPLETE')
  assert.ok(staged.staging?.mappings.every((item) => item.decision === 'UNREVIEWED'))
  assert.equal(staged.activeDataCount, 0)
  assert.equal(staged.autoMappingAllowed, false)
})

test('06C.3.9.1 scripted DEMO choices exercise KEEP, MAP and unresolved decisions only after explicit action', () => {
  const staged = stageFacadeFlowDryRunDemoRecord(loadFacadeFlowDryRunDemoIntake(createFacadeFlowRealDataDryRunState()))
  const mapped = applyFacadeFlowDryRunDemoMappingChoices(staged)
  assert.equal(mapped.step, 'MAPPING_READY')
  assert.equal(mapped.staging?.status, 'READY_FOR_HUMAN_CONFIRMATION')
  const decisions = new Set(mapped.staging?.mappings.map((item) => item.decision))
  assert.ok(decisions.has('KEEP_SOURCE'))
  assert.ok(decisions.has('MAP_TO_CANONICAL'))
  assert.ok(decisions.has('ACKNOWLEDGED_UNRESOLVED'))
  assert.equal(mapped.activeDataCount, 0)
})

test('06C.3.9.1 human mapping confirmation still requires a named reviewer', () => {
  const mapped = applyFacadeFlowDryRunDemoMappingChoices(stageFacadeFlowDryRunDemoRecord(loadFacadeFlowDryRunDemoIntake(createFacadeFlowRealDataDryRunState())))
  const rejected = confirmFacadeFlowDryRunHumanMapping(mapped, '', '2026-08-31T15:45:00+03:00')
  assert.equal(rejected.step, 'MAPPING_READY')
  const confirmed = confirmFacadeFlowDryRunHumanMapping(mapped, 'Dry Run Reviewer', '2026-08-31T15:45:00+03:00')
  assert.equal(confirmed.step, 'HUMAN_CONFIRMED')
  assert.equal(confirmed.staging?.humanReviewStatus, 'HUMAN_CONFIRMED')
  assert.equal(confirmed.activeDataCount, 0)
})

test('06C.3.9.1 activation candidate is only a future review candidate and never active data', () => {
  const mapped = applyFacadeFlowDryRunDemoMappingChoices(stageFacadeFlowDryRunDemoRecord(loadFacadeFlowDryRunDemoIntake(createFacadeFlowRealDataDryRunState())))
  const confirmed = confirmFacadeFlowDryRunHumanMapping(mapped, 'Dry Run Reviewer', '2026-08-31T15:45:00+03:00')
  const finalState = buildFacadeFlowDryRunActivationCandidate(confirmed)
  assert.equal(finalState.step, 'ACTIVATION_CANDIDATE')
  assert.equal(finalState.candidate?.status, 'READY_FOR_ACTIVATION_REVIEW')
  assert.equal(finalState.candidate?.activationReviewStatus, 'NOT_REVIEWED')
  assert.equal(finalState.candidate?.acceptedIntoActiveData, false)
  assert.equal(finalState.activeDataCount, 0)
  assert.equal(finalState.rulesValidated, false)
  assert.equal(finalState.productionLocked, true)
  assert.equal(finalState.machineReady, false)
})

test('06C.3.9.1 dry run never uses a real Nadezhda profile code or source file as test input', () => {
  const source = readFileSync('src/aiRealDataDryRun.ts', 'utf8')
  for (const realCode of ['78.01', '78.27', '78.33', '78.51']) assert.doesNotMatch(source, new RegExp(realCode.replace('.', '\\.')))
  assert.doesNotMatch(source, /Вадим|Vadim|Пещерско/)
  assert.match(source, /DEMO_DRY_RUN_SOURCE\.xml/)
})

test('06C.3.9.1 UI exposes the complete dry-run path while active data and production remain locked', () => {
  const ui = readFileSync('src/components/RealDataDryRun.tsx', 'utf8')
  const pipeline = readFileSync('src/components/UnifiedDemoPipeline.tsx', 'utf8')
  for (const text of ['КОНТРОЛЕН DRY RUN', 'Зареди тестов запис', 'Премести в карантина', 'Подготви тестовите решения', 'Потвърди човешкото съпоставяне', 'Създай кандидат за преглед за активиране', 'АКТИВНИ ДАННИ: 0', 'АВТОМАТИЧНО СЪПОСТАВЯНЕ: НЕ', 'ПРОИЗВОДСТВО: ЗАКЛЮЧЕНО']) assert.match(ui, new RegExp(text))
  assert.match(pipeline, /RealDataDryRun/)
  for (const unsafe of ['fetch(', 'WebSocket', 'localStorage', 'sessionStorage', 'acceptedIntoActiveData: true', 'machineReady: true']) assert.doesNotMatch(ui + readFileSync('src/aiRealDataDryRun.ts', 'utf8'), new RegExp(unsafe.replace('(', '\\(')))
})
