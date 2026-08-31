export type FacadeFlowJobType = 'BUILDING' | 'HOUSE' | 'SMALL_PROJECT' | 'SINGLE_PRODUCT' | 'CUSTOM_ORDER' | 'TECHNICAL_DETAIL'
export type FacadeFlowAiInputMode = 'DOCUMENTS' | 'DESCRIPTION' | 'SKETCH' | 'MANUAL'
export type FacadeFlowAiWorkspaceView = 'INTAKE' | 'KNOWLEDGE_BASE'
export type FacadeFlowAiIntakeStatus = 'EMPTY' | 'SOURCE_CAPTURED' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
export type FacadeFlowAiModelStatus = 'NOT_CONNECTED'
export type FacadeFlowAiDemoScenario = 'PROJECT_DOCUMENTS' | 'GUIDED_WINDOW' | 'GUIDED_DOOR' | 'SKETCH' | 'MANUAL' | 'KNOWLEDGE_BASE'

export type FacadeFlowProjectNodeKind = 'BUILDING' | 'FLOOR' | 'FACADE' | 'ROOM' | 'ZONE' | 'POSITION' | 'DETAIL'

export interface FacadeFlowProjectStructureNode {
  id: string
  kind: FacadeFlowProjectNodeKind
  label: string
  parentId: string | null
  order: number
  source: 'MANUAL' | 'EXTRACTED'
  evidence: FacadeFlowEvidenceReference[]
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
}

export interface FacadeFlowProjectStructure {
  mode: 'FLEXIBLE'
  nodes: FacadeFlowProjectStructureNode[]
  activeNodeId: string | null
  sessionOnly: true
  simulationOnly: true
}


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
  placementNodeId?: string
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


export type FacadeFlowUnifiedReviewPacketKind = 'PRODUCT' | 'PROJECT_SOURCE' | 'SKETCH_SOURCE' | 'MANUAL_ROUTE' | 'KNOWLEDGE_CONTEXT'
export type FacadeFlowUnifiedReviewPacketStatus = 'NEEDS_REVIEW' | 'HUMAN_REVIEWED'

export type FacadeFlowRuleGateRequirementId =
  | 'GEOMETRY_LIMITS'
  | 'PROFILE_COMPATIBILITY'
  | 'OPENING_HARDWARE'
  | 'GLAZING_FILL'
  | 'FINISH_COLOR'
  | 'THRESHOLD'
  | 'PROJECT_CONTEXT'
  | 'SOURCE_TRACEABILITY'
export type FacadeFlowRuleGateRequirementApplicability = 'REQUIRED' | 'DEFERRED' | 'NOT_APPLICABLE'
export type FacadeFlowRuleGateRequirementState = 'SOURCE_REQUIRED' | 'DEFERRED' | 'NOT_APPLICABLE'

export type FacadeFlowRuleSourceKind =
  | 'MANUFACTURER_CATALOGUE'
  | 'PROJECT_SPECIFICATION'
  | 'TECHNICAL_INSTRUCTION'
  | 'COMPATIBILITY_MATRIX'
  | 'HUMAN_EXPERT_RECORD'
  | 'OTHER'
export type FacadeFlowRuleSourceReviewStatus = 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
export type FacadeFlowRuleSourceReReviewReason =
  | 'SOURCE_KIND_CHANGED'
  | 'SOURCE_REFERENCE_CHANGED'
  | 'SOURCE_LOCATION_CHANGED'
  | 'REVISION_CHANGED'
  | 'SCOPE_CHANGED'
  | 'SOURCE_DATE_CHANGED'

export interface FacadeFlowRuleSourceRecord {
  id: string
  requirementId: FacadeFlowRuleGateRequirementId
  sourceKind: FacadeFlowRuleSourceKind
  sourceTitle: string
  sourceReference: string
  sourceLocation: string
  revision: string
  scope: string
  sourceDate: string
  reviewer: string
  reviewedAt: string | null
  reviewStatus: FacadeFlowRuleSourceReviewStatus
  reviewNote: string
  supersedesSourceId?: string
  reReviewReasons: FacadeFlowRuleSourceReReviewReason[]
  evidence: FacadeFlowEvidenceReference[]
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowRuleSourceRevisionPolicy {
  humanConfirmationRequired: true
  ruleSetRevisionRequiresConfirmedSources: true
  invalidateOn: FacadeFlowRuleSourceReReviewReason[]
}

export type FacadeFlowRuleApplicabilityProductTarget = 'WINDOW' | 'DOOR' | 'SLIDING_SYSTEM' | 'FACADE' | 'TECHNICAL_DETAIL'
export type FacadeFlowRuleApplicabilitySystemScopeMode = 'UNRESOLVED' | 'EXACT_SYSTEM' | 'SYSTEM_FAMILY' | 'ANY_SYSTEM'
export type FacadeFlowRuleApplicabilityProjectScopeMode = 'UNRESOLVED' | 'SINGLE_PRODUCT' | 'STRUCTURED_POSITION' | 'PROJECT_WIDE'
export type FacadeFlowRuleApplicabilityDecision = 'UNRESOLVED' | 'APPLIES' | 'DOES_NOT_APPLY' | 'CONDITIONAL'
export type FacadeFlowRuleApplicabilityReviewStatus = 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'

export interface FacadeFlowRuleApplicabilityRecord {
  id: string
  requirementId: FacadeFlowRuleGateRequirementId
  productTargets: FacadeFlowRuleApplicabilityProductTarget[]
  systemScopeMode: FacadeFlowRuleApplicabilitySystemScopeMode
  systemScope: string
  projectScopeMode: FacadeFlowRuleApplicabilityProjectScopeMode
  projectScope: string
  decision: FacadeFlowRuleApplicabilityDecision
  conditionSummary: string
  sourceRecordIds: string[]
  reviewer: string
  reviewedAt: string | null
  reviewStatus: FacadeFlowRuleApplicabilityReviewStatus
  reviewNote: string
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowRuleApplicabilityFoundation {
  status: 'FOUNDATION_READY'
  currentProductTarget: FacadeFlowRuleApplicabilityProductTarget | null
  currentSystemLabel: string
  currentProjectScopeMode: FacadeFlowRuleApplicabilityProjectScopeMode
  currentProjectScopeLabel: string
  supportedProductTargets: FacadeFlowRuleApplicabilityProductTarget[]
  rows: FacadeFlowRuleApplicabilityRecord[]
  realApplicabilityDecisionCount: 0
  humanConfirmedDecisionCount: 0
  validated: false
  simulationOnly: true
  machineReady: false
}

export type FacadeFlowRuleEvaluationResult = 'NEEDS_EVIDENCE' | 'PASS' | 'FAIL' | 'NOT_APPLICABLE'
export type FacadeFlowRuleEvaluationReviewStatus = 'NEEDS_REVIEW' | 'HUMAN_REVIEWED'
export type FacadeFlowRuleEvaluationInvalidationReason =
  | 'RULE_REFERENCE_CHANGED'
  | 'RULE_REVISION_CHANGED'
  | 'APPLICABILITY_CHANGED'
  | 'SOURCE_SET_CHANGED'
  | 'EVIDENCE_CHANGED'
  | 'OBSERVATION_CHANGED'
  | 'RESULT_CHANGED'

export interface FacadeFlowRuleEvaluationRecord {
  id: string
  requirementId: FacadeFlowRuleGateRequirementId
  ruleId: string
  ruleRevision: string
  applicabilityRecordId: string
  applicabilityDecision: FacadeFlowRuleApplicabilityDecision
  sourceRecordIds: string[]
  evidence: FacadeFlowEvidenceReference[]
  observationSummary: string
  result: FacadeFlowRuleEvaluationResult
  evaluator: string
  evaluatedAt: string | null
  reviewStatus: FacadeFlowRuleEvaluationReviewStatus
  reviewNote: string
  invalidationReasons: FacadeFlowRuleEvaluationInvalidationReason[]
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowRuleEvaluationFoundation {
  status: 'FOUNDATION_READY'
  rows: FacadeFlowRuleEvaluationRecord[]
  resultVocabulary: FacadeFlowRuleEvaluationResult[]
  realEvaluationCount: 0
  humanReviewedEvaluationCount: 0
  passCount: 0
  failCount: 0
  notApplicableCount: 0
  needsEvidenceCount: number
  rulesValidated: false
  handoffLocked: true
  simulationOnly: true
  machineReady: false
}
export interface FacadeFlowRuleGateRequirement {
  id: FacadeFlowRuleGateRequirementId
  label: string
  applicability: FacadeFlowRuleGateRequirementApplicability
  state: FacadeFlowRuleGateRequirementState
  summary: string
  sourceRequirement: string
  evidence: FacadeFlowEvidenceReference[]
}

export interface FacadeFlowRuleGate {
  status: 'FRAMEWORK_READY'
  sourcePolicy: 'TRACEABLE_SOURCE_REQUIRED'
  ruleSetRevision: null
  requirements: FacadeFlowRuleGateRequirement[]
  sourceRecords: FacadeFlowRuleSourceRecord[]
  sourceRecordCount: number
  humanConfirmedSourceCount: number
  sourceRevisionPolicy: FacadeFlowRuleSourceRevisionPolicy
  realRuleCount: 0
  validated: false
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowUnifiedReviewSection {
  id: 'CONTEXT' | 'SOURCE' | 'STRUCTURE' | 'PRODUCT' | 'EVIDENCE' | 'RULES'
  label: string
  state: 'CAPTURED' | 'UNRESOLVED' | 'NOT_APPLICABLE'
  summary: string
}

export interface FacadeFlowUnifiedReviewPacket {
  id: string
  demoScenario: FacadeFlowAiDemoScenario
  kind: FacadeFlowUnifiedReviewPacketKind
  inputMode: FacadeFlowAiInputMode | 'KNOWLEDGE_BASE'
  jobType: FacadeFlowJobType | null
  title: string
  jobName: string
  reference: string
  groupPath: string[]
  placementNodeId?: string
  linkedProductSpecificationId?: string
  sections: FacadeFlowUnifiedReviewSection[]
  evidence: FacadeFlowEvidenceReference[]
  unresolved: string[]
  reviewAccepted: boolean
  status: FacadeFlowUnifiedReviewPacketStatus
  ruleGate: FacadeFlowRuleGate | null
  aiGenerated: false
  rulesValidated: false
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
  demoScenario: FacadeFlowAiDemoScenario | null
  guidedProduct: FacadeFlowGuidedProductDraft
  products: FacadeFlowProductSpecification[]
  technicalDetails: FacadeFlowTechnicalDetailSpecification[]
  groupLabels: string[]
  projectStructure: FacadeFlowProjectStructure
  reviewPacket: FacadeFlowUnifiedReviewPacket | null
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
