import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aggregateWp78ProfileEvidenceGate,
  evaluateWp78ProfileEvidenceGate,
  integrateWp78EvidenceGateWithRuleAggregation,
} from '../src/realData/wp78EvidenceAwareRuleGate'

test('WP78.4 accepts verified frame evidence only as context for human rule review', () => {
  const row = evaluateWp78ProfileEvidenceGate({ system: 'WP 78', role: 'FRAME', code: '78,01' })
  assert.equal(row.evidenceClass, 'SOURCE_VERIFIED_PROJECT_OBSERVED')
  assert.equal(row.projectCodeLiteral, '78.01')
  assert.equal(row.eligibleForHumanRuleReview, true)
  assert.equal(row.autoRulePassAllowed, false)
  assert.equal(row.rulesValidated, false)
})

test('WP78.4 accepts verified divider evidence from source plus Vadim project observation', () => {
  const row = evaluateWp78ProfileEvidenceGate({ system: 'WP 78', role: 'MULLION', code: '78.33' })
  assert.equal(row.evidenceClass, 'SOURCE_VERIFIED_PROJECT_OBSERVED')
  assert.equal(row.sourceCodeLiteral, '78,33')
  assert.equal(row.projectObserved, true)
})

test('WP78.4 keeps 78,22 source-verified but explicitly records the Vadim project evidence gap', () => {
  const row = evaluateWp78ProfileEvidenceGate({ system: 'WP 78', role: 'SASH', code: '78,22' })
  assert.equal(row.evidenceClass, 'SOURCE_VERIFIED_SOURCE_ONLY')
  assert.equal(row.decision, 'ELIGIBLE_WITH_PROJECT_EVIDENCE_GAP')
  assert.equal(row.projectObserved, false)
  assert.equal(row.eligibleForHumanRuleReview, true)
})

test('WP78.4 blocks role inference for project-only 78.27 and 78.51', () => {
  for (const code of ['78.27', '78.51']) {
    const row = evaluateWp78ProfileEvidenceGate({ system: 'WP 78', role: 'SASH', code })
    assert.equal(row.evidenceClass, 'PROJECT_OBSERVED_ROLE_UNCONFIRMED')
    assert.equal(row.decision, 'BLOCK_ROLE_ASSUMPTION')
    assert.equal(row.eligibleForHumanRuleReview, false)
  }
})

test('WP78.4 blocks a source-backed code when the requested role contradicts the verified source role', () => {
  const row = evaluateWp78ProfileEvidenceGate({ system: 'WP 78', role: 'SASH', code: '78.01' })
  assert.equal(row.evidenceClass, 'SOURCE_ROLE_MISMATCH')
  assert.equal(row.verifiedSourceRole, 'FRAME')
  assert.equal(row.decision, 'BLOCK_SOURCE_ROLE_MISMATCH')
})

test('WP78.4 blocks unknown codes and non-WP78 system requests', () => {
  const unknown = evaluateWp78ProfileEvidenceGate({ system: 'WP 78', role: 'FRAME', code: '78,99' })
  assert.equal(unknown.evidenceClass, 'UNKNOWN_CODE')
  assert.equal(unknown.decision, 'BLOCK_UNKNOWN_CODE')

  const wrongSystem = evaluateWp78ProfileEvidenceGate({ system: 'WDS 70', role: 'FRAME', code: '78,01' })
  assert.equal(wrongSystem.evidenceClass, 'SYSTEM_MISMATCH')
  assert.equal(wrongSystem.decision, 'BLOCK_SYSTEM_MISMATCH')
})

test('WP78.4 aggregation exposes project gaps without creating a rule PASS or production unlock', () => {
  const gate = aggregateWp78ProfileEvidenceGate([
    { system: 'WP 78', role: 'FRAME', code: '78,01' },
    { system: 'WP 78', role: 'MULLION', code: '78,33' },
    { system: 'WP 78', role: 'SASH', code: '78,22' },
  ])
  assert.equal(gate.state, 'READY_FOR_HUMAN_RULE_REVIEW_WITH_PROJECT_GAPS')
  assert.equal(gate.sourceVerifiedProjectObservedCount, 2)
  assert.equal(gate.sourceVerifiedSourceOnlyCount, 1)
  assert.deepEqual(gate.projectEvidenceGapCodes, ['78,22'])
  assert.equal(gate.autoRulePassAllowed, false)
  assert.equal(gate.rulesValidated, false)
  assert.equal(gate.productionLocked, true)
  assert.equal(gate.machineReady, false)
})

test('WP78.4 integrates evidence preconditions with the existing rule aggregation while keeping validation incomplete', () => {
  const integrated = integrateWp78EvidenceGateWithRuleAggregation([
    { system: 'WP 78', role: 'FRAME', code: '78,01' },
  ], [])
  assert.equal(integrated.evidenceGate.state, 'READY_FOR_HUMAN_RULE_REVIEW')
  assert.equal(integrated.ruleAggregation.state, 'INCOMPLETE')
  assert.equal(integrated.effectiveState, 'RULE_REVIEW_INCOMPLETE')
  assert.deepEqual(integrated.relevantRequirementIds, ['PROFILE_COMPATIBILITY', 'SOURCE_TRACEABILITY'])
  assert.equal(integrated.validationDecision, 'NOT_MADE')
  assert.equal(integrated.rulesValidated, false)
  assert.equal(integrated.productionApproved, false)
})

test('WP78.4 evidence blockers override the generic rule aggregation path', () => {
  const integrated = integrateWp78EvidenceGateWithRuleAggregation([
    { system: 'WP 78', role: 'SASH', code: '78.27' },
  ], [])
  assert.equal(integrated.evidenceGate.state, 'BLOCKED_EVIDENCE')
  assert.equal(integrated.effectiveState, 'EVIDENCE_BLOCKED')
  assert.equal(integrated.handoffLocked, true)
  assert.equal(integrated.productionLocked, true)
})
