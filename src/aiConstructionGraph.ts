import type { FacadeFlowIntentDivider, FacadeFlowIntentField, FacadeFlowProductIntent } from './aiProductIntent'

export const AI_CONSTRUCTION_GRAPH_VERSION = 'AI05.2' as const

export type FacadeFlowConstructionGraphStatus = 'READY_FOR_HUMAN_REVIEW' | 'BLOCKED'
export type FacadeFlowConstructionGraphTopologyBasis =
  | 'SINGLE_FIELD'
  | 'EXPLICIT_LINEAR_DIVIDERS'
  | 'PROPOSED_LINEAR_FIELD_SEQUENCE'

export type FacadeFlowConstructionGraphFieldRole =
  | 'FIXED_FIELD'
  | 'OPENABLE_FIELD'
  | 'SLIDING_FIELD'
  | 'PANEL_FIELD'
  | 'UNRESOLVED_FIELD'

export interface FacadeFlowConstructionGraphSashNode {
  kind: 'SASH'
  semanticRole: 'SASH'
  sourceFieldId: string
  profileRef?: string
  openingType?: FacadeFlowIntentField['openingType']
  openingDirection?: FacadeFlowIntentField['openingDirection']
  swing?: FacadeFlowIntentField['swing']
}

export interface FacadeFlowConstructionGraphFieldNode {
  kind: 'FIELD'
  semanticRole: FacadeFlowConstructionGraphFieldRole
  sourceFieldId: string
  order: number
  sourceRole: FacadeFlowIntentField['role']
  sash?: FacadeFlowConstructionGraphSashNode
}

export interface FacadeFlowConstructionGraphMullionNode {
  kind: 'MULLION'
  semanticRole: 'MULLION'
  order: number
  orientation: 'VERTICAL' | 'HORIZONTAL'
  profileRef?: string
  sourceDividerId?: string
  positionMm?: number
  positionRatio?: number
  basis: 'EXPLICIT' | 'PROPOSED_BETWEEN_LINEAR_FIELDS'
  exactPositionKnown: boolean
}

export type FacadeFlowConstructionGraphChild = FacadeFlowConstructionGraphFieldNode | FacadeFlowConstructionGraphMullionNode

export interface FacadeFlowConstructionGraphFrameNode {
  kind: 'FRAME'
  semanticRole: 'FRAME'
  profileRef?: string
  children: FacadeFlowConstructionGraphChild[]
}

export interface FacadeFlowConstructionGraph {
  schemaVersion: 'AI05.2'
  sourceIntentId: string
  status: FacadeFlowConstructionGraphStatus
  topologyBasis: FacadeFlowConstructionGraphTopologyBasis | null
  root: FacadeFlowConstructionGraphFrameNode | null
  fieldCount: number
  mullionCount: number
  unresolved: string[]
  warnings: string[]
  blockers: string[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  exactProductionGeometry: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const unique = <T,>(items: T[]) => [...new Set(items)]

function graphFieldRole(field: FacadeFlowIntentField): FacadeFlowConstructionGraphFieldRole {
  if (field.role === 'FIXED') return 'FIXED_FIELD'
  if (field.role === 'OPENING_SASH') return 'OPENABLE_FIELD'
  if (field.role === 'SLIDING_SASH') return 'SLIDING_FIELD'
  if (field.role === 'PANEL') return 'PANEL_FIELD'
  return 'UNRESOLVED_FIELD'
}

function buildFieldNode(field: FacadeFlowIntentField, defaultSashProfile?: string): FacadeFlowConstructionGraphFieldNode {
  const semanticRole = graphFieldRole(field)
  const hasSash = field.role === 'OPENING_SASH' || field.role === 'SLIDING_SASH'
  return {
    kind: 'FIELD',
    semanticRole,
    sourceFieldId: field.id,
    order: field.order,
    sourceRole: field.role,
    sash: hasSash
      ? {
          kind: 'SASH',
          semanticRole: 'SASH',
          sourceFieldId: field.id,
          profileRef: field.sashProfile ?? defaultSashProfile,
          openingType: field.openingType,
          openingDirection: field.openingDirection,
          swing: field.swing,
        }
      : undefined,
  }
}

function explicitLinearDividers(intent: FacadeFlowProductIntent): FacadeFlowIntentDivider[] | null {
  if (!intent.dividers.length) return null
  if (intent.dividers.length !== intent.fields.length - 1) return []
  const orientations = unique(intent.dividers.map((divider) => divider.orientation))
  if (orientations.length !== 1) return []
  return intent.dividers.slice()
}

export function buildFacadeFlowConstructionGraph(intent: FacadeFlowProductIntent): FacadeFlowConstructionGraph {
  const blockers: string[] = []
  const warnings: string[] = []
  const unresolved = [...intent.unresolved]

  const fields = intent.fields.slice().sort((a, b) => a.order - b.order)
  if (!fields.length) blockers.push('Липсва конструктивна топология на полетата.')
  if (fields.some((field, index) => field.order !== index)) warnings.push('Редът на полетата е нормализиран за конструктивния граф и изисква човешка проверка.')

  const explicitDividers = explicitLinearDividers(intent)
  if (explicitDividers && explicitDividers.length === 0) blockers.push('Дадените делители не образуват еднозначна линейна топология между полетата.')

  let topologyBasis: FacadeFlowConstructionGraphTopologyBasis | null = null
  if (!blockers.length) {
    topologyBasis = fields.length === 1
      ? 'SINGLE_FIELD'
      : explicitDividers
        ? 'EXPLICIT_LINEAR_DIVIDERS'
        : 'PROPOSED_LINEAR_FIELD_SEQUENCE'
  }

  const children: FacadeFlowConstructionGraphChild[] = []
  if (!blockers.length) {
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index]!
      children.push(buildFieldNode(field, intent.profiles.sash))
      if (index === fields.length - 1) continue

      const explicit = explicitDividers?.[index]
      children.push({
        kind: 'MULLION',
        semanticRole: 'MULLION',
        order: index,
        orientation: explicit?.orientation ?? 'VERTICAL',
        profileRef: explicit?.profile ?? intent.profiles.mullion,
        sourceDividerId: explicit?.id,
        positionMm: explicit?.positionMm,
        positionRatio: explicit?.positionRatio,
        basis: explicit ? 'EXPLICIT' : 'PROPOSED_BETWEEN_LINEAR_FIELDS',
        exactPositionKnown: explicit?.positionMm !== undefined || explicit?.positionRatio !== undefined,
      })
    }
  }

  for (const field of fields) {
    if (field.role === 'UNRESOLVED') unresolved.push(`Роля на поле ${field.order + 1}`)
    if (field.role === 'OPENING_SASH' && !field.openingType) unresolved.push(`Тип отваряне за поле ${field.order + 1}`)
  }

  if (fields.length > 1 && !explicitDividers) {
    warnings.push('Делителите са предложени семантично между последователните полета; точните им позиции и размери не са производствена геометрия.')
    unresolved.push('Точни позиции / размери на делителите')
  }
  if (fields.some((field) => field.role === 'SLIDING_SASH')) warnings.push('Плъзгащото поле е представено семантично; механизмът и производствената геометрия остават извън AI05.2.')
  if (fields.some((field) => field.role === 'OPENING_SASH' || field.role === 'SLIDING_SASH') && !intent.profiles.sash) warnings.push('Има поле с крило, но точният профил за крило не е потвърден.')
  if (fields.length > 1 && !intent.profiles.mullion) warnings.push('Има повече от едно поле, но точният профил за делител не е потвърден.')
  if (!intent.profiles.frame) warnings.push('Точният профил за каса не е потвърден.')

  const root: FacadeFlowConstructionGraphFrameNode | null = blockers.length
    ? null
    : { kind: 'FRAME', semanticRole: 'FRAME', profileRef: intent.profiles.frame, children }

  return {
    schemaVersion: AI_CONSTRUCTION_GRAPH_VERSION,
    sourceIntentId: intent.id,
    status: blockers.length ? 'BLOCKED' : 'READY_FOR_HUMAN_REVIEW',
    topologyBasis,
    root,
    fieldCount: fields.length,
    mullionCount: children.filter((child) => child.kind === 'MULLION').length,
    unresolved: unique(unresolved),
    warnings: unique(warnings),
    blockers: unique(blockers),
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    exactProductionGeometry: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

export function facadeFlowConstructionGraphSignature(graph: FacadeFlowConstructionGraph): string[] {
  if (!graph.root) return []
  return graph.root.children.map((child) => {
    if (child.kind === 'MULLION') return 'MULLION'
    if (child.semanticRole === 'OPENABLE_FIELD') return child.sash ? 'OPENABLE_FIELD>SASH' : 'OPENABLE_FIELD'
    if (child.semanticRole === 'SLIDING_FIELD') return child.sash ? 'SLIDING_FIELD>SASH' : 'SLIDING_FIELD'
    return child.semanticRole
  })
}
