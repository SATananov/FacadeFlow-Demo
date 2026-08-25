import type { DrawingFileKind, DrawingImportLimits, DrawingImportValidation, DrawingProductDraft } from './drawingImportTypes'

export const defaultDrawingImportLimits: DrawingImportLimits = {
  maximumFileBytes: 15 * 1024 * 1024,
  maximumPdfPages: 50,
}

const signatures = {
  PDF: (bytes: Uint8Array) => bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d,
  PNG: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a,
  JPEG: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9,
} satisfies Record<DrawingFileKind, (bytes: Uint8Array) => boolean>

export function identifyDrawingFile(file: File, bytes: ArrayBuffer, limits: DrawingImportLimits): { kind?: DrawingFileKind; errors: string[] } {
  const errors: string[] = []
  if (!file.size) errors.push('Файлът е празен.')
  if (file.size > limits.maximumFileBytes) errors.push(`Файлът надвишава ограничението от ${Math.round(limits.maximumFileBytes / 1024 / 1024)} MB.`)
  const extension = file.name.split('.').pop()?.toLowerCase()
  const expectedKind: DrawingFileKind | undefined = extension === 'pdf' ? 'PDF' : extension === 'png' ? 'PNG' : extension === 'jpg' || extension === 'jpeg' ? 'JPEG' : undefined
  if (!expectedKind) errors.push('Неподдържан формат. Изберете PDF, PNG, JPG или JPEG файл.')
  const view = new Uint8Array(bytes)
  if (expectedKind && !signatures[expectedKind](view)) errors.push('Съдържанието на файла е повредено или не съответства на разширението.')
  return { kind: errors.length ? undefined : expectedKind, errors }
}

export function validateDrawingDraft(draft: DrawingProductDraft, pageCount: number): DrawingImportValidation {
  const errors: string[] = []
  if (!draft.projectReference.trim()) errors.push('Въведете име или референция на проекта.')
  if (!draft.productReference.trim()) errors.push('Въведете референция на изделието.')
  if (!Number.isInteger(draft.sourcePage) || draft.sourcePage < 1 || draft.sourcePage > pageCount) errors.push(`Страницата трябва да е между 1 и ${pageCount}.`)
  if (!Number.isFinite(draft.width) || draft.width <= 0) errors.push('Ширината трябва да е положително крайно число.')
  if (!Number.isFinite(draft.height) || draft.height <= 0) errors.push('Височината трябва да е положително крайно число.')
  if (!Number.isInteger(draft.quantity) || draft.quantity <= 0) errors.push('Количеството трябва да е положително цяло число.')
  if (!draft.templateId) errors.push('Изберете референтна схема.')
  return { valid: errors.length === 0, errors }
}
