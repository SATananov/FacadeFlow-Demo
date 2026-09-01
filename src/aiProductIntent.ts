import type { FacadeFlowEvidenceReference, FacadeFlowProductSpecification } from './aiWorkspaceTypes'

export type FacadeFlowProductIntentSourceKind = 'PROMPT' | 'DOCUMENT' | 'SKETCH' | 'MANUAL'
export type FacadeFlowProductIntentCategory = 'WINDOW' | 'DOOR' | 'COMBINED' | 'FACADE' | 'UNRESOLVED'
export type FacadeFlowProductIntentStatus = 'AI_DRAFT' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
export type FacadeFlowIntentEvidenceStrength = 'EXPLICIT' | 'SUPPORTED' | 'UNCERTAIN' | 'UNRESOLVED'
export type FacadeFlowIntentFieldRole = 'FIXED' | 'OPENING_SASH' | 'SLIDING_SASH' | 'PANEL' | 'UNRESOLVED'
export type FacadeFlowIntentOpeningType = 'FIXED' | 'TURN' | 'TILT' | 'TILT_TURN' | 'SLIDING' | 'OTHER' | 'UNRESOLVED'
export type FacadeFlowIntentOpeningDirection = 'LEFT' | 'RIGHT' | 'UNRESOLVED'
export type FacadeFlowIntentSwing = 'INWARD' | 'OUTWARD' | 'UNRESOLVED'
export type FacadeFlowIntentDividerOrientation = 'VERTICAL' | 'HORIZONTAL'

export interface FacadeFlowIntentEvidence {
  id: string
  sourceKind: FacadeFlowProductIntentSourceKind
  sourceName: string
  excerpt: string
  location?: string
  strength: FacadeFlowIntentEvidenceStrength
}

export interface FacadeFlowIntentProfiles {
  system?: string
  frame?: string
  sash?: string
  mullion?: string
  transom?: string
  threshold?: string
}

export interface FacadeFlowIntentHardware {
  mechanism?: string
  handle?: string
  handleHeightMm?: number
  hinges?: string
  hingeQuantity?: number
  lock?: string
}

export interface FacadeFlowIntentField {
  id: string
  order: number
  role: FacadeFlowIntentFieldRole
  widthMm?: number
  heightMm?: number
  openingType?: FacadeFlowIntentOpeningType
  openingDirection?: FacadeFlowIntentOpeningDirection
  swing?: FacadeFlowIntentSwing
  sashProfile?: string
  hardware?: FacadeFlowIntentHardware
  evidenceIds: string[]
  unresolved: string[]
}

export interface FacadeFlowIntentDivider {
  id: string
  orientation: FacadeFlowIntentDividerOrientation
  positionMm?: number
  positionRatio?: number
  profile?: string
  evidenceIds: string[]
  unresolved: string[]
}

export interface FacadeFlowProductIntent {
  schemaVersion: 'AI01.1'
  id: string
  sourceKind: FacadeFlowProductIntentSourceKind
  sourceText: string
  category: FacadeFlowProductIntentCategory
  mark?: string
  name?: string
  quantity?: number
  dimensions: { widthMm?: number; heightMm?: number }
  profiles: FacadeFlowIntentProfiles
  fields: FacadeFlowIntentField[]
  dividers: FacadeFlowIntentDivider[]
  glazing: { description?: string; thicknessMm?: number }
  finish: { exterior?: string; interior?: string }
  hardwareDefaults: FacadeFlowIntentHardware
  evidence: FacadeFlowIntentEvidence[]
  unresolved: string[]
  status: FacadeFlowProductIntentStatus
  aiGenerated: boolean
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

export interface FacadeFlowProductIntentValidation {
  validForHumanReview: boolean
  errors: string[]
  warnings: string[]
}

const positiveFinite = (value: number | undefined) => value === undefined || (Number.isFinite(value) && value > 0)
const positiveInteger = (value: number | undefined) => value === undefined || (Number.isInteger(value) && value > 0)
const unitInterval = (value: number | undefined) => value === undefined || (Number.isFinite(value) && value >= 0 && value <= 1)

export function createFacadeFlowProductIntent(input: {
  id: string
  sourceKind: FacadeFlowProductIntentSourceKind
  sourceText: string
  aiGenerated?: boolean
}): FacadeFlowProductIntent {
  return {
    schemaVersion: 'AI01.1',
    id: input.id,
    sourceKind: input.sourceKind,
    sourceText: input.sourceText,
    category: 'UNRESOLVED',
    dimensions: {},
    profiles: {},
    fields: [],
    dividers: [],
    glazing: {},
    finish: {},
    hardwareDefaults: {},
    evidence: [],
    unresolved: [],
    status: 'AI_DRAFT',
    aiGenerated: input.aiGenerated ?? input.sourceKind !== 'MANUAL',
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

export function validateFacadeFlowProductIntent(intent: FacadeFlowProductIntent): FacadeFlowProductIntentValidation {
  const errors: string[] = []
  const warnings: string[] = []
  if (!intent.id.trim()) errors.push('Product intent requires an id.')
  if (!intent.sourceText.trim() && intent.sourceKind !== 'MANUAL') errors.push('Prompt/document/sketch intent requires captured source text.')
  if (!positiveInteger(intent.quantity)) errors.push('Quantity must be a positive integer when provided.')
  if (!positiveFinite(intent.dimensions.widthMm)) errors.push('Overall width must be a positive finite millimetre value when provided.')
  if (!positiveFinite(intent.dimensions.heightMm)) errors.push('Overall height must be a positive finite millimetre value when provided.')

  const evidenceIds = new Set(intent.evidence.map((item) => item.id))
  if (evidenceIds.size !== intent.evidence.length) errors.push('Evidence ids must be unique.')

  const fieldIds = new Set<string>()
  for (const field of intent.fields) {
    if (!field.id.trim() || fieldIds.has(field.id)) errors.push('Field ids must be non-empty and unique.')
    fieldIds.add(field.id)
    if (!Number.isInteger(field.order) || field.order < 0) errors.push(`Field ${field.id || '<empty>'} requires a non-negative integer order.`)
    if (!positiveFinite(field.widthMm) || !positiveFinite(field.heightMm)) errors.push(`Field ${field.id || '<empty>'} dimensions must be positive when provided.`)
    for (const evidenceId of field.evidenceIds) if (!evidenceIds.has(evidenceId)) errors.push(`Field ${field.id || '<empty>'} references missing evidence ${evidenceId}.`)
  }

  const dividerIds = new Set<string>()
  for (const divider of intent.dividers) {
    if (!divider.id.trim() || dividerIds.has(divider.id)) errors.push('Divider ids must be non-empty and unique.')
    dividerIds.add(divider.id)
    if (!positiveFinite(divider.positionMm)) errors.push(`Divider ${divider.id || '<empty>'} positionMm must be positive when provided.`)
    if (!unitInterval(divider.positionRatio)) errors.push(`Divider ${divider.id || '<empty>'} positionRatio must be between 0 and 1.`)
    if (divider.positionMm !== undefined && divider.positionRatio !== undefined) warnings.push(`Divider ${divider.id || '<empty>'} provides both absolute and ratio positions; human review must choose the authoritative value.`)
    for (const evidenceId of divider.evidenceIds) if (!evidenceIds.has(evidenceId)) errors.push(`Divider ${divider.id || '<empty>'} references missing evidence ${evidenceId}.`)
  }

  if (intent.category === 'UNRESOLVED') warnings.push('Product category is unresolved.')
  if (intent.dimensions.widthMm === undefined) warnings.push('Overall width is unresolved.')
  if (intent.dimensions.heightMm === undefined) warnings.push('Overall height is unresolved.')
  if (!intent.fields.length) warnings.push('Field topology is unresolved.')
  if (intent.unresolved.length) warnings.push(`${intent.unresolved.length} product intent item(s) remain unresolved.`)

  return { validForHumanReview: errors.length === 0, errors, warnings }
}

export function facadeFlowProductIntentAllowsAutomaticGeometry(_intent: FacadeFlowProductIntent): false {
  return false
}

export function facadeFlowProductIntentToSpecification(intent: FacadeFlowProductIntent): FacadeFlowProductSpecification {
  const evidence: FacadeFlowEvidenceReference[] = intent.evidence.map((item) => ({
    id: item.id,
    sourceName: item.sourceName,
    sourceKind: intent.sourceKind === 'PROMPT' ? 'DESCRIPTION' : intent.sourceKind,
    location: item.location,
    note: `${item.strength}: ${item.excerpt}`,
  }))
  const unresolved = [...intent.unresolved]
  if (intent.category === 'UNRESOLVED') unresolved.push('Категория на изделието')
  if (intent.dimensions.widthMm === undefined) unresolved.push('Обща ширина')
  if (intent.dimensions.heightMm === undefined) unresolved.push('Обща височина')
  if (!intent.fields.length) unresolved.push('Разпределение на полетата / геометрична топология')

  return {
    id: `${intent.id}-specification`,
    mark: intent.mark,
    name: intent.name?.trim() || intent.mark?.trim() || 'AI предложение за изделие',
    quantity: intent.quantity && Number.isFinite(intent.quantity) && intent.quantity > 0 ? intent.quantity : 1,
    groupPath: [],
    dimensions: { width: intent.dimensions.widthMm, height: intent.dimensions.heightMm },
    system: intent.profiles.system,
    profiles: {
      frame: intent.profiles.frame,
      sash: intent.profiles.sash,
      mullion: intent.profiles.mullion,
      transom: intent.profiles.transom,
      threshold: intent.profiles.threshold,
    },
    opening: {},
    hardware: {
      hinges: intent.hardwareDefaults.hinges,
      hingeQuantity: intent.hardwareDefaults.hingeQuantity,
      handle: intent.hardwareDefaults.handle,
      handleHeight: intent.hardwareDefaults.handleHeightMm,
      lock: intent.hardwareDefaults.lock,
      mechanism: intent.hardwareDefaults.mechanism,
    },
    glazing: { ...intent.glazing },
    finish: { ...intent.finish },
    notes: intent.sourceText.trim() || undefined,
    evidence,
    unresolved: [...new Set(unresolved)],
    status: 'NEEDS_REVIEW',
    simulationOnly: true,
    machineReady: false,
  }
}
