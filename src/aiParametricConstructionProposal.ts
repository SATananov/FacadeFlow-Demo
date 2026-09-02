import type {
  FacadeFlowIntentDivider,
  FacadeFlowIntentField,
  FacadeFlowProductIntent,
} from './aiProductIntent'

export type FacadeFlowAi03ProposalStatus = 'BLOCKED' | 'NEEDS_REVIEW' | 'HUMAN_REVIEWED'
export type FacadeFlowAi03GeometryBasis = 'EXPLICIT_DIVIDERS' | 'EQUAL_DISTRIBUTION_PROPOSAL' | 'SINGLE_EXPLICIT_FIELD'

export interface FacadeFlowAi03ProposalRect {
  xRatio: number
  yRatio: number
  widthRatio: number
  heightRatio: number
}

export interface FacadeFlowAi03ProposalField {
  id: string
  order: number
  rect: FacadeFlowAi03ProposalRect
  role: FacadeFlowIntentField['role']
  openingType?: FacadeFlowIntentField['openingType']
  openingDirection?: FacadeFlowIntentField['openingDirection']
  swing?: FacadeFlowIntentField['swing']
  sourceFieldId: string
  evidenceIds: string[]
  unresolved: string[]
}

export interface FacadeFlowAi03ProposalDivider {
  id: string
  orientation: 'VERTICAL' | 'HORIZONTAL'
  positionRatio: number
  basis: 'EXPLICIT' | 'PROPOSED_EQUAL_DISTRIBUTION'
  sourceDividerId?: string
  evidenceIds: string[]
}

export interface FacadeFlowAi03Assumption {
  id: string
  label: string
  detail: string
  humanAcceptanceRequired: true
}

export interface FacadeFlowAi03ParametricProposal {
  schemaVersion: 'AI03.1'
  id: string
  sourceIntentId: string
  sourceKind: FacadeFlowProductIntent['sourceKind']
  mark?: string
  category: FacadeFlowProductIntent['category']
  dimensions: { widthMm: number; heightMm: number }
  geometryBasis: FacadeFlowAi03GeometryBasis | null
  fields: FacadeFlowAi03ProposalField[]
  dividers: FacadeFlowAi03ProposalDivider[]
  profileSummary: FacadeFlowProductIntent['profiles']
  glazing: FacadeFlowProductIntent['glazing']
  finish: FacadeFlowProductIntent['finish']
  hardwareSummary: FacadeFlowProductIntent['hardwareDefaults']
  evidenceCount: number
  assumptions: FacadeFlowAi03Assumption[]
  unresolved: string[]
  blockers: string[]
  warnings: string[]
  status: FacadeFlowAi03ProposalStatus
  proposalGenerated: true
  proposalGeometryHumanReviewed: boolean
  humanReviewRequired: true
  rulesValidated: false
  automaticAcceptedGeometry: false
  constructorHandoffAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const finitePositive = (value: number | undefined): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
const ratioInside = (value: number) => Number.isFinite(value) && value > 0 && value < 1
const unique = <T,>(values: T[]) => [...new Set(values)]

function dividerRatio(divider: FacadeFlowIntentDivider, widthMm: number, heightMm: number) {
  if (typeof divider.positionRatio === 'number' && ratioInside(divider.positionRatio)) return divider.positionRatio
  if (!finitePositive(divider.positionMm)) return null
  const extent = divider.orientation === 'VERTICAL' ? widthMm : heightMm
  const ratio = divider.positionMm / extent
  return ratioInside(ratio) ? ratio : null
}

function explicitLinearLayout(
  fields: FacadeFlowIntentField[],
  dividers: FacadeFlowIntentDivider[],
  widthMm: number,
  heightMm: number,
): { fields: FacadeFlowAi03ProposalField[]; dividers: FacadeFlowAi03ProposalDivider[]; basis: FacadeFlowAi03GeometryBasis } | null {
  if (!fields.length || dividers.length !== fields.length - 1) return null
  const orientations = unique(dividers.map((divider) => divider.orientation))
  if (orientations.length !== 1) return null
  const orientation = orientations[0]!
  const resolved = dividers.map((divider) => ({ divider, ratio: dividerRatio(divider, widthMm, heightMm) }))
  if (resolved.some((entry) => entry.ratio === null)) return null
  const sorted = resolved.slice().sort((a, b) => a.ratio! - b.ratio!)
  const positions = sorted.map((entry) => entry.ratio!)
  if (new Set(positions.map((value) => value.toFixed(8))).size !== positions.length) return null
  const edges = [0, ...positions, 1]
  const proposalFields = fields.slice().sort((a, b) => a.order - b.order).map((field, index) => {
    const start = edges[index]!
    const end = edges[index + 1]!
    const rect = orientation === 'VERTICAL'
      ? { xRatio: start, yRatio: 0, widthRatio: end - start, heightRatio: 1 }
      : { xRatio: 0, yRatio: start, widthRatio: 1, heightRatio: end - start }
    return proposalField(field, rect)
  })
  return {
    fields: proposalFields,
    dividers: sorted.map(({ divider, ratio }) => ({
      id: `proposal-${divider.id}`,
      orientation: divider.orientation,
      positionRatio: ratio!,
      basis: 'EXPLICIT',
      sourceDividerId: divider.id,
      evidenceIds: [...divider.evidenceIds],
    })),
    basis: 'EXPLICIT_DIVIDERS',
  }
}

function proposalField(field: FacadeFlowIntentField, rect: FacadeFlowAi03ProposalRect): FacadeFlowAi03ProposalField {
  return {
    id: `proposal-${field.id}`,
    order: field.order,
    rect,
    role: field.role,
    openingType: field.openingType,
    openingDirection: field.openingDirection,
    swing: field.swing,
    sourceFieldId: field.id,
    evidenceIds: [...field.evidenceIds],
    unresolved: [...field.unresolved],
  }
}

function equalDistribution(fields: FacadeFlowIntentField[]) {
  const count = fields.length
  const sorted = fields.slice().sort((a, b) => a.order - b.order)
  return {
    fields: sorted.map((field, index) => proposalField(field, { xRatio: index / count, yRatio: 0, widthRatio: 1 / count, heightRatio: 1 })),
    dividers: Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({
      id: `proposal-equal-divider-${index + 1}`,
      orientation: 'VERTICAL' as const,
      positionRatio: (index + 1) / count,
      basis: 'PROPOSED_EQUAL_DISTRIBUTION' as const,
      evidenceIds: [] as string[],
    })),
  }
}

export function buildFacadeFlowParametricConstructionProposal(intent: FacadeFlowProductIntent): FacadeFlowAi03ParametricProposal {
  const blockers: string[] = []
  const warnings: string[] = []
  const assumptions: FacadeFlowAi03Assumption[] = []
  const unresolved = [...intent.unresolved]

  if (intent.category !== 'WINDOW' && intent.category !== 'DOOR') blockers.push('AI03 V1 поддържа предложения само за прозорец или врата.')
  if (!finitePositive(intent.dimensions.widthMm)) blockers.push('Нужна е обща ширина, преди да се генерира пропорционално геометрично предложение.')
  if (!finitePositive(intent.dimensions.heightMm)) blockers.push('Нужна е обща височина, преди да се генерира пропорционално геометрично предложение.')
  if (!intent.fields.length) blockers.push('Топологията на полетата не е уточнена; AI03 няма да приема, че изделието има едно поле.')

  const widthMm = finitePositive(intent.dimensions.widthMm) ? intent.dimensions.widthMm : 1
  const heightMm = finitePositive(intent.dimensions.heightMm) ? intent.dimensions.heightMm : 1
  let fields: FacadeFlowAi03ProposalField[] = []
  let dividers: FacadeFlowAi03ProposalDivider[] = []
  let geometryBasis: FacadeFlowAi03GeometryBasis | null = null

  if (!blockers.length) {
    if (intent.fields.length === 1) {
      fields = [proposalField(intent.fields[0]!, { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 1 })]
      geometryBasis = 'SINGLE_EXPLICIT_FIELD'
      if (intent.dividers.length) warnings.push('Има доказателство за делител при изделие с едно поле и то не е проектирано автоматично.')
    } else {
      const explicit = explicitLinearLayout(intent.fields, intent.dividers, widthMm, heightMm)
      if (explicit) {
        fields = explicit.fields
        dividers = explicit.dividers
        geometryBasis = explicit.basis
      } else if (!intent.dividers.length) {
        const equal = equalDistribution(intent.fields)
        fields = equal.fields
        dividers = equal.dividers
        geometryBasis = 'EQUAL_DISTRIBUTION_PROPOSAL'
        assumptions.push({
          id: 'equal-field-distribution',
          label: 'Равномерно разпределение на полетата',
          detail: `Източникът задава ${intent.fields.length} полета, но не задава позиции на делителите. AI03 предлага равни ширини само като концептуална геометрия.`,
          humanAcceptanceRequired: true,
        })
        unresolved.push('Точни позиции / размери на делителите')
      } else {
        blockers.push('Топологията на делителите не може да се проектира безопасно: смесени, непълни или невалидни позиции изискват човешко въвеждане на геометрия.')
      }
    }
  }

  for (const field of fields) {
    if (field.role === 'UNRESOLVED') unresolved.push(`Роля на поле ${field.order + 1}`)
    if (field.role === 'OPENING_SASH' && (!field.openingType || field.openingType === 'UNRESOLVED')) unresolved.push(`Тип отваряне за поле ${field.order + 1}`)
    if (field.role === 'OPENING_SASH' && (!field.openingDirection || field.openingDirection === 'UNRESOLVED')) warnings.push(`Посоката на поле ${field.order + 1} не е зададена и не се визуализира като потвърдено отваряне.`)
  }
  if (intent.hardwareDefaults.hingeQuantity && intent.hardwareDefaults.hingeQuantity > 0) unresolved.push('Позиции на пантите')
  if (intent.hardwareDefaults.handle) unresolved.push('Позиция / височина на дръжката')
  if (intent.profiles.system && !intent.profiles.frame) warnings.push('Профилната система е известна, но точният профил за каса не е потвърден.')
  if (intent.profiles.system && fields.some((field) => field.role === 'OPENING_SASH') && !intent.profiles.sash) warnings.push('Има отваряемо поле, но точният профил за крило не е потвърден.')
  if (dividers.length && !intent.profiles.mullion) warnings.push('Предложението съдържа делители, но точният профил за делител не е потвърден.')

  return {
    schemaVersion: 'AI03.1',
    id: `${intent.id}-construction-proposal`,
    sourceIntentId: intent.id,
    sourceKind: intent.sourceKind,
    mark: intent.mark,
    category: intent.category,
    dimensions: { widthMm, heightMm },
    geometryBasis,
    fields,
    dividers,
    profileSummary: { ...intent.profiles },
    glazing: { ...intent.glazing },
    finish: { ...intent.finish },
    hardwareSummary: { ...intent.hardwareDefaults },
    evidenceCount: intent.evidence.length,
    assumptions,
    unresolved: unique(unresolved),
    blockers: unique(blockers),
    warnings: unique(warnings),
    status: blockers.length ? 'BLOCKED' : 'NEEDS_REVIEW',
    proposalGenerated: true,
    proposalGeometryHumanReviewed: false,
    humanReviewRequired: true,
    rulesValidated: false,
    automaticAcceptedGeometry: false,
    constructorHandoffAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

export function humanReviewFacadeFlowParametricProposal(
  proposal: FacadeFlowAi03ParametricProposal,
  input: { topologyChecked: boolean; assumptionsAccepted: boolean },
): FacadeFlowAi03ParametricProposal {
  if (proposal.blockers.length) return { ...proposal, status: 'BLOCKED', proposalGeometryHumanReviewed: false }
  if (!input.topologyChecked) return { ...proposal, status: 'NEEDS_REVIEW', proposalGeometryHumanReviewed: false }
  if (proposal.assumptions.length && !input.assumptionsAccepted) return { ...proposal, status: 'NEEDS_REVIEW', proposalGeometryHumanReviewed: false }
  return {
    ...proposal,
    status: 'HUMAN_REVIEWED',
    proposalGeometryHumanReviewed: true,
    automaticAcceptedGeometry: false,
    constructorHandoffAllowed: false,
    rulesValidated: false,
    machineReady: false,
    productionApproved: false,
  }
}
