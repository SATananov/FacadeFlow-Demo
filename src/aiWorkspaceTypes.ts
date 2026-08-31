export type FacadeFlowJobType = 'BUILDING' | 'HOUSE' | 'SMALL_PROJECT' | 'SINGLE_PRODUCT' | 'CUSTOM_ORDER' | 'TECHNICAL_DETAIL'
export type FacadeFlowAiInputMode = 'DOCUMENTS' | 'DESCRIPTION' | 'SKETCH' | 'MANUAL'
export type FacadeFlowAiWorkspaceView = 'INTAKE' | 'KNOWLEDGE_BASE'
export type FacadeFlowAiIntakeStatus = 'EMPTY' | 'SOURCE_CAPTURED' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
export type FacadeFlowAiModelStatus = 'NOT_CONNECTED'


export type FacadeFlowGuidedProductType = '' | 'WINDOW' | 'DOOR'
export type FacadeFlowGuidedOpeningType = '' | 'FIXED' | 'TURN' | 'TILT' | 'TILT_TURN' | 'DOUBLE_LEAF' | 'SLIDING' | 'OTHER'
export type FacadeFlowGuidedOpeningDirection = '' | 'LEFT' | 'RIGHT'
export type FacadeFlowGuidedInwardOutward = '' | 'INWARD' | 'OUTWARD'
export type FacadeFlowGuidedFillType = '' | 'GLAZING_UNIT' | 'GLASS' | 'PANEL' | 'OTHER'
export type FacadeFlowGuidedColorMode = '' | 'SAME_BOTH_SIDES' | 'DIFFERENT_SIDES' | 'PROJECT_DEFINED' | 'OTHER'
export type FacadeFlowGuidedHardwareType = '' | 'WINDOW' | 'DOOR' | 'SLIDING' | 'OTHER'
export type FacadeFlowGuidedHandleType = '' | 'STANDARD' | 'HANDLE_HANDLE' | 'HANDLE_KNOB' | 'KEYED' | 'OTHER'

export interface FacadeFlowGuidedProductDraft {
  productType: FacadeFlowGuidedProductType
  name: string
  quantity: string
  width: string
  height: string
  profileSystem: string
  manualProfileSystem: string
  frameProfileId: string
  sashProfileId: string
  mullionProfileId: string
  manualFrameProfile: string
  manualSashProfile: string
  manualMullionProfile: string
  thresholdDescription: string
  openingType: FacadeFlowGuidedOpeningType
  openingDirection: FacadeFlowGuidedOpeningDirection
  inwardOutward: FacadeFlowGuidedInwardOutward
  fillType: FacadeFlowGuidedFillType
  fillDescription: string
  colorMode: FacadeFlowGuidedColorMode
  exteriorColor: string
  interiorColor: string
  hardwareType: FacadeFlowGuidedHardwareType
  hardwareDescription: string
  handleType: FacadeFlowGuidedHandleType
  handleDescription: string
  hingeQuantity: string
  notes: string
  reviewAccepted: boolean
  status: 'EMPTY' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
}

export interface FacadeFlowEvidenceReference {
  id: string
  sourceName: string
  sourceKind: 'DOCUMENT' | 'DESCRIPTION' | 'SKETCH' | 'MANUAL' | 'CATALOGUE'
  page?: number
  location?: string
  revision?: string
  note?: string
}

export interface FacadeFlowProductSpecification {
  id: string
  mark?: string
  name: string
  quantity: number
  groupPath: string[]
  dimensions: { width?: number; height?: number }
  system?: string
  profiles: { frame?: string; sash?: string; mullion?: string; transom?: string; threshold?: string }
  opening?: { type?: string; direction?: string; inwardOutward?: string }
  hardware: { hinges?: string; hingeQuantity?: number; handle?: string; handleHeight?: number; lock?: string; mechanism?: string }
  glazing: { description?: string; thicknessMm?: number }
  finish: { exterior?: string; interior?: string }
  notes?: string
  evidence: FacadeFlowEvidenceReference[]
  unresolved: string[]
  status: 'PROPOSED' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowTechnicalDetailSpecification {
  id: string
  name: string
  groupPath: string[]
  notes: string
  profileRefs: string[]
  materialRefs: string[]
  evidence: FacadeFlowEvidenceReference[]
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowJobDraft {
  id: string
  name: string
  reference: string
  jobType: FacadeFlowJobType | null
  inputMode: FacadeFlowAiInputMode | null
  description: string
  guidedProduct: FacadeFlowGuidedProductDraft
  products: FacadeFlowProductSpecification[]
  technicalDetails: FacadeFlowTechnicalDetailSpecification[]
  groupLabels: string[]
  intakeStatus: FacadeFlowAiIntakeStatus
  createdAt: string
  updatedAt: string
  sessionOnly: true
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowAiSession {
  id: string
  view: FacadeFlowAiWorkspaceView
  job: FacadeFlowJobDraft
  aiModelStatus: FacadeFlowAiModelStatus
  humanReviewRequired: true
  rulesValidationRequired: true
  automaticGeometryAllowed: false
  sourceEvidenceRequired: true
  productionApproved: false
}

export interface KnowledgeBaseSectionDefinition {
  id: 'PROFILES' | 'HARDWARE' | 'GLAZING' | 'PANELS' | 'FINISHES' | 'COMPATIBILITY' | 'ENGINEERING_RULES' | 'SOURCES'
  title: string
  description: string
  status: 'FOUNDATION' | 'NEEDS_DATA'
}
