import type { FacadeFlowAi03ParametricProposal } from './aiParametricConstructionProposal'
import type { FacadeFlowConstructionDrawing } from './aiConstructionDrawing'
import {
  attachFacadeFlowCanonicalProfileAssignmentsToConceptual3D,
  type FacadeFlowCanonicalProfileAssignmentBridge,
} from './aiCanonicalProfileAssignmentBridge'
import { barNode, CONCEPTUAL_GLASS_DEPTH_MM, createScene } from './threeDSceneBuilder'
import type { Component3DNode, Product3DScene } from './threeDTypes'

export const AI_CANONICAL_PROFILE_REAL_CONCEPTUAL_3D_VERSION = 'AI05.3.7' as const

export type CanonicalProfileRealConceptual3DStatus =
  | 'WAITING_FOR_HUMAN_REVIEW'
  | 'READY_FOR_HUMAN_REVIEW'
  | 'BLOCKED_CONFLICT'

export interface CanonicalProfileRealConceptual3DBinding {
  targetKind: 'FRAME' | 'MULLION' | 'SASH'
  targetRef: string
  profileCode: string
  nodeIds: string[]
  sceneProfilePreserved: boolean
}

export interface CanonicalProfileRealConceptual3DResult {
  version: typeof AI_CANONICAL_PROFILE_REAL_CONCEPTUAL_3D_VERSION
  status: CanonicalProfileRealConceptual3DStatus
  scene: Product3DScene | null
  bindings: CanonicalProfileRealConceptual3DBinding[]
  conflicts: string[]
  warnings: string[]
  sourceGeometryAuthority: 'HUMAN_REVIEWED_CONCEPTUAL_TOPOLOGY_ONLY'
  visualExtrusionOnly: true
  automaticProfileSelectionAllowed: false
  automaticSystemAssignmentAllowed: false
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

const VISUAL_FRAME_FACE_MM = 20
const VISUAL_MULLION_FACE_MM = 16
const VISUAL_SASH_FACE_MM = 14
const EPSILON = 1e-7

function unique(items: string[]) {
  return [...new Set(items)]
}

function nearlyEqual(left: number, right: number) {
  return Math.abs(left - right) <= EPSILON
}

function sameRect(
  left: { xRatio: number; yRatio: number; widthRatio: number; heightRatio: number },
  right: { xRatio: number; yRatio: number; widthRatio: number; heightRatio: number },
) {
  return nearlyEqual(left.xRatio, right.xRatio)
    && nearlyEqual(left.yRatio, right.yRatio)
    && nearlyEqual(left.widthRatio, right.widthRatio)
    && nearlyEqual(left.heightRatio, right.heightRatio)
}

function normalizedOpeningDirection(value: string | undefined): 'left' | 'right' | undefined {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'LEFT' || normalized === 'ЛЯВО' || normalized === 'ЛЯВА') return 'left'
  if (normalized === 'RIGHT' || normalized === 'ДЯСНО' || normalized === 'ДЯСНА') return 'right'
  return undefined
}

function expectedRole(targetKind: CanonicalProfileRealConceptual3DBinding['targetKind']) {
  if (targetKind === 'FRAME') return 'FRAME' as const
  if (targetKind === 'MULLION') return 'DIVIDER' as const
  return 'SASH' as const
}

function assertHumanReviewedTopologyMatchesDrawing(
  proposal: FacadeFlowAi03ParametricProposal,
  drawing: FacadeFlowConstructionDrawing,
  conflicts: string[],
) {
  if (proposal.fields.length !== drawing.fields.length) {
    conflicts.push('Human-reviewed proposal field count does not match AI05.3 Drawing.')
    return
  }

  for (const proposalField of proposal.fields) {
    const drawingField = drawing.fields.find((field) => field.sourceFieldId === proposalField.sourceFieldId)
    if (!drawingField) {
      conflicts.push(`Field ${proposalField.sourceFieldId} exists in the human-reviewed proposal but is missing from AI05.3 Drawing.`)
      continue
    }
    if (!sameRect(proposalField.rect, drawingField.rect)) {
      conflicts.push(`Field ${proposalField.sourceFieldId} geometry differs between the human-reviewed proposal and AI05.3 Drawing.`)
    }
  }

  if (proposal.dividers.length !== drawing.mullions.length) {
    conflicts.push('Human-reviewed proposal divider count does not match AI05.3 Drawing mullions.')
    return
  }

  for (let index = 0; index < proposal.dividers.length; index += 1) {
    const proposalDivider = proposal.dividers[index]!
    const drawingMullion = drawing.mullions[index]!
    if (proposalDivider.orientation !== drawingMullion.orientation || !nearlyEqual(proposalDivider.positionRatio, drawingMullion.positionRatio)) {
      conflicts.push(`Divider ${index + 1} differs between the human-reviewed proposal and AI05.3 Drawing.`)
    }
  }
}

function buildSceneNodes(
  proposal: FacadeFlowAi03ParametricProposal,
  drawing: FacadeFlowConstructionDrawing,
  conceptualDepthMm: number,
): Component3DNode[] {
  const width = proposal.dimensions.widthMm
  const height = proposal.dimensions.heightMm
  const nodes: Component3DNode[] = []
  const frameCode = drawing.frame?.profileRef

  nodes.push(
    barNode('AI0537-FRAME-TOP', 'FRAME', 'frame-root', frameCode, width, VISUAL_FRAME_FACE_MM, conceptualDepthMm, 0, height / 2 - VISUAL_FRAME_FACE_MM / 2),
    barNode('AI0537-FRAME-RIGHT', 'FRAME', 'frame-root', frameCode, VISUAL_FRAME_FACE_MM, height, conceptualDepthMm, width / 2 - VISUAL_FRAME_FACE_MM / 2, 0),
    barNode('AI0537-FRAME-BOTTOM', 'FRAME', 'frame-root', frameCode, width, VISUAL_FRAME_FACE_MM, conceptualDepthMm, 0, -height / 2 + VISUAL_FRAME_FACE_MM / 2),
    barNode('AI0537-FRAME-LEFT', 'FRAME', 'frame-root', frameCode, VISUAL_FRAME_FACE_MM, height, conceptualDepthMm, -width / 2 + VISUAL_FRAME_FACE_MM / 2, 0),
  )

  for (const mullion of drawing.mullions) {
    const targetRef = mullion.sourceDividerId ?? `mullion:${mullion.order}`
    if (mullion.orientation === 'VERTICAL') {
      const x = -width / 2 + mullion.positionRatio * width
      nodes.push(barNode(`AI0537-MULLION-${mullion.order}`, 'DIVIDER', targetRef, mullion.profileRef, VISUAL_MULLION_FACE_MM, height, conceptualDepthMm * 0.9, x, 0))
    } else {
      const y = height / 2 - mullion.positionRatio * height
      nodes.push(barNode(`AI0537-MULLION-${mullion.order}`, 'DIVIDER', targetRef, mullion.profileRef, width, VISUAL_MULLION_FACE_MM, conceptualDepthMm * 0.9, 0, y))
    }
  }

  for (const field of drawing.fields) {
    const fieldWidth = field.rect.widthRatio * width
    const fieldHeight = field.rect.heightRatio * height
    const centerX = -width / 2 + field.rect.xRatio * width + fieldWidth / 2
    const centerY = height / 2 - field.rect.yRatio * height - fieldHeight / 2
    const glazingWidth = Math.max(1, fieldWidth - VISUAL_FRAME_FACE_MM * 1.5)
    const glazingHeight = Math.max(1, fieldHeight - VISUAL_FRAME_FACE_MM * 1.5)

    nodes.push(barNode(
      `AI0537-GLAZING-${field.sourceFieldId}`,
      field.semanticRole === 'PANEL_FIELD' ? 'PANEL' : 'GLAZING',
      field.sourceFieldId,
      undefined,
      glazingWidth,
      glazingHeight,
      CONCEPTUAL_GLASS_DEPTH_MM,
      centerX,
      centerY,
      -conceptualDepthMm * 0.12,
    ))

    if (!field.sash) continue

    const sashInsetX = fieldWidth * field.sash.conceptualInsetRatio
    const sashInsetY = fieldHeight * field.sash.conceptualInsetRatio
    const sashWidth = Math.max(1, fieldWidth - sashInsetX * 2)
    const sashHeight = Math.max(1, fieldHeight - sashInsetY * 2)
    const direction = normalizedOpeningDirection(field.sash.openingDirection)
    const openingGroupId = `AI0537-OPENING-${field.sourceFieldId}`
    const bars = [
      barNode(`AI0537-SASH-${field.sourceFieldId}-TOP`, 'SASH', field.sourceFieldId, field.sash.profileRef, sashWidth, VISUAL_SASH_FACE_MM, conceptualDepthMm * 0.75, centerX, centerY + sashHeight / 2 - VISUAL_SASH_FACE_MM / 2),
      barNode(`AI0537-SASH-${field.sourceFieldId}-BOTTOM`, 'SASH', field.sourceFieldId, field.sash.profileRef, sashWidth, VISUAL_SASH_FACE_MM, conceptualDepthMm * 0.75, centerX, centerY - sashHeight / 2 + VISUAL_SASH_FACE_MM / 2),
      barNode(`AI0537-SASH-${field.sourceFieldId}-LEFT`, 'SASH', field.sourceFieldId, field.sash.profileRef, VISUAL_SASH_FACE_MM, sashHeight, conceptualDepthMm * 0.75, centerX - sashWidth / 2 + VISUAL_SASH_FACE_MM / 2, centerY),
      barNode(`AI0537-SASH-${field.sourceFieldId}-RIGHT`, 'SASH', field.sourceFieldId, field.sash.profileRef, VISUAL_SASH_FACE_MM, sashHeight, conceptualDepthMm * 0.75, centerX + sashWidth / 2 - VISUAL_SASH_FACE_MM / 2, centerY),
    ]
    bars.forEach((node) => nodes.push({
      ...node,
      openingGroupId,
      openingDirection: direction,
      openingConfirmed: Boolean(direction),
    }))
  }

  return nodes
}

function bindingFor(
  scene: Product3DScene,
  assignment: FacadeFlowCanonicalProfileAssignmentBridge['assignments'][number],
  conflicts: string[],
): CanonicalProfileRealConceptual3DBinding {
  const role = expectedRole(assignment.targetKind)
  const nodes = scene.nodes.filter((node) => node.role === role && node.sourcePath === assignment.targetRef)
  const sceneProfilePreserved = nodes.length > 0 && nodes.every((node) => node.profileCode === assignment.profileCode)

  if (!nodes.length) {
    conflicts.push(`${assignment.targetKind}:${assignment.targetRef} has no matching node in the real conceptual 3D scene.`)
  } else if (!sceneProfilePreserved) {
    conflicts.push(`${assignment.targetKind}:${assignment.targetRef} node profile code does not preserve canonical assignment ${assignment.profileCode}.`)
  }

  return {
    targetKind: assignment.targetKind,
    targetRef: assignment.targetRef,
    profileCode: assignment.profileCode,
    nodeIds: nodes.map((node) => node.id),
    sceneProfilePreserved,
  }
}

export function buildCanonicalProfileRealConceptual3D(input: {
  proposal: FacadeFlowAi03ParametricProposal
  drawing: FacadeFlowConstructionDrawing
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
  conceptualDepthMm: number
}): CanonicalProfileRealConceptual3DResult {
  const conflicts: string[] = []
  const warnings: string[] = []

  if (input.proposal.status !== 'HUMAN_REVIEWED' || !input.proposal.proposalGeometryHumanReviewed) {
    return {
      version: AI_CANONICAL_PROFILE_REAL_CONCEPTUAL_3D_VERSION,
      status: 'WAITING_FOR_HUMAN_REVIEW',
      scene: null,
      bindings: [],
      conflicts: [],
      warnings: ['Real conceptual 3D is withheld until the conceptual topology is explicitly human-reviewed.'],
      sourceGeometryAuthority: 'HUMAN_REVIEWED_CONCEPTUAL_TOPOLOGY_ONLY',
      visualExtrusionOnly: true,
      automaticProfileSelectionAllowed: false,
      automaticSystemAssignmentAllowed: false,
      automaticGeometryAllowed: false,
      exactProfileContourApplied: false,
      productionDeductionsApplied: false,
      manufacturingToleranceApplied: false,
      rulesValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    }
  }

  if (input.drawing.status !== 'READY_FOR_HUMAN_REVIEW') conflicts.push('AI05.3 Drawing is blocked; a real conceptual 3D scene cannot be built from it.')
  if (input.bridge.status !== 'READY_FOR_HUMAN_REVIEW') conflicts.push(`Canonical profile bridge is ${input.bridge.status}; 3D binding remains blocked.`)
  if (input.bridge.missingExplicitAssignments.length) conflicts.push('Canonical profile bridge still has missing explicit assignments.')
  if (input.bridge.conflicts.length) conflicts.push(...input.bridge.conflicts)
  if (input.proposal.sourceIntentId !== input.drawing.sourceIntentId || input.proposal.sourceIntentId !== input.bridge.sourceIntentId) {
    conflicts.push('Product Intent lineage differs between proposal, Drawing and canonical profile bridge.')
  }
  if (input.drawing.dimensions.widthMm !== input.proposal.dimensions.widthMm || input.drawing.dimensions.heightMm !== input.proposal.dimensions.heightMm) {
    conflicts.push('Overall dimensions differ between the human-reviewed proposal and AI05.3 Drawing.')
  }
  if (!Number.isFinite(input.conceptualDepthMm) || input.conceptualDepthMm <= 0) conflicts.push('Conceptual 3D depth must be a positive visual-only value.')

  assertHumanReviewedTopologyMatchesDrawing(input.proposal, input.drawing, conflicts)

  if (conflicts.length) {
    return {
      version: AI_CANONICAL_PROFILE_REAL_CONCEPTUAL_3D_VERSION,
      status: 'BLOCKED_CONFLICT',
      scene: null,
      bindings: [],
      conflicts: unique(conflicts),
      warnings: unique(warnings),
      sourceGeometryAuthority: 'HUMAN_REVIEWED_CONCEPTUAL_TOPOLOGY_ONLY',
      visualExtrusionOnly: true,
      automaticProfileSelectionAllowed: false,
      automaticSystemAssignmentAllowed: false,
      automaticGeometryAllowed: false,
      exactProfileContourApplied: false,
      productionDeductionsApplied: false,
      manufacturingToleranceApplied: false,
      rulesValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    }
  }

  const rawScene = createScene(
    `ai0537-${input.proposal.id}`,
    'HUMAN_REVIEWED_AI',
    input.proposal.sourceIntentId,
    input.proposal.dimensions.widthMm,
    input.proposal.dimensions.heightMm,
    input.conceptualDepthMm,
    buildSceneNodes(input.proposal, input.drawing, input.conceptualDepthMm),
  )
  const scene = attachFacadeFlowCanonicalProfileAssignmentsToConceptual3D(rawScene, input.bridge)
  const bindingConflicts: string[] = []
  const bindings = input.bridge.assignments.map((assignment) => bindingFor(scene, assignment, bindingConflicts))

  return {
    version: AI_CANONICAL_PROFILE_REAL_CONCEPTUAL_3D_VERSION,
    status: bindingConflicts.length ? 'BLOCKED_CONFLICT' : 'READY_FOR_HUMAN_REVIEW',
    scene: bindingConflicts.length ? null : scene,
    bindings,
    conflicts: unique(bindingConflicts),
    warnings: unique(warnings),
    sourceGeometryAuthority: 'HUMAN_REVIEWED_CONCEPTUAL_TOPOLOGY_ONLY',
    visualExtrusionOnly: true,
    automaticProfileSelectionAllowed: false,
    automaticSystemAssignmentAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    productionDeductionsApplied: false,
    manufacturingToleranceApplied: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const AI05_3_7_STATE = Object.freeze({
  parent: 'AI05.3' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'AI05.3.7' as const,
  stepStatus: 'WORKING' as const,
  profileData03Status: 'OPEN / WORKING' as const,
  rtp01Status: 'WORKING' as const,
})

export const AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY = Object.freeze({
  realWebGlSceneFromHumanReviewedTopologyOnly: true,
  syntheticSceneStubAllowed: false,
  visualExtrusionOnly: true,
  noNewTopology: true,
  automaticProfileSelectionAllowed: false,
  automaticSystemAssignmentAllowed: false,
  automaticGeometryAllowed: false,
  exactProfileContourApplied: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
