import type { SkyGlazingLteInspection, SkyGlazingLteRecord, SkyGlazingSourceEvidence } from './skyGlazingTypes'
import { normalizeSkyGlazingBarcode } from './skyGlazingXmlInspection'

export const LTE_RECORD_WIDTH = 149
const PROFILE_START = 12, PROFILE_END = 25
const RAW_LENGTH_START = 33, RAW_LENGTH_END = 41
const BARCODE_START = 137
export const isSafeLteAscii = (text: string) => [...text].every((char) => { const code = char.charCodeAt(0); return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126) })

export function inspectSkyGlazingLte(text: string, source: SkyGlazingSourceEvidence): SkyGlazingLteInspection {
  if (!isSafeLteAscii(text)) throw new Error('LTE файлът трябва да съдържа само безопасен ASCII текст.')
  const warnings = [...source.warnings]
  if (text.includes('\n') && !text.includes('\r\n')) warnings.push('LTE редовете не използват очаквания CRLF разделител.')
  const lines = text.split(/\r\n|\n|\r/); if (lines.at(-1) === '') lines.pop()
  if (!lines.length) throw new Error('LTE файлът е празен.')
  const records: SkyGlazingLteRecord[] = lines.map((line, index) => {
    if (line.length !== LTE_RECORD_WIDTH) warnings.push(`Ред ${index + 1} е ${line.length} знака вместо очакваните ${LTE_RECORD_WIDTH}.`)
    const barcode = line.length >= BARCODE_START ? line.slice(BARCODE_START, BARCODE_START + 12) : ''
    return {
      sourceFileName: source.fileName, sourceSha256: source.sha256, originalRecordIndex: index, lineNumber: index + 1,
      profileToken: line.slice(PROFILE_START, PROFILE_END).trim(), rawLengthToken: line.slice(RAW_LENGTH_START, RAW_LENGTH_END),
      barcode, normalizedBarcode: normalizeSkyGlazingBarcode(barcode), originalLine: line, sourceStatus: 'OBSERVED',
      unresolvedFixedWidthRanges: true, simulationOnly: true, machineReady: false,
    }
  })
  const barcodeCounts = new Map<string, number>()
  records.forEach(({ normalizedBarcode }) => { if (normalizedBarcode) barcodeCounts.set(normalizedBarcode, (barcodeCounts.get(normalizedBarcode) ?? 0) + 1) })
  if (records.some(({ normalizedBarcode }) => !/^\d{12}$/.test(normalizedBarcode))) warnings.push('Има LTE редове без наблюдаван 12-цифрен краен баркод.')
  if ([...barcodeCounts.values()].some((count) => count > 1)) warnings.push('Открити са повтарящи се LTE баркодове; съпоставянето им остава неразрешено.')
  const inspectedSource = { ...source, warnings: [...new Set(warnings)] }
  const widths = new Set(lines.map(({ length }) => length))
  return { source: inspectedSource, recordCount: records.length, fixedRecordWidth: widths.size === 1 ? [...widths][0]! : null, uniqueBarcodeCount: barcodeCounts.size, profileGroupCount: new Set(records.map(({ profileToken }) => profileToken).filter(Boolean)).size, records }
}
