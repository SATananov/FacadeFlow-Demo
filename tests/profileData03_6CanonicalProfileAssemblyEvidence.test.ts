import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { buildFacadeFlowCanonicalProfileAssignmentBridge } from '../src/aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileTechnicalSemanticsBridge } from '../src/aiCanonicalProfileTechnicalSemanticsBridge'
import { buildCanonicalProfileCompatibilitySemanticsBridge } from '../src/aiCanonicalProfileCompatibilitySemanticsBridge'
import {
  buildCanonicalProfileAssemblyEvidenceBridge,
  PROFILE_DATA_03_6_AI_BRIDGE_SAFETY,
} from '../src/aiCanonicalProfileAssemblyEvidenceBridge'
import {
  PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY,
  PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_VERSION,
  PROFILE_DATA_03_6_STATE,
  resolvePrelude60CanonicalAssemblyEvidence,
} from '../src/profileData/prelude60CanonicalAssemblyEvidence'
import { PRELUDE_60_SASH_OVERLAP_PARAMETER } from '../src/profileData/sashOverlapGeometry'

function compatibilityFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-6-assembly-evidence',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 assembly evidence fixture.',
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
    { id: 'divider-1', orientation: 'VERTICAL', positionRatio: 0.33, evidenceIds: [], unresolved: [] },
    { id: 'divider-2', orientation: 'VERTICAL', positionRatio: 0.66, evidenceIds: [], unresolved: [] },
  ]
  intent.unresolved = []

  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const assignments = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)
  const technical = buildCanonicalProfileTechnicalSemanticsBridge(assignments)
  return buildCanonicalProfileCompatibilitySemanticsBridge(technical)
}

test('PROFILE DATA 03.6 keeps FRAME_MULLION at conceptual + same-system catalogue evidence only', () => {
  assert.equal(PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_VERSION, 'PROFILE_DATA_03.6')
  const evidence = resolvePrelude60CanonicalAssemblyEvidence('FRAME_MULLION')
  assert.equal(evidence.maturity, 'CONCEPTUAL_AND_CATALOGUE_SYSTEM_ONLY')
  assert.equal(evidence.catalogueSystemEvidence.state, 'SAME_SYSTEM_MEMBERSHIP_ONLY')
  assert.equal(evidence.catalogueSystemEvidence.sourceLabel, 'PVC Prelude_bg.pdf')
  assert.equal(evidence.humanWorkingRelationEvidence.state, 'NOT_RECORDED_FOR_THIS_RELATION')
  assert.equal(evidence.verifiedAssemblyNodeEvidence.state, 'NOT_RECORDED')
  assert.equal(evidence.manufacturerAssemblyCompatibilityState, 'NOT_VALIDATED')
})

test('PROFILE DATA 03.6 surfaces the existing human-reviewed 7 mm working rule only for sash relations', () => {
  assert.equal(PRELUDE_60_SASH_OVERLAP_PARAMETER.sashOverlapMm, 7)
  for (const relation of ['FRAME_SASH', 'MULLION_SASH'] as const) {
    const evidence = resolvePrelude60CanonicalAssemblyEvidence(relation)
    assert.equal(evidence.maturity, 'HUMAN_REVIEWED_WORKING_RELATION_RULE')
    assert.equal(evidence.humanWorkingRelationEvidence.state, 'HUMAN_REVIEWED_WORKING_RULE')
    assert.equal(evidence.humanWorkingRelationEvidence.sashOverlapMm, 7)
    assert.equal(evidence.humanWorkingRelationEvidence.ruleKind, 'SYSTEM_SASH_OVERLAP_WHEN_EXPLICITLY_ADJACENT')
    assert.equal(evidence.humanWorkingRelationEvidence.exactProductionConfirmationRequired, true)
    assert.equal(evidence.humanWorkingRelationEvidence.supportsInstanceAdjacencyInference, false)
    assert.equal(evidence.humanWorkingRelationEvidence.supportsManufacturerPairApproval, false)
  }
})

test('PROFILE DATA 03.6 bridge preserves the three canonical relations and their distinct evidence maturity', () => {
  const bridge = buildCanonicalProfileAssemblyEvidenceBridge(compatibilityFixture())
  assert.equal(bridge.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(bridge.rows.length, 3)
  const byRelation = new Map(bridge.rows.map((row) => [row.relation, row]))
  assert.equal(byRelation.get('FRAME_MULLION')?.evidenceMaturity, 'CONCEPTUAL_AND_CATALOGUE_SYSTEM_ONLY')
  assert.equal(byRelation.get('FRAME_SASH')?.evidenceMaturity, 'HUMAN_REVIEWED_WORKING_RELATION_RULE')
  assert.equal(byRelation.get('MULLION_SASH')?.evidenceMaturity, 'HUMAN_REVIEWED_WORKING_RELATION_RULE')
  assert.deepEqual(byRelation.get('FRAME_MULLION')?.rightTargets.map((item) => item.targetRef), ['divider-1', 'divider-2'])
  assert.equal(bridge.instanceAdjacencyAsserted, false)
  assert.equal(bridge.verifiedAssemblyNodeEvidence, false)
})

test('PROFILE DATA 03.6 does not promote human working relation evidence into manufacturer or production validation', () => {
  const bridge = buildCanonicalProfileAssemblyEvidenceBridge(compatibilityFixture())
  for (const row of bridge.rows) {
    assert.equal(row.manufacturerAssemblyCompatibilityState, 'NOT_VALIDATED')
    assert.equal(row.verifiedAssemblyNodeEvidence, false)
    assert.equal(row.exactJointGeometryVerified, false)
    assert.equal(row.productionCompatibilityValidated, false)
    assert.equal(row.productionRuleApplied, false)
    assert.equal(row.productionUnlockAllowed, false)
    assert.equal(row.machineReady, false)
  }
})

test('PROFILE DATA 03.6 blocks when PROFILE DATA 03.5 is upstream-blocked', () => {
  const compatibility = compatibilityFixture()
  const blocked = { ...compatibility, status: 'BLOCKED_UPSTREAM' as const, rows: [] }
  const bridge = buildCanonicalProfileAssemblyEvidenceBridge(blocked)
  assert.equal(bridge.status, 'BLOCKED_UPSTREAM')
  assert.equal(bridge.rows.length, 0)
  assert.match(bridge.conflicts.join('\n'), /assembly evidence is blocked/)
})

test('PROFILE DATA 03.6 UI explicitly separates evidence channels and keeps verified assembly evidence absent', () => {
  const parent = readFileSync('src/components/CanonicalProfileRealConceptual3DPanel.tsx', 'utf8')
  const panel = readFileSync('src/components/CanonicalProfileAssemblyEvidencePanel.tsx', 'utf8')
  assert.match(parent, /CanonicalProfileAssemblyEvidencePanel/)
  assert.match(parent, /bridge=\{bridge\}/)
  assert.match(panel, /ASSEMBLY EVIDENCE · PROVENANCE LEDGER/)
  assert.match(panel, /Catalogue evidence:<\/strong> same PRELUDE 60 system membership only/)
  assert.match(panel, /Verified assembly-node evidence:<\/strong> NOT RECORDED/)
  assert.match(panel, /Manufacturer assembly compatibility:<\/strong> NOT VALIDATED/)
  assert.match(panel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.6 remains OPEN / WORKING and preserves all safety locks', () => {
  assert.equal(PROFILE_DATA_03_6_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_6_STATE.stepStatus, 'WORKING')
  assert.equal(PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY.catalogueEvidenceLimitedToSameSystemMembership, true)
  assert.equal(PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY.humanWorkingRuleIsManufacturerApproval, false)
  assert.equal(PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY.instanceAdjacencyInferenceAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY.verifiedAssemblyNodeEvidence, false)
  assert.equal(PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY.productionUnlockAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY.machineReady, false)

  assert.equal(PROFILE_DATA_03_6_AI_BRIDGE_SAFETY.evidenceLedgerOnly, true)
  assert.equal(PROFILE_DATA_03_6_AI_BRIDGE_SAFETY.noInstanceAdjacencyInference, true)
  assert.equal(PROFILE_DATA_03_6_AI_BRIDGE_SAFETY.manufacturerAssemblyCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_6_AI_BRIDGE_SAFETY.verifiedAssemblyNodeEvidence, false)
  assert.equal(PROFILE_DATA_03_6_AI_BRIDGE_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_6_AI_BRIDGE_SAFETY.productionApproved, false)
})
