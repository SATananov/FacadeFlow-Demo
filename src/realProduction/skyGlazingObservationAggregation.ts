import {
  correlateSkyGlazingObservations,
  type SkyGlazingCutObservation,
  type SkyGlazingLteObservation,
  type SkyGlazingObservedPosition,
  type SkyGlazingOperationObservation,
  type SkyGlazingXmlPieceObservation,
} from './skyGlazingObservationExtraction'

export const OBSERVATION_AGGREGATION_ONLY = 'OBSERVATION_AGGREGATION_ONLY' as const

export type ObservationMultiplicity =
  | 'SINGLE_OBSERVATION'
  | 'REPEATED_OBSERVATION'

export type AggregatedPosition = SkyGlazingObservedPosition | 'UNLABELED'

export interface ObservationFrequency {
  key: string
  count: number
  multiplicity: ObservationMultiplicity
  productionRuleCreated: false
}

export interface CutTupleObservationFrequency extends ObservationFrequency {
  sxB: number | null
  dxB: number | null
  sxC: number | null
  dxC: number | null
  lengthIncludedInPattern: false
}

export interface ExactOperationObservationFrequency extends ObservationFrequency {
  operationName: string
  fingerprint: string
}

export interface SkyGlazingProfileObservationAggregation {
  profileCode: string
  xmlObservationCount: number
  lteObservationCount: number
  correlatedObservationCount: number
  lteOnlyObservationCount: number
  correlatedPositionCounts: Readonly<Record<AggregatedPosition, number>>
  ltePositionCounts: Readonly<Record<AggregatedPosition, number>>
  cutTuplePatterns: readonly CutTupleObservationFrequency[]
  operationNamePatterns: readonly ObservationFrequency[]
  exactOperationPatterns: readonly ExactOperationObservationFrequency[]
  exactOperationPatternCount: number
  repeatedExactOperationPatternCount: number
  aggregationStatus: typeof OBSERVATION_AGGREGATION_ONLY
  repeatedObservationIsProductionRule: false
  universalRuleInferenceAllowed: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface SkyGlazingObservationAggregation {
  profileCount: number
  xmlObservationCount: number
  lteObservationCount: number
  correlatedObservationCount: number
  lteOnlyObservationCount: number
  profiles: readonly SkyGlazingProfileObservationAggregation[]
  aggregationStatus: typeof OBSERVATION_AGGREGATION_ONLY
  repeatedObservationIsProductionRule: false
  universalRuleInferenceAllowed: false
  profileRoleInferenceAllowed: false
  systemInferenceAllowed: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

function multiplicity(count: number): ObservationMultiplicity {
  return count >= 2 ? 'REPEATED_OBSERVATION' : 'SINGLE_OBSERVATION'
}

function emptyPositionCounts(): Record<AggregatedPosition, number> {
  return {
    Left: 0,
    Right: 0,
    Upper: 0,
    Bottom: 0,
    UNLABELED: 0,
  }
}

function positionCounts(
  observations: readonly (SkyGlazingObservedPosition | null)[],
): Readonly<Record<AggregatedPosition, number>> {
  const counts = emptyPositionCounts()
  for (const position of observations) counts[position ?? 'UNLABELED'] += 1
  return Object.freeze(counts)
}

function numberToken(value: number | null): string {
  return value === null ? 'null' : String(value)
}

function cutTupleKey(cut: SkyGlazingCutObservation): string {
  return [
    `sxB=${numberToken(cut.sxB)}`,
    `dxB=${numberToken(cut.dxB)}`,
    `sxC=${numberToken(cut.sxC)}`,
    `dxC=${numberToken(cut.dxC)}`,
  ].join('|')
}

function aggregateCutTuples(
  observations: readonly SkyGlazingXmlPieceObservation[],
): readonly CutTupleObservationFrequency[] {
  const groups = new Map<string, { cut: SkyGlazingCutObservation; count: number }>()

  for (const observation of observations) {
    const key = cutTupleKey(observation.cut)
    const existing = groups.get(key)
    if (existing) existing.count += 1
    else groups.set(key, { cut: observation.cut, count: 1 })
  }

  return Object.freeze(
    [...groups.entries()]
      .map(([key, group]) => Object.freeze({
        key,
        count: group.count,
        multiplicity: multiplicity(group.count),
        productionRuleCreated: false as const,
        sxB: group.cut.sxB,
        dxB: group.cut.dxB,
        sxC: group.cut.sxC,
        dxC: group.cut.dxC,
        lengthIncludedInPattern: false as const,
      }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
  )
}

function aggregateStringFrequency(values: readonly string[]): readonly ObservationFrequency[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)

  return Object.freeze(
    [...counts.entries()]
      .map(([key, count]) => Object.freeze({
        key,
        count,
        multiplicity: multiplicity(count),
        productionRuleCreated: false as const,
      }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
  )
}

function stableParameters(parameters: Readonly<Record<string, string>>): string {
  return Object.keys(parameters)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${parameters[key]}`)
    .join('&')
}

export function exactOperationFingerprint(operation: SkyGlazingOperationObservation): string {
  const point = operation.facePoint
  return [
    `name=${operation.name}`,
    `positionX=${numberToken(operation.positionX)}`,
    `positionY=${numberToken(operation.positionY)}`,
    `positionZ=${numberToken(operation.positionZ)}`,
    `faceX=${numberToken(point?.x ?? null)}`,
    `faceY=${numberToken(point?.y ?? null)}`,
    `faceZ=${numberToken(point?.z ?? null)}`,
    `angleA=${numberToken(operation.angleA)}`,
    `angleC=${numberToken(operation.angleC)}`,
    `toolT=${numberToken(operation.toolT)}`,
    `parameters=${stableParameters(operation.parameters)}`,
  ].join('|')
}

function aggregateExactOperations(
  observations: readonly SkyGlazingXmlPieceObservation[],
): readonly ExactOperationObservationFrequency[] {
  const groups = new Map<string, { operationName: string; count: number }>()

  for (const observation of observations) {
    for (const operation of observation.operations) {
      const fingerprint = exactOperationFingerprint(operation)
      const existing = groups.get(fingerprint)
      if (existing) existing.count += 1
      else groups.set(fingerprint, { operationName: operation.name, count: 1 })
    }
  }

  return Object.freeze(
    [...groups.entries()]
      .map(([fingerprint, group]) => Object.freeze({
        key: fingerprint,
        fingerprint,
        operationName: group.operationName,
        count: group.count,
        multiplicity: multiplicity(group.count),
        productionRuleCreated: false as const,
      }))
      .sort((a, b) => b.count - a.count || a.fingerprint.localeCompare(b.fingerprint)),
  )
}

function profileAggregation(
  profileCode: string,
  xmlObservations: readonly SkyGlazingXmlPieceObservation[],
  lteObservations: readonly SkyGlazingLteObservation[],
): SkyGlazingProfileObservationAggregation {
  const profileXml = xmlObservations.filter((record) => record.profileCode === profileCode)
  const profileLte = lteObservations.filter((record) => record.profileCode === profileCode)
  const correlations = correlateSkyGlazingObservations(profileXml, profileLte)
  const xmlBarcodes = new Set(profileXml.map((record) => record.barcode))
  const exactOperationPatterns = aggregateExactOperations(profileXml)
  const operationNames = profileXml.flatMap((record) => record.operations.map((operation) => operation.name))

  return Object.freeze({
    profileCode,
    xmlObservationCount: profileXml.length,
    lteObservationCount: profileLte.length,
    correlatedObservationCount: correlations.filter((record) => record.lte !== null).length,
    lteOnlyObservationCount: profileLte.filter((record) => !xmlBarcodes.has(record.barcode)).length,
    correlatedPositionCounts: positionCounts(correlations.map((record) => record.lte?.observedPosition ?? null)),
    ltePositionCounts: positionCounts(profileLte.map((record) => record.observedPosition)),
    cutTuplePatterns: aggregateCutTuples(profileXml),
    operationNamePatterns: aggregateStringFrequency(operationNames),
    exactOperationPatterns,
    exactOperationPatternCount: exactOperationPatterns.length,
    repeatedExactOperationPatternCount: exactOperationPatterns.filter(
      (pattern) => pattern.multiplicity === 'REPEATED_OBSERVATION',
    ).length,
    aggregationStatus: OBSERVATION_AGGREGATION_ONLY,
    repeatedObservationIsProductionRule: false,
    universalRuleInferenceAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function aggregateSkyGlazingObservationPatterns(
  xmlObservations: readonly SkyGlazingXmlPieceObservation[],
  lteObservations: readonly SkyGlazingLteObservation[],
): SkyGlazingObservationAggregation {
  const profileCodes = [...new Set([
    ...xmlObservations.map((record) => record.profileCode),
    ...lteObservations.map((record) => record.profileCode),
  ])].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))

  const profiles = profileCodes.map((code) => profileAggregation(code, xmlObservations, lteObservations))
  const correlations = correlateSkyGlazingObservations(xmlObservations, lteObservations)
  const xmlBarcodes = new Set(xmlObservations.map((record) => record.barcode))

  return Object.freeze({
    profileCount: profiles.length,
    xmlObservationCount: xmlObservations.length,
    lteObservationCount: lteObservations.length,
    correlatedObservationCount: correlations.filter((record) => record.lte !== null).length,
    lteOnlyObservationCount: lteObservations.filter((record) => !xmlBarcodes.has(record.barcode)).length,
    profiles: Object.freeze(profiles),
    aggregationStatus: OBSERVATION_AGGREGATION_ONLY,
    repeatedObservationIsProductionRule: false,
    universalRuleInferenceAllowed: false,
    profileRoleInferenceAllowed: false,
    systemInferenceAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}
