import {
  REAL_DATA_INTAKE_FIELD_DEFINITIONS,
  type FacadeFlowRealDataFieldId,
  type FacadeFlowRealDataFieldState,
  type FacadeFlowRealDataIntakeRecord,
} from './aiRealDataIntake'

export type FacadeFlowStagingMappingDecision = 'UNREVIEWED' | 'KEEP_SOURCE' | 'MAP_TO_CANONICAL' | 'ACKNOWLEDGED_UNRESOLVED'
export type FacadeFlowStagingRecordStatus = 'MAPPING_INCOMPLETE' | 'READY_FOR_HUMAN_CONFIRMATION' | 'READY_FOR_ACTIVATION_REVIEW'
export type FacadeFlowStagingHumanReviewStatus = 'NOT_REVIEWED' | 'HUMAN_CONFIRMED'

export const REAL_DATA_STAGING_MAPPING_FIELDS: FacadeFlowRealDataFieldId[] = [
  'recordKind',
  'productType',
  'profileSystem',
  'profileCode',
  'dimensions',
  'opening',
  'hardware',
  'glassFill',
  'color',
  'projectPosition',
]

export interface FacadeFlowStagingMappingField {
  fieldId: FacadeFlowRealDataFieldId
  label: string
  sourceState: FacadeFlowRealDataFieldState
  sourceValue: string | null
  evidenceRefs: string[]
  decision: FacadeFlowStagingMappingDecision
  canonicalValue: string | null
  note: string
}

export interface FacadeFlowRealDataStagingRecord {
  id: string
  sourceIntakeId: string
  sourceSnapshotKey: string
  mappings: FacadeFlowStagingMappingField[]
  status: FacadeFlowStagingRecordStatus
  humanReviewStatus: FacadeFlowStagingHumanReviewStatus
  reviewedBy: string | null
  reviewedAt: string | null
  stagingOnly: true
  autoMappingAllowed: false
  acceptedIntoActiveData: false
  activationReviewRequired: true
  persistenceAllowed: false
  rulesValidated: false
  productionLocked: true
  machineReady: false
}

export interface FacadeFlowMappedDataCandidate {
  stagingRecordId: string
  sourceIntakeId: string
  sourceSnapshotKey: string
  canonicalFields: Partial<Record<FacadeFlowRealDataFieldId, string | null>>
  unresolvedFields: FacadeFlowRealDataFieldId[]
  status: 'READY_FOR_ACTIVATION_REVIEW'
  activationReviewStatus: 'NOT_REVIEWED'
  acceptedIntoActiveData: false
  rulesValidated: false
  productionLocked: true
  machineReady: false
}

const fieldLabel = (fieldId: FacadeFlowRealDataFieldId) => REAL_DATA_INTAKE_FIELD_DEFINITIONS.find((item) => item.id === fieldId)?.label ?? fieldId

export function facadeFlowRealDataIntakeSnapshotKey(record: FacadeFlowRealDataIntakeRecord) {
  return JSON.stringify(REAL_DATA_INTAKE_FIELD_DEFINITIONS.map((definition) => {
    const field = record.fields[definition.id]
    return [definition.id, field.state, field.value, [...field.evidenceRefs].sort()]
  }))
}

const mappingIsComplete = (mapping: FacadeFlowStagingMappingField) => {
  if (mapping.decision === 'KEEP_SOURCE') return mapping.sourceState === 'RESOLVED' && Boolean(mapping.sourceValue?.trim()) && mapping.canonicalValue === mapping.sourceValue
  if (mapping.decision === 'MAP_TO_CANONICAL') return Boolean(mapping.canonicalValue?.trim())
  if (mapping.decision === 'ACKNOWLEDGED_UNRESOLVED') return mapping.sourceState === 'UNRESOLVED' && mapping.canonicalValue === null
  return false
}

export function evaluateFacadeFlowRealDataStaging(record: FacadeFlowRealDataStagingRecord): FacadeFlowRealDataStagingRecord {
  const mappingsComplete = record.mappings.every(mappingIsComplete)
  const status: FacadeFlowStagingRecordStatus = record.humanReviewStatus === 'HUMAN_CONFIRMED'
    ? 'READY_FOR_ACTIVATION_REVIEW'
    : mappingsComplete
      ? 'READY_FOR_HUMAN_CONFIRMATION'
      : 'MAPPING_INCOMPLETE'
  return {
    ...record,
    status,
    acceptedIntoActiveData: false,
    activationReviewRequired: true,
    autoMappingAllowed: false,
    persistenceAllowed: false,
    rulesValidated: false,
    productionLocked: true,
    machineReady: false,
  }
}

export function createFacadeFlowRealDataStagingRecord(intake: FacadeFlowRealDataIntakeRecord): FacadeFlowRealDataStagingRecord | null {
  if (intake.status !== 'READY_FOR_REVIEW' || intake.reviewStatus !== 'NOT_REVIEWED' || intake.acceptedIntoActiveData) return null
  const mappings = REAL_DATA_STAGING_MAPPING_FIELDS.map<FacadeFlowStagingMappingField>((fieldId) => {
    const source = intake.fields[fieldId]
    return {
      fieldId,
      label: fieldLabel(fieldId),
      sourceState: source.state,
      sourceValue: source.value,
      evidenceRefs: [...source.evidenceRefs],
      decision: 'UNREVIEWED',
      canonicalValue: null,
      note: '',
    }
  })
  return evaluateFacadeFlowRealDataStaging({
    id: `staging:${intake.id}`,
    sourceIntakeId: intake.id,
    sourceSnapshotKey: facadeFlowRealDataIntakeSnapshotKey(intake),
    mappings,
    status: 'MAPPING_INCOMPLETE',
    humanReviewStatus: 'NOT_REVIEWED',
    reviewedBy: null,
    reviewedAt: null,
    stagingOnly: true,
    autoMappingAllowed: false,
    acceptedIntoActiveData: false,
    activationReviewRequired: true,
    persistenceAllowed: false,
    rulesValidated: false,
    productionLocked: true,
    machineReady: false,
  })
}

export function setFacadeFlowStagingMappingDecision(
  record: FacadeFlowRealDataStagingRecord,
  fieldId: FacadeFlowRealDataFieldId,
  decision: FacadeFlowStagingMappingDecision,
  canonicalValue: string | null = null,
  note = '',
): FacadeFlowRealDataStagingRecord {
  const mappings = record.mappings.map((mapping) => {
    if (mapping.fieldId !== fieldId) return mapping
    const nextCanonical = decision === 'KEEP_SOURCE'
      ? mapping.sourceValue
      : decision === 'MAP_TO_CANONICAL'
        ? canonicalValue?.trim() || null
        : null
    return { ...mapping, decision, canonicalValue: nextCanonical, note }
  })
  return evaluateFacadeFlowRealDataStaging({
    ...record,
    mappings,
    humanReviewStatus: 'NOT_REVIEWED',
    reviewedBy: null,
    reviewedAt: null,
  })
}

export function confirmFacadeFlowStagingHumanMapping(
  record: FacadeFlowRealDataStagingRecord,
  reviewer: string,
  reviewedAt: string,
): FacadeFlowRealDataStagingRecord {
  const cleanReviewer = reviewer.trim()
  if (!cleanReviewer || !reviewedAt.trim() || !record.mappings.every(mappingIsComplete)) return record
  return evaluateFacadeFlowRealDataStaging({
    ...record,
    humanReviewStatus: 'HUMAN_CONFIRMED',
    reviewedBy: cleanReviewer,
    reviewedAt,
  })
}

export function refreshFacadeFlowStagingFromIntake(
  record: FacadeFlowRealDataStagingRecord,
  intake: FacadeFlowRealDataIntakeRecord,
): FacadeFlowRealDataStagingRecord | null {
  const snapshot = facadeFlowRealDataIntakeSnapshotKey(intake)
  if (snapshot === record.sourceSnapshotKey) return record
  return createFacadeFlowRealDataStagingRecord(intake)
}

export function buildFacadeFlowMappedDataCandidate(record: FacadeFlowRealDataStagingRecord): FacadeFlowMappedDataCandidate | null {
  if (record.status !== 'READY_FOR_ACTIVATION_REVIEW' || record.humanReviewStatus !== 'HUMAN_CONFIRMED') return null
  const canonicalFields: Partial<Record<FacadeFlowRealDataFieldId, string | null>> = {}
  const unresolvedFields: FacadeFlowRealDataFieldId[] = []
  for (const mapping of record.mappings) {
    if (mapping.decision === 'ACKNOWLEDGED_UNRESOLVED') unresolvedFields.push(mapping.fieldId)
    canonicalFields[mapping.fieldId] = mapping.canonicalValue
  }
  return {
    stagingRecordId: record.id,
    sourceIntakeId: record.sourceIntakeId,
    sourceSnapshotKey: record.sourceSnapshotKey,
    canonicalFields,
    unresolvedFields,
    status: 'READY_FOR_ACTIVATION_REVIEW',
    activationReviewStatus: 'NOT_REVIEWED',
    acceptedIntoActiveData: false,
    rulesValidated: false,
    productionLocked: true,
    machineReady: false,
  }
}

export const STAGING_STATUS_LABELS: Record<FacadeFlowStagingRecordStatus, string> = {
  MAPPING_INCOMPLETE: 'НУЖЕН MAPPING ПРЕГЛЕД',
  READY_FOR_HUMAN_CONFIRMATION: 'ГОТОВ ЗА ЧОВЕШКО ПОТВЪРЖДЕНИЕ',
  READY_FOR_ACTIVATION_REVIEW: 'КАНДИДАТ ЗА АКТИВАЦИОНЕН ПРЕГЛЕД',
}
