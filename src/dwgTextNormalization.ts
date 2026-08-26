export interface DwgNormalizedText {
  rawText: string
  displayText: string
  warnings: string[]
  hadFormatting: boolean
  hadUnicodeEscapes: boolean
  runs: readonly DwgTextRun[]
}

export interface DwgTextRun { text: string; heightScale: number; widthScale: number; fontMetadata: string | null }

export const DWG_TEXT_LOD_MINIMUM_PIXELS = 2.5

const formattingControls = new Set(['A', 'C', 'F', 'H', 'Q', 'T', 'W', 'f', 'p'])

export function normalizeDwgDisplayText(rawText: string): DwgNormalizedText {
  let displayText = ''
  let hadFormatting = false
  let hadUnicodeEscapes = false
  const warnings: string[] = []
  const runs: DwgTextRun[] = []
  let runText = '', heightScale = 1, widthScale = 1, fontMetadata: string | null = null
  const states: Array<{ heightScale: number; widthScale: number; fontMetadata: string | null }> = []
  const flush = () => { if (runText) { runs.push(Object.freeze({ text: runText, heightScale, widthScale, fontMetadata })); runText = '' } }
  const append = (text: string) => { displayText += text; runText += text }
  const warn = (message: string) => { if (!warnings.includes(message)) warnings.push(message) }

  for (let index = 0; index < rawText.length;) {
    const character = rawText[index]
    if (character === '{') { flush(); states.push({ heightScale, widthScale, fontMetadata }); hadFormatting = true; index += 1; continue }
    if (character === '}') { flush(); const state = states.pop(); if (state) ({ heightScale, widthScale, fontMetadata } = state); hadFormatting = true; index += 1; continue }
    if (character !== '\\') { append(character); index += 1; continue }

    const control = rawText[index + 1]
    if (control === undefined) { displayText += '\\'; warn('Незавършена escape последователност.'); break }
    if (control === '\\') { append('\\'); index += 2; continue }
    if (control === '{' || control === '}') { append(control); index += 2; continue }
    if (control === 'P') { append('\n'); hadFormatting = true; index += 2; continue }
    if (control === '~') { append('\u00a0'); hadFormatting = true; index += 2; continue }
    if (control === 'U' && rawText[index + 2] === '+') {
      const hexadecimal = rawText.slice(index + 3, index + 7)
      if (/^[0-9A-Fa-f]{4}$/.test(hexadecimal)) {
        append(String.fromCodePoint(Number.parseInt(hexadecimal, 16)))
        hadUnicodeEscapes = true
        index += 7
        continue
      }
      append(rawText.slice(index, Math.min(index + 7, rawText.length)))
      warn('Невалидна Unicode escape последователност.')
      index += Math.min(7, rawText.length - index)
      continue
    }
    if (formattingControls.has(control)) {
      const end = rawText.indexOf(';', index + 2)
      if (end >= 0) {
        hadFormatting = true
        const payload = rawText.slice(index + 2, end)
        flush()
        if (control === 'H') {
          const relative = payload.match(/^([+]?(?:\d+(?:\.\d*)?|\.\d+))x$/i)
          if (relative && Number(relative[1]) > 0) heightScale = Number(relative[1])
          else warn('Неподдържан или невалиден absolute MTEXT height control; запазен е в raw evidence.')
        } else if (control === 'W') {
          const value = Number(payload)
          if (Number.isFinite(value) && value > 0) widthScale = value
          else warn('Невалиден MTEXT width control; запазен е в raw evidence.')
        } else if (control === 'F' || control === 'f') fontMetadata = payload || null
        index = end + 1
        continue
      }
      displayText += rawText.slice(index)
      warn(`Незавършена MTEXT команда \\${control}.`)
      break
    }
    if (control === 'S') {
      const end = rawText.indexOf(';', index + 2)
      if (end >= 0) {
        const stacked = rawText.slice(index + 2, end).replace(/[#^\\]/g, '/')
        append(stacked)
        hadFormatting = true
        index = end + 1
        continue
      }
      displayText += rawText.slice(index)
      warn('Незавършена MTEXT stacked fraction команда.')
      break
    }

    append(`\\${control}`)
    warn(`Неподдържана escape последователност \\${control}.`)
    index += 2
  }

  flush()
  return { rawText, displayText, warnings, hadFormatting, hadUnicodeEscapes, runs: Object.freeze(runs) }
}

export function isDwgTextVisibleAtScale(textHeight: number, drawingScale: number, explicitlyShown = true, threshold = DWG_TEXT_LOD_MINIMUM_PIXELS) {
  if (!explicitlyShown || !Number.isFinite(textHeight) || !Number.isFinite(drawingScale)) return false
  return Math.abs(textHeight * drawingScale) >= threshold
}
