import {
  nadezhdaProfileEvidence,
  nadezhdaSourceEvidence,
} from '../nadezhdaCatalogueEvidence'

export const OBSERVED_PRODUCTION_DATA = 'OBSERVED_PRODUCTION_DATA' as const

export type SkyGlazingObservedPosition = 'Left' | 'Right' | 'Upper' | 'Bottom'

export interface SkyGlazingCutObservation {
  sxB: number | null
  dxB: number | null
  sxC: number | null
  dxC: number | null
  length: number | null
}

export interface SkyGlazingFacePointObservation {
  x: number | null
  y: number | null
  z: number | null
}

export interface SkyGlazingOperationObservation {
  name: string
  positionX: number | null
  positionY: number | null
  positionZ: number | null
  facePoint: SkyGlazingFacePointObservation | null
  angleA: number | null
  angleC: number | null
  toolT: number | null
  parameters: Readonly<Record<string, string>>
}

export interface SkyGlazingXmlPieceObservation {
  sourceKind: 'SKYGLAZING_XML'
  observationStatus: typeof OBSERVED_PRODUCTION_DATA
  project: string
  generator: string
  unit: string
  profileCode: string
  dxfName: string
  xmlMaxY: number | null
  xmlMaxZ: number | null
  xmlMaxYMaxZMeaningConfirmedAsCatalogueDimensions: false
  barcode: string
  cut: SkyGlazingCutObservation
  operations: readonly SkyGlazingOperationObservation[]
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface SkyGlazingLteObservation {
  sourceKind: 'SKYGLAZING_LTE'
  observationStatus: typeof OBSERVED_PRODUCTION_DATA
  profileCode: string
  description: string
  observedPosition: SkyGlazingObservedPosition | null
  barcode: string
  rawLine: string
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface SkyGlazingCorrelatedObservation {
  barcode: string
  xml: SkyGlazingXmlPieceObservation
  lte: SkyGlazingLteObservation | null
  correlationState: 'XML_LTE_BARCODE_MATCH' | 'XML_WITHOUT_LTE_MATCH'
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface SkyGlazingObservationSummary {
  xmlObservationCount: number
  lteObservationCount: number
  correlatedBarcodeCount: number
  xmlWithoutLteCount: number
  lteOnlyCount: number
  machiningOperationCount: number
  profileXmlCounts: Readonly<Record<string, number>>
  profileLteCounts: Readonly<Record<string, number>>
  operationNameCounts: Readonly<Record<string, number>>
}

export const vadimRp01ExpectedEvidence = Object.freeze({
  project: nadezhdaSourceEvidence.project,
  generator: nadezhdaSourceEvidence.generatedBy,
  xmlSha256: nadezhdaSourceEvidence.xmlSha256,
  lteSha256: nadezhdaSourceEvidence.lteSha256,
  xmlObservationCount: 46,
  lteObservationCount: 84,
  correlatedBarcodeCount: 46,
  lteOnlyCount: 38,
  machiningOperationCount: 220,
  profileXmlCounts: Object.freeze({
    '78.01': 29,
    '78.27': 6,
    '78.33': 8,
    '78.51': 3,
  }),
  profileLteCounts: Object.freeze({
    '78.01': 49,
    '78.27': 24,
    '78.33': 8,
    '78.51': 3,
  }),
  operationNameCounts: Object.freeze({
    STD_NOTCH: 112,
    STD_HOLE: 76,
    STD_SLOT: 17,
    STD_DRILL: 6,
    STD_KEYHOLE: 6,
    STD_POCKET: 3,
  }),
  sourceType: OBSERVED_PRODUCTION_DATA,
  productionRuleCreated: false,
  machineReady: false,
  productionApproved: false,
} as const)

function decodeXmlText(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .trim()
}

function xmlTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeXmlText(match[1]) : null
}

function xmlBlocks(block: string, tag: string): string[] {
  return [...block.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi'))]
    .map((match) => match[1])
}

function numberOrNull(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function operationParameters(workBlock: string): Readonly<Record<string, string>> {
  const parameters: Record<string, string> = {}
  for (const parameterBlock of xmlBlocks(workBlock, 'Parameters')) {
    const name = xmlTag(parameterBlock, 'Name')
    if (!name) continue
    parameters[name] = xmlTag(parameterBlock, 'Value') ?? ''
  }
  return Object.freeze(parameters)
}

function parseWork(workBlock: string): SkyGlazingOperationObservation {
  const faceBlock = xmlTag(workBlock, 'Face')
  const pointsBlock = faceBlock ? xmlTag(faceBlock, 'Points') : null
  const toolBlock = xmlTag(workBlock, 'Tool')

  return Object.freeze({
    name: xmlTag(workBlock, 'Name') ?? 'UNKNOWN_OPERATION',
    positionX: numberOrNull(xmlTag(workBlock, 'PositionX')),
    positionY: numberOrNull(xmlTag(workBlock, 'PositionY')),
    positionZ: numberOrNull(xmlTag(workBlock, 'PositionZ')),
    facePoint: pointsBlock
      ? Object.freeze({
        x: numberOrNull(xmlTag(pointsBlock, 'X')),
        y: numberOrNull(xmlTag(pointsBlock, 'Y')),
        z: numberOrNull(xmlTag(pointsBlock, 'Z')),
      })
      : null,
    angleA: faceBlock ? numberOrNull(xmlTag(faceBlock, 'AngleA')) : null,
    angleC: faceBlock ? numberOrNull(xmlTag(faceBlock, 'AngleC')) : null,
    toolT: toolBlock ? numberOrNull(xmlTag(toolBlock, 'T')) : null,
    parameters: operationParameters(workBlock),
  })
}

export function extractSkyGlazingXmlObservations(xml: string): SkyGlazingXmlPieceObservation[] {
  const project = xmlTag(xml, 'Name') ?? ''
  const generator = xmlTag(xml, 'Generator') ?? ''
  const unit = xmlTag(xml, 'Unit') ?? ''

  const observations: SkyGlazingXmlPieceObservation[] = []
  for (const barBlock of xmlBlocks(xml, 'Bar')) {
    const dxfName = xmlTag(barBlock, 'DXF_Name') ?? ''
    const profileCode = dxfName.replace(/\.dxf$/i, '')
    const xmlMaxY = numberOrNull(xmlTag(barBlock, 'MaxY'))
    const xmlMaxZ = numberOrNull(xmlTag(barBlock, 'MaxZ'))

    for (const pieceBlock of xmlBlocks(barBlock, 'Piece')) {
      const machiningBlock = xmlTag(pieceBlock, 'Machining')
      if (!machiningBlock) continue

      const barcode = xmlTag(machiningBlock, 'BarCode') ?? ''
      const cutBlock = xmlTag(machiningBlock, 'Cut')

      observations.push(Object.freeze({
        sourceKind: 'SKYGLAZING_XML',
        observationStatus: OBSERVED_PRODUCTION_DATA,
        project,
        generator,
        unit,
        profileCode,
        dxfName,
        xmlMaxY,
        xmlMaxZ,
        xmlMaxYMaxZMeaningConfirmedAsCatalogueDimensions: false,
        barcode,
        cut: Object.freeze({
          sxB: cutBlock ? numberOrNull(xmlTag(cutBlock, 'sxB')) : null,
          dxB: cutBlock ? numberOrNull(xmlTag(cutBlock, 'dxB')) : null,
          sxC: cutBlock ? numberOrNull(xmlTag(cutBlock, 'sxC')) : null,
          dxC: cutBlock ? numberOrNull(xmlTag(cutBlock, 'dxC')) : null,
          length: cutBlock ? numberOrNull(xmlTag(cutBlock, 'Length')) : null,
        }),
        operations: Object.freeze(xmlBlocks(machiningBlock, 'Work').map(parseWork)),
        productionRuleCreated: false,
        machineReady: false,
        productionApproved: false,
      }))
    }
  }

  return observations
}

function positionFromDescription(description: string): SkyGlazingObservedPosition | null {
  const match = description.match(/\b(Left|Right|Upper|Bottom)\b/i)
  if (!match) return null
  const normalized = match[1].toLowerCase()
  if (normalized === 'left') return 'Left'
  if (normalized === 'right') return 'Right'
  if (normalized === 'upper') return 'Upper'
  if (normalized === 'bottom') return 'Bottom'
  return null
}

export function extractSkyGlazingLteObservations(lte: string): SkyGlazingLteObservation[] {
  const observations: SkyGlazingLteObservation[] = []

  for (const rawLine of lte.split(/\r?\n/)) {
    if (!rawLine.trim()) continue

    const profileMatch = rawLine.match(/^\s*(\S+)/)
    const barcodeMatch = rawLine.match(/(\d{12})\s*$/)
    if (!profileMatch || !barcodeMatch) continue

    const profileCode = profileMatch[1]
    const afterProfile = rawLine.slice(profileMatch.index! + profileMatch[0].length)
    const firstLength = afterProfile.search(/\d{5}\.\d{3}/)
    const description = (firstLength >= 0 ? afterProfile.slice(0, firstLength) : afterProfile).trim()

    observations.push(Object.freeze({
      sourceKind: 'SKYGLAZING_LTE',
      observationStatus: OBSERVED_PRODUCTION_DATA,
      profileCode,
      description,
      observedPosition: positionFromDescription(description),
      barcode: barcodeMatch[1],
      rawLine,
      productionRuleCreated: false,
      machineReady: false,
      productionApproved: false,
    }))
  }

  return observations
}

export function correlateSkyGlazingObservations(
  xmlObservations: readonly SkyGlazingXmlPieceObservation[],
  lteObservations: readonly SkyGlazingLteObservation[],
): SkyGlazingCorrelatedObservation[] {
  const lteByBarcode = new Map(lteObservations.map((record) => [record.barcode, record]))

  return xmlObservations.map((xml) => {
    const lte = lteByBarcode.get(xml.barcode) ?? null
    return Object.freeze({
      barcode: xml.barcode,
      xml,
      lte,
      correlationState: lte ? 'XML_LTE_BARCODE_MATCH' : 'XML_WITHOUT_LTE_MATCH',
      productionRuleCreated: false,
      machineReady: false,
      productionApproved: false,
    })
  })
}

function countBy<T>(values: readonly T[], key: (value: T) => string): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const value of values) {
    const name = key(value)
    counts[name] = (counts[name] ?? 0) + 1
  }
  return Object.freeze(counts)
}

export function summarizeSkyGlazingObservations(
  xmlObservations: readonly SkyGlazingXmlPieceObservation[],
  lteObservations: readonly SkyGlazingLteObservation[],
): SkyGlazingObservationSummary {
  const correlations = correlateSkyGlazingObservations(xmlObservations, lteObservations)
  const xmlBarcodes = new Set(xmlObservations.map((record) => record.barcode))
  const operations = xmlObservations.flatMap((record) => record.operations)

  return Object.freeze({
    xmlObservationCount: xmlObservations.length,
    lteObservationCount: lteObservations.length,
    correlatedBarcodeCount: correlations.filter((record) => record.lte !== null).length,
    xmlWithoutLteCount: correlations.filter((record) => record.lte === null).length,
    lteOnlyCount: lteObservations.filter((record) => !xmlBarcodes.has(record.barcode)).length,
    machiningOperationCount: operations.length,
    profileXmlCounts: countBy(xmlObservations, (record) => record.profileCode),
    profileLteCounts: countBy(lteObservations, (record) => record.profileCode),
    operationNameCounts: countBy(operations, (record) => record.name),
  })
}

export function vadimRp01EvidenceMatchesExistingCatalogueAggregate(): boolean {
  const profileByCode = new Map(nadezhdaProfileEvidence.map((record) => [record.code, record]))

  return Object.entries(vadimRp01ExpectedEvidence.profileXmlCounts).every(([code, xmlCount]) => {
    const evidence = profileByCode.get(code)
    return evidence?.xmlPieceCount === xmlCount
      && evidence?.lteRecordCount === vadimRp01ExpectedEvidence.profileLteCounts[code as keyof typeof vadimRp01ExpectedEvidence.profileLteCounts]
  })
}
