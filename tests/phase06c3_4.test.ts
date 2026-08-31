import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildFacadeFlowDemoRulesGate } from '../src/aiRulesGate'
import { canHumanConfirmFacadeFlowRuleSource, confirmFacadeFlowRuleSource, createFacadeFlowRuleSourceDraft, facadeFlowRuleSourceMissingFields, updateFacadeFlowRuleSource } from '../src/aiRuleSources'
import { applyFacadeFlowAiDemoScenario, completeFacadeFlowDemoHumanReview, createFacadeFlowAiSession, prepareFacadeFlowDemoReviewPacket, setFacadeFlowDemoReviewAccepted } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

function reviewedPacket() {
  let session = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('rule-source-foundation'), 'GUIDED_WINDOW', sampleCatalogueProfiles), sampleCatalogueProfiles)
  session = setFacadeFlowDemoReviewAccepted(session, true)
  session = completeFacadeFlowDemoHumanReview(session)
  return session.job.reviewPacket!
}

function completeDraft() {
  return updateFacadeFlowRuleSource(createFacadeFlowRuleSourceDraft('source-1', 'GEOMETRY_LIMITS'), {
    sourceKind: 'MANUFACTURER_CATALOGUE', sourceTitle: 'REAL SOURCE TITLE', sourceReference: 'REAL-DOC-REF',
    sourceLocation: 'page / row / detail', revision: 'REVISION-ID', scope: 'REAL SYSTEM / SCOPE', sourceDate: 'YYYY-MM-DD',
  })
}

void test('06C.3.4 rules gate starts with an empty source registry and no rule-set revision', () => {
  const gate = buildFacadeFlowDemoRulesGate(reviewedPacket())
  assert.deepEqual(gate.sourceRecords, [])
  assert.equal(gate.sourceRecordCount, 0)
  assert.equal(gate.humanConfirmedSourceCount, 0)
  assert.equal(gate.ruleSetRevision, null)
  assert.equal(gate.sourceRevisionPolicy.humanConfirmationRequired, true)
  assert.equal(gate.sourceRevisionPolicy.ruleSetRevisionRequiresConfirmedSources, true)
  assert.ok(gate.sourceRevisionPolicy.invalidateOn.includes('REVISION_CHANGED'))
  assert.equal(gate.validated, false)
  assert.equal(gate.machineReady, false)
})

void test('06C.3.4 a new source record is only an empty NEEDS_REVIEW draft', () => {
  const draft = createFacadeFlowRuleSourceDraft('source-empty', 'PROFILE_COMPATIBILITY')
  assert.equal(draft.reviewStatus, 'NEEDS_REVIEW')
  assert.equal(draft.reviewer, '')
  assert.equal(draft.reviewedAt, null)
  assert.deepEqual(draft.evidence, [])
  assert.equal(draft.machineReady, false)
  assert.ok(facadeFlowRuleSourceMissingFields(draft).length >= 6)
})

void test('06C.3.4 incomplete or anonymous source records cannot be HUMAN_CONFIRMED', () => {
  const empty = createFacadeFlowRuleSourceDraft('source-incomplete', 'GEOMETRY_LIMITS')
  assert.equal(canHumanConfirmFacadeFlowRuleSource(empty, 'Technologist'), false)
  assert.equal(confirmFacadeFlowRuleSource(empty, 'Technologist', '2026-08-31T12:00:00+03:00').reviewStatus, 'NEEDS_REVIEW')
  assert.equal(canHumanConfirmFacadeFlowRuleSource(completeDraft(), ''), false)
})

void test('06C.3.4 complete traceable source data can be human-confirmed without validating a rule', () => {
  const confirmed = confirmFacadeFlowRuleSource(completeDraft(), 'Human Reviewer', '2026-08-31T12:00:00+03:00', 'Source reviewed only')
  assert.equal(confirmed.reviewStatus, 'HUMAN_CONFIRMED')
  assert.equal(confirmed.reviewer, 'Human Reviewer')
  assert.equal(confirmed.reviewedAt, '2026-08-31T12:00:00+03:00')
  assert.equal(confirmed.machineReady, false)
})

void test('06C.3.4 revision changes invalidate previous human source confirmation', () => {
  const confirmed = confirmFacadeFlowRuleSource(completeDraft(), 'Human Reviewer', '2026-08-31T12:00:00+03:00')
  const changed = updateFacadeFlowRuleSource(confirmed, { revision: 'REVISION-ID-2' })
  assert.equal(changed.reviewStatus, 'NEEDS_REVIEW')
  assert.equal(changed.reviewer, '')
  assert.equal(changed.reviewedAt, null)
  assert.deepEqual(changed.reReviewReasons, ['REVISION_CHANGED'])
})

void test('06C.3.4 scope and source-location changes also force a repeat review', () => {
  const confirmed = confirmFacadeFlowRuleSource(completeDraft(), 'Human Reviewer', '2026-08-31T12:00:00+03:00')
  const changed = updateFacadeFlowRuleSource(confirmed, { scope: 'ANOTHER REAL SCOPE', sourceLocation: 'another page / row' })
  assert.equal(changed.reviewStatus, 'NEEDS_REVIEW')
  assert.ok(changed.reReviewReasons.includes('SCOPE_CHANGED'))
  assert.ok(changed.reReviewReasons.includes('SOURCE_LOCATION_CHANGED'))
  assert.equal(changed.machineReady, false)
})

void test('06C.3.4 review-note edits do not invalidate source identity or revision', () => {
  const confirmed = confirmFacadeFlowRuleSource(completeDraft(), 'Human Reviewer', '2026-08-31T12:00:00+03:00')
  const changed = updateFacadeFlowRuleSource(confirmed, { reviewNote: 'Clarified review note only' })
  assert.equal(changed.reviewStatus, 'HUMAN_CONFIRMED')
  assert.equal(changed.reviewer, 'Human Reviewer')
  assert.deepEqual(changed.reReviewReasons, [])
})

void test('06C.3.4 UI documents the provenance and revision model without unlocking validation or production', () => {
  const component = readFileSync('src/components/RuleSourceRevisionFoundation.tsx', 'utf8')
  const model = readFileSync('src/aiRuleSources.ts', 'utf8')
  const gate = readFileSync('src/aiRulesGate.ts', 'utf8')
  const combined = [component, model, gate].join('\n')
  assert.match(component, /РЕАЛНИ ИЗТОЧНИЦИ:/)
  assert.match(component, /Система \/ обхват/)
  assert.match(component, /Ревизия \/ дата/)
  assert.match(component, /Човешко потвърждение/)
  assert.match(component, /Повторна проверка/)
  assert.match(component, /ПРАВИЛА ПРОВЕРЕНИ: НЕ/)
  assert.match(model, /REVISION_CHANGED/)
  assert.match(model, /SCOPE_CHANGED/)
  assert.doesNotMatch(combined, /fetch\s*\(|WebSocket\s*\(|localStorage|sessionStorage/)
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|validated\s*:\s*true|productionApproved\s*:\s*true/)
})
