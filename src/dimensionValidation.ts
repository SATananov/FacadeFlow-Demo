import type { DimensionAnnotation, ImportedDimensionEvidence } from './dimensionTypes'
export const validDimensionValue = (value: number) => Number.isFinite(value) && value > 0
export function validateAnnotations(items: DimensionAnnotation[]) { const errors = items.filter((item) => !validDimensionValue(item.value)).map((item) => `${item.id}: Неразрешен размер`); return { valid: errors.length === 0, errors } }
export const confirmedEvidence = (evidence: ImportedDimensionEvidence) => evidence.decision === 'ACCEPTED' && evidence.humanConfirmed && evidence.confirmedValue !== undefined && validDimensionValue(evidence.confirmedValue)
