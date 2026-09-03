import { resolveStructuralVisibleBand, type DrawingRectMm } from './visibleProfileGeometry'

export const PROFILE_DATA_01_2_VERSION = 'PROFILE_DATA_01.2' as const

export type StructuralFieldType = string
export type ProfileBandSide = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'
export type OverlapParameterState = 'HUMAN_REVIEWED_WORKING_VALUE'

export interface SystemSashOverlapParameter {
  systemId: string
  systemLabel: string
  sashOverlapMm: number
  state: OverlapParameterState
  editable: true
  exactProductionConfirmationRequired: true
  sourceKind: 'HUMAN_TECHNICAL_CONFIRMATION'
  note: string
  machineReady: false
  productionApproved: false
}

/**
 * Current PRELUDE 60 simulation input.
 *
 * Bat Trifon's confirmed architectural rule is that sash overlap belongs to the
 * profile system and can differ between systems (for example 6, 7 or 8 mm).
 * The currently reviewed PRELUDE working value is 7 mm. It remains editable and
 * explicitly requires exact production confirmation before any production use.
 */
export const PRELUDE_60_SASH_OVERLAP_PARAMETER: SystemSashOverlapParameter = Object.freeze({
  systemId: 'PRELUDE_60',
  systemLabel: 'PRELUDE 60',
  sashOverlapMm: 7,
  state: 'HUMAN_REVIEWED_WORKING_VALUE',
  editable: true,
  exactProductionConfirmationRequired: true,
  sourceKind: 'HUMAN_TECHNICAL_CONFIRMATION',
  note: 'Системен параметър за застъпване на крилото. Работна човешки прегледана стойност 7 mm; не е универсална константа.',
  machineReady: false,
  productionApproved: false,
})

export const SASH_OVERLAP_SAFETY = Object.freeze({
  globalFallbackOverlapAllowed: false,
  inferOverlapFromProfileDimensionsAllowed: false,
  reduceFrameWithoutAdjacentSashAllowed: false,
  reduceMullionWithoutAdjacentSashAllowed: false,
  reduceSashVisibleWidthFromThisRuleAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})

export interface EffectiveVisibleWidthResult {
  baseVisibleWidthMm: number
  sashOverlapMm: number
  sideAHasSash: boolean
  sideBHasSash: boolean
  overlapApplicationCount: 0 | 1 | 2
  effectiveVisibleWidthMm: number
}

export interface StructuralLeafRegion {
  id: string
  fieldType: StructuralFieldType
  rect: DrawingRectMm
}

export interface OverlapAwareProfileSegment {
  id: string
  role: 'FRAME' | 'MULLION'
  side?: ProfileBandSide
  orientation?: 'VERTICAL' | 'HORIZONTAL'
  rect: DrawingRectMm
  baseVisibleWidthMm: number
  effectiveVisibleWidthMm: number
  sashOverlapMm: number
  sideAHasSash: boolean
  sideBHasSash: boolean
  overlapApplicationCount: 0 | 1 | 2
  adjacentSashIds: readonly string[]
}

const EPSILON_MM = 0.001

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} трябва да бъде положително крайно число.`)
  }
}

function assertRect(rect: DrawingRectMm, name: string): void {
  if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
    throw new Error(`${name} трябва да бъде валиден правоъгълник с положителни размери.`)
  }
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON_MM
}

function overlapsInterval(startA: number, endA: number, startB: number, endB: number): boolean {
  return Math.min(endA, endB) - Math.max(startA, startB) > EPSILON_MM
}

function intervalContains(value: number, start: number, end: number): boolean {
  return value >= start - EPSILON_MM && value <= end + EPSILON_MM
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.map((value) => Math.round(value * 1000) / 1000))].sort((a, b) => a - b)
}

function sashRegionsAtCoordinate(
  regions: readonly StructuralLeafRegion[],
  axis: 'X' | 'Y',
  coordinate: number,
): StructuralLeafRegion[] {
  return regions.filter((region) => {
    if (region.fieldType !== 'OPENING_SASH') return false
    if (axis === 'X') return intervalContains(coordinate, region.rect.y, region.rect.y + region.rect.height)
    return intervalContains(coordinate, region.rect.x, region.rect.x + region.rect.width)
  })
}

export function calculateEffectiveVisibleWidth(
  baseVisibleWidthMm: number,
  sashOverlapMm: number,
  sideAHasSash: boolean,
  sideBHasSash: boolean,
): EffectiveVisibleWidthResult {
  assertFinitePositive(baseVisibleWidthMm, 'baseVisibleWidthMm')
  assertFinitePositive(sashOverlapMm, 'sashOverlapMm')

  const overlapApplicationCount = (Number(sideAHasSash) + Number(sideBHasSash)) as 0 | 1 | 2
  const effectiveVisibleWidthMm = baseVisibleWidthMm - sashOverlapMm * overlapApplicationCount
  if (effectiveVisibleWidthMm <= 0) {
    throw new Error('Застъпването не може да премахне цялата или повече от видимата ширина на профила.')
  }

  return {
    baseVisibleWidthMm,
    sashOverlapMm,
    sideAHasSash,
    sideBHasSash,
    overlapApplicationCount,
    effectiveVisibleWidthMm,
  }
}

function boundaryTouchingRegions(
  side: ProfileBandSide,
  outerWidthMm: number,
  outerHeightMm: number,
  leaves: readonly StructuralLeafRegion[],
): StructuralLeafRegion[] {
  return leaves.filter((leaf) => {
    assertRect(leaf.rect, `leaf:${leaf.id}`)
    if (side === 'LEFT') return nearlyEqual(leaf.rect.x, 0)
    if (side === 'RIGHT') return nearlyEqual(leaf.rect.x + leaf.rect.width, outerWidthMm)
    if (side === 'TOP') return nearlyEqual(leaf.rect.y, 0)
    return nearlyEqual(leaf.rect.y + leaf.rect.height, outerHeightMm)
  })
}

function frameSegmentRect(
  side: ProfileBandSide,
  start: number,
  end: number,
  effectiveVisibleWidthMm: number,
  outerWidthMm: number,
  outerHeightMm: number,
): DrawingRectMm {
  const span = end - start
  if (side === 'LEFT') return { x: 0, y: start, width: effectiveVisibleWidthMm, height: span }
  if (side === 'RIGHT') return { x: outerWidthMm - effectiveVisibleWidthMm, y: start, width: effectiveVisibleWidthMm, height: span }
  if (side === 'TOP') return { x: start, y: 0, width: span, height: effectiveVisibleWidthMm }
  return { x: start, y: outerHeightMm - effectiveVisibleWidthMm, width: span, height: effectiveVisibleWidthMm }
}

function buildFrameSideSegments(
  side: ProfileBandSide,
  outerWidthMm: number,
  outerHeightMm: number,
  baseVisibleWidthMm: number,
  sashOverlapMm: number,
  leaves: readonly StructuralLeafRegion[],
): OverlapAwareProfileSegment[] {
  const boundaryLeaves = boundaryTouchingRegions(side, outerWidthMm, outerHeightMm, leaves)
  const vertical = side === 'LEFT' || side === 'RIGHT'
  const spanEnd = vertical ? outerHeightMm : outerWidthMm
  const breakpoints = uniqueSorted([
    0,
    spanEnd,
    ...boundaryLeaves.flatMap((leaf) => vertical
      ? [Math.max(0, leaf.rect.y), Math.min(spanEnd, leaf.rect.y + leaf.rect.height)]
      : [Math.max(0, leaf.rect.x), Math.min(spanEnd, leaf.rect.x + leaf.rect.width)]),
  ]).filter((value) => value >= -EPSILON_MM && value <= spanEnd + EPSILON_MM)

  const segments: OverlapAwareProfileSegment[] = []
  for (let index = 0; index < breakpoints.length - 1; index += 1) {
    const start = breakpoints[index]
    const end = breakpoints[index + 1]
    if (end - start <= EPSILON_MM) continue
    const midpoint = (start + end) / 2
    const adjacentSashes = boundaryLeaves.filter((leaf) => leaf.fieldType === 'OPENING_SASH' && (vertical
      ? intervalContains(midpoint, leaf.rect.y, leaf.rect.y + leaf.rect.height)
      : intervalContains(midpoint, leaf.rect.x, leaf.rect.x + leaf.rect.width)))
    const hasSash = adjacentSashes.length > 0
    const effective = calculateEffectiveVisibleWidth(baseVisibleWidthMm, sashOverlapMm, hasSash, false)
    segments.push({
      id: `frame-${side.toLowerCase()}-${index}`,
      role: 'FRAME',
      side,
      rect: frameSegmentRect(side, start, end, effective.effectiveVisibleWidthMm, outerWidthMm, outerHeightMm),
      ...effective,
      adjacentSashIds: adjacentSashes.map(({ id }) => id),
    })
  }
  return segments
}

/**
 * Creates overlap-aware visible frame bands from actual leaf adjacency.
 * Fixed fields never reduce the frame. A sash reduces only the frame segment it
 * actually touches, and only by the explicitly supplied system overlap.
 */
export function buildOverlapAwareFrameSegments(
  outerWidthMm: number,
  outerHeightMm: number,
  leaves: readonly StructuralLeafRegion[],
  sashOverlapMm: number,
  frameProfileCode = '482.30',
): OverlapAwareProfileSegment[] {
  assertFinitePositive(outerWidthMm, 'outerWidthMm')
  assertFinitePositive(outerHeightMm, 'outerHeightMm')
  assertFinitePositive(sashOverlapMm, 'sashOverlapMm')
  const resolution = resolveStructuralVisibleBand(frameProfileCode)
  if (resolution.state !== 'READY') throw new Error(`Профил ${frameProfileCode} няма потвърдена базова видима ширина.`)

  const base = resolution.visibleWidthMm
  return (['LEFT', 'RIGHT', 'TOP', 'BOTTOM'] as const).flatMap((side) =>
    buildFrameSideSegments(side, outerWidthMm, outerHeightMm, base, sashOverlapMm, leaves),
  )
}

interface MullionAdjacency {
  sideA: StructuralLeafRegion[]
  sideB: StructuralLeafRegion[]
  spanStart: number
  spanEnd: number
  lineCoordinate: number
}

function mullionAdjacency(
  orientation: 'VERTICAL' | 'HORIZONTAL',
  centerPositionMm: number,
  parentRect: DrawingRectMm,
  leaves: readonly StructuralLeafRegion[],
): MullionAdjacency {
  assertRect(parentRect, 'parentRect')
  if (!Number.isFinite(centerPositionMm) || centerPositionMm < 0) {
    throw new Error('centerPositionMm трябва да бъде неотрицателно крайно число.')
  }

  if (orientation === 'VERTICAL') {
    const lineCoordinate = parentRect.x + centerPositionMm
    if (lineCoordinate > parentRect.x + parentRect.width + EPSILON_MM) throw new Error('Вертикалният делител е извън родителската геометрия.')
    const sideA = leaves.filter((leaf) => nearlyEqual(leaf.rect.x + leaf.rect.width, lineCoordinate)
      && overlapsInterval(leaf.rect.y, leaf.rect.y + leaf.rect.height, parentRect.y, parentRect.y + parentRect.height))
    const sideB = leaves.filter((leaf) => nearlyEqual(leaf.rect.x, lineCoordinate)
      && overlapsInterval(leaf.rect.y, leaf.rect.y + leaf.rect.height, parentRect.y, parentRect.y + parentRect.height))
    return { sideA, sideB, spanStart: parentRect.y, spanEnd: parentRect.y + parentRect.height, lineCoordinate }
  }

  const lineCoordinate = parentRect.y + centerPositionMm
  if (lineCoordinate > parentRect.y + parentRect.height + EPSILON_MM) throw new Error('Хоризонталният делител е извън родителската геометрия.')
  const sideA = leaves.filter((leaf) => nearlyEqual(leaf.rect.y + leaf.rect.height, lineCoordinate)
    && overlapsInterval(leaf.rect.x, leaf.rect.x + leaf.rect.width, parentRect.x, parentRect.x + parentRect.width))
  const sideB = leaves.filter((leaf) => nearlyEqual(leaf.rect.y, lineCoordinate)
    && overlapsInterval(leaf.rect.x, leaf.rect.x + leaf.rect.width, parentRect.x, parentRect.x + parentRect.width))
  return { sideA, sideB, spanStart: parentRect.x, spanEnd: parentRect.x + parentRect.width, lineCoordinate }
}

/**
 * Builds per-segment visible mullion geometry. Side A is LEFT/TOP and side B is
 * RIGHT/BOTTOM. A sash on each side subtracts the explicit system overlap once.
 */
export function buildOverlapAwareMullionSegments(
  orientation: 'VERTICAL' | 'HORIZONTAL',
  centerPositionMm: number,
  parentRect: DrawingRectMm,
  leaves: readonly StructuralLeafRegion[],
  sashOverlapMm: number,
  mullionProfileCode = '482.21',
): OverlapAwareProfileSegment[] {
  assertFinitePositive(sashOverlapMm, 'sashOverlapMm')
  const resolution = resolveStructuralVisibleBand(mullionProfileCode)
  if (resolution.state !== 'READY') throw new Error(`Профил ${mullionProfileCode} няма потвърдена базова видима ширина.`)
  const base = resolution.visibleWidthMm
  const adjacency = mullionAdjacency(orientation, centerPositionMm, parentRect, leaves)

  const all = [...adjacency.sideA, ...adjacency.sideB]
  const breakpoints = uniqueSorted([
    adjacency.spanStart,
    adjacency.spanEnd,
    ...all.flatMap((leaf) => orientation === 'VERTICAL'
      ? [Math.max(adjacency.spanStart, leaf.rect.y), Math.min(adjacency.spanEnd, leaf.rect.y + leaf.rect.height)]
      : [Math.max(adjacency.spanStart, leaf.rect.x), Math.min(adjacency.spanEnd, leaf.rect.x + leaf.rect.width)]),
  ]).filter((value) => value >= adjacency.spanStart - EPSILON_MM && value <= adjacency.spanEnd + EPSILON_MM)

  const result: OverlapAwareProfileSegment[] = []
  for (let index = 0; index < breakpoints.length - 1; index += 1) {
    const start = breakpoints[index]
    const end = breakpoints[index + 1]
    if (end - start <= EPSILON_MM) continue
    const midpoint = (start + end) / 2
    const sideASashes = sashRegionsAtCoordinate(adjacency.sideA, orientation === 'VERTICAL' ? 'X' : 'Y', midpoint)
    const sideBSashes = sashRegionsAtCoordinate(adjacency.sideB, orientation === 'VERTICAL' ? 'X' : 'Y', midpoint)
    const sideAHasSash = sideASashes.length > 0
    const sideBHasSash = sideBSashes.length > 0
    const effective = calculateEffectiveVisibleWidth(base, sashOverlapMm, sideAHasSash, sideBHasSash)
    const sideAReduction = sideAHasSash ? sashOverlapMm : 0

    const rect: DrawingRectMm = orientation === 'VERTICAL'
      ? {
          x: adjacency.lineCoordinate - base / 2 + sideAReduction,
          y: start,
          width: effective.effectiveVisibleWidthMm,
          height: end - start,
        }
      : {
          x: start,
          y: adjacency.lineCoordinate - base / 2 + sideAReduction,
          width: end - start,
          height: effective.effectiveVisibleWidthMm,
        }

    result.push({
      id: `mullion-${orientation.toLowerCase()}-${index}`,
      role: 'MULLION',
      orientation,
      rect,
      ...effective,
      adjacentSashIds: [...sideASashes, ...sideBSashes].map(({ id }) => id),
    })
  }
  return result
}
