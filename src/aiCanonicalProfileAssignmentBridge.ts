import type { FacadeFlowProductIntent } from './aiProductIntent'
import type {
  FacadeFlowConstructionGraph,
  FacadeFlowConstructionGraphFieldNode,
  FacadeFlowConstructionGraphMullionNode,
} from './aiConstructionGraph'
import {
  resolvePrelude60CanonicalProfileIdentity,
  type FacadeFlowCanonicalProfileRole,
  type Prelude60CanonicalProfileIdentity,
} from './profileData/prelude60CanonicalProfileIdentity'
import type {
  Conceptual3DCanonicalProfileAssignment,
  Product3DScene,
  Product3DProfileAssignmentBridge,
} from './threeDTypes'

export const AI_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_VERSION = 'AI05.3.4' as const

export type FacadeFlowCanonicalProfileAssignmentBridgeStatus =
  | 'READY_FOR_HUMAN_REVIEW'
  | 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
  | 'BLOCKED_CONFLICT'

export interface FacadeFlowProfileAssignmentDrawingLike {
  frame?: { profileRef?: string } | null
  mullions: ReadonlyArray<{ order?: number; profileRef?: string }>
  fields: ReadonlyArray<{
    sourceFieldId?: string
    order?: number
    sash?: { profileRef?: string }
  }>
}

export interface FacadeFlowCanonicalProfileAssignmentLayerTrace {
  productIntent?: string
  constructionGraph?: string
  drawing?: string
}

export interface FacadeFlowCanonicalProfileAssignment {
  targetKind: 'FRAME' | 'MULLION' | 'SASH'
  targetRef: string
  role: FacadeFlowCanonicalProfileRole
  profileCode: string
  canonicalIdentity: Prelude60CanonicalProfileIdentity
  layerTrace: FacadeFlowCanonicalProfileAssignmentLayerTrace
  assignmentAuthority: 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY'
  automaticProfileSelectionAllowed: false
  exactProfileContourApplied: false
  geometryMutatedByBridge: false
  machineReady: false
  productionApproved: false
}

export interface FacadeFlowCanonicalProfileAssignmentBridge {
  version: typeof AI_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_VERSION
  sourceIntentId: string
  sourceGraphVersion: FacadeFlowConstructionGraph['schemaVersion']
  status: FacadeFlowCanonicalProfileAssignmentBridgeStatus
  assignments: FacadeFlowCanonicalProfileAssignment[]
  missingExplicitAssignments: string[]
  conflicts: string[]
  warnings: string[]
  humanReviewRequired: true
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  geometryMutatedByBridge: false
  rulesValidated: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface AssignmentSlot {
  targetKind: FacadeFlowCanonicalProfileAssignment['targetKind']
  targetRef: string
  role: FacadeFlowCanonicalProfileRole
  intentCode?: string
  graphCode?: string
  drawingCode?: string
}

const trim = (value: string | undefined) => value?.trim() || undefined
const unique = (items: string[]) => [...new Set(items)]

function drawingMullionAt(
  drawing: FacadeFlowProfileAssignmentDrawingLike,
  mullion: FacadeFlowConstructionGraphMullionNode,
) {
  return drawing.mullions.find((item) => item.order === mullion.order)
}

function drawingFieldFor(
  drawing: FacadeFlowProfileAssignmentDrawingLike,
  field: FacadeFlowConstructionGraphFieldNode,
) {
  return drawing.fields.find((item) => item.sourceFieldId === field.sourceFieldId)
    ?? drawing.fields.find((item) => item.order === field.order)
}

function buildSlots(
  intent: FacadeFlowProductIntent,
  graph: FacadeFlowConstructionGraph,
  drawing: FacadeFlowProfileAssignmentDrawingLike,
): AssignmentSlot[] {
  const slots: AssignmentSlot[] = []

  if (graph.root) {
    slots.push({
      targetKind: 'FRAME',
      targetRef: 'frame-root',
      role: 'FRAME',
      intentCode: trim(intent.profiles.frame),
      graphCode: trim(graph.root.profileRef),
      drawingCode: trim(drawing.frame?.profileRef),
    })

    const mullions = graph.root.children.filter(
      (child): child is FacadeFlowConstructionGraphMullionNode => child.kind === 'MULLION',
    )
    mullions.forEach((mullion) => {
      const sourceDivider = mullion.sourceDividerId
        ? intent.dividers.find((divider) => divider.id === mullion.sourceDividerId)
        : undefined
      const drawingMullion = drawingMullionAt(drawing, mullion)
      slots.push({
        targetKind: 'MULLION',
        targetRef: mullion.sourceDividerId ?? `mullion:${mullion.order}`,
        role: 'MULLION',
        intentCode: trim(sourceDivider?.profile ?? intent.profiles.mullion),
        graphCode: trim(mullion.profileRef),
        drawingCode: trim(drawingMullion?.profileRef),
      })
    })

    const graphFields = graph.root.children.filter(
      (child): child is FacadeFlowConstructionGraphFieldNode => child.kind === 'FIELD',
    )
    graphFields.forEach((field) => {
      if (!field.sash) return
      const sourceField = intent.fields.find((item) => item.id === field.sourceFieldId)
      const drawingField = drawingFieldFor(drawing, field)
      slots.push({
        targetKind: 'SASH',
        targetRef: field.sourceFieldId,
        role: 'SASH',
        intentCode: trim(sourceField?.sashProfile ?? intent.profiles.sash),
        graphCode: trim(field.sash.profileRef),
        drawingCode: trim(drawingField?.sash?.profileRef),
      })
    })
  }

  return slots
}

function assignmentFromSlot(
  slot: AssignmentSlot,
  system: string | undefined,
  missingExplicitAssignments: string[],
  conflicts: string[],
): FacadeFlowCanonicalProfileAssignment | null {
  if (!slot.intentCode) {
    missingExplicitAssignments.push(`${slot.targetKind}:${slot.targetRef}`)
    if (slot.graphCode || slot.drawingCode) {
      conflicts.push(`${slot.targetKind}:${slot.targetRef} has a downstream profile code without an explicit Product Intent assignment.`)
    }
    return null
  }

  const observed = [slot.intentCode, slot.graphCode, slot.drawingCode].filter((value): value is string => Boolean(value))
  const distinct = unique(observed)
  if (distinct.length > 1) {
    conflicts.push(`${slot.targetKind}:${slot.targetRef} profile assignment drift: ${distinct.join(' -> ')}.`)
    return null
  }

  if (!slot.graphCode || !slot.drawingCode) {
    conflicts.push(`${slot.targetKind}:${slot.targetRef} lost explicit profile ${slot.intentCode} before conceptual 3D.`)
    return null
  }

  const resolution = resolvePrelude60CanonicalProfileIdentity({
    system,
    role: slot.role,
    explicitCode: slot.intentCode,
  })
  if (resolution.state !== 'RESOLVED_EXPLICIT' || !resolution.identity) {
    conflicts.push(`${slot.targetKind}:${slot.targetRef} cannot resolve canonical identity: ${resolution.state}.`)
    return null
  }

  return {
    targetKind: slot.targetKind,
    targetRef: slot.targetRef,
    role: slot.role,
    profileCode: resolution.identity.profileCode,
    canonicalIdentity: resolution.identity,
    layerTrace: {
      productIntent: slot.intentCode,
      constructionGraph: slot.graphCode,
      drawing: slot.drawingCode,
    },
    assignmentAuthority: 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY',
    automaticProfileSelectionAllowed: false,
    exactProfileContourApplied: false,
    geometryMutatedByBridge: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function buildFacadeFlowCanonicalProfileAssignmentBridge(
  intent: FacadeFlowProductIntent,
  graph: FacadeFlowConstructionGraph,
  drawing: FacadeFlowProfileAssignmentDrawingLike,
): FacadeFlowCanonicalProfileAssignmentBridge {
  const assignments: FacadeFlowCanonicalProfileAssignment[] = []
  const missingExplicitAssignments: string[] = []
  const conflicts: string[] = []
  const warnings: string[] = []

  if (!graph.root) conflicts.push('Construction Graph has no FRAME root; canonical profile propagation cannot be verified.')

  for (const slot of buildSlots(intent, graph, drawing)) {
    const assignment = assignmentFromSlot(
      slot,
      intent.profiles.system,
      missingExplicitAssignments,
      conflicts,
    )
    if (assignment) assignments.push(assignment)
  }

  if (!intent.profiles.system?.trim()) {
    warnings.push('Profile system is not explicit; canonical PRELUDE identity cannot be asserted from codes alone.')
  }

  const status: FacadeFlowCanonicalProfileAssignmentBridgeStatus = conflicts.length
    ? 'BLOCKED_CONFLICT'
    : missingExplicitAssignments.length
      ? 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
      : 'READY_FOR_HUMAN_REVIEW'

  return {
    version: AI_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_VERSION,
    sourceIntentId: intent.id,
    sourceGraphVersion: graph.schemaVersion,
    status,
    assignments,
    missingExplicitAssignments: unique(missingExplicitAssignments),
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    humanReviewRequired: true,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    geometryMutatedByBridge: false,
    rulesValidated: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

function conceptual3DAssignment(
  assignment: FacadeFlowCanonicalProfileAssignment,
): Conceptual3DCanonicalProfileAssignment {
  return {
    targetKind: assignment.targetKind,
    targetRef: assignment.targetRef,
    systemId: assignment.canonicalIdentity.systemId,
    systemLabel: assignment.canonicalIdentity.systemLabel,
    role: assignment.role,
    profileCode: assignment.profileCode,
    source: 'AI05.3.4_EXPLICIT_PRODUCT_INTENT_PROPAGATION',
    explicit: true,
    automaticProfileSelectionAllowed: false,
    exactProfileContourApplied: false,
    productionGeometryApproved: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function attachFacadeFlowCanonicalProfileAssignmentsToConceptual3D(
  scene: Product3DScene,
  bridge: FacadeFlowCanonicalProfileAssignmentBridge,
): Product3DScene {
  const profileAssignmentBridge: Product3DProfileAssignmentBridge = {
    version: AI_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_VERSION,
    status: bridge.status,
    assignments: bridge.assignments.map(conceptual3DAssignment),
    missingExplicitAssignments: [...bridge.missingExplicitAssignments],
    conflicts: [...bridge.conflicts],
    automaticProfileSelectionAllowed: false,
    exactProfileContourApplied: false,
    geometryMutatedByBridge: false,
    productionGeometryApproved: false,
    machineReady: false,
    productionApproved: false,
  }

  return {
    ...scene,
    profileAssignmentBridge,
    conceptualOnly: true,
    productionGeometryApproved: false,
    machineReady: false,
  }
}

export function bridgeFacadeFlowCanonicalProfilesToConceptual3D(input: {
  intent: FacadeFlowProductIntent
  graph: FacadeFlowConstructionGraph
  drawing: FacadeFlowProfileAssignmentDrawingLike
  scene: Product3DScene
}) {
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(input.intent, input.graph, input.drawing)
  return {
    bridge,
    scene: attachFacadeFlowCanonicalProfileAssignmentsToConceptual3D(input.scene, bridge),
  }
}

export const AI05_3_4_STATE = Object.freeze({
  parent: 'AI05.3' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'AI05.3.4' as const,
  stepStatus: 'WORKING' as const,
  rtp01Status: 'WORKING' as const,
})

export const AI05_3_4_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_SAFETY = Object.freeze({
  explicitAssignmentsOnly: true,
  canonicalIdentityValidationOnly: true,
  automaticProfileSelectionAllowed: false,
  automaticSystemAssignmentAllowed: false,
  exactProfileContourApplied: false,
  geometryMutatedByBridge: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
