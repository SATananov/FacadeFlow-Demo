import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { CanonicalProfileAssemblyEvidenceReadiness } from '../src/aiCanonicalProfileAssemblyEvidenceReadiness'
import type {
  CanonicalProfileEvidenceResolutionAggregation,
  CanonicalProfileKnowledgeRequirementAggregateRow,
} from '../src/aiCanonicalProfileEvidenceResolutionAggregation'
import { buildCanonicalProfileKnowledgeReadinessSummary } from '../src/aiCanonicalProfileKnowledgeReadinessSummary'
import {
  buildCanonicalProfileRelationKnowledgeReadiness,
  PROFILE_DATA_03_18_SAFETY,
} from '../src/aiCanonicalProfileRelationKnowledgeReadiness'
import {
  buildCanonicalProfileSystemKnowledgeReadiness,
  PROFILE_DATA_03_19_SAFETY,
} from '../src/aiCanonicalProfileSystemKnowledgeReadiness'
import {
  buildCanonicalProfileSystemKnowledgeGate,
  PROFILE_DATA_03_20_SAFETY,
} from '../src/aiCanonicalProfileSystemKnowledgeGate'

type RequirementKind = CanonicalProfileKnowledgeRequirementAggregateRow['requirementKind']

const authorityByKind: Record<RequirementKind, CanonicalProfileKnowledgeRequirementAggregateRow['authorityNeeded']> = {
  HUMAN_WORKING_RELATION_EVIDENCE: 'HUMAN_TECHNICAL_CONFIRMATION',
  MANUFACTURER_PAIR_RELATION_EVIDENCE: 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT',
  VERIFIED_ASSEMBLY_NODE_EVIDENCE: 'HUMAN_VERIFIED_REAL_ASSEMBLY_NODE',
  EXACT_JOINT_DOCUMENTATION: 'MANUFACTURER_OR_ENGINEERING_EXACT_JOINT_DOCUMENT',
}

const relationRequirements = {
  FRAME_MULLION: [
    'HUMAN_WORKING_RELATION_EVIDENCE',
    'MANUFACTURER_PAIR_RELATION_EVIDENCE',
    'VERIFIED_ASSEMBLY_NODE_EVIDENCE',
    'EXACT_JOINT_DOCUMENTATION',
  ],
  FRAME_SASH: [
    'MANUFACTURER_PAIR_RELATION_EVIDENCE',
    'VERIFIED_ASSEMBLY_NODE_EVIDENCE',
    'EXACT_JOINT_DOCUMENTATION',
  ],
  MULLION_SASH: [
    'MANUFACTURER_PAIR_RELATION_EVIDENCE',
    'VERIFIED_ASSEMBLY_NODE_EVIDENCE',
    'EXACT_JOINT_DOCUMENTATION',
  ],
} as const satisfies Record<string, readonly RequirementKind[]>

const relationProfiles = {
  FRAME_MULLION: { leftRole: 'FRAME', leftProfileCode: '482.30', rightRole: 'MULLION', rightProfileCode: '482.21' },
  FRAME_SASH: { leftRole: 'FRAME', leftProfileCode: '482.30', rightRole: 'SASH', rightProfileCode: '482.05' },
  MULLION_SASH: { leftRole: 'MULLION', leftProfileCode: '482.21', rightRole: 'SASH', rightProfileCode: '482.05' },
} as const

const keyOf = (relation: string, requirementKind: string) => `${relation}:${requirementKind}`

function fixture(resolvedKeys: readonly string[] = [], aggregationStatus?: CanonicalProfileEvidenceResolutionAggregation['status']) {
  const sourceIntentId = 'profile-data03-18-20-fixture'
  const rows = Object.entries(relationRequirements).flatMap(([relation, kinds]) => kinds.map((requirementKind) => {
    const resolvedForKnowledgeReadiness = resolvedKeys.includes(keyOf(relation, requirementKind))
    return {
      relation: relation as CanonicalProfileKnowledgeRequirementAggregateRow['relation'],
      requirementKind,
      authorityNeeded: authorityByKind[requirementKind],
      sourceReason: `Fixture requirement ${requirementKind}`,
      state: resolvedForKnowledgeReadiness ? 'RESOLVED_FOR_KNOWLEDGE_READINESS' as const : 'NO_CANDIDATE_EVIDENCE' as const,
      candidateEvidenceCount: resolvedForKnowledgeReadiness ? 1 : 0,
      satisfiedReviewCount: resolvedForKnowledgeReadiness ? 1 : 0,
      explicitResolutionCount: resolvedForKnowledgeReadiness ? 1 : 0,
      resolvedForKnowledgeReadiness,
      productionCompatibilityValidated: false as const,
      productionUnlockAllowed: false as const,
      machineReady: false as const,
    }
  }))
  const resolvedKnowledgeRequirementCount = rows.filter((row) => row.resolvedForKnowledgeReadiness).length
  const totalKnowledgeRequirementCount = rows.length
  const unresolvedKnowledgeRequirementCount = totalKnowledgeRequirementCount - resolvedKnowledgeRequirementCount

  const aggregation: CanonicalProfileEvidenceResolutionAggregation = {
    version: 'PROFILE_DATA_03.16',
    sourceIntentId,
    status: aggregationStatus ?? (
      resolvedKnowledgeRequirementCount === 0
        ? 'KNOWLEDGE_REQUIREMENTS_UNRESOLVED'
        : unresolvedKnowledgeRequirementCount === 0
          ? 'ALL_KNOWLEDGE_REQUIREMENTS_RESOLVED_PRODUCTION_LOCKED'
          : 'KNOWLEDGE_REQUIREMENTS_PARTIALLY_RESOLVED_PRODUCTION_LOCKED'
    ),
    rows,
    conflicts: [],
    warnings: [],
    totalKnowledgeRequirementCount,
    resolvedKnowledgeRequirementCount,
    unresolvedKnowledgeRequirementCount,
    knowledgeCoveragePercent: Math.round((resolvedKnowledgeRequirementCount / totalKnowledgeRequirementCount) * 100),
    sourceReadinessMutated: false,
    validatedEvidenceCreated: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    productionCompatibilityValidated: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }

  const readiness = {
    sourceIntentId,
    warnings: [],
    rows: Object.entries(relationRequirements).map(([relation, kinds]) => ({
      relation,
      ...relationProfiles[relation as keyof typeof relationProfiles],
      requirements: kinds.map((kind) => ({ kind })),
    })),
  } as unknown as CanonicalProfileAssemblyEvidenceReadiness

  const summary = buildCanonicalProfileKnowledgeReadinessSummary(aggregation)
  return { readiness, aggregation, summary }
}

const allKeys = Object.entries(relationRequirements).flatMap(([relation, kinds]) => kinds.map((kind) => keyOf(relation, kind)))

test('PROFILE DATA 03.18 binds relation knowledge readiness to PRELUDE 60 profile pairs', () => {
  const { readiness, aggregation, summary } = fixture()
  const matrix = buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary })
  assert.equal(matrix.systemId, 'PRELUDE_60')
  assert.equal(matrix.systemLabel, 'PRELUDE 60')
  assert.equal(matrix.relationCount, 3)
  assert.equal(matrix.rows.reduce((sum, row) => sum + row.totalRequirementCount, 0), 10)
  assert.deepEqual(matrix.rows.map((row) => [row.relation, row.leftProfileCode, row.rightProfileCode]), [
    ['FRAME_MULLION', '482.30', '482.21'],
    ['FRAME_SASH', '482.30', '482.05'],
    ['MULLION_SASH', '482.21', '482.05'],
  ])
})

test('PROFILE DATA 03.18 exposes partial coverage per relation without production semantics', () => {
  const { readiness, aggregation, summary } = fixture(['FRAME_MULLION:HUMAN_WORKING_RELATION_EVIDENCE'])
  const matrix = buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary })
  const frameMullion = matrix.rows.find((row) => row.relation === 'FRAME_MULLION')!
  assert.equal(frameMullion.resolvedRequirementCount, 1)
  assert.equal(frameMullion.totalRequirementCount, 4)
  assert.equal(frameMullion.knowledgeCoveragePercent, 25)
  assert.equal(frameMullion.state, 'RELATION_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED')
  assert.equal(frameMullion.productionCompatibilityValidated, false)
  assert.equal(frameMullion.automaticGeometryAllowed, false)
})

test('PROFILE DATA 03.19 aggregates unresolved requirement kinds across the entire system', () => {
  const { readiness, aggregation, summary } = fixture()
  const matrix = buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary })
  const system = buildCanonicalProfileSystemKnowledgeReadiness(matrix)
  const human = system.unresolvedByRequirementKind.find((row) => row.requirementKind === 'HUMAN_WORKING_RELATION_EVIDENCE')!
  const manufacturer = system.unresolvedByRequirementKind.find((row) => row.requirementKind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE')!
  const node = system.unresolvedByRequirementKind.find((row) => row.requirementKind === 'VERIFIED_ASSEMBLY_NODE_EVIDENCE')!
  const joint = system.unresolvedByRequirementKind.find((row) => row.requirementKind === 'EXACT_JOINT_DOCUMENTATION')!
  assert.deepEqual([human.unresolvedCount, manufacturer.unresolvedCount, node.unresolvedCount, joint.unresolvedCount], [1, 3, 3, 3])
  assert.equal(system.totalKnowledgeRequirementCount, 10)
  assert.equal(system.knowledgeCoveragePercent, 0)
  assert.equal(system.status, 'SYSTEM_KNOWLEDGE_INCOMPLETE')
})

test('PROFILE DATA 03.19 reports system-level partial readiness from relation coverage', () => {
  const { readiness, aggregation, summary } = fixture(['FRAME_MULLION:HUMAN_WORKING_RELATION_EVIDENCE'])
  const system = buildCanonicalProfileSystemKnowledgeReadiness(buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary }))
  assert.equal(system.resolvedKnowledgeRequirementCount, 1)
  assert.equal(system.unresolvedKnowledgeRequirementCount, 9)
  assert.equal(system.knowledgeCoveragePercent, 10)
  assert.equal(system.allRelationKnowledgeComplete, false)
  assert.equal(system.status, 'SYSTEM_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED')
})

test('PROFILE DATA 03.20 allows read-only knowledge diagnostics while gaps remain', () => {
  const { readiness, aggregation, summary } = fixture(['FRAME_MULLION:HUMAN_WORKING_RELATION_EVIDENCE'])
  const system = buildCanonicalProfileSystemKnowledgeReadiness(buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary }))
  const gate = buildCanonicalProfileSystemKnowledgeGate(system)
  assert.equal(gate.status, 'KNOWLEDGE_GAPS_REMAIN_PRODUCTION_LOCKED')
  assert.equal(gate.aiKnowledgeDiagnosticAllowed, true)
  assert.equal(gate.aiMayDescribeKnownCoverage, true)
  assert.equal(gate.aiMayDescribeKnowledgeGaps, true)
  assert.equal(gate.aiMayClaimProductionCompatibility, false)
  assert.equal(gate.productionUnlockAllowed, false)
  assert.equal(gate.machineReady, false)
})

test('PROFILE DATA 03.20 10/10 knowledge coverage stays production locked', () => {
  const { readiness, aggregation, summary } = fixture(allKeys)
  const matrix = buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary })
  const system = buildCanonicalProfileSystemKnowledgeReadiness(matrix)
  const gate = buildCanonicalProfileSystemKnowledgeGate(system)
  assert.equal(matrix.completeRelationCount, 3)
  assert.equal(system.knowledgeCoveragePercent, 100)
  assert.equal(system.allRelationKnowledgeComplete, true)
  assert.equal(gate.status, 'KNOWLEDGE_COVERAGE_COMPLETE_PRODUCTION_LOCKED')
  assert.equal(gate.aiMayClaimManufacturerApproval, false)
  assert.equal(gate.aiMayClaimExactJointGeometry, false)
  assert.equal(gate.aiMayClaimProductionCompatibility, false)
  assert.equal(gate.automaticProfileSelectionAllowed, false)
  assert.equal(gate.automaticGeometryAllowed, false)
  assert.equal(gate.productionRulesValidated, false)
  assert.equal(gate.productionUnlockAllowed, false)
  assert.equal(gate.machineReady, false)
})

test('PROFILE DATA 03.18-03.20 propagates stale state and disables AI diagnostic claims', () => {
  const { readiness, aggregation, summary } = fixture([], 'STALE_REVIEW_REQUIRED')
  const matrix = buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary })
  const system = buildCanonicalProfileSystemKnowledgeReadiness(matrix)
  const gate = buildCanonicalProfileSystemKnowledgeGate(system)
  assert.equal(matrix.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(system.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(gate.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(gate.aiKnowledgeDiagnosticAllowed, false)
  assert.equal(gate.aiMayDescribeKnownCoverage, false)
  assert.equal(gate.aiMayDescribeKnowledgeGaps, false)
})

test('PROFILE DATA 03.18 fails closed on source intent mismatch', () => {
  const { readiness, aggregation, summary } = fixture()
  const mismatched = { ...readiness, sourceIntentId: 'different-intent' }
  const matrix = buildCanonicalProfileRelationKnowledgeReadiness({ readiness: mismatched, aggregation, summary })
  assert.equal(matrix.status, 'BLOCKED_UPSTREAM')
  assert.match(matrix.conflicts.join(' '), /sourceIntentId mismatch/)
})

test('PROFILE DATA 03.18-03.20 UI is nested under 03.15-03.17 and safety remains explicit', () => {
  const parent = readFileSync('src/components/CanonicalProfileKnowledgeReadinessBundlePanel.tsx', 'utf8')
  const panel = readFileSync('src/components/CanonicalProfileSystemKnowledgeGatePanel.tsx', 'utf8')
  assert.match(parent, /CanonicalProfileSystemKnowledgeGatePanel/)
  assert.match(parent, /readiness=\{readiness\} aggregation=\{aggregation\} summary=\{summary\}/)
  assert.match(panel, /SYSTEM KNOWLEDGE GATE · 03\.18–03\.20/)
  assert.match(panel, /AI knowledge diagnostic allowed:/)
  assert.match(panel, /Manufacturer approval:<\/strong> NO/)
  assert.match(panel, /Production compatibility validated:<\/strong> NO/)
  assert.match(panel, /Automatic profile selection:<\/strong> NO/)
  assert.match(panel, /Automatic geometry:<\/strong> NO/)
  assert.match(panel, /Production unlock:<\/strong> NO/)
  assert.match(panel, /Machine ready:<\/strong> NO/)
  assert.equal(PROFILE_DATA_03_18_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_19_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_20_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(PROFILE_DATA_03_20_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_03_20_SAFETY.machineReady, false)
})
