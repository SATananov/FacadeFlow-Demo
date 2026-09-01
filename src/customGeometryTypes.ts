import type { OpeningDirection } from './productTypes'

export type SplitOrientation = 'VERTICAL' | 'HORIZONTAL'
export type CustomFieldType = 'FIXED' | 'OPENING_SASH' | 'PLACEHOLDER'
export type CustomOpeningType = 'TURN' | 'TILT' | 'TILT_TURN' | 'OTHER'
export type CustomReviewStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'VERIFIED'

export interface CustomLeafNode {
  kind: 'LEAF'
  id: string
  fieldType: CustomFieldType
  sashProfileId?: string
  openingType?: CustomOpeningType
  openingDirection?: OpeningDirection
}

export interface CustomSplitNode {
  kind: 'SPLIT'
  id: string
  orientation: SplitOrientation
  position: number
  first: CustomGeometryNode
  second: CustomGeometryNode
}

export type CustomGeometryNode = CustomLeafNode | CustomSplitNode


export interface CustomAi04HandoffMetadata {
  schemaVersion: 'AI04.1'
  sourceProposalId: string
  sourceIntentId: string
  sourceKind: 'PROMPT' | 'DOCUMENT' | 'MANUAL' | 'SKETCH'
  mark?: string
  geometryBasis: 'EXPLICIT_DIVIDERS' | 'EQUAL_DISTRIBUTION_PROPOSAL' | 'SINGLE_EXPLICIT_FIELD'
  evidenceCount: number
  sourceUnresolved: string[]
  sourceWarnings: string[]
  humanApprovedProposal: true
  explicitConstructorHandoff: true
  editableDraft: true
  rulesValidated: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

export interface CustomProduct {
  id: string
  name: string
  width: number
  height: number
  frameProfileId: string
  frameCreated: boolean
  mullionProfileId?: string
  geometry: CustomGeometryNode
  status: CustomReviewStatus
  humanReviewConfirmed: boolean
  createdAt: string
  updatedAt: string
  simulationOnly: true
  machineReady: false
  ai04Handoff?: CustomAi04HandoffMetadata
}

export interface GeometryRect { x: number; y: number; width: number; height: number }
