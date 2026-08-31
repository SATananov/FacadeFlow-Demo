import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('Nadezhda XML/LTE sample pair is missing.')

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex').toUpperCase()
const readSample = (name, extension) => {
  try { return readFileSync(join(sampleDir, name)) } catch (error) {
    if (process.platform === 'win32') throw error
    const rawName = readdirSync(sampleDir, { encoding: 'buffer' }).find((entry) => entry.subarray(-extension.length).toString('ascii').toLowerCase() === extension)
    if (!rawName) throw error
    return readFileSync(Buffer.concat([Buffer.from(`${sampleDir}/`), rawName]))
  }
}
const xmlBuffer = readSample(xmlName, '.xml')
const lteBuffer = readSample(lteName, '.lte')
const xml = xmlBuffer.toString('utf8')
const lte = lteBuffer.toString('latin1')
const barBlocks = [...xml.matchAll(/<Bar>([\s\S]*?)<\/Bar>/g)].map((match) => match[1])
const pick = (block, tag) => block.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`))?.[1] ?? ''
const records = barBlocks.map((block) => {
  const code = pick(block, 'DXF_Name').replace(/\.dxf$/i, '')
  const works = [...block.matchAll(/<Work>[\s\S]*?<Name>([^<]+)<\/Name>[\s\S]*?<\/Work>/g)].map((match) => match[1])
  return { code, maxY: Number(pick(block, 'MaxY')), maxZ: Number(pick(block, 'MaxZ')), barcode: pick(block, 'BarCode'), length: Number(pick(block, 'Length')), works }
})
const lteLines = lte.split(/\r?\n/).filter(Boolean)
if (!lteLines.every((line) => line.length === 149)) throw new Error('LTE fixed record width changed from 149 chars.')

const byCode = new Map()
for (const record of records) {
  const item = byCode.get(record.code) ?? { code: record.code, xmlPieceCount: 0, lteRecordCount: 0, machiningCount: 0, maxY: record.maxY, maxZ: record.maxZ, lengths: [] }
  item.xmlPieceCount += 1
  item.machiningCount += record.works.length
  item.lengths.push(record.length)
  byCode.set(record.code, item)
}
for (const line of lteLines) {
  const code = line.match(/^(\d+\.\d+)/)?.[1]
  const item = code ? byCode.get(code) : undefined
  if (item) item.lteRecordCount += 1
}
const matched = records.filter((record) => record.barcode && lte.includes(record.barcode)).length
const profileEvidence = [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true })).map((item) => ({
  code: item.code,
  maxY: item.maxY,
  maxZ: item.maxZ,
  xmlPieceCount: item.xmlPieceCount,
  lteRecordCount: item.lteRecordCount,
  machiningCount: item.machiningCount,
  minLength: Math.min(...item.lengths),
  maxLength: Math.max(...item.lengths),
}))

const result = {
  xmlSha256: sha256(xmlBuffer),
  lteSha256: sha256(lteBuffer),
  xmlPieceCount: records.length,
  lteRecordCount: lteLines.length,
  matchedXmlBarcodesInLte: matched,
  machiningCount: records.reduce((sum, record) => sum + record.works.length, 0),
  profileEvidence,
}
const expected = {
  xmlSha256: '1FAFBDE7A13A28936EDC9FE9382DB5F50DA6B22D8168CF5959D95AE053E8DF08',
  lteSha256: '6D753E558A1EA330573F2555F34603CD406EC9C6842A4CAB4EE210D1450A272A',
  xmlPieceCount: 46,
  lteRecordCount: 84,
  matchedXmlBarcodesInLte: 46,
  machiningCount: 220,
}
for (const [key, value] of Object.entries(expected)) if (result[key] !== value) throw new Error(`Nadezhda evidence mismatch: ${key} expected ${value}, got ${result[key]}`)
console.log(JSON.stringify({ status: 'PASS', ...result }, null, 2))
