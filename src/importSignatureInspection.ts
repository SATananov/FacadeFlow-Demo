import type { DetectedImportFormat } from './importFormatTypes'

const starts = (bytes: Uint8Array, signature: number[]) => signature.every((value, index) => bytes[index] === value)
const decodePrefix = (bytes: Uint8Array, length = 4096) => new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, length))

export function detectImportFormat(bytes: ArrayBuffer, fileName: string): { format: DetectedImportFormat; version?: string; summary?: string } {
  const view = new Uint8Array(bytes), prefix = decodePrefix(view)
  if (starts(view, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { format: 'PNG' }
  if (view.length > 3 && view[0] === 0xff && view[1] === 0xd8 && view[view.length - 2] === 0xff && view[view.length - 1] === 0xd9) return { format: 'JPEG' }
  if (prefix.startsWith('%PDF-')) return { format: 'PDF', version: prefix.slice(5, 8) }
  if (!/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(prefix) && /<Order(?:\s|>)/.test(prefix) && /<Generator>\s*SkyGlazing\s*<\/Generator>/.test(prefix)) return { format: 'SKYGLAZING_XML', summary: 'Разпозната SkyGlazing XML структура за отделна проверка само за преглед.' }
  if (fileName.toLowerCase().endsWith('.lte') && !prefix.includes('\0')) { const lines = prefix.split(/\r\n|\n|\r/).filter(Boolean); if (lines.length && lines.every((line) => line.length === 149 && /^[\x20-\x7e]+$/.test(line))) return { format: 'LTE', summary: 'Разпознати ASCII LTE записи с ширина 149 знака за отделна проверка само за преглед.' } }
  const dwg = prefix.match(/^AC10\d{2}/); if (dwg) return { format: 'DWG', version: dwg[0], summary: `Разпозната безопасна DWG заглавна част ${dwg[0]}. Геометрични обекти не са прочетени.` }
  if (/\bSECTION\s*[\r\n]+\s*2\s*[\r\n]+\s*(?:HEADER|ENTITIES)\b/i.test(prefix) || /\b0\s*[\r\n]+\s*SECTION\b/i.test(prefix)) return { format: 'DXF', summary: 'Разпозната текстова DXF структура. Геометричните обекти не са анализирани.' }
  if (starts(view, [0x50, 0x4b, 0x03, 0x04]) && fileName.toLowerCase().endsWith('.xlsx')) return { format: 'XLSX', summary: 'Разпознат ZIP контейнер за XLSX; работните листове не са прочетени.' }
  if (fileName.toLowerCase().endsWith('.csv') && /[,;\t]/.test(prefix) && !prefix.includes('\0')) return { format: 'CSV', summary: 'Текстов табличен източник; колоните не са интерпретирани.' }
  if (fileName.toLowerCase().endsWith('.drawing-import.simulation.json')) {
    try { const parsed: unknown = JSON.parse(new TextDecoder().decode(view)); if (isFacadeFlowSimulation(parsed)) return { format: 'FACADEFLOW_SIMULATION_JSON', version: parsed.schemaVersion, summary: `Схема на FacadeFlow симулация ${parsed.schemaVersion}; данните не са възстановени.` } } catch { return { format: 'UNKNOWN' } }
  }
  return { format: 'UNKNOWN' }
}

function isFacadeFlowSimulation(value: unknown): value is { schemaVersion: string; simulationOnly: true; machineReady: false; requiresHumanApproval: true } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.schemaVersion === 'string' && record.simulationOnly === true && record.machineReady === false && record.requiresHumanApproval === true
}
