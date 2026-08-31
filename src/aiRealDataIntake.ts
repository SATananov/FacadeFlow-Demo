export type FacadeFlowRealDataRecordKind = 'PRODUCT' | 'PROFILE' | 'PROJECT_POSITION' | 'RULE_SOURCE' | 'UNKNOWN'
export type FacadeFlowRealDataSourceKind = 'XML' | 'LTE' | 'DWG' | 'PDF' | 'IMAGE' | 'CATALOGUE' | 'MANUAL' | 'OTHER' | 'UNKNOWN'
export type FacadeFlowRealDataFieldState = 'UNRESOLVED' | 'RESOLVED' | 'CONFLICT'
export type FacadeFlowRealDataRecordStatus = 'UNRESOLVED' | 'CONFLICT' | 'READY_FOR_REVIEW'
export type FacadeFlowRealDataFieldRequirement = 'REQUIRED' | 'CONDITIONAL'
export type FacadeFlowRealDataFieldId =
  | 'sourceKind'
  | 'sourceReference'
  | 'sourceRevision'
  | 'sourceLocation'
  | 'recordKind'
  | 'externalReference'
  | 'productType'
  | 'profileSystem'
  | 'profileCode'
  | 'dimensions'
  | 'opening'
  | 'hardware'
  | 'glassFill'
  | 'color'
  | 'projectPosition'
  | 'ruleEvidenceLinks'

export interface FacadeFlowRealDataFieldDefinition {
  id: FacadeFlowRealDataFieldId
  label: string
  group: 'PROVENANCE' | 'IDENTITY' | 'PRODUCT' | 'PROJECT' | 'EVIDENCE'
  requirement: FacadeFlowRealDataFieldRequirement
  description: string
}

export interface FacadeFlowRealDataFieldValue {
  state: FacadeFlowRealDataFieldState
  value: string | null
  evidenceRefs: string[]
}

export interface FacadeFlowRealDataIntakeRecord {
  id: string
  fields: Record<FacadeFlowRealDataFieldId, FacadeFlowRealDataFieldValue>
  status: FacadeFlowRealDataRecordStatus
  reviewStatus: 'NOT_REVIEWED'
  stagingStatus: 'NOT_STARTED'
  acceptedIntoActiveData: false
  autoMappingAllowed: false
  rulesValidated: false
  productionLocked: true
  simulationOnly: true
  machineReady: false
}

export const REAL_DATA_INTAKE_FIELD_DEFINITIONS: FacadeFlowRealDataFieldDefinition[] = [
  { id: 'sourceKind', label: 'Вид източник', group: 'PROVENANCE', requirement: 'REQUIRED', description: 'XML, LTE, DWG, PDF, изображение, каталог или друг доказуем източник.' },
  { id: 'sourceReference', label: 'Източник / файл / запис', group: 'PROVENANCE', requirement: 'REQUIRED', description: 'Име, идентификатор или референция към реалния източник.' },
  { id: 'sourceRevision', label: 'Ревизия / hash / версия', group: 'PROVENANCE', requirement: 'REQUIRED', description: 'Версията на източника трябва да е проследима и отделна от стойностите.' },
  { id: 'sourceLocation', label: 'Точно място в източника', group: 'PROVENANCE', requirement: 'REQUIRED', description: 'Ред, позиция, страница, barcode, mark или друго точно място.' },
  { id: 'recordKind', label: 'Вид реален запис', group: 'IDENTITY', requirement: 'REQUIRED', description: 'Изделие, профил, проектна позиция, източник за правило или друг тип.' },
  { id: 'externalReference', label: 'Външна референция', group: 'IDENTITY', requirement: 'REQUIRED', description: 'Оригинален код / mark / barcode / позиция. Не се измисля служебно.' },
  { id: 'productType', label: 'Тип изделие', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Само ако е заявен от реалния източник или потвърден при mapping.' },
  { id: 'profileSystem', label: 'Профилна система', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Не се извежда от размери или код без доказан mapping.' },
  { id: 'profileCode', label: 'Профилен код', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Запазва оригиналния код от източника; ролята остава отделно решение.' },
  { id: 'dimensions', label: 'Размери', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Стойности + мерни единици само от доказуем източник.' },
  { id: 'opening', label: 'Отваряемост', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Не се предполага от рисунка или позиция без доказателство.' },
  { id: 'hardware', label: 'Обков', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Код, тип или комплект само ако източникът го съдържа.' },
  { id: 'glassFill', label: 'Стъкло / пълнеж', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Съставът остава НЕУТОЧНЕН, ако липсва от входните данни.' },
  { id: 'color', label: 'Цвят / покритие', group: 'PRODUCT', requirement: 'CONDITIONAL', description: 'Оригинална стойност и бъдещ mapping се пазят отделно.' },
  { id: 'projectPosition', label: 'Проектна позиция / път', group: 'PROJECT', requirement: 'CONDITIONAL', description: 'Етаж, помещение, фасада, mark или друг реално доказан контекст.' },
  { id: 'ruleEvidenceLinks', label: 'Връзки към правила / доказателства', group: 'EVIDENCE', requirement: 'CONDITIONAL', description: 'Само идентификатори към вече проследими source/evidence записи.' },
]

const emptyField = (): FacadeFlowRealDataFieldValue => ({ state: 'UNRESOLVED', value: null, evidenceRefs: [] })

export function createFacadeFlowRealDataIntakeDraft(id: string): FacadeFlowRealDataIntakeRecord {
  const fields = Object.fromEntries(REAL_DATA_INTAKE_FIELD_DEFINITIONS.map((item) => [item.id, emptyField()])) as Record<FacadeFlowRealDataFieldId, FacadeFlowRealDataFieldValue>
  return {
    id,
    fields,
    status: 'UNRESOLVED',
    reviewStatus: 'NOT_REVIEWED',
    stagingStatus: 'NOT_STARTED',
    acceptedIntoActiveData: false,
    autoMappingAllowed: false,
    rulesValidated: false,
    productionLocked: true,
    simulationOnly: true,
    machineReady: false,
  }
}

export function evaluateFacadeFlowRealDataIntake(record: FacadeFlowRealDataIntakeRecord): FacadeFlowRealDataIntakeRecord {
  const definitions = REAL_DATA_INTAKE_FIELD_DEFINITIONS
  const hasConflict = definitions.some((item) => record.fields[item.id].state === 'CONFLICT')
  const requiredResolved = definitions
    .filter((item) => item.requirement === 'REQUIRED')
    .every((item) => record.fields[item.id].state === 'RESOLVED' && Boolean(record.fields[item.id].value?.trim()))
  const status: FacadeFlowRealDataRecordStatus = hasConflict ? 'CONFLICT' : requiredResolved ? 'READY_FOR_REVIEW' : 'UNRESOLVED'
  return {
    ...record,
    status,
    reviewStatus: 'NOT_REVIEWED',
    stagingStatus: 'NOT_STARTED',
    acceptedIntoActiveData: false,
    autoMappingAllowed: false,
    rulesValidated: false,
    productionLocked: true,
    machineReady: false,
  }
}

export function setFacadeFlowRealDataIntakeField(
  record: FacadeFlowRealDataIntakeRecord,
  fieldId: FacadeFlowRealDataFieldId,
  value: string | null,
  state: FacadeFlowRealDataFieldState,
  evidenceRefs: string[] = [],
): FacadeFlowRealDataIntakeRecord {
  return evaluateFacadeFlowRealDataIntake({
    ...record,
    fields: {
      ...record.fields,
      [fieldId]: { value, state, evidenceRefs: [...evidenceRefs] },
    },
  })
}

export const REAL_DATA_INTAKE_STATUS_LABELS: Record<FacadeFlowRealDataRecordStatus, string> = {
  UNRESOLVED: 'НЕУТОЧНЕН',
  CONFLICT: 'КОНФЛИКТ',
  READY_FOR_REVIEW: 'ГОТОВ ЗА ПРЕГЛЕД',
}
