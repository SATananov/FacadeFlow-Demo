import type { FacadeFlowProductIntent } from './aiProductIntent'
import type {
  FacadeFlowConstructionGraph,
  FacadeFlowConstructionGraphFieldRole,
  FacadeFlowConstructionGraphMullionNode,
} from './aiConstructionGraph'

export const AI_CONSTRUCTION_DRAWING_VERSION = 'AI05.3' as const

export type FacadeFlowConstructionDrawingStatus = 'READY_FOR_HUMAN_REVIEW' | 'BLOCKED'
export type FacadeFlowConstructionDrawingBasis =
  | 'SINGLE_FIELD'
  | 'EXPLICIT_LINEAR_DIVIDERS'
  | 'PROPOSED_EQUAL_FIELD_DISTRIBUTION'

export interface FacadeFlowConstructionDrawingRect {
  xRatio: number
  yRatio: number
  widthRatio: number
  heightRatio: number
}

export interface FacadeFlowConstructionDrawingSash {
  semanticRole: 'SASH'
  profileRef?: string
  openingType?: string
  openingDirection?: string
  swing?: string
  conceptualInsetRatio: number
}

export interface FacadeFlowConstructionDrawingLowerPanel {
  semanticRole: 'LOWER_PANEL_ZONE'
  dividerOrientation: 'HORIZONTAL'
  heightMm?: number
  heightRatio?: number
  exactHeightKnown: boolean
  upperZoneRole: 'GLAZING' | 'UNRESOLVED'
  lowerZoneRole: 'PANEL'
}

export interface FacadeFlowConstructionDrawingField {
  sourceFieldId: string
  order: number
  semanticRole: FacadeFlowConstructionGraphFieldRole
  rect: FacadeFlowConstructionDrawingRect
  sash?: FacadeFlowConstructionDrawingSash
  lowerPanel?: FacadeFlowConstructionDrawingLowerPanel
}

export interface FacadeFlowConstructionDrawingMullion {
  order: number
  orientation: 'VERTICAL' | 'HORIZONTAL'
  positionRatio: number
  profileRef?: string
  sourceDividerId?: string
  basis: FacadeFlowConstructionGraphMullionNode['basis']
  exactPositionKnown: boolean
}

export interface FacadeFlowConstructionDrawing {
  schemaVersion: 'AI05.3'
  sourceIntentId: string
  sourceGraphVersion: 'AI05.2'
  sourceOfTruth: 'AI05.2_CONSTRUCTION_GRAPH'
  status: FacadeFlowConstructionDrawingStatus
  dimensions: { widthMm?: number; heightMm?: number }
  basis: FacadeFlowConstructionDrawingBasis | null
  linearOrientation: 'VERTICAL' | 'HORIZONTAL' | null
  frame: { semanticRole: 'FRAME'; profileRef?: string } | null
  fields: FacadeFlowConstructionDrawingField[]
  mullions: FacadeFlowConstructionDrawingMullion[]
  warnings: string[]
  blockers: string[]
  humanReviewRequired: true
  automaticDrawingProposal: true
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  exactProductionGeometry: false
  rulesValidated: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const unique = <T,>(items: T[]) => [...new Set(items)]

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value))
}

function explicitPositionRatio(
  mullion: FacadeFlowConstructionGraphMullionNode,
  intent: FacadeFlowProductIntent,
): number | undefined {
  if (mullion.positionRatio !== undefined) return mullion.positionRatio
  if (mullion.positionMm === undefined) return undefined
  const span = mullion.orientation === 'VERTICAL' ? intent.dimensions.widthMm : intent.dimensions.heightMm
  if (!span || span <= 0) return undefined
  return mullion.positionMm / span
}

function linearBoundaries(fieldCount: number, exactRatios: number[] | null): number[] {
  if (fieldCount <= 1) return [0, 1]
  if (exactRatios) return [0, ...exactRatios, 1]
  return Array.from({ length: fieldCount + 1 }, (_, index) => index / fieldCount)
}

export function buildFacadeFlowConstructionDrawing(
  intent: FacadeFlowProductIntent,
  graph: FacadeFlowConstructionGraph,
): FacadeFlowConstructionDrawing {
  const blockers: string[] = []
  const warnings: string[] = []
  const widthMm = intent.dimensions.widthMm
  const heightMm = intent.dimensions.heightMm

  if (graph.status === 'BLOCKED' || !graph.root) blockers.push(...(graph.blockers.length ? graph.blockers : ['Конструктивният граф е блокиран.']))
  if (!widthMm || widthMm <= 0) blockers.push('Липсва обща ширина за 2D предложението.')
  if (!heightMm || heightMm <= 0) blockers.push('Липсва обща височина за 2D предложението.')

  const graphFields = graph.root?.children.filter((child) => child.kind === 'FIELD').sort((a, b) => a.order - b.order) ?? []
  const graphMullions = graph.root?.children.filter((child): child is FacadeFlowConstructionGraphMullionNode => child.kind === 'MULLION').sort((a, b) => a.order - b.order) ?? []

  if (graphFields.length !== graph.fieldCount) blockers.push('Графът съдържа несъответствие в броя на полетата.')
  if (graphFields.length > 1 && graphMullions.length !== graphFields.length - 1) blockers.push('AI05.3 изисква еднозначна линейна последователност поле/делител.')

  const orientations = unique(graphMullions.map((item) => item.orientation))
  if (orientations.length > 1) blockers.push('Смесена хоризонтална/вертикална топология още не се визуализира от AI05.3.')
  const linearOrientation = graphFields.length <= 1 ? null : orientations[0] ?? 'VERTICAL'

  const exactRatios = graphMullions.length && graphMullions.every((mullion) => mullion.exactPositionKnown)
    ? graphMullions.map((mullion) => explicitPositionRatio(mullion, intent))
    : null
  const resolvedExactRatios = exactRatios && exactRatios.every((ratio): ratio is number => ratio !== undefined)
    ? exactRatios
    : null

  if (resolvedExactRatios) {
    const sorted = resolvedExactRatios.slice().sort((a, b) => a - b)
    if (sorted.some((ratio) => ratio <= 0 || ratio >= 1) || sorted.some((ratio, index) => index > 0 && ratio <= sorted[index - 1]!)) {
      blockers.push('Точните позиции на делителите не образуват валидна нарастваща линейна последователност.')
    }
  }

  let basis: FacadeFlowConstructionDrawingBasis | null = null
  if (!blockers.length) {
    basis = graphFields.length <= 1
      ? 'SINGLE_FIELD'
      : resolvedExactRatios
        ? 'EXPLICIT_LINEAR_DIVIDERS'
        : 'PROPOSED_EQUAL_FIELD_DISTRIBUTION'
  }

  if (graphFields.length > 1 && !resolvedExactRatios) {
    warnings.push('Позициите на делителите в 2D изгледа са само равномерно визуално предложение за човешки преглед.')
  }
  if (graph.root && !graph.root.profileRef) warnings.push('Касата няма потвърден точен профилен код.')
  if (graphMullions.some((item) => !item.profileRef)) warnings.push('Поне един делител няма потвърден точен профилен код.')
  if (graphFields.some((item) => item.sash && !item.sash.profileRef)) warnings.push('Поне едно крило няма потвърден точен профилен код.')
  if (graphFields.some((item) => item.lowerPanel && item.lowerPanel.heightMm === undefined)) warnings.push('Долната панелна зона е разпозната, но височината ѝ не е зададена; AI05.3 няма да измисля позиция на вътрешния делител.')

  const boundaries = blockers.length ? [] : linearBoundaries(graphFields.length, resolvedExactRatios?.map(clampUnit) ?? null)
  const fields: FacadeFlowConstructionDrawingField[] = blockers.length ? [] : graphFields.map((field, index) => {
    const start = boundaries[index] ?? 0
    const end = boundaries[index + 1] ?? 1
    const rect = linearOrientation === 'HORIZONTAL'
      ? { xRatio: 0, yRatio: start, widthRatio: 1, heightRatio: end - start }
      : { xRatio: start, yRatio: 0, widthRatio: end - start, heightRatio: 1 }
    return {
      sourceFieldId: field.sourceFieldId,
      order: field.order,
      semanticRole: field.semanticRole,
      rect,
      sash: field.sash
        ? {
            semanticRole: 'SASH',
            profileRef: field.sash.profileRef,
            openingType: field.sash.openingType,
            openingDirection: field.sash.openingDirection,
            swing: field.sash.swing,
            conceptualInsetRatio: 0.06,
          }
        : undefined,
      lowerPanel: field.lowerPanel
        ? {
            semanticRole: 'LOWER_PANEL_ZONE',
            dividerOrientation: 'HORIZONTAL',
            heightMm: field.lowerPanel.heightMm,
            heightRatio: field.lowerPanel.heightMm !== undefined && heightMm && heightMm > 0
              ? clampUnit(field.lowerPanel.heightMm / heightMm)
              : undefined,
            exactHeightKnown: field.lowerPanel.heightMm !== undefined,
            upperZoneRole: field.lowerPanel.upperZoneRole,
            lowerZoneRole: field.lowerPanel.lowerZoneRole,
          }
        : undefined,
    }
  })

  const mullions: FacadeFlowConstructionDrawingMullion[] = blockers.length ? [] : graphMullions.map((mullion, index) => ({
    order: mullion.order,
    orientation: mullion.orientation,
    positionRatio: resolvedExactRatios?.[index] ?? ((index + 1) / graphFields.length),
    profileRef: mullion.profileRef,
    sourceDividerId: mullion.sourceDividerId,
    basis: mullion.basis,
    exactPositionKnown: resolvedExactRatios !== null,
  }))

  return {
    schemaVersion: AI_CONSTRUCTION_DRAWING_VERSION,
    sourceIntentId: intent.id,
    sourceGraphVersion: 'AI05.2',
    sourceOfTruth: 'AI05.2_CONSTRUCTION_GRAPH',
    status: blockers.length ? 'BLOCKED' : 'READY_FOR_HUMAN_REVIEW',
    dimensions: { widthMm, heightMm },
    basis,
    linearOrientation,
    frame: graph.root ? { semanticRole: 'FRAME', profileRef: graph.root.profileRef } : null,
    fields,
    mullions,
    warnings: unique(warnings),
    blockers: unique(blockers),
    humanReviewRequired: true,
    automaticDrawingProposal: true,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    productionDeductionsApplied: false,
    manufacturingToleranceApplied: false,
    exactProductionGeometry: false,
    rulesValidated: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

export function facadeFlowConstructionDrawingSignature(drawing: FacadeFlowConstructionDrawing): string[] {
  const output: string[] = []
  if (!drawing.frame) return output
  output.push(drawing.frame.profileRef ? `FRAME:${drawing.frame.profileRef}` : 'FRAME')
  drawing.fields.forEach((field, index) => {
    const fieldLabel = field.sash?.profileRef
      ? `${field.semanticRole}>SASH:${field.sash.profileRef}`
      : field.sash
        ? `${field.semanticRole}>SASH`
        : field.semanticRole
    output.push(fieldLabel)
    const mullion = drawing.mullions[index]
    if (mullion) output.push(mullion.profileRef ? `MULLION:${mullion.profileRef}` : 'MULLION')
  })
  return output
}
