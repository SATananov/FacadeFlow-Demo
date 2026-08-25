import type { CombinedCandidate, CombinedCandidateType } from './combinedAnalysisTypes'
import { ocrLimits } from './ocrLimits'
import type { OcrTextItem } from './ocrTypes'
import { proposeDimensionOrientation } from './combinedOrientationReasoning'

const plausible = (value: number) => Number.isFinite(value) && value >= ocrLimits.minimumDimension && value <= ocrLimits.maximumDimension
export function parseCombinedCandidates(text: string, items: OcrTextItem[], confidence: number, page: number, evidenceWidth: number, evidenceHeight: number): CombinedCandidate[] {
  const result: CombinedCandidate[] = [], seen = new Set<string>(), createdAt = new Date().toISOString()
  const boxFor = (raw: string) => items.find((item) => item.text.includes(raw) || raw.includes(item.text.trim()))?.bbox
  const add = (raw: string, value: string, type: CombinedCandidateType, parserConfidence: number, unit = '', warning?: string) => { const key = `${type}:${value}`; if (seen.has(key)) return; seen.add(key); result.push({ id: crypto.randomUUID(), rawSourceText: raw, normalizedValue: value, type, unit, ocrConfidence: confidence, parserConfidence, sourceBox: boxFor(raw), sourcePage: page, status: 'SUGGESTED', warning, createdAt }) }
  for (const match of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(mm)?\b/gi)) { const w = Number(match[1]?.replace(',', '.')), h = Number(match[2]?.replace(',', '.')); if (plausible(w) && plausible(h)) { add(match[0], String(w), 'OVERALL_WIDTH', 95, 'mm'); add(match[0], String(h), 'OVERALL_HEIGHT', 95, 'mm') } }
  for (const match of text.matchAll(/(?:\bW|Ш)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?\s*[/;, ]+\s*(?:H|В)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/gi)) { const w = Number(match[1]?.replace(',', '.')), h = Number(match[2]?.replace(',', '.')); if (plausible(w) && plausible(h)) { add(match[0], String(w), 'OVERALL_WIDTH', 98, 'mm'); add(match[0], String(h), 'OVERALL_HEIGHT', 98, 'mm') } }
  for (const match of text.matchAll(/([Ø⌀R])\s*(\d+(?:[.,]\d+)?)/gi)) { const value = Number(match[2]?.replace(',', '.')); if (plausible(value)) add(match[0], String(value), match[1]?.toUpperCase() === 'R' ? 'RADIUS' : 'DIAMETER', 96, 'mm') }
  for (const match of text.matchAll(/\b(\d+)\s*(?:бр\.?|pcs?)\b/gi)) add(match[0], match[1] ?? '', 'QUANTITY', 94, 'бр.')
  for (const match of text.matchAll(/\b(?:Pos\.?|Поз\.?)\s*[:#-]?\s*([A-ZА-Я0-9_-]+)/gi)) add(match[0], match[1] ?? match[0], 'PRODUCT_REFERENCE', 92)
  for (const match of text.matchAll(/\b\d{2,5}(?:[.,]\d+)?\b/g)) { const value = Number(match[0].replace(',', '.')); if (plausible(value)) { const box = boxFor(match[0]), orientation = proposeDimensionOrientation(box, evidenceWidth, evidenceHeight); add(match[0], String(value), orientation === 'AMBIGUOUS' ? 'GENERIC_DIMENSION' : orientation, orientation === 'AMBIGUOUS' ? 42 : 66, 'mm', orientation === 'AMBIGUOUS' ? 'Нееднозначно число — не е установена видима ориентация или етикет.' : 'Ориентацията е предложена само от видимото положение спрямо края на извадката.') } }
  if (!result.length && text.trim()) add(text.trim().slice(0, 300), text.trim().slice(0, 300), 'TEXT_ONLY', 35, '', 'Не е открита надеждна размерна нотация.')
  return result
}
