import type { VisualComposition } from '../visualComposerTypes'
import {
  buildOverlapAwareFrameSegments,
  buildOverlapAwareMullionSegments,
  type OverlapAwareProfileSegment,
  type StructuralLeafRegion,
} from './sashOverlapGeometry'

export const PROFILE_DATA_01_2A_V3_VERSION = 'PROFILE_DATA_01.2A_V3' as const

export const VISUAL_COMPOSER_EFFECTIVE_GEOMETRY_SAFETY = Object.freeze({
  sashGeometryPromoted: false,
  globalFallbackOverlapAllowed: false,
  automaticProfileSelectionAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})

export interface VisualComposerEffectiveProfileGeometryReady {
  state: 'READY'
  outerWidthMm: number
  outerHeightMm: number
  sashOverlapMm: number
  frameProfileCode: string
  mullionProfileCode: string | null
  frameSegments: OverlapAwareProfileSegment[]
  mullionSegments: OverlapAwareProfileSegment[]
  source: 'PROFILE_DATA_01_2'
  workingValueOnly: true
  productionConfirmationRequired: true
  sashGeometryPromoted: false
  machineReady: false
  productionApproved: false
}

export interface VisualComposerEffectiveProfileGeometryUnresolved {
  state: 'UNRESOLVED'
  reason: string
  frameSegments: []
  mullionSegments: []
  source: 'PROFILE_DATA_01_2'
  workingValueOnly: true
  productionConfirmationRequired: true
  sashGeometryPromoted: false
  machineReady: false
  productionApproved: false
}

export type VisualComposerEffectiveProfileGeometry =
  | VisualComposerEffectiveProfileGeometryReady
  | VisualComposerEffectiveProfileGeometryUnresolved

const unresolved = (reason: string): VisualComposerEffectiveProfileGeometryUnresolved => ({
  state: 'UNRESOLVED',
  reason,
  frameSegments: [],
  mullionSegments: [],
  source: 'PROFILE_DATA_01_2',
  workingValueOnly: true,
  productionConfirmationRequired: true,
  sashGeometryPromoted: false,
  machineReady: false,
  productionApproved: false,
})

const positiveFinite = (value: number) => Number.isFinite(value) && value > 0
const percentage = (placement: string) => {
  const match = placement.trim().match(/^(-?\d+(?:\.\d+)?)%$/)
  if (!match) return null
  const value = Number(match[1]) / 100
  return Number.isFinite(value) && value > 0 && value < 1 ? value : null
}

export function buildVisualComposerEffectiveProfileGeometry(input: {
  state: Pick<VisualComposition, 'fields' | 'components' | 'templateId'>
  outerWidthMm: number
  outerHeightMm: number
  sashOverlapMm: number
  frameProfileCode: string | null
  mullionProfileCode: string | null
}): VisualComposerEffectiveProfileGeometry {
  if (!input.state.templateId) return unresolved('Няма приложен шаблон.')
  if (!positiveFinite(input.outerWidthMm) || !positiveFinite(input.outerHeightMm)) return unresolved('Невалидни общи размери.')
  if (!positiveFinite(input.sashOverlapMm)) return unresolved('Невалидна работна стойност за застъпване.')
  if (!input.frameProfileCode) return unresolved('Липсва избран профил за каса.')

  const leaves: StructuralLeafRegion[] = input.state.fields.map((field) => ({
    id: field.id,
    fieldType: field.fieldType === 'OPENABLE' ? 'OPENING_SASH' : 'FIXED_GLAZING',
    rect: {
      x: field.rect.x * input.outerWidthMm,
      y: field.rect.y * input.outerHeightMm,
      width: field.rect.width * input.outerWidthMm,
      height: field.rect.height * input.outerHeightMm,
    },
  }))

  const templateDividers = input.state.components.filter(
    (component) => component.role === 'DIVIDER' && component.parentFieldId === null,
  )

  if (templateDividers.length > 0 && !input.mullionProfileCode) {
    return unresolved('Шаблонът има делител, но липсва избран профил за делител.')
  }

  try {
    const frameSegments = buildOverlapAwareFrameSegments(
      input.outerWidthMm,
      input.outerHeightMm,
      leaves,
      input.sashOverlapMm,
      input.frameProfileCode,
    )

    const parentRect = { x: 0, y: 0, width: input.outerWidthMm, height: input.outerHeightMm }
    const mullionSegments = templateDividers.flatMap((component) => {
      const ratio = percentage(component.placement)
      if (ratio === null) throw new Error(`Делител ${component.id} няма доказана процентна позиция.`)
      const orientation = component.type === 'VERTICAL_DIVIDER' ? 'VERTICAL'
        : component.type === 'HORIZONTAL_DIVIDER' ? 'HORIZONTAL'
          : null
      if (!orientation) throw new Error(`Делител ${component.id} има неподдържана ориентация.`)
      const parentSpan = orientation === 'VERTICAL' ? input.outerWidthMm : input.outerHeightMm
      const mullionProfileCode = input.mullionProfileCode
      if (!mullionProfileCode) throw new Error('Липсва избран профил за делител.')
      return buildOverlapAwareMullionSegments(
        orientation,
        ratio * parentSpan,
        parentRect,
        leaves,
        input.sashOverlapMm,
        mullionProfileCode,
      ).map((segment) => ({ ...segment, id: `${component.id}-${segment.id}` }))
    })

    return {
      state: 'READY',
      outerWidthMm: input.outerWidthMm,
      outerHeightMm: input.outerHeightMm,
      sashOverlapMm: input.sashOverlapMm,
      frameProfileCode: input.frameProfileCode,
      mullionProfileCode: templateDividers.length ? input.mullionProfileCode : null,
      frameSegments,
      mullionSegments,
      source: 'PROFILE_DATA_01_2',
      workingValueOnly: true,
      productionConfirmationRequired: true,
      sashGeometryPromoted: false,
      machineReady: false,
      productionApproved: false,
    }
  } catch (error) {
    return unresolved(error instanceof Error ? error.message : 'Ефективната профилна геометрия не може да бъде изчислена.')
  }
}

export function effectiveWidths(segments: readonly OverlapAwareProfileSegment[]): number[] {
  return [...new Set(segments.map((segment) => segment.effectiveVisibleWidthMm))].sort((a, b) => a - b)
}
