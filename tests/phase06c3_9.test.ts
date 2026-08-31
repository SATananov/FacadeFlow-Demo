import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createFacadeFlowRealDataIntakeDraft, setFacadeFlowRealDataIntakeField } from '../src/aiRealDataIntake'
import {
  REAL_DATA_STAGING_MAPPING_FIELDS,
  buildFacadeFlowMappedDataCandidate,
  confirmFacadeFlowStagingHumanMapping,
  createFacadeFlowRealDataStagingRecord,
  refreshFacadeFlowStagingFromIntake,
  setFacadeFlowStagingMappingDecision,
} from '../src/aiRealDataStaging'

const readyIntake = () => {
  let record = createFacadeFlowRealDataIntakeDraft('real-001')
  const required: Array<[Parameters<typeof setFacadeFlowRealDataIntakeField>[1], string]> = [
    ['sourceKind', 'XML'],
    ['sourceReference', 'project.xml'],
    ['sourceRevision', 'sha256:demo'],
    ['sourceLocation', 'barcode:001'],
    ['recordKind', 'PRODUCT'],
    ['externalReference', 'W-001'],
  ]
  for (const [field, value] of required) record = setFacadeFlowRealDataIntakeField(record, field, value, 'RESOLVED', [`evidence:${field}`])
  record = setFacadeFlowRealDataIntakeField(record, 'productType', 'WINDOW', 'RESOLVED', ['evidence:productType'])
  record = setFacadeFlowRealDataIntakeField(record, 'profileCode', '78.01', 'RESOLVED', ['evidence:profileCode'])
  return record
}

const completeMappings = (staging: NonNullable<ReturnType<typeof createFacadeFlowRealDataStagingRecord>>) => {
  let next = staging
  for (const mapping of staging.mappings) {
    next = mapping.sourceState === 'RESOLVED'
      ? setFacadeFlowStagingMappingDecision(next, mapping.fieldId, 'KEEP_SOURCE')
      : setFacadeFlowStagingMappingDecision(next, mapping.fieldId, 'ACKNOWLEDGED_UNRESOLVED')
  }
  return next
}

test('06C.3.9 unresolved or conflicting intake records cannot enter staging', () => {
  const unresolved = createFacadeFlowRealDataIntakeDraft('unresolved')
  assert.equal(createFacadeFlowRealDataStagingRecord(unresolved), null)
  const conflict = setFacadeFlowRealDataIntakeField(readyIntake(), 'profileCode', '78.01 / 78.33', 'CONFLICT', ['source:a', 'source:b'])
  assert.equal(conflict.status, 'CONFLICT')
  assert.equal(createFacadeFlowRealDataStagingRecord(conflict), null)
})

test('06C.3.9 READY_FOR_REVIEW intake enters staging with no automatic mapping or activation', () => {
  const staging = createFacadeFlowRealDataStagingRecord(readyIntake())
  assert.ok(staging)
  assert.equal(staging.status, 'MAPPING_INCOMPLETE')
  assert.equal(staging.autoMappingAllowed, false)
  assert.equal(staging.acceptedIntoActiveData, false)
  assert.equal(staging.persistenceAllowed, false)
  assert.equal(staging.mappings.length, REAL_DATA_STAGING_MAPPING_FIELDS.length)
  assert.ok(staging.mappings.every((item) => item.decision === 'UNREVIEWED' && item.canonicalValue === null))
})

test('06C.3.9 source values and evidence are preserved while mapping decisions remain separate', () => {
  const staging = createFacadeFlowRealDataStagingRecord(readyIntake())!
  const profile = staging.mappings.find((item) => item.fieldId === 'profileCode')!
  assert.equal(profile.sourceValue, '78.01')
  assert.deepEqual(profile.evidenceRefs, ['evidence:profileCode'])
  const mapped = setFacadeFlowStagingMappingDecision(staging, 'profileCode', 'MAP_TO_CANONICAL', 'SYSTEM-78-FRAME')
  const nextProfile = mapped.mappings.find((item) => item.fieldId === 'profileCode')!
  assert.equal(nextProfile.sourceValue, '78.01')
  assert.equal(nextProfile.canonicalValue, 'SYSTEM-78-FRAME')
  assert.deepEqual(nextProfile.evidenceRefs, ['evidence:profileCode'])
})

test('06C.3.9 resolved and unresolved fields require explicit human mapping decisions', () => {
  let staging = createFacadeFlowRealDataStagingRecord(readyIntake())!
  staging = setFacadeFlowStagingMappingDecision(staging, 'productType', 'KEEP_SOURCE')
  assert.equal(staging.mappings.find((item) => item.fieldId === 'productType')?.canonicalValue, 'WINDOW')
  staging = setFacadeFlowStagingMappingDecision(staging, 'hardware', 'ACKNOWLEDGED_UNRESOLVED')
  assert.equal(staging.mappings.find((item) => item.fieldId === 'hardware')?.canonicalValue, null)
  assert.equal(staging.status, 'MAPPING_INCOMPLETE')
})

test('06C.3.9 human mapping confirmation requires complete decisions, reviewer and review time', () => {
  const staging = createFacadeFlowRealDataStagingRecord(readyIntake())!
  assert.equal(confirmFacadeFlowStagingHumanMapping(staging, 'Technologist', '2026-08-31T12:00:00+03:00').humanReviewStatus, 'NOT_REVIEWED')
  const complete = completeMappings(staging)
  assert.equal(complete.status, 'READY_FOR_HUMAN_CONFIRMATION')
  assert.equal(confirmFacadeFlowStagingHumanMapping(complete, '', '2026-08-31T12:00:00+03:00').humanReviewStatus, 'NOT_REVIEWED')
  const confirmed = confirmFacadeFlowStagingHumanMapping(complete, 'Technologist', '2026-08-31T12:00:00+03:00')
  assert.equal(confirmed.humanReviewStatus, 'HUMAN_CONFIRMED')
  assert.equal(confirmed.status, 'READY_FOR_ACTIVATION_REVIEW')
})

test('06C.3.9 HUMAN CONFIRMED mapping creates only an activation-review candidate and never active data', () => {
  const staging = completeMappings(createFacadeFlowRealDataStagingRecord(readyIntake())!)
  const confirmed = confirmFacadeFlowStagingHumanMapping(staging, 'Technologist', '2026-08-31T12:00:00+03:00')
  const candidate = buildFacadeFlowMappedDataCandidate(confirmed)
  assert.ok(candidate)
  assert.equal(candidate.status, 'READY_FOR_ACTIVATION_REVIEW')
  assert.equal(candidate.activationReviewStatus, 'NOT_REVIEWED')
  assert.equal(candidate.acceptedIntoActiveData, false)
  assert.equal(candidate.rulesValidated, false)
  assert.equal(candidate.productionLocked, true)
  assert.equal(candidate.machineReady, false)
})

test('06C.3.9 mapping or source changes invalidate stale human mapping confirmation', () => {
  const intake = readyIntake()
  const complete = completeMappings(createFacadeFlowRealDataStagingRecord(intake)!)
  const confirmed = confirmFacadeFlowStagingHumanMapping(complete, 'Technologist', '2026-08-31T12:00:00+03:00')
  const changedMapping = setFacadeFlowStagingMappingDecision(confirmed, 'profileCode', 'MAP_TO_CANONICAL', 'OTHER-CODE')
  assert.equal(changedMapping.humanReviewStatus, 'NOT_REVIEWED')
  const changedIntake = setFacadeFlowRealDataIntakeField(intake, 'profileCode', '78.33', 'RESOLVED', ['evidence:profileCode:v2'])
  const refreshed = refreshFacadeFlowStagingFromIntake(confirmed, changedIntake)
  assert.ok(refreshed)
  assert.equal(refreshed.humanReviewStatus, 'NOT_REVIEWED')
  assert.equal(refreshed.status, 'MAPPING_INCOMPLETE')
})

test('06C.3.9 UI exposes staging and human mapping review while active data, persistence and production stay locked', () => {
  const ui = readFileSync('src/components/RealDataStagingHumanMappingFoundation.tsx', 'utf8')
  const model = readFileSync('src/aiRealDataStaging.ts', 'utf8')
  const pipeline = readFileSync('src/components/UnifiedDemoPipeline.tsx', 'utf8')
  for (const text of ['ЗАПИСИ В КАРАНТИНА: 0', 'СЪПОСТАВЕНИ ОТ ЧОВЕК: 0', 'АКТИВНИ ДАННИ: 0', 'АВТОМАТИЧНО СЪПОСТАВЯНЕ: НЕ', 'ПРЕГЛЕД ЗА АКТИВИРАНЕ', 'СЪПОСТАВЕНО ОТ ЧОВЕК ≠ АКТИВНИ ДАННИ']) assert.match(ui, new RegExp(text))
  assert.match(pipeline, /RealDataStagingHumanMappingFoundation/)
  for (const unsafe of ['fetch(', 'WebSocket', 'localStorage', 'sessionStorage']) assert.doesNotMatch(model + ui, new RegExp(unsafe.replace('(', '\\(')))
  for (const safe of ['acceptedIntoActiveData: false', 'persistenceAllowed: false', 'rulesValidated: false', 'productionLocked: true', 'machineReady: false']) assert.match(model, new RegExp(safe))
})
