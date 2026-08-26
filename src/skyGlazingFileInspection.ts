import { calculateSha256 } from './drawingImportHash'
import { inspectSkyGlazingLte, isSafeLteAscii } from './skyGlazingLteInspection'
import type { SkyGlazingLteInspection, SkyGlazingSourceEvidence, SkyGlazingXmlInspection } from './skyGlazingTypes'
import { hasForbiddenXmlDeclaration, inspectSkyGlazingXml } from './skyGlazingXmlInspection'

export const DEFAULT_SKYGLAZING_MAXIMUM_BYTES = 20 * 1024 * 1024

export interface PreparedSkyGlazingXml { file: File; bytes: ArrayBuffer; inspection: SkyGlazingXmlInspection }
export interface PreparedSkyGlazingLte { file: File; bytes: ArrayBuffer; inspection: SkyGlazingLteInspection }

function extensionOf(fileName: string): string { return fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : '' }
function source(file: File, sha256: string, format: SkyGlazingSourceEvidence['detectedFormat']): SkyGlazingSourceEvidence {
  return { fileName: file.name, extension: extensionOf(file.name), detectedFormat: format, sizeBytes: file.size, sha256, supportStatus: 'SUPPORTED_FOR_VIEW_ONLY', importedAt: new Date().toISOString(), warnings: [], simulationOnly: true, machineReady: false }
}
function validateSize(file: File, maximumBytes: number) {
  if (!file.size) throw new Error('Избраният файл е празен.')
  if (!Number.isFinite(maximumBytes) || maximumBytes <= 0 || file.size > maximumBytes) throw new Error(`Файлът надвишава локалното ограничение от ${Math.round(maximumBytes / 1024 / 1024)} MB.`)
}

export async function prepareSkyGlazingXml(file: File, maximumBytes = DEFAULT_SKYGLAZING_MAXIMUM_BYTES): Promise<PreparedSkyGlazingXml> {
  validateSize(file, maximumBytes)
  if (extensionOf(file.name) !== 'xml') throw new Error('За XML проверката се допуска само файл с разширение .xml.')
  const bytes = await file.arrayBuffer(); let text: string
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { throw new Error('XML файлът не е валиден UTF-8 текст.') }
  if (hasForbiddenXmlDeclaration(text)) throw new Error('XML с DOCTYPE или ENTITY декларация не се допуска.')
  if (!/^\uFEFF?\s*(?:<\?xml[\s\S]*?\?>\s*)?<Order(?:\s|>)/.test(text)) throw new Error('Съдържанието не съответства на очакван SkyGlazing XML с корен Order.')
  const evidence = source(file, await calculateSha256(bytes), 'SKYGLAZING_XML')
  return { file, bytes, inspection: inspectSkyGlazingXml(text, evidence) }
}

export async function prepareSkyGlazingLte(file: File, maximumBytes = DEFAULT_SKYGLAZING_MAXIMUM_BYTES): Promise<PreparedSkyGlazingLte> {
  validateSize(file, maximumBytes)
  if (extensionOf(file.name) !== 'lte') throw new Error('За LTE проверката се допуска само файл с разширение .lte.')
  const bytes = await file.arrayBuffer(), text = new TextDecoder('ascii').decode(bytes)
  if (!isSafeLteAscii(text) || text.includes('\0')) throw new Error('LTE съдържанието не съответства на безопасен ASCII текстов формат.')
  const evidence = source(file, await calculateSha256(bytes), 'LTE'), inspected = inspectSkyGlazingLte(text, evidence)
  const inspection = inspected.source.warnings.length ? { ...inspected, source: { ...inspected.source, supportStatus: 'FORMAT_MISMATCH' as const } } : inspected
  if (!inspection.records.some(({ originalLine }) => originalLine.length === 149)) throw new Error('LTE съдържанието няма разпознаваем 149-знаков запис.')
  return { file, bytes, inspection }
}
