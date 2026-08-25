import type { OpeningDirection } from './productTypes'

export type SplitOrientation = 'VERTICAL' | 'HORIZONTAL'
export type CustomFieldType = 'FIXED' | 'OPENING_SASH' | 'PLACEHOLDER'
export type CustomReviewStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'VERIFIED'

export interface CustomLeafNode {
  kind: 'LEAF'
  id: string
  fieldType: CustomFieldType
  sashProfileId?: string
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

export interface CustomProduct {
  id: string
  name: string
  width: number
  height: number
  frameProfileId: string
  mullionProfileId?: string
  geometry: CustomGeometryNode
  status: CustomReviewStatus
  humanReviewConfirmed: boolean
  createdAt: string
  updatedAt: string
  simulationOnly: true
  machineReady: false
}

export interface GeometryRect { x: number; y: number; width: number; height: number }

