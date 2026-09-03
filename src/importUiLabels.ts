import type { CombinedAuditEntry, CombinedCandidateType, CombinedDecision } from './combinedAnalysisTypes'
import type { DetectedImportFormat, ImportRoute, ImportSupportStatus } from './importFormatTypes'
import type { OcrAuditEntry, OcrCandidateStatus, OcrCandidateType, OcrJobState, OcrTargetField } from './ocrTypes'
import type { SkyGlazingComparisonStatus } from './skyGlazingTypes'

export const importRouteLabels: Record<ImportRoute, string> = {
  IMAGE: 'Снимка',
  PDF: 'PDF чертеж',
  SKYGLAZING: 'SkyGlazing XML / LTE',
  CAD: 'CAD чертеж',
  TABULAR: 'Таблична спецификация',
  SIMULATION: 'FacadeFlow симулация',
}


export const detectedImportFormatLabels: Record<DetectedImportFormat, string> = {
  PNG: 'PNG изображение',
  JPEG: 'JPEG изображение',
  PDF: 'PDF документ',
  SKYGLAZING_XML: 'SkyGlazing XML',
  LTE: 'SkyGlazing LTE',
  DWG: 'DWG чертеж',
  DXF: 'DXF чертеж',
  CSV: 'CSV таблица',
  XLSX: 'XLSX таблица',
  FACADEFLOW_SIMULATION_JSON: 'FacadeFlow симулация',
  UNKNOWN: 'Неразпознат формат',
}

export const importSupportStatusLabels: Record<ImportSupportStatus, string> = {
  SUPPORTED: 'Поддържа се',
  SUPPORTED_FOR_VIEW_ONLY: 'Само за преглед',
  FUTURE_SUPPORT: 'Предстои поддръжка',
  REJECTED: 'Отхвърлен',
  FORMAT_MISMATCH: 'Несъответствие на формата',
}


const ocrProgressStatusLabels: Record<string, string> = {
  'loading tesseract core': 'Зареждане на OCR ядрото',
  'initializing tesseract': 'Инициализиране на OCR',
  'loading language traineddata': 'Зареждане на езиковите данни',
  'initializing api': 'Подготовка на OCR',
  'recognizing text': 'Разпознаване на текст',
}

export const ocrProgressStatusBg = (status: string) => ocrProgressStatusLabels[status.trim().toLowerCase()] ?? 'Локално OCR разпознаване'

export const ocrJobStateLabels: Record<OcrJobState, string> = {
  READY: 'Готово', PROCESSING: 'Обработва се', COMPLETED: 'Завършено', FAILED: 'Неуспешно', CANCELLED: 'Прекратено',
}
export const ocrCandidateTypeLabels: Record<OcrCandidateType, string> = {
  WIDTH: 'Ширина', HEIGHT: 'Височина', WIDTH_HEIGHT_PAIR: 'Ширина × височина', DIAMETER: 'Диаметър', RADIUS: 'Радиус', GENERIC_DIMENSION: 'Размер', TEXT_ONLY: 'Текст',
}
export const ocrCandidateStatusLabels: Record<OcrCandidateStatus, string> = { SUGGESTED: 'Предложено', ACCEPTED: 'Прието', REJECTED: 'Отхвърлено' }
export const ocrAuditActionLabels: Record<OcrAuditEntry['action'], string> = { ACCEPT: 'Приемане', REJECT: 'Отхвърляне', EDIT: 'Редакция', APPLY: 'Прилагане' }
export const ocrTargetFieldLabels: Record<OcrTargetField, string> = { projectReference: 'Проект / референция', productReference: 'Референция на изделието', width: 'Ширина', height: 'Височина', drawingPosition: 'Позиция в чертежа', notes: 'Общи бележки' }

export const combinedCandidateTypeLabels: Record<CombinedCandidateType, string> = {
  OVERALL_WIDTH: 'Обща ширина', OVERALL_HEIGHT: 'Обща височина', SECTION_WIDTH: 'Ширина на секция', SECTION_HEIGHT: 'Височина на секция', DIAMETER: 'Диаметър', RADIUS: 'Радиус', GENERIC_DIMENSION: 'Размер', QUANTITY: 'Количество', PRODUCT_REFERENCE: 'Референция на изделието', TEXT_ONLY: 'Текст',
}
export const combinedDecisionLabels: Record<CombinedDecision, string> = { SUGGESTED: 'Предложено', ACCEPTED: 'Прието', REJECTED: 'Отхвърлено' }
export const combinedAuditActionLabels: Record<CombinedAuditEntry['action'], string> = { SELECT_SCHEME: 'Избор на схема', ACCEPT: 'Приемане', REJECT: 'Отхвърляне', EDIT: 'Редакция', APPLY: 'Прилагане' }

export const skyComparisonStatusLabels: Record<SkyGlazingComparisonStatus, string> = {
  MATCHED: 'Съвпадение', XML_ONLY: 'Само в XML', LTE_ONLY: 'Само в LTE', CONFLICT: 'Конфликт', UNRESOLVED: 'Неразрешено',
}
