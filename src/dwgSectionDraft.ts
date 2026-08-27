export type DwgDraftKind = 'WINDOW' | 'DOOR' | 'FACADE'

export interface DwgSectionDraft {
  sectionId: string
  sourceSha256: string
  name: string
  kind: DwgDraftKind
  widthMm: number | null
  heightMm: number | null
  fieldCount: number
  verticalDividers: number
  horizontalDividers: number
  openingSashes: number
  humanConfirmed: boolean
  simulationOnly: true
  machineReady: false
  internalEvaluationOnly: true
}

export interface DwgDraftValidation { valid: boolean; errors: readonly string[] }

export const createDwgSectionDraft = (sectionId: string, sourceSha256: string, sectionNumber: number): DwgSectionDraft => ({ sectionId, sourceSha256, name: `Секция ${sectionNumber}`, kind: 'WINDOW', widthMm: null, heightMm: null, fieldCount: 1, verticalDividers: 0, horizontalDividers: 0, openingSashes: 0, humanConfirmed: false, simulationOnly: true, machineReady: false, internalEvaluationOnly: true })

export const validateDwgSectionDraft = (draft: DwgSectionDraft): DwgDraftValidation => {
  const errors: string[] = []
  if (!draft.name.trim()) errors.push('Въведете наименование.')
  if (draft.widthMm === null || !Number.isFinite(draft.widthMm) || draft.widthMm < 100 || draft.widthMm > 20_000) errors.push('Ширината трябва да бъде между 100 и 20 000 mm.')
  if (draft.heightMm === null || !Number.isFinite(draft.heightMm) || draft.heightMm < 100 || draft.heightMm > 20_000) errors.push('Височината трябва да бъде между 100 и 20 000 mm.')
  if (!Number.isInteger(draft.fieldCount) || draft.fieldCount < 1 || draft.fieldCount > 12) errors.push('Броят полета трябва да бъде между 1 и 12.')
  if (!Number.isInteger(draft.verticalDividers) || draft.verticalDividers < 0 || draft.verticalDividers > draft.fieldCount - 1) errors.push('Вертикалните делители не съответстват на броя полета.')
  if (!Number.isInteger(draft.horizontalDividers) || draft.horizontalDividers < 0 || draft.horizontalDividers > 6) errors.push('Хоризонталните делители трябва да бъдат между 0 и 6.')
  if (!Number.isInteger(draft.openingSashes) || draft.openingSashes < 0 || draft.openingSashes > draft.fieldCount) errors.push('Отваряемите крила не могат да бъдат повече от полетата.')
  return { valid: errors.length === 0, errors }
}

export const confirmDwgSectionDraft = (draft: DwgSectionDraft): DwgSectionDraft => validateDwgSectionDraft(draft).valid ? { ...draft, humanConfirmed: true } : draft

export const updateDwgSectionDraft = (draft: DwgSectionDraft, patch: Partial<Pick<DwgSectionDraft, 'name' | 'kind' | 'widthMm' | 'heightMm' | 'fieldCount' | 'verticalDividers' | 'horizontalDividers' | 'openingSashes'>>): DwgSectionDraft => ({ ...draft, ...patch, humanConfirmed: false })
