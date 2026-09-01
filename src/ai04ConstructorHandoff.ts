import type { FacadeFlowAi03ParametricProposal, FacadeFlowAi03ProposalField } from './aiParametricConstructionProposal'
import { catalogueProfileIsSelectable } from './profileCatalogueState'
import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'
import type { CustomAi04HandoffMetadata, CustomGeometryNode, CustomLeafNode, CustomProduct } from './customGeometryTypes'

export type FacadeFlowAi04HandoffStatus = 'BLOCKED' | 'READY'

export interface FacadeFlowAi04ConstructorHandoffResult {
  schemaVersion: 'AI04.1'
  status: FacadeFlowAi04HandoffStatus
  customProduct: CustomProduct | null
  transferred: string[]
  unresolved: string[]
  warnings: string[]
  blockers: string[]
  explicitHumanHandoffRequired: true
  automaticConstructorHandoff: false
  editableGeometryCreated: boolean
  rulesValidated: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const unique = (values: string[]) => [...new Set(values.filter(Boolean))]

function profileByExactEvidence(profiles: CatalogueProfile[], role: ProfileRole, system: string | undefined, value: string | undefined) {
  if (!value?.trim()) return undefined
  const normalized = value.trim()
  return profiles.find((profile) => catalogueProfileIsSelectable(profile)
    && profile.role === role
    && (!system || profile.system.localeCompare(system, 'bg', { sensitivity: 'base' }) === 0)
    && (profile.code.localeCompare(normalized, 'bg', { sensitivity: 'base' }) === 0
      || profile.nameBg.localeCompare(normalized, 'bg', { sensitivity: 'base' }) === 0))
}

function leafFromProposal(field: FacadeFlowAi03ProposalField, sashProfileId: string | undefined): CustomLeafNode {
  if (field.role === 'OPENING_SASH') {
    const openingType = field.openingType === 'TURN' || field.openingType === 'TILT' || field.openingType === 'TILT_TURN' || field.openingType === 'OTHER'
      ? field.openingType
      : undefined
    return {
      kind: 'LEAF',
      id: `ai04-field-${field.order + 1}`,
      fieldType: 'OPENING_SASH',
      sashProfileId,
      openingType,
      openingDirection: field.openingDirection === 'LEFT' ? 'left' : field.openingDirection === 'RIGHT' ? 'right' : undefined,
    }
  }
  if (field.role === 'UNRESOLVED') return { kind: 'LEAF', id: `ai04-field-${field.order + 1}`, fieldType: 'PLACEHOLDER' }
  return { kind: 'LEAF', id: `ai04-field-${field.order + 1}`, fieldType: 'FIXED' }
}

function buildLinearGeometry(proposal: FacadeFlowAi03ParametricProposal, sashProfileId: string | undefined): CustomGeometryNode | null {
  const fields = proposal.fields.slice().sort((a, b) => a.order - b.order)
  if (fields.length === 1) return leafFromProposal(fields[0]!, sashProfileId)
  if (proposal.dividers.length !== fields.length - 1) return null
  const orientations = [...new Set(proposal.dividers.map((divider) => divider.orientation))]
  if (orientations.length !== 1) return null
  const orientation = orientations[0]!
  const extent = orientation === 'VERTICAL' ? proposal.dimensions.widthMm : proposal.dimensions.heightMm
  const positions = proposal.dividers.slice().sort((a, b) => a.positionRatio - b.positionRatio).map((divider) => divider.positionRatio * extent)
  if (positions.some((position) => !Number.isFinite(position) || position <= 0 || position >= extent)) return null
  for (let index = 1; index < positions.length; index += 1) if (positions[index]! <= positions[index - 1]!) return null

  const build = (fieldIndex: number, start: number): CustomGeometryNode => {
    if (fieldIndex === fields.length - 1) return leafFromProposal(fields[fieldIndex]!, sashProfileId)
    const globalPosition = positions[fieldIndex]!
    const localPosition = globalPosition - start
    return {
      kind: 'SPLIT',
      id: `ai04-split-${fieldIndex + 1}`,
      orientation,
      position: localPosition,
      first: leafFromProposal(fields[fieldIndex]!, sashProfileId),
      second: build(fieldIndex + 1, globalPosition),
    }
  }
  return build(0, 0)
}

export function buildFacadeFlowAi04ConstructorHandoff(
  proposal: FacadeFlowAi03ParametricProposal,
  profiles: CatalogueProfile[],
  options: { productId?: string; now?: string } = {},
): FacadeFlowAi04ConstructorHandoffResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const unresolved = [...proposal.unresolved]
  const transferred: string[] = []

  if (proposal.status !== 'HUMAN_REVIEWED' || !proposal.proposalGeometryHumanReviewed) blockers.push('AI04 изисква AI03 предложението да е изрично прегледано от човек.')
  if (proposal.blockers.length) blockers.push(...proposal.blockers.map((item) => `AI03 blocker: ${item}`))
  if (!Number.isFinite(proposal.dimensions.widthMm) || proposal.dimensions.widthMm <= 0 || !Number.isFinite(proposal.dimensions.heightMm) || proposal.dimensions.heightMm <= 0) blockers.push('Общите размери не са валидни за editable constructor draft.')
  const geometryBasis = proposal.geometryBasis
  if (!proposal.fields.length || !geometryBasis) blockers.push('Липсва прегледана геометрична основа.')
  if (proposal.fields.some((field) => field.role === 'SLIDING_SASH' || field.role === 'PANEL')) blockers.push('AI04 V1 не прехвърля SLIDING_SASH или PANEL към Custom Product Designer, защото тези роли нямат еквивалент в текущия editable geometry model.')

  const exactFrame = profileByExactEvidence(profiles, 'FRAME', proposal.profileSummary.system, proposal.profileSummary.frame)
  const exactSash = profileByExactEvidence(profiles, 'SASH', proposal.profileSummary.system, proposal.profileSummary.sash)
  const exactMullion = profileByExactEvidence(profiles, 'MULLION', proposal.profileSummary.system, proposal.profileSummary.mullion)
  if (proposal.profileSummary.frame && !exactFrame) unresolved.push(`Каса: ${proposal.profileSummary.frame} не е намерена като точен активен каталогов профил.`)
  if (proposal.fields.some((field) => field.role === 'OPENING_SASH') && proposal.profileSummary.sash && !exactSash) unresolved.push(`Крило: ${proposal.profileSummary.sash} не е намерено като точен активен каталогов профил.`)
  if (proposal.dividers.length && proposal.profileSummary.mullion && !exactMullion) unresolved.push(`Делител: ${proposal.profileSummary.mullion} не е намерен като точен активен каталогов профил.`)
  if (!proposal.profileSummary.frame) unresolved.push('Точният профил за каса остава за избор в конструктора.')
  if (proposal.fields.some((field) => field.role === 'OPENING_SASH') && !proposal.profileSummary.sash) unresolved.push('Точният профил за крило остава за избор в конструктора.')
  if (proposal.dividers.length && !proposal.profileSummary.mullion) unresolved.push('Точният профил за делител остава за избор в конструктора.')

  const unsupportedOpeningTypes = unique(proposal.fields.flatMap((field) => field.role === 'OPENING_SASH' && field.openingType && !['TURN', 'TILT', 'TILT_TURN', 'OTHER', 'UNRESOLVED'].includes(field.openingType) ? [field.openingType] : []))
  if (unsupportedOpeningTypes.length) warnings.push(`Неподдържани opening types остават само като provenance: ${unsupportedOpeningTypes.join(', ')}.`)

  const geometry = blockers.length ? null : buildLinearGeometry(proposal, exactSash?.id)
  if (!geometry && !blockers.length) blockers.push('AI04 не успя да преобразува прегледаната линейна топология към editable CustomGeometry tree без загуба на позиции.')

  if (blockers.length || !geometry || !geometryBasis) return {
    schemaVersion: 'AI04.1', status: 'BLOCKED', customProduct: null, transferred, unresolved: unique(unresolved), warnings: unique(warnings), blockers: unique(blockers),
    explicitHumanHandoffRequired: true, automaticConstructorHandoff: false, editableGeometryCreated: false, rulesValidated: false, simulationOnly: true, machineReady: false, productionApproved: false,
  }

  const now = options.now ?? new Date().toISOString()
  const productId = options.productId ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${proposal.id}-editable`)
  const metadata: CustomAi04HandoffMetadata = {
    schemaVersion: 'AI04.1',
    sourceProposalId: proposal.id,
    sourceIntentId: proposal.sourceIntentId,
    sourceKind: proposal.sourceKind,
    mark: proposal.mark,
    geometryBasis,
    evidenceCount: proposal.evidenceCount,
    sourceUnresolved: unique(proposal.unresolved),
    sourceWarnings: unique(proposal.warnings),
    humanApprovedProposal: true,
    explicitConstructorHandoff: true,
    editableDraft: true,
    rulesValidated: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
  const customProduct: CustomProduct = {
    id: productId,
    name: proposal.mark ? `${proposal.mark} · AI04 editable draft` : 'AI04 editable constructor draft',
    width: proposal.dimensions.widthMm,
    height: proposal.dimensions.heightMm,
    frameProfileId: exactFrame?.id ?? '',
    frameCreated: true,
    mullionProfileId: exactMullion?.id,
    geometry,
    status: 'NEEDS_REVIEW',
    humanReviewConfirmed: false,
    createdAt: now,
    updatedAt: now,
    simulationOnly: true,
    machineReady: false,
    ai04Handoff: metadata,
  }
  transferred.push('Общи размери', 'Външна каса като editable geometry boundary', `${proposal.fields.length} полета`, `${proposal.dividers.length} делители`)
  if (exactFrame) transferred.push(`Каса: ${exactFrame.code}`)
  if (exactSash) transferred.push(`Крило: ${exactSash.code}`)
  if (exactMullion) transferred.push(`Делител: ${exactMullion.code}`)
  if (proposal.fields.some((field) => field.role === 'OPENING_SASH')) transferred.push('Роли на отваряемите полета и доказаните LEFT/RIGHT посоки')
  warnings.push('AI04 създава редактируема симулационна чернова. Всяка последваща промяна нулира VERIFIED статуса и изисква нова човешка проверка.')
  if (proposal.profileSummary.system && !exactFrame && !exactSash && !exactMullion) warnings.push(`Системата ${proposal.profileSummary.system} е provenance контекст, но AI04 не избира профили само по име на система.`)

  return {
    schemaVersion: 'AI04.1', status: 'READY', customProduct, transferred, unresolved: unique(unresolved), warnings: unique(warnings), blockers: [],
    explicitHumanHandoffRequired: true, automaticConstructorHandoff: false, editableGeometryCreated: true, rulesValidated: false, simulationOnly: true, machineReady: false, productionApproved: false,
  }
}
