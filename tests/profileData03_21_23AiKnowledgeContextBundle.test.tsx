import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CanonicalProfileAssemblyEvidenceReadiness } from '../src/aiCanonicalProfileAssemblyEvidenceReadiness'
import type {
  CanonicalProfileEvidenceResolutionAggregation,
  CanonicalProfileKnowledgeRequirementAggregateRow,
} from '../src/aiCanonicalProfileEvidenceResolutionAggregation'
import { buildCanonicalProfileKnowledgeReadinessSummary } from '../src/aiCanonicalProfileKnowledgeReadinessSummary'
import { buildCanonicalProfileRelationKnowledgeReadiness } from '../src/aiCanonicalProfileRelationKnowledgeReadiness'
import { buildCanonicalProfileSystemKnowledgeReadiness } from '../src/aiCanonicalProfileSystemKnowledgeReadiness'
import { buildCanonicalProfileSystemKnowledgeGate } from '../src/aiCanonicalProfileSystemKnowledgeGate'
import {
  buildCanonicalProfileAiDecisionContext,
  PROFILE_DATA_03_21_SAFETY,
} from '../src/aiCanonicalProfileAiDecisionContext'
import {
  buildCanonicalProfileAiClaimBoundary,
  evaluateCanonicalProfileAiClaim,
  PROFILE_DATA_03_22_SAFETY,
} from '../src/aiCanonicalProfileAiClaimBoundary'
import {
  buildCanonicalProfileAiConsumableKnowledgeContext,
  PROFILE_DATA_03_23_SAFETY,
} from '../src/aiCanonicalProfileAiConsumableKnowledgeContext'

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
const allKeys = Object.entries(relationRequirements).flatMap(([relation, kinds]) => kinds.map((kind) => keyOf(relation, kind)))

function fixture(resolvedKeys: readonly string[] = [], mode?: 'STALE' | 'BLOCKED') {
  const sourceIntentId = 'profile-data03-21-23-fixture'
  const rows = Object.entries(relationRequirements).flatMap(([relation, kinds]) => kinds.map((requirementKind) => {
    const resolvedForKnowledgeReadiness = resolvedKeys.includes(keyOf(relation, requirementKind))
    return {
      relation: relation as CanonicalProfileKnowledgeRequirementAggregateRow['relation'],
      requirementKind,
      authorityNeeded: authorityByKind[requirementKind],
      sourceReason: `Fixture requirement ${requirementKind}`,
      state: mode === 'STALE'
        ? 'STALE_REVIEW_REQUIRED' as const
        : resolvedForKnowledgeReadiness
          ? 'RESOLVED_FOR_KNOWLEDGE_READINESS' as const
          : 'NO_CANDIDATE_EVIDENCE' as const,
      candidateEvidenceCount: resolvedForKnowledgeReadiness ? 1 : 0,
      satisfiedReviewCount: resolvedForKnowledgeReadiness ? 1 : 0,
      explicitResolutionCount: resolvedForKnowledgeReadiness ? 1 : 0,
      resolvedForKnowledgeReadiness: mode === 'STALE' ? false : resolvedForKnowledgeReadiness,
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
    status: mode === 'BLOCKED'
      ? 'BLOCKED_UPSTREAM'
      : mode === 'STALE'
        ? 'STALE_REVIEW_REQUIRED'
        : resolvedKnowledgeRequirementCount === 0
          ? 'KNOWLEDGE_REQUIREMENTS_UNRESOLVED'
          : unresolvedKnowledgeRequirementCount === 0
            ? 'ALL_KNOWLEDGE_REQUIREMENTS_RESOLVED_PRODUCTION_LOCKED'
            : 'KNOWLEDGE_REQUIREMENTS_PARTIALLY_RESOLVED_PRODUCTION_LOCKED',
    rows,
    conflicts: mode === 'BLOCKED' ? ['fixture upstream conflict'] : [],
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
  const relationMatrix = buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary })
  const systemReadiness = buildCanonicalProfileSystemKnowledgeReadiness(relationMatrix)
  const gate = buildCanonicalProfileSystemKnowledgeGate(systemReadiness)
  const context = buildCanonicalProfileAiDecisionContext({ relationMatrix, systemReadiness, gate })
  const boundary = buildCanonicalProfileAiClaimBoundary(context)
  const consumable = buildCanonicalProfileAiConsumableKnowledgeContext({ context, boundary })
  return { relationMatrix, systemReadiness, gate, context, boundary, consumable }
}

test('03.21 separates reviewed knowledge from unresolved unknowns without inventing values', () => {
  const { context } = fixture(['FRAME_MULLION:HUMAN_WORKING_RELATION_EVIDENCE'])
  assert.equal(context.knownItems.length, 1)
  assert.equal(context.unknownItems.length, 9)
  assert.equal(context.humanEvidenceRequiredCount, 9)
  assert.equal(context.status, 'HUMAN_EVIDENCE_REQUIRED_PRODUCTION_LOCKED')
  assert.equal(context.unknownItems.every((item) => item.humanEvidenceRequired && item.mayInferMissingValue === false), true)
})

test('03.21 keeps system/profile relation identity in AI context', () => {
  const { context } = fixture()
  assert.equal(context.systemId, 'PRELUDE_60')
  assert.equal(context.systemLabel, 'PRELUDE 60')
  const frameSash = context.unknownItems.find((item) => item.relation === 'FRAME_SASH')!
  assert.equal(frameSash.leftProfileCode, '482.30')
  assert.equal(frameSash.rightProfileCode, '482.05')
})

test('03.22 allows knowledge diagnostics and human evidence requests but blocks production claims', () => {
  const { boundary } = fixture(['FRAME_MULLION:HUMAN_WORKING_RELATION_EVIDENCE'])
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'KNOWN_KNOWLEDGE_COVERAGE').allowed, true)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'KNOWLEDGE_GAP').allowed, true)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'HUMAN_EVIDENCE_REQUEST').allowed, true)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'MANUFACTURER_APPROVAL').allowed, false)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'EXACT_JOINT_GEOMETRY').allowed, false)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'PRODUCTION_COMPATIBILITY').allowed, false)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'MACHINE_READY').allowed, false)
})

test('03.22 stale review suppresses current knowledge claims and still permits renewed human evidence request', () => {
  const { context, boundary } = fixture([], 'STALE')
  assert.equal(context.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'KNOWN_KNOWLEDGE_COVERAGE').allowed, false)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'KNOWLEDGE_GAP').allowed, false)
  assert.equal(evaluateCanonicalProfileAiClaim(boundary, 'HUMAN_EVIDENCE_REQUEST').allowed, true)
})

test('03.21 upstream conflict blocks the AI context fail-closed', () => {
  const { context, boundary, consumable } = fixture([], 'BLOCKED')
  assert.equal(context.status, 'BLOCKED_UPSTREAM')
  assert.equal(boundary.mayStateKnownKnowledgeCoverage, false)
  assert.equal(boundary.mayStateKnowledgeGap, false)
  assert.equal(boundary.mayRequestHumanEvidence, false)
  assert.equal(consumable.status, 'BLOCKED_UPSTREAM')
})

test('03.23 exports explicit unknowns and authority-specific human evidence requests', () => {
  const { consumable } = fixture(['FRAME_MULLION:HUMAN_WORKING_RELATION_EVIDENCE'])
  assert.equal(consumable.status, 'AI_CONTEXT_READY_WITH_GAPS_PRODUCTION_LOCKED')
  assert.equal(consumable.known.length, 1)
  assert.equal(consumable.unknown.length, 9)
  assert.equal(consumable.humanEvidenceRequests.length, 9)
  assert.equal(consumable.humanEvidenceRequests.every((item) => item.authorityNeeded.length > 0), true)
  assert.equal(consumable.responsePolicy.mayGuessMissingTechnicalData, false)
  assert.equal(consumable.responsePolicy.mustKeepUnknownExplicit, true)
})

test('03.23 full 10/10 knowledge context remains production locked', () => {
  const { context, boundary, consumable } = fixture(allKeys)
  assert.equal(context.knownItems.length, 10)
  assert.equal(context.unknownItems.length, 0)
  assert.equal(consumable.status, 'AI_CONTEXT_READY_COMPLETE_PRODUCTION_LOCKED')
  assert.equal(consumable.hardSafetyLocks.manufacturerApproval, false)
  assert.equal(consumable.hardSafetyLocks.exactJointGeometryVerified, false)
  assert.equal(consumable.hardSafetyLocks.productionCompatibilityValidated, false)
  assert.equal(consumable.hardSafetyLocks.automaticGeometryAllowed, false)
  assert.equal(consumable.hardSafetyLocks.productionUnlockAllowed, false)
  assert.equal(consumable.hardSafetyLocks.machineReady, false)
  assert.equal(boundary.productionLocked, true)
})

test('03.21-03.23 safety constants forbid guessing and production promotion', () => {
  assert.equal(PROFILE_DATA_03_21_SAFETY.mayInferMissingTechnicalData, false)
  assert.equal(PROFILE_DATA_03_21_SAFETY.mayTransformUnknownIntoKnown, false)
  assert.equal(PROFILE_DATA_03_22_SAFETY.mustLabelUnknownAsUnknown, true)
  assert.equal(PROFILE_DATA_03_22_SAFETY.mayClaimProductionCompatibility, false)
  assert.equal(PROFILE_DATA_03_23_SAFETY.unknownMustRemainExplicit, true)
  assert.equal(PROFILE_DATA_03_23_SAFETY.mayGuessMissingTechnicalData, false)
  assert.equal(PROFILE_DATA_03_23_SAFETY.mayPromoteKnowledgeToProductionFact, false)
  assert.equal(PROFILE_DATA_03_23_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_23_SAFETY.machineReady, false)
})

test('03.21-03.23 UI is wired under the existing system knowledge gate panel', () => {
  const repoRoot = process.cwd()
  const parent = readFileSync(resolve(repoRoot, 'src/components/CanonicalProfileSystemKnowledgeGatePanel.tsx'), 'utf8')
  const panel = readFileSync(resolve(repoRoot, 'src/components/CanonicalProfileAiKnowledgeContextPanel.tsx'), 'utf8')
  assert.match(parent, /CanonicalProfileAiKnowledgeContextPanel/)
  assert.match(parent, /relationMatrix=\{relationMatrix\}/)
  assert.match(panel, /PROFILE DATA 03\.21-03\.23/)
  assert.match(panel, /UNKNOWN/)
  assert.match(panel, /May infer missing technical data:<\/strong> NO/)
  assert.match(panel, /Production unlock:<\/strong> NO/)
  assert.match(panel, /Machine ready:<\/strong> NO/)
})
