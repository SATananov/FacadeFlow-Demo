import type { SkyGlazingSourceEvidence, SkyGlazingXmlInspection, SkyGlazingXmlPiece } from './skyGlazingTypes'

interface XmlNode { name: string; children: XmlNode[]; text: string; start: number; end: number }

const forbiddenDeclaration = /<!\s*(?:DOCTYPE|ENTITY)\b/i
const tagToken = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]*>/g

function decodeXmlText(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
    if (entity.toLowerCase() === 'amp') return '&'
    if (entity.toLowerCase() === 'lt') return '<'
    if (entity.toLowerCase() === 'gt') return '>'
    if (entity.toLowerCase() === 'quot') return '"'
    if (entity.toLowerCase() === 'apos') return "'"
    const codePoint = entity.toLowerCase().startsWith('#x') ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10)
    if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) throw new Error('XML съдържа невалидна символна референция.')
    return String.fromCodePoint(codePoint)
  }).replace(/&[^;\s]+;/g, () => { throw new Error('XML съдържа непозната entity референция.') })
}

function parseXml(text: string): XmlNode {
  if (forbiddenDeclaration.test(text)) throw new Error('XML с DOCTYPE или ENTITY декларация не се допуска.')
  const stack: XmlNode[] = [], roots: XmlNode[] = []
  let cursor = 0
  for (const match of text.matchAll(tagToken)) {
    const token = match[0], index = match.index
    if (index === undefined) continue
    const between = text.slice(cursor, index)
    if (stack.length) stack[stack.length - 1]!.text += decodeXmlText(between)
    else if (between.trim()) throw new Error('XML съдържа текст извън кореновия елемент.')
    cursor = index + token.length
    if (token.startsWith('<?') || token.startsWith('<!--')) continue
    if (token.startsWith('<![CDATA[')) { if (!stack.length) throw new Error('Невалидна CDATA секция.'); stack[stack.length - 1]!.text += token.slice(9, -3); continue }
    if (token.startsWith('</')) {
      const closing = token.slice(2, -1).trim(), node = stack.pop()
      if (!node || node.name !== closing) throw new Error(`Невалидно затваряне на XML елемент: ${closing || '(празен)'}.`)
      node.end = cursor
      continue
    }
    const selfClosing = /\/\s*>$/.test(token), content = token.slice(1, selfClosing ? token.lastIndexOf('/') : -1).trim(), name = content.split(/\s+/, 1)[0] ?? ''
    if (!/^[A-Za-z_\u0080-\uFFFF][\w.\-:\u0080-\uFFFF]*$/u.test(name)) throw new Error('XML съдържа невалидно име на елемент.')
    const node: XmlNode = { name, children: [], text: '', start: index, end: cursor }
    if (stack.length) stack[stack.length - 1]!.children.push(node); else roots.push(node)
    if (!selfClosing) stack.push(node)
  }
  const trailing = text.slice(cursor)
  if (trailing.trim()) throw new Error('XML съдържа невалиден или незавършен фрагмент.')
  if (stack.length || roots.length !== 1) throw new Error('XML структурата е незавършена или има повече от един коренов елемент.')
  return roots[0]!
}

const children = (node: XmlNode, name: string) => node.children.filter((item) => item.name === name)
const child = (node: XmlNode, name: string) => children(node, name)[0]
const value = (node: XmlNode | undefined) => node ? node.text.trim() : ''
const descendants = (node: XmlNode, name: string): XmlNode[] => node.children.flatMap((item) => [...(item.name === name ? [item] : []), ...descendants(item, name)])
export const normalizeSkyGlazingBarcode = (barcode: string) => barcode.trim()

export function inspectSkyGlazingXml(text: string, source: SkyGlazingSourceEvidence): SkyGlazingXmlInspection {
  const root = parseXml(text)
  if (root.name !== 'Order') throw new Error('Очаква се XML коренов елемент Order.')
  const generator = value(child(root, 'Generator')), warnings = [...source.warnings]
  if (generator !== 'SkyGlazing') warnings.push('Generator не е SkyGlazing; структурата е показана само като непотвърден read-only източник.')
  const bars = children(root, 'Bar'), pieces: SkyGlazingXmlPiece[] = []
  bars.forEach((bar) => {
    const dxfProfileName = value(child(bar, 'DXF_Name')), maxY = value(child(bar, 'MaxY')), maxZ = value(child(bar, 'MaxZ'))
    children(bar, 'Piece').forEach((piece) => {
      const machining = child(piece, 'Machining'), cut = machining ? child(machining, 'Cut') : undefined
      const works = machining ? children(machining, 'Work') : [], barcode = machining ? value(child(machining, 'BarCode')) : ''
      if (!barcode) warnings.push(`Piece ${pieces.length + 1} няма наблюдаван BarCode.`)
      pieces.push({
        sourceFileName: source.fileName, sourceSha256: source.sha256, originalRecordIndex: pieces.length,
        rawEvidence: text.slice(piece.start, piece.end), dxfProfileName, maxY, maxZ, barcode,
        normalizedBarcode: normalizeSkyGlazingBarcode(barcode), length: value(cut ? child(cut, 'Length') : undefined),
        sxB: value(cut ? child(cut, 'sxB') : undefined), dxB: value(cut ? child(cut, 'dxB') : undefined),
        sxC: value(cut ? child(cut, 'sxC') : undefined), dxC: value(cut ? child(cut, 'dxC') : undefined),
        operationCount: works.length, operationNames: [...new Set(works.map((work) => value(child(work, 'Name'))).filter(Boolean))],
        sourceStatus: 'OBSERVED', simulationOnly: true, machineReady: false,
      })
    })
  })
  const barcodeCounts = new Map<string, number>()
  pieces.forEach(({ normalizedBarcode }) => { if (normalizedBarcode) barcodeCounts.set(normalizedBarcode, (barcodeCounts.get(normalizedBarcode) ?? 0) + 1) })
  if ([...barcodeCounts.values()].some((count) => count > 1)) warnings.push('Открити са повтарящи се XML баркодове; съпоставянето им остава UNRESOLVED.')
  const inspectedSource = { ...source, warnings: [...new Set(warnings)] }
  return {
    source: inspectedSource, generator, version: value(child(root, 'Version')), unit: value(child(root, 'Unit')),
    projectName: value(child(root, 'Name')), barCount: bars.length, pieceCount: pieces.length,
    workCount: descendants(root, 'Work').length, uniqueBarcodeCount: barcodeCounts.size,
    uniqueDxfProfileCount: new Set(pieces.map(({ dxfProfileName }) => dxfProfileName).filter(Boolean)).size,
    pieces, rawStructuralText: text,
  }
}

export function hasForbiddenXmlDeclaration(text: string): boolean { return forbiddenDeclaration.test(text) }
