import {
  createHybridProductDesignerSession,
  createStructuredConfiguration,
  maximumAccessibleConfigurationStep,
  validateStructuredConfiguration,
  type HybridGuidedAiHandoff,
  type HybridProductDesignerSession,
  type StructuredProfileConfiguration,
} from './hybridProductDesigner'
import {
  GUIDED_DIRECTION_LABELS,
  GUIDED_FILL_LABELS,
  GUIDED_HANDLE_LABELS,
  GUIDED_HARDWARE_LABELS,
  GUIDED_INWARD_OUTWARD_LABELS,
  GUIDED_OPENING_LABELS,
  GUIDED_PRODUCT_TYPE_LABELS,
  effectiveGuidedProfileSystem,
} from './aiGuidedProduct'
import type { FacadeFlowAiSession, FacadeFlowGuidedProductDraft } from './aiWorkspaceTypes'
import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'

const profileCode = (profiles: CatalogueProfile[], id: string, role: ProfileRole) => profiles.find((profile) => profile.id === id && profile.role === role && profile.status !== 'ARCHIVED')?.code || ''

const selectedCatalogueProfileIsValid = (profiles: CatalogueProfile[], draft: FacadeFlowGuidedProductDraft, id: string, role: ProfileRole) => Boolean(
  draft.profileSystem && profiles.some((profile) => profile.id === id && profile.system === draft.profileSystem && profile.role === role && profile.status !== 'ARCHIVED'),
)

export function canCreateGuidedConstructorHandoff(session: FacadeFlowAiSession) {
  const draft = session.job.guidedProduct
  const proposal = session.job.products.find((product) => product.id === `${session.job.id}-guided-product`)
  return session.job.inputMode === 'DESCRIPTION'
    && draft.status === 'HUMAN_CONFIRMED'
    && proposal?.status === 'HUMAN_CONFIRMED'
    && (draft.productType === 'WINDOW' || draft.productType === 'DOOR')
    && Number.isFinite(Number(draft.width)) && Number(draft.width) > 0
    && Number.isFinite(Number(draft.height)) && Number(draft.height) > 0
}

function buildHandoffEvidence(session: FacadeFlowAiSession, profiles: CatalogueProfile[]): HybridGuidedAiHandoff {
  const draft = session.job.guidedProduct
  const proposal = session.job.products.find((product) => product.id === `${session.job.id}-guided-product`)
  if (!proposal || !draft.productType) throw new Error('Confirmed guided product proposal is required for constructor handoff.')
  const system = effectiveGuidedProfileSystem(draft)
  const frame = profileCode(profiles, draft.frameProfileId, 'FRAME') || draft.manualFrameProfile.trim()
  const sash = profileCode(profiles, draft.sashProfileId, 'SASH') || draft.manualSashProfile.trim()
  const mullion = profileCode(profiles, draft.mullionProfileId, 'MULLION') || draft.manualMullionProfile.trim()
  const openingType = draft.openingType ? GUIDED_OPENING_LABELS[draft.openingType] : ''
  const direction = draft.openingDirection ? GUIDED_DIRECTION_LABELS[draft.openingDirection] : ''
  const inwardOutward = draft.inwardOutward ? GUIDED_INWARD_OUTWARD_LABELS[draft.inwardOutward] : ''
  const fill = draft.fillType ? GUIDED_FILL_LABELS[draft.fillType] : ''
  const hardwareType = draft.hardwareType ? GUIDED_HARDWARE_LABELS[draft.hardwareType] : ''
  const handle = draft.handleType ? GUIDED_HANDLE_LABELS[draft.handleType] : ''
  return {
    source: 'AI_GUIDED_HUMAN_CONFIRMED',
    aiSessionId: session.id,
    jobId: session.job.id,
    productSpecificationId: proposal.id,
    quantity: Number(draft.quantity),
    productType: draft.productType,
    dimensions: { width: draft.width.trim(), height: draft.height.trim() },
    profileEvidence: { system, frame, sash, mullion, threshold: draft.thresholdDescription.trim() },
    opening: { type: openingType, direction, inwardOutward },
    glazing: [fill, draft.fillDescription.trim()].filter(Boolean).join(' · '),
    finish: { exterior: draft.exteriorColor.trim(), interior: draft.interiorColor.trim() },
    hardware: {
      type: hardwareType,
      description: draft.hardwareDescription.trim(),
      handle: [handle, draft.handleDescription.trim()].filter(Boolean).join(' · '),
      hingeQuantity: draft.hingeQuantity.trim(),
    },
    notes: [draft.notes.trim(), session.job.description.trim()].filter(Boolean).join('\n'),
    humanConfirmed: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
  }
}

export function createHybridSessionFromGuidedAi(
  session: FacadeFlowAiSession,
  profiles: CatalogueProfile[],
  hybridSessionId = 'hybrid-from-ai-guided',
): HybridProductDesignerSession | null {
  if (!canCreateGuidedConstructorHandoff(session)) return null
  const draft = session.job.guidedProduct
  const productCategory = draft.productType as 'WINDOW' | 'DOOR'
  const baseConfiguration = createStructuredConfiguration(productCategory)
  const catalogueSystem = draft.profileSystem && profiles.some((profile) => profile.system === draft.profileSystem && profile.status !== 'ARCHIVED') ? draft.profileSystem : ''
  const frameProfileId = selectedCatalogueProfileIsValid(profiles, draft, draft.frameProfileId, 'FRAME') ? draft.frameProfileId : ''
  const sashProfileId = selectedCatalogueProfileIsValid(profiles, draft, draft.sashProfileId, 'SASH') ? draft.sashProfileId : ''
  const mullionProfileId = selectedCatalogueProfileIsValid(profiles, draft, draft.mullionProfileId, 'MULLION') ? draft.mullionProfileId : ''
  let configuration: StructuredProfileConfiguration = {
    ...baseConfiguration,
    productName: draft.name.trim() || GUIDED_PRODUCT_TYPE_LABELS[productCategory],
    overallWidth: draft.width.trim(),
    overallHeight: draft.height.trim(),
    profileSystem: catalogueSystem,
    frameProfileId,
    sashProfileId,
    mullionProfileId,
    humanReviewChecked: false,
    status: 'NEEDS_REVIEW',
  }
  configuration = {
    ...configuration,
    wizardStep: maximumAccessibleConfigurationStep(configuration, profiles),
    validationErrors: validateStructuredConfiguration(configuration, profiles),
  }
  const base = createHybridProductDesignerSession(hybridSessionId)
  return {
    ...base,
    creationRoute: 'STANDARD',
    productCategory,
    workflowStep: 'STANDARD_DRAFT',
    configuration,
    sourceReferenceStatus: 'AI_GUIDED_CONFIRMED',
    guidedAiHandoff: buildHandoffEvidence(session, profiles),
  }
}
