import type { DwgTextRun } from './dwgTextNormalization'

export type DwgTextAlignment = 'left' | 'center' | 'right'
export interface DwgTextLayoutInput { textKind: 'TEXT' | 'MTEXT'; displayText: string; runs?: readonly DwgTextRun[]; referenceWidth: number | null; textHeight: number; widthFactor: number; attachmentPoint: number; horizontalAlignment: number; verticalAlignment: number; lineSpacingFactor: number; lineSpacingStyle: number }
export interface DwgDisplayRun extends DwgTextRun { x: number; measuredWidth: number }
export interface DwgDisplayLine { text: string; x: number; y: number; measuredWidth: number; height: number; runs: readonly DwgDisplayRun[] }
export interface DwgTextLocalBounds { minX: number; minY: number; maxX: number; maxY: number }
export interface DwgTextLayoutResult { lines: DwgDisplayLine[]; textAlign: DwgTextAlignment; anchorOffsetY: number; blockWidth: number; blockHeight: number; lineAdvance: number; usedSourceWidth: boolean; bounds: DwgTextLocalBounds }
export const DWG_FALLBACK_FONT_FAMILY = 'Arial, sans-serif'
export const dwgCanvasFont = (fontPixels: number) => `${fontPixels}px ${DWG_FALLBACK_FONT_FAMILY}`
export function canvasPixelsToDwgLocal(pixelWidth: number, drawingScale: number, widthFactor: number) { if (![pixelWidth, drawingScale, widthFactor].every(Number.isFinite) || drawingScale <= 0 || widthFactor <= 0) return 0; return pixelWidth * widthFactor / drawingScale }

const defaultRun = (text: string): DwgTextRun => ({ text, heightScale: 1, widthScale: 1, fontMetadata: null })
const attachmentColumn = (point: number) => point >= 1 && point <= 9 ? ((point - 1) % 3) + 1 : 0
const attachmentRow = (point: number) => point >= 1 && point <= 9 ? Math.floor((point - 1) / 3) + 1 : 0
const appendRun = (target: DwgTextRun[], run: DwgTextRun) => { if (!run.text) return; const last = target.at(-1); if (last && last.heightScale === run.heightScale && last.widthScale === run.widthScale && last.fontMetadata === run.fontMetadata) last.text += run.text; else target.push({ ...run }) }

function paragraphRuns(input: DwgTextLayoutInput) {
  const source = input.runs?.length ? input.runs : [defaultRun(input.displayText)]
  const paragraphs: DwgTextRun[][] = [[]]
  for (const run of source) run.text.split('\n').forEach((part, index) => { if (index) paragraphs.push([]); appendRun(paragraphs.at(-1)!, { ...run, text: part }) })
  return input.textKind === 'TEXT' ? [[defaultRun(input.displayText.replace(/\n/g, ' '))]] : paragraphs
}

export function layoutDwgText(input: DwgTextLayoutInput, measure: (text: string, run: DwgTextRun) => number): DwgTextLayoutResult {
  const sourceWidth = input.textKind === 'MTEXT' && typeof input.referenceWidth === 'number' && Number.isFinite(input.referenceWidth) && input.referenceWidth > 0 ? input.referenceWidth : null
  const lines: Array<{ runs: DwgTextRun[]; width: number; heightScale: number }> = []
  for (const paragraph of paragraphRuns(input)) {
    let current: DwgTextRun[] = [], width = 0, heightScale = 1
    const push = () => { lines.push({ runs: current, width, heightScale }); current = []; width = 0; heightScale = 1 }
    const characters = paragraph.flatMap((run) => [...run.text].map((text) => ({ ...run, text })))
    const words: DwgTextRun[][] = []
    let word: DwgTextRun[] = []
    for (const character of characters) {
      if (/\s/.test(character.text)) { if (word.length) { words.push(word); word = [] } }
      else appendRun(word, character)
    }
    if (word.length) words.push(word)
    for (const nextWord of words) {
      const separator = current.length ? { ...nextWord[0]!, text: ' ' } : null
      const wordWidth = nextWord.reduce((sum, run) => sum + measure(run.text, run), 0)
      const separatorWidth = separator ? measure(separator.text, separator) : 0
      if (sourceWidth && current.length && width + separatorWidth + wordWidth > sourceWidth) push()
      if (sourceWidth && wordWidth > sourceWidth) {
        for (const run of nextWord) for (const character of run.text) {
          const part = { ...run, text: character }, partWidth = measure(character, part)
          if (current.length && width + partWidth > sourceWidth) push()
          appendRun(current, part); width += partWidth; heightScale = Math.max(heightScale, part.heightScale)
        }
        continue
      }
      const activeSeparator = current.length ? { ...nextWord[0]!, text: ' ' } : null
      if (activeSeparator) { appendRun(current, activeSeparator); width += measure(' ', activeSeparator) }
      for (const run of nextWord) { appendRun(current, run); width += measure(run.text, run); heightScale = Math.max(heightScale, run.heightScale) }
    }
    push()
  }
  const column = attachmentColumn(input.attachmentPoint)
  const textAlign: DwgTextAlignment = input.textKind === 'MTEXT' && column ? column === 2 ? 'center' : column === 3 ? 'right' : 'left' : input.horizontalAlignment === 1 || input.horizontalAlignment === 4 ? 'center' : input.horizontalAlignment === 2 ? 'right' : 'left'
  const spacingFactor = Number.isFinite(input.lineSpacingFactor) && input.lineSpacingFactor >= 0.25 && input.lineSpacingFactor <= 4 ? input.lineSpacingFactor : 1
  const lineAdvance = input.textKind === 'MTEXT' ? input.textHeight * (5 / 3) * spacingFactor : input.textHeight
  const blockHeight = Math.max(input.textHeight, ...lines.map((line, index) => index * lineAdvance + input.textHeight * line.heightScale))
  const blockWidth = sourceWidth ?? Math.max(0, ...lines.map((line) => line.width))
  const row = attachmentRow(input.attachmentPoint)
  const anchorOffsetY = input.textKind === 'MTEXT' && row ? row === 2 ? -blockHeight / 2 : row === 3 ? -blockHeight : 0 : input.verticalAlignment === 1 ? -blockHeight : input.verticalAlignment === 2 ? -blockHeight / 2 : input.verticalAlignment === 3 ? 0 : -input.textHeight
  const displayLines = lines.map((line, index) => {
    const lineX = textAlign === 'center' ? -line.width / 2 : textAlign === 'right' ? -line.width : 0
    let cursor = lineX
    const displayRuns = line.runs.map((run) => { const measuredWidth = measure(run.text, run), result = { ...run, x: cursor, measuredWidth }; cursor += measuredWidth; return result })
    return { text: line.runs.map((run) => run.text).join(''), x: lineX, y: index * lineAdvance, measuredWidth: line.width, height: input.textHeight * line.heightScale, runs: Object.freeze(displayRuns) }
  })
  const minX = Math.min(0, ...displayLines.map((line) => line.x)), maxX = Math.max(0, ...displayLines.map((line) => line.x + line.measuredWidth))
  return { lines: displayLines, textAlign, anchorOffsetY, blockWidth, blockHeight, lineAdvance, usedSourceWidth: sourceWidth !== null, bounds: { minX, minY: anchorOffsetY, maxX, maxY: anchorOffsetY + blockHeight } }
}
