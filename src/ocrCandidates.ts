import { ocrLimits } from './ocrLimits'
import type { OcrCandidate, OcrCandidateType, OcrRectangle } from './ocrTypes'

const valid = (value: number) => Number.isFinite(value) && value >= ocrLimits.minimumDimension && value <= ocrLimits.maximumDimension
export function parseDimensionCandidates(text: string, ocrConfidence: number, sourcePage: number, selection: OcrRectangle): OcrCandidate[] {
  const createdAt = new Date().toISOString(), candidates: OcrCandidate[] = [], seen = new Set<string>()
  const add = (raw: string, value: string, type: OcrCandidateType, confidence: number, unit = 'mm') => {
    const key = `${type}:${value}`; if (seen.has(key)) return; seen.add(key)
    candidates.push({ id: crypto.randomUUID(), rawSourceText: raw, normalizedValue: value, type, unit, ocrConfidence, parserConfidence: confidence, sourcePage, selection, status: 'SUGGESTED', createdAt })
  }
  for (const match of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(mm)?\b/gi)) {
    const width = Number(match[1]?.replace(',', '.')), height = Number(match[2]?.replace(',', '.')); if (valid(width) && valid(height)) add(match[0], `${width} × ${height}`, 'WIDTH_HEIGHT_PAIR', 95)
  }
  for (const match of text.matchAll(/(?:\bW|Ш)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?\s*[/;, ]+\s*(?:H|В)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/gi)) {
    const width = Number(match[1]?.replace(',', '.')), height = Number(match[2]?.replace(',', '.')); if (valid(width) && valid(height)) add(match[0], `${width} × ${height}`, 'WIDTH_HEIGHT_PAIR', 98)
  }
  for (const match of text.matchAll(/(?:\bW|Ш)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?/gi)) { const value = Number(match[1]?.replace(',', '.')); if (valid(value)) add(match[0], String(value), 'WIDTH', 88) }
  for (const match of text.matchAll(/(?:\bH|В)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?/gi)) { const value = Number(match[1]?.replace(',', '.')); if (valid(value)) add(match[0], String(value), 'HEIGHT', 88) }
  for (const match of text.matchAll(/([Ø⌀R])\s*(\d+(?:[.,]\d+)?)/gi)) { const value = Number(match[2]?.replace(',', '.')); if (valid(value)) add(match[0], String(value), match[1]?.toUpperCase() === 'R' ? 'RADIUS' : 'DIAMETER', 96) }
  for (const match of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*mm\b/gi)) { const value = Number(match[1]?.replace(',', '.')); if (valid(value)) add(match[0], String(value), 'GENERIC_DIMENSION', 72) }
  for (const match of text.matchAll(/\b\d{2,5}(?:[.,]\d+)?\b/g)) { const value = Number(match[0].replace(',', '.')); if (valid(value)) add(match[0], String(value), 'GENERIC_DIMENSION', 40) }
  if (!candidates.length && text.trim()) add(text.trim().slice(0, 300), text.trim().slice(0, 300), 'TEXT_ONLY', 45, '')
  return candidates
}
