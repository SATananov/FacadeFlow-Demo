import { calculateSha256 } from './drawingImportHash'
import { formatsForRoute } from './importFormatRoutes'
import { detectImportFormat } from './importSignatureInspection'
import type { ImportRoute, InspectedImportSource } from './importFormatTypes'

export async function inspectImportFile(file: File, selectedRoute: ImportRoute, maximumBytes: number): Promise<{ bytes: ArrayBuffer; inspection: InspectedImportSource }> {
  const bytes = await file.arrayBuffer(), detected = detectImportFormat(bytes, file.name), extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? '' : ''
  let supportStatus: InspectedImportSource['supportStatus'] = 'REJECTED', warnings: string[] = []
  if (!file.size) warnings.push('Файлът е празен.')
  if (file.size > maximumBytes) warnings.push(`Файлът надвишава ограничението от ${Math.round(maximumBytes / 1024 / 1024)} MB.`)
  if (detected.format === 'UNKNOWN') warnings.push('Форматът не може да бъде потвърден безопасно по съдържанието.')
  else if (!formatsForRoute[selectedRoute].includes(detected.format)) { supportStatus = 'FORMAT_MISMATCH'; warnings.push(`Съдържанието е ${detected.format}, но избраният маршрут е ${selectedRoute}.`) }
  else {
    const expectedExtensions: Record<typeof detected.format, string[]> = { PNG: ['png'], JPEG: ['jpg', 'jpeg'], PDF: ['pdf'], DWG: ['dwg'], DXF: ['dxf'], CSV: ['csv'], XLSX: ['xlsx'], FACADEFLOW_SIMULATION_JSON: ['json'] }
    if (!expectedExtensions[detected.format].includes(extension)) warnings.push(`Разширението .${extension || '(липсва)'} не съответства на потвърдения формат ${detected.format}.`)
    const strictMime: Partial<Record<typeof detected.format, string[]>> = { PNG: ['image/png'], JPEG: ['image/jpeg'], PDF: ['application/pdf'], CSV: ['text/csv'], XLSX: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], FACADEFLOW_SIMULATION_JSON: ['application/json'] }
    if (file.type && strictMime[detected.format] && !strictMime[detected.format]?.includes(file.type)) warnings.push(`MIME типът ${file.type} не съответства на потвърдения формат ${detected.format}.`)
    if (warnings.length) supportStatus = 'FORMAT_MISMATCH'
  }
  if (!warnings.length) supportStatus = selectedRoute === 'IMAGE' || selectedRoute === 'PDF' ? 'SUPPORTED' : selectedRoute === 'CAD' ? 'SUPPORTED_FOR_VIEW_ONLY' : 'FUTURE_SUPPORT'
  return { bytes, inspection: { fileName: file.name, extension, mimeType: file.type || 'неуказан', sizeBytes: file.size, sha256: await calculateSha256(bytes), selectedRoute, detectedFormat: detected.format, supportStatus, warnings, importedAt: new Date().toISOString(), safeSummary: detected.summary, formatVersion: detected.version } }
}
