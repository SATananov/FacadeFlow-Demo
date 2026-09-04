export const PROFILE_DATA_01_1_VERSION = 'PROFILE_DATA_01.1_V2' as const

export type ProfileComponentRole = 'FRAME' | 'MULLION' | 'SASH'
export type ProfileMeasurementState = 'HUMAN_CONFIRMED' | 'PENDING_HUMAN_CONFIRMATION'
export type ProfileGeometryRepresentation = 'FILLED_VISIBLE_BAND'

export interface NadezhdaVisibleProfileGeometry {
  systemId: 'PRELUDE_60'
  systemLabel: 'PRELUDE 60 mm'
  profileCode: string
  role: ProfileComponentRole
  systemDepthMm: number
  profileHeightMm: number | null
  visibleWidthMm: number | null
  measurementState: ProfileMeasurementState
  representation: ProfileGeometryRepresentation
  structuralProfileIsDrawingStroke: false
  visibleBandRequired: true
  placeholderVisibleWidthAllowed: false
  note: string
}

export const PRELUDE_60_VISIBLE_PROFILE_GEOMETRY = Object.freeze({
  '482.30': Object.freeze({
    systemId: 'PRELUDE_60',
    systemLabel: 'PRELUDE 60 mm',
    profileCode: '482.30',
    role: 'FRAME',
    systemDepthMm: 60,
    profileHeightMm: 64,
    visibleWidthMm: 42,
    measurementState: 'HUMAN_CONFIRMED',
    representation: 'FILLED_VISIBLE_BAND',
    structuralProfileIsDrawingStroke: false,
    visibleBandRequired: true,
    placeholderVisibleWidthAllowed: false,
    note: 'Каса: човешки потвърдени височина 64 mm и видима ширина 42 mm.',
  }),
  '482.21': Object.freeze({
    systemId: 'PRELUDE_60',
    systemLabel: 'PRELUDE 60 mm',
    profileCode: '482.21',
    role: 'MULLION',
    systemDepthMm: 60,
    profileHeightMm: 84,
    visibleWidthMm: 40,
    measurementState: 'HUMAN_CONFIRMED',
    representation: 'FILLED_VISIBLE_BAND',
    structuralProfileIsDrawingStroke: false,
    visibleBandRequired: true,
    placeholderVisibleWidthAllowed: false,
    note: 'Делител: човешки потвърдени височина 84 mm и видима ширина 40 mm.',
  }),
  '482.05': Object.freeze({
    systemId: 'PRELUDE_60',
    systemLabel: 'PRELUDE 60 mm',
    profileCode: '482.05',
    role: 'SASH',
    systemDepthMm: 60,
    profileHeightMm: 78,
    visibleWidthMm: 56,
    measurementState: 'HUMAN_CONFIRMED',
    representation: 'FILLED_VISIBLE_BAND',
    structuralProfileIsDrawingStroke: false,
    visibleBandRequired: true,
    placeholderVisibleWidthAllowed: false,
    note: 'Крило: човешки потвърдени базови размери 78 mm височина и 56 mm видима ширина. Ефективната ширина в конкретна сглобка остава отделна величина.',
  }),
} satisfies Record<string, NadezhdaVisibleProfileGeometry>)

export interface ProfileGeometrySafety {
  sourceEvidenceRequired: true
  automaticProfileSelectionAllowed: false
  automaticSashMeasurementInferenceAllowed: false
  structuralProfilesMayRenderAsSingleStrokes: false
  assemblyOverlapMustBeExplicit: true
  machineReady: false
  productionApproved: false
}

export const PROFILE_GEOMETRY_SAFETY: ProfileGeometrySafety = Object.freeze({
  sourceEvidenceRequired: true,
  automaticProfileSelectionAllowed: false,
  automaticSashMeasurementInferenceAllowed: false,
  structuralProfilesMayRenderAsSingleStrokes: false,
  assemblyOverlapMustBeExplicit: true,
  machineReady: false,
  productionApproved: false,
})

export type VisibleBandResolution =
  | {
      state: 'READY'
      profileCode: string
      visibleWidthMm: number
      reason: null
    }
  | {
      state: 'REQUIRES_HUMAN_CONFIRMATION'
      profileCode: string
      visibleWidthMm: null
      reason: string
    }
  | {
      state: 'UNKNOWN_PROFILE'
      profileCode: string
      visibleWidthMm: null
      reason: string
    }

export function resolveStructuralVisibleBand(profileCode: string): VisibleBandResolution {
  const profile = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY[profileCode as keyof typeof PRELUDE_60_VISIBLE_PROFILE_GEOMETRY]
  if (!profile) {
    return {
      state: 'UNKNOWN_PROFILE',
      profileCode,
      visibleWidthMm: null,
      reason: 'Профилът не е наличен в потвърдения регистър.',
    }
  }
  if (profile.measurementState !== 'HUMAN_CONFIRMED' || profile.visibleWidthMm === null) {
    return {
      state: 'REQUIRES_HUMAN_CONFIRMATION',
      profileCode,
      visibleWidthMm: null,
      reason: 'Видимата ширина не е човешки потвърдена.',
    }
  }
  return {
    state: 'READY',
    profileCode,
    visibleWidthMm: profile.visibleWidthMm,
    reason: null,
  }
}

export interface DrawingRectMm {
  x: number
  y: number
  width: number
  height: number
}

export interface RectangularFrameVisibleBands {
  outer: DrawingRectMm
  left: DrawingRectMm
  right: DrawingRectMm
  top: DrawingRectMm
  bottom: DrawingRectMm
  inner: DrawingRectMm
  profileCode: string
  visibleWidthMm: number
}

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} трябва да бъде положително крайно число.`)
  }
}

export function buildRectangularFrameVisibleBands(
  outerWidthMm: number,
  outerHeightMm: number,
  frameProfileCode = '482.30',
): RectangularFrameVisibleBands {
  assertFinitePositive(outerWidthMm, 'outerWidthMm')
  assertFinitePositive(outerHeightMm, 'outerHeightMm')

  const resolution = resolveStructuralVisibleBand(frameProfileCode)
  if (resolution.state !== 'READY') {
    throw new Error(`Профил ${frameProfileCode} няма потвърдена видима ширина.`)
  }

  const band = resolution.visibleWidthMm
  if (outerWidthMm <= band * 2 || outerHeightMm <= band * 2) {
    throw new Error('Външният размер е твърде малък за потвърдената видима ширина на касата.')
  }

  const outer = { x: 0, y: 0, width: outerWidthMm, height: outerHeightMm }
  return {
    outer,
    left: { x: 0, y: 0, width: band, height: outerHeightMm },
    right: { x: outerWidthMm - band, y: 0, width: band, height: outerHeightMm },
    top: { x: band, y: 0, width: outerWidthMm - band * 2, height: band },
    bottom: {
      x: band,
      y: outerHeightMm - band,
      width: outerWidthMm - band * 2,
      height: band,
    },
    inner: {
      x: band,
      y: band,
      width: outerWidthMm - band * 2,
      height: outerHeightMm - band * 2,
    },
    profileCode: frameProfileCode,
    visibleWidthMm: band,
  }
}

export interface MullionVisibleBand {
  orientation: 'VERTICAL' | 'HORIZONTAL'
  profileCode: string
  visibleWidthMm: number
  rect: DrawingRectMm
}

export function buildMullionVisibleBand(
  orientation: 'VERTICAL' | 'HORIZONTAL',
  centerPositionMm: number,
  spanMm: number,
  mullionProfileCode = '482.21',
): MullionVisibleBand {
  assertFinitePositive(spanMm, 'spanMm')
  if (!Number.isFinite(centerPositionMm) || centerPositionMm < 0) {
    throw new Error('centerPositionMm трябва да бъде неотрицателно крайно число.')
  }

  const resolution = resolveStructuralVisibleBand(mullionProfileCode)
  if (resolution.state !== 'READY') {
    throw new Error(`Профил ${mullionProfileCode} няма потвърдена видима ширина.`)
  }
  const band = resolution.visibleWidthMm
  const start = centerPositionMm - band / 2
  if (start < 0) {
    throw new Error('Делителят излиза извън началната граница на чертежа.')
  }

  return {
    orientation,
    profileCode: mullionProfileCode,
    visibleWidthMm: band,
    rect:
      orientation === 'VERTICAL'
        ? { x: start, y: 0, width: band, height: spanMm }
        : { x: 0, y: start, width: spanMm, height: band },
  }
}

export interface RectangularSashVisibleBands extends RectangularFrameVisibleBands {
  confirmationSource: 'EXPLICIT_HUMAN_CONFIRMED_VISIBLE_WIDTH'
}

/**
 * Builds the structural visible-width geometry for a sash only when an explicit
 * assembly-width value is supplied by the caller. The base 482.05 profile geometry
 * is now human-confirmed as 78/56 mm, but this function deliberately does not use
 * 56 mm as an automatic assembled/effective width and never invents a fallback.
 */
export function buildRectangularSashVisibleBands(
  outerWidthMm: number,
  outerHeightMm: number,
  humanConfirmedVisibleWidthMm: number,
  sashProfileCode = '482.05',
): RectangularSashVisibleBands {
  assertFinitePositive(outerWidthMm, 'outerWidthMm')
  assertFinitePositive(outerHeightMm, 'outerHeightMm')
  assertFinitePositive(humanConfirmedVisibleWidthMm, 'humanConfirmedVisibleWidthMm')

  const profile = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY[
    sashProfileCode as keyof typeof PRELUDE_60_VISIBLE_PROFILE_GEOMETRY
  ]
  if (!profile || profile.role !== 'SASH') {
    throw new Error(`Профил ${sashProfileCode} не е регистриран като крило.`)
  }

  if (outerWidthMm <= humanConfirmedVisibleWidthMm * 2 || outerHeightMm <= humanConfirmedVisibleWidthMm * 2) {
    throw new Error('Полето е твърде малко за човешки потвърдената видима ширина на крилото.')
  }

  const band = humanConfirmedVisibleWidthMm
  const outer = { x: 0, y: 0, width: outerWidthMm, height: outerHeightMm }
  return {
    outer,
    left: { x: 0, y: 0, width: band, height: outerHeightMm },
    right: { x: outerWidthMm - band, y: 0, width: band, height: outerHeightMm },
    top: { x: band, y: 0, width: outerWidthMm - band * 2, height: band },
    bottom: {
      x: band,
      y: outerHeightMm - band,
      width: outerWidthMm - band * 2,
      height: band,
    },
    inner: {
      x: band,
      y: band,
      width: outerWidthMm - band * 2,
      height: outerHeightMm - band * 2,
    },
    profileCode: sashProfileCode,
    visibleWidthMm: band,
    confirmationSource: 'EXPLICIT_HUMAN_CONFIRMED_VISIBLE_WIDTH',
  }
}

export interface SashVisibleGeometryPolicy {
  profileCode: '482.05'
  role: 'SASH'
  visibleBandRequired: true
  baseProfileHeightMm: 78
  baseProfileVisibleWidthMm: 56
  baseGeometryState: 'HUMAN_CONFIRMED'
  assemblyEffectiveVisibleWidthState: 'UNRESOLVED'
  rendererWithoutAssemblyWidth: 'BLOCK_STRUCTURAL_SASH_BAND'
  legacySingleStrokeAllowed: false
  placeholderVisibleWidthAllowed: false
}

export const PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY: SashVisibleGeometryPolicy = Object.freeze({
  profileCode: '482.05',
  role: 'SASH',
  visibleBandRequired: true,
  baseProfileHeightMm: 78,
  baseProfileVisibleWidthMm: 56,
  baseGeometryState: 'HUMAN_CONFIRMED',
  assemblyEffectiveVisibleWidthState: 'UNRESOLVED',
  rendererWithoutAssemblyWidth: 'BLOCK_STRUCTURAL_SASH_BAND',
  legacySingleStrokeAllowed: false,
  placeholderVisibleWidthAllowed: false,
})

export function visibleWidthMmToCanvasPx(visibleWidthMm: number, pxPerMm: number): number {
  assertFinitePositive(visibleWidthMm, 'visibleWidthMm')
  assertFinitePositive(pxPerMm, 'pxPerMm')
  return visibleWidthMm * pxPerMm
}

export interface FrameSashAssemblyPolicy {
  assemblyType: 'FRAME_SASH'
  frameProfileCode: '482.30'
  sashProfileCode: '482.05'
  sashBaseProfileHeightMm: 78
  sashBaseVisibleWidthMm: 56
  sashBaseGeometryState: 'HUMAN_CONFIRMED'
  sashEffectiveAssemblyWidthState: 'UNRESOLVED'
  sashMustRenderAsVisibleBandAfterConfirmation: true
  legacySashSingleStrokeAllowed: false
  placeholderSashVisibleWidthAllowed: false
  automaticOverlapInferenceAllowed: false
  automaticAssemblyVisibleWidthCalculationAllowed: false
  structuralRepresentation: 'PROFILE_GEOMETRY_NOT_STROKES'
}

export const PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY: FrameSashAssemblyPolicy = Object.freeze({
  assemblyType: 'FRAME_SASH',
  frameProfileCode: '482.30',
  sashProfileCode: '482.05',
  sashBaseProfileHeightMm: 78,
  sashBaseVisibleWidthMm: 56,
  sashBaseGeometryState: 'HUMAN_CONFIRMED',
  sashEffectiveAssemblyWidthState: 'UNRESOLVED',
  sashMustRenderAsVisibleBandAfterConfirmation: true,
  legacySashSingleStrokeAllowed: false,
  placeholderSashVisibleWidthAllowed: false,
  automaticOverlapInferenceAllowed: false,
  automaticAssemblyVisibleWidthCalculationAllowed: false,
  structuralRepresentation: 'PROFILE_GEOMETRY_NOT_STROKES',
})

export function canRenderStructuralProfile(profileCode: string): boolean {
  return resolveStructuralVisibleBand(profileCode).state === 'READY'
}
