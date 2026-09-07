import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { buildFacadeFlowCanonicalProfileAssignmentBridge } from '../src/aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileTechnicalSemanticsBridge } from '../src/aiCanonicalProfileTechnicalSemanticsBridge'
import {
  buildCanonicalProfileCompatibilitySemanticsBridge,
  PROFILE_DATA_03_5_AI_BRIDGE_SAFETY,
} from '../src/aiCanonicalProfileCompatibilitySemanticsBridge'
import {
  PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY,
  PRELUDE_60_CANONICAL_COMPATIBILITY_SEMANTICS_VERSION,
  PROFILE_DATA_03_5_STATE,
  resolvePrelude60CanonicalCompatibilitySemantics,
} from '../src/profileData/prelude60CanonicalCompatibilitySemantics'

function explicitPreludeIntent() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-5-compatibility-semantics',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 canonical compatibility semantics fixture.',
    aiGenerated: false,
  })
  intent.category = 'WINDOW'
  intent.dimensions = { widthMm: 1800, heightMm: 1400 }
  intent.profiles = { system: 'PRELUDE 60', frame: '482.30', mullion: '482.21', sash: '482.05' }
  intent.fields = [
    { id: 'field-1', order: 0, role: 'FIXED', evidenceIds: [], unresolved: [] },
    { id: 'field-2', order: 1, role: 'OPENING_SASH', openingType: 'TILT_TURN', openingDirection: 'RIGHT', evidenceIds: [], unresolved: [] },
    { id: 'field-3', order: 2, role: 'FIXED', evidenceIds: [], unresolved: [] },
  ]
  intent.dividers = [
    { id: 'divider-1', orientation: 'VERTICAL', positionRatio: 1 / 3, evidenceIds: [], unresolved: [] },
    { id: 'divider-2', orientation: 'VERTICAL', positionRatio: 2 / 3, evidenceIds: [], unresolved: [] },
  ]
  return intent
}

function technicalFixture() {
  const intent = explicitPreludeIntent()
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)
  return buildCanonicalProfileTechnicalSemanticsBridge(bridge)
}

test('PROFILE DATA 03.5 resolves all PRELUDE canonical cross-role pairs as conceptual system-role relations only', () => {
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SEMANTICS_VERSION, 'PROFILE_DATA_03.5')
  const cases = [
    ['482.30', 'FRAME', '482.21', 'MULLION', 'FRAME_MULLION'],
    ['482.30', 'FRAME', '482.05', 'SASH', 'FRAME_SASH'],
    ['482.21', 'MULLION', '482.05', 'SASH', 'MULLION_SASH'],
  ] as const

  for (const [leftCode, leftRole, rightCode, rightRole, relation] of cases) {
    const result = resolvePrelude60CanonicalCompatibilitySemantics({ leftCode, leftRole, rightCode, rightRole })
    assert.equal(result.state, 'RESOLVED_CONCEPTUAL_SYSTEM_ROLE_RELATION')
    assert.equal(result.semantics?.relation, relation)
    assert.equal(result.semantics?.systemId, 'PRELUDE_60')
    assert.equal(result.semantics?.compatibilityAuthority, 'CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY')
    assert.equal(result.semantics?.manufacturerAssemblyCompatibilityState, 'NOT_VALIDATED')
    assert.equal(result.semantics?.exactJointGeometryAuthority, 'NOT_ESTABLISHED')
    assert.equal(result.semantics?.productionCompatibilityValidated, false)
  }
})

test('PROFILE DATA 03.5 fails closed for role/code mismatch and same-role pseudo-pairs', () => {
  const mismatch = resolvePrelude60CanonicalCompatibilitySemantics({ leftCode: '482.05', leftRole: 'FRAME', rightCode: '482.21', rightRole: 'MULLION' })
  assert.equal(mismatch.state, 'INVALID_LEFT_PROFILE_OR_ROLE')
  assert.equal(mismatch.semantics, undefined)

  const sameRole = resolvePrelude60CanonicalCompatibilitySemantics({ leftCode: '482.30', leftRole: 'FRAME', rightCode: '482.30', rightRole: 'FRAME' })
  assert.equal(sameRole.state, 'SAME_ROLE_NOT_A_PAIR')
  assert.equal(sameRole.semantics, undefined)
})

test('PROFILE DATA 03.5 bridge deduplicates repeated target instances and yields only three canonical role relations', () => {
  const compatibility = buildCanonicalProfileCompatibilitySemanticsBridge(technicalFixture())
  assert.equal(compatibility.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(compatibility.rows.map((row) => row.relation).sort(), ['FRAME_MULLION', 'FRAME_SASH', 'MULLION_SASH'])
  const frameMullion = compatibility.rows.find((row) => row.relation === 'FRAME_MULLION')!
  assert.deepEqual(frameMullion.leftTargets.map((item) => item.targetRef), ['frame-root'])
  assert.deepEqual(frameMullion.rightTargets.map((item) => item.targetRef), ['divider-1', 'divider-2'])
  assert.equal(compatibility.instanceAdjacencyAsserted, false)
  assert.equal(compatibility.manufacturerAssemblyCompatibilityValidated, false)
})

test('PROFILE DATA 03.5 does not invent a missing role relation when only one canonical role remains in the source bridge', () => {
  const technical = technicalFixture()
  const frameOnly = { ...technical, rows: technical.rows.filter((row) => row.role === 'FRAME') }
  const compatibility = buildCanonicalProfileCompatibilitySemanticsBridge(frameOnly)
  assert.equal(compatibility.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(compatibility.rows.length, 0)
  assert.match(compatibility.warnings.join('\n'), /no pair relation is inferred or invented/)
})

test('PROFILE DATA 03.5 blocks when PROFILE DATA 03.4 is upstream-blocked', () => {
  const technical = technicalFixture()
  const blocked = { ...technical, status: 'BLOCKED_UPSTREAM' as const, rows: [] }
  const compatibility = buildCanonicalProfileCompatibilitySemanticsBridge(blocked)
  assert.equal(compatibility.status, 'BLOCKED_UPSTREAM')
  assert.equal(compatibility.rows.length, 0)
  assert.match(compatibility.conflicts.join('\n'), /compatibility semantics are blocked/)
})

test('PROFILE DATA 03.5 UI states that system-role coherence is not manufacturer assembly validation', () => {
  const parent = readFileSync('src/components/CanonicalProfileRealConceptual3DPanel.tsx', 'utf8')
  const panel = readFileSync('src/components/CanonicalProfileCompatibilitySemanticsPanel.tsx', 'utf8')
  assert.match(parent, /CanonicalProfileCompatibilitySemanticsPanel/)
  assert.match(parent, /bridge=\{bridge\}/)
  assert.match(panel, /PROFILE COMPATIBILITY SEMANTICS · SYSTEM \/ ROLE COHERENCE/)
  assert.match(panel, /Manufacturer assembly compatibility:<\/strong> NOT VALIDATED/)
  assert.match(panel, /Instance adjacency:<\/strong> НЕ СЕ ТВЪРДИ/)
  assert.match(panel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.5 remains OPEN / WORKING and preserves production safety boundaries', () => {
  assert.equal(PROFILE_DATA_03_5_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_5_STATE.stepStatus, 'WORKING')
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY.conceptualSystemRoleCoherenceOnly, true)
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY.manufacturerAssemblyCompatibilityValidated, false)
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY.exactJointGeometryAuthorityEstablished, false)
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY.profilePairAutoSelectionAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY.productionUnlockAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY.machineReady, false)

  assert.equal(PROFILE_DATA_03_5_AI_BRIDGE_SAFETY.systemRoleCoherenceOnly, true)
  assert.equal(PROFILE_DATA_03_5_AI_BRIDGE_SAFETY.noInstanceAdjacencyInference, true)
  assert.equal(PROFILE_DATA_03_5_AI_BRIDGE_SAFETY.manufacturerAssemblyCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_5_AI_BRIDGE_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_5_AI_BRIDGE_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(PROFILE_DATA_03_5_AI_BRIDGE_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_5_AI_BRIDGE_SAFETY.productionApproved, false)
})
