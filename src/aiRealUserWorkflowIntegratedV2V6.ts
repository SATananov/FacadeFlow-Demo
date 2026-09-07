import { buildFacadeFlowAi04ConstructorHandoff, type FacadeFlowAi04ConstructorHandoffResult } from './ai04ConstructorHandoff'
import {
  buildFacadeFlowParametricConstructionProposal,
  humanReviewFacadeFlowParametricProposal,
  type FacadeFlowAi03ParametricProposal,
} from './aiParametricConstructionProposal'
import type { FacadeFlowProductIntent, FacadeFlowIntentField } from './aiProductIntent'
import type { FacadeFlowRealUserWorkflowV1State } from './aiWorkspaceTypes'
import type { CatalogueProfile } from './profileCatalogueTypes'
import { PRELUDE_60_PROFILE_CODES } from './profileData/prelude60BaseProfiles'
import { isExplicitPrelude60System } from './profileData/prelude60CanonicalProfileIdentity'
import { resolvePrelude60CanonicalTechnicalSemantics } from './profileData/prelude60CanonicalTechnicalSemantics'

export const REAL_USER_WORKFLOW_V2_V6_VERSION = 'REAL_USER_WORKFLOW_V2_V6' as const

export const REAL_USER_WORKFLOW_V2_V6_SAFETY = Object.freeze({
  conceptualDrawingOnly: true,
  conversationalEditsAreCandidateOnly: true,
  profilePreparationRequiresHumanReviewedDrawing: true,
  automaticProfileSelectionAllowed: false,
  exactProfileContourApplied: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  automaticManufacturingExportAllowed: false,
  machineConnectivityAllowed: false,
  machineReady: false,
  productionApproved: false,
})

export type FacadeFlowRealUserDrawingReviewStatus = 'BLOCKED' | 'NEEDS_REVIEW' | 'HUMAN_REVIEWED'
export type FacadeFlowRealUserEditStatus = 'APPLIED_CANDIDATE' | 'NEEDS_CLARIFICATION'

export interface FacadeFlowRealUserConversationalEditRecord {
  id: string
  command: string
  status: FacadeFlowRealUserEditStatus
  changedTargets: string[]
  messageBg: string
  createdAt: string
  humanReviewRequired: true
}

export interface FacadeFlowRealUserWorkflowV2V6State {
  version: typeof REAL_USER_WORKFLOW_V2_V6_VERSION
  sourceWorkflowVersion: 'REAL_USER_WORKFLOW_V1'
  sourceWorkflowIntentId: string
  sourceWorkflowText: string
  workingIntent: FacadeFlowProductIntent
  drawingReviewStatus: FacadeFlowRealUserDrawingReviewStatus
  drawingReviewedAt: string | null
  drawingAssumptionsAccepted: boolean
  editHistory: FacadeFlowRealUserConversationalEditRecord[]
  explicitConstructorHandoffCount: number
  sessionOnly: true
  simulationOnly: true
  automaticGeometryAllowed: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface FacadeFlowRealUserProfileRolePreparation {
  role: 'FRAME' | 'SASH' | 'MULLION'
  labelBg: string
  required: boolean
  explicitCode?: string
  prelude60SuggestedCode?: string
  semanticState: 'NOT_REQUIRED' | 'EXPLICIT_REVIEWED_WORKING_SEMANTICS' | 'EXPLICIT_CODE_NOT_REVIEWED' | 'HUMAN_CONFIRMATION_REQUIRED' | 'SYSTEM_NOT_COVERED'
  workingSemantic?: string
  safetyNote: string
}

export interface FacadeFlowRealUserIntegratedSnapshot {
  proposal: FacadeFlowAi03ParametricProposal
  handoff: FacadeFlowAi04ConstructorHandoffResult
  v2: {
    status: FacadeFlowRealUserDrawingReviewStatus
    conceptualDrawingAvailable: boolean
    humanReviewed: boolean
    blockerCount: number
    assumptionCount: number
  }
  v3: {
    conversationalEditingAvailable: true
    editCount: number
    lastEditStatus: FacadeFlowRealUserEditStatus | null
    humanReviewResetAfterEdit: true
  }
  v4: {
    status: 'BLOCKED' | 'READY_FOR_EXPLICIT_CONSTRUCTOR_HANDOFF'
    profileRoles: FacadeFlowRealUserProfileRolePreparation[]
    editableGeometryCandidateAvailable: boolean
    explicitHumanHandoffRequired: true
  }
  v5: {
    status: 'LOCKED'
    blockers: string[]
    rulesValidated: false
    productionCompatibilityValidated: false
    productionUnlockAllowed: false
  }
  v6: {
    status: 'LOCKED'
    blockers: string[]
    futureTargets: readonly ['DWG', 'DXF', 'MACHINE_JOB']
    automaticExportAllowed: false
    machineConnectivityAllowed: false
    machineReady: false
  }
}

const unique = <T,>(items: readonly T[]) => [...new Set(items)]
const clean = (value: string) => value.replace(/\s+/g, ' ').trim()

function cloneIntent(intent: FacadeFlowProductIntent): FacadeFlowProductIntent {
  return {
    ...intent,
    dimensions: { ...intent.dimensions },
    profiles: { ...intent.profiles },
    fields: intent.fields.map((field) => ({
      ...field,
      hardware: field.hardware ? { ...field.hardware } : undefined,
      lowerPanel: field.lowerPanel ? { ...field.lowerPanel, evidenceIds: [...field.lowerPanel.evidenceIds], unresolved: [...field.lowerPanel.unresolved] } : undefined,
      evidenceIds: [...field.evidenceIds],
      unresolved: [...field.unresolved],
    })),
    dividers: intent.dividers.map((divider) => ({ ...divider, evidenceIds: [...divider.evidenceIds], unresolved: [...divider.unresolved] })),
    glazing: { ...intent.glazing },
    finish: { ...intent.finish },
    hardwareDefaults: { ...intent.hardwareDefaults },
    evidence: intent.evidence.map((item) => ({ ...item })),
    unresolved: [...intent.unresolved],
  }
}

export function startFacadeFlowRealUserWorkflowV2V6(workflow: FacadeFlowRealUserWorkflowV1State): FacadeFlowRealUserWorkflowV2V6State {
  const proposal = buildFacadeFlowParametricConstructionProposal(workflow.currentInterpretation.intent)
  return {
    version: REAL_USER_WORKFLOW_V2_V6_VERSION,
    sourceWorkflowVersion: 'REAL_USER_WORKFLOW_V1',
    sourceWorkflowIntentId: workflow.currentInterpretation.intent.id,
    sourceWorkflowText: workflow.augmentedSourceText,
    workingIntent: cloneIntent(workflow.currentInterpretation.intent),
    drawingReviewStatus: proposal.blockers.length ? 'BLOCKED' : 'NEEDS_REVIEW',
    drawingReviewedAt: null,
    drawingAssumptionsAccepted: false,
    editHistory: [],
    explicitConstructorHandoffCount: 0,
    sessionOnly: true,
    simulationOnly: true,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function reviewFacadeFlowRealUserConceptualDrawing(
  state: FacadeFlowRealUserWorkflowV2V6State,
  input: { topologyChecked: boolean; assumptionsAccepted: boolean; reviewedAt?: string },
): FacadeFlowRealUserWorkflowV2V6State {
  const proposal = buildFacadeFlowParametricConstructionProposal(state.workingIntent)
  const reviewed = humanReviewFacadeFlowParametricProposal(proposal, input)
  return {
    ...state,
    drawingReviewStatus: reviewed.status === 'HUMAN_REVIEWED' ? 'HUMAN_REVIEWED' : reviewed.status === 'BLOCKED' ? 'BLOCKED' : 'NEEDS_REVIEW',
    drawingReviewedAt: reviewed.status === 'HUMAN_REVIEWED' ? input.reviewedAt ?? new Date().toISOString() : null,
    drawingAssumptionsAccepted: reviewed.status === 'HUMAN_REVIEWED' ? input.assumptionsAccepted : false,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

function resolveFieldIndex(command: string, fields: readonly FacadeFlowIntentField[]) {
  const explicit = command.match(/(?:поле|field)\s*#?\s*(\d+)/i)
  if (explicit) {
    const index = Number(explicit[1]) - 1
    return index >= 0 && index < fields.length ? index : null
  }
  if (/средн|middle/i.test(command) && fields.length) return Math.floor((fields.length - 1) / 2)
  if (/(лявото|ляво поле|най-ляв|left field|leftmost)/i.test(command) && fields.length) return 0
  if (/(дясното|дясно поле|най-дяс|right field|rightmost)/i.test(command) && fields.length) return fields.length - 1
  return null
}

function nextFieldFromCommand(field: FacadeFlowIntentField, command: string) {
  let next = { ...field, evidenceIds: [...field.evidenceIds], unresolved: [...field.unresolved] }
  const changed: string[] = []
  if (/фиксиран|fixed/i.test(command)) {
    next = { ...next, role: 'FIXED', openingType: 'FIXED', openingDirection: undefined, unresolved: [] }
    changed.push('ROLE', 'OPENING_TYPE', 'DIRECTION')
  } else {
    if (/двуос|tilt\s*[-_/ ]?\s*turn/i.test(command)) {
      next = { ...next, role: 'OPENING_SASH', openingType: 'TILT_TURN' }
      changed.push('ROLE', 'OPENING_TYPE')
    } else if (/(отваряем|едноос|\bturn\b)/i.test(command)) {
      next = { ...next, role: 'OPENING_SASH', openingType: 'TURN' }
      changed.push('ROLE', 'OPENING_TYPE')
    }
    if (/(наляво|\bleft\b|лява посока)/i.test(command)) {
      next = { ...next, openingDirection: 'LEFT' }
      changed.push('DIRECTION')
    }
    if (/(надясно|\bright\b|дясна посока)/i.test(command)) {
      next = { ...next, openingDirection: 'RIGHT' }
      changed.push('DIRECTION')
    }
    if (!changed.includes('DIRECTION') && /\bляво\b/i.test(command) && !/(ляво поле|най-ляв)/i.test(command)) {
      next = { ...next, openingDirection: 'LEFT' }
      changed.push('DIRECTION')
    }
    if (!changed.includes('DIRECTION') && /\bдясно\b/i.test(command) && !/(дясно поле|най-дяс)/i.test(command)) {
      next = { ...next, openingDirection: 'RIGHT' }
      changed.push('DIRECTION')
    }
  }
  return { next, changed: unique(changed) }
}

export function applyFacadeFlowRealUserConversationalEdit(
  state: FacadeFlowRealUserWorkflowV2V6State,
  commandText: string,
  options: { now?: string } = {},
): FacadeFlowRealUserWorkflowV2V6State {
  const command = clean(commandText)
  if (!command) return state
  const intent = cloneIntent(state.workingIntent)
  const changedTargets: string[] = []

  const dimensionMatch = command.match(/(\d{2,5}(?:[.,]\d+)?)\s*(?:x|×|х)\s*(\d{2,5}(?:[.,]\d+)?)\s*(?:mm|мм)?/i)
  if (dimensionMatch) {
    const widthMm = Number(dimensionMatch[1].replace(',', '.'))
    const heightMm = Number(dimensionMatch[2].replace(',', '.'))
    if (Number.isFinite(widthMm) && widthMm > 0 && Number.isFinite(heightMm) && heightMm > 0) {
      intent.dimensions = { widthMm, heightMm }
      changedTargets.push('DIMENSIONS')
    }
  }

  const systemMatch = command.match(/(?:система|system)\s*[:=-]?\s*([A-Za-zА-Яа-я0-9 ._-]{3,40})/i)
  if (systemMatch) {
    const value = clean(systemMatch[1]).replace(/[.,;]+$/, '')
    if (value) {
      intent.profiles.system = value
      changedTargets.push('PROFILE_SYSTEM')
    }
  } else if (/prelude\s*60/i.test(command)) {
    intent.profiles.system = 'PRELUDE 60'
    changedTargets.push('PROFILE_SYSTEM')
  }

  const frameMatch = command.match(/(?:каса|frame)\s*[:=-]?\s*(\d{3}\.\d{2})/i)
  const sashMatch = command.match(/(?:крило|sash)\s*[:=-]?\s*(\d{3}\.\d{2})/i)
  const mullionMatch = command.match(/(?:делител|mullion)\s*[:=-]?\s*(\d{3}\.\d{2})/i)
  if (frameMatch) { intent.profiles.frame = frameMatch[1]; changedTargets.push('PROFILE_FRAME') }
  if (sashMatch) { intent.profiles.sash = sashMatch[1]; changedTargets.push('PROFILE_SASH') }
  if (mullionMatch) { intent.profiles.mullion = mullionMatch[1]; changedTargets.push('PROFILE_MULLION') }

  if (/троен\s+стъклопакет|triple\s+glaz/i.test(command)) {
    intent.glazing.description = 'троен стъклопакет'
    changedTargets.push('GLAZING')
  } else if (/двоен\s+стъклопакет|double\s+glaz/i.test(command)) {
    intent.glazing.description = 'двоен стъклопакет'
    changedTargets.push('GLAZING')
  }

  const handleMatch = command.match(/(?:дръжк(?:а|ата)|handle)\s*(?:да е|=|:)?\s*([A-Za-zА-Яа-я0-9 -]{3,30})/i)
  if (handleMatch) {
    intent.hardwareDefaults.handle = clean(handleMatch[1]).replace(/[.,;]+$/, '')
    changedTargets.push('HANDLE')
  }

  const colorMatch = command.match(/(?:цвят|цветът|color)\s*(?:да е|=|:)?\s*([A-Za-zА-Яа-я0-9 -]{3,30})/i)
  if (colorMatch) {
    const color = clean(colorMatch[1]).replace(/[.,;]+$/, '')
    intent.finish.exterior = color
    intent.finish.interior = color
    changedTargets.push('FINISH')
  }

  const fieldIndex = resolveFieldIndex(command, intent.fields)
  if (fieldIndex !== null) {
    const field = intent.fields[fieldIndex]!
    const edited = nextFieldFromCommand(field, command)
    if (edited.changed.length) {
      intent.fields[fieldIndex] = edited.next
      changedTargets.push(...edited.changed.map((item) => `FIELD:${fieldIndex + 1}:${item}`))
    }
  }

  const now = options.now ?? new Date().toISOString()
  const editId = `${state.sourceWorkflowIntentId}-edit-${state.editHistory.length + 1}`
  if (!changedTargets.length) {
    return {
      ...state,
      editHistory: [...state.editHistory, {
        id: editId,
        command,
        status: 'NEEDS_CLARIFICATION',
        changedTargets: [],
        messageBg: 'Командата не е приложена автоматично. Нужна е по-точна формулировка за поле, размер, профил, стъкло, цвят или дръжка.',
        createdAt: now,
        humanReviewRequired: true,
      }],
    }
  }

  const evidenceId = `${editId}-evidence`
  intent.id = `${state.sourceWorkflowIntentId}-v3-${state.editHistory.length + 1}`
  intent.sourceText = `${clean(intent.sourceText)}. Редакция от човек: ${command}.`
  intent.evidence.push({
    id: evidenceId,
    sourceKind: 'PROMPT',
    sourceName: 'REAL USER WORKFLOW V3 · conversational edit',
    excerpt: command,
    strength: 'EXPLICIT',
  })
  intent.status = 'NEEDS_REVIEW'
  intent.aiGenerated = true
  intent.rulesValidated = false
  intent.automaticGeometryAllowed = false
  intent.machineReady = false
  intent.productionApproved = false

  return {
    ...state,
    workingIntent: intent,
    drawingReviewStatus: 'NEEDS_REVIEW',
    drawingReviewedAt: null,
    drawingAssumptionsAccepted: false,
    editHistory: [...state.editHistory, {
      id: editId,
      command,
      status: 'APPLIED_CANDIDATE',
      changedTargets: unique(changedTargets),
      messageBg: 'Редакцията е приложена само към candidate intent. Conceptual drawing review е нулиран и трябва да се потвърди отново.',
      createdAt: now,
      humanReviewRequired: true,
    }],
    automaticGeometryAllowed: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function markFacadeFlowExplicitConstructorHandoff(state: FacadeFlowRealUserWorkflowV2V6State) {
  if (state.drawingReviewStatus !== 'HUMAN_REVIEWED') return state
  return { ...state, explicitConstructorHandoffCount: state.explicitConstructorHandoffCount + 1 }
}

function prepareRole(input: {
  role: 'FRAME' | 'SASH' | 'MULLION'
  labelBg: string
  required: boolean
  explicitCode?: string
  system?: string
}): FacadeFlowRealUserProfileRolePreparation {
  if (!input.required) return {
    role: input.role, labelBg: input.labelBg, required: false, semanticState: 'NOT_REQUIRED',
    safetyNote: 'Ролята не е нужна за текущата conceptual topology.',
  }
  if (!isExplicitPrelude60System(input.system)) return {
    role: input.role, labelBg: input.labelBg, required: true, explicitCode: input.explicitCode,
    semanticState: 'SYSTEM_NOT_COVERED',
    safetyNote: 'Няма reviewed canonical technical semantics за тази система в PROFILE DATA V1.',
  }
  const suggested = input.role === 'FRAME' ? PRELUDE_60_PROFILE_CODES.frame : input.role === 'SASH' ? PRELUDE_60_PROFILE_CODES.sash : PRELUDE_60_PROFILE_CODES.mullion
  if (!input.explicitCode) return {
    role: input.role, labelBg: input.labelBg, required: true, prelude60SuggestedCode: suggested,
    semanticState: 'HUMAN_CONFIRMATION_REQUIRED',
    safetyNote: `PRELUDE 60 knowledge предлага ${suggested} само като human-confirmation candidate. Автоматичен избор: НЕ.`,
  }
  const resolved = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: input.explicitCode, role: input.role })
  if (resolved.state !== 'RESOLVED_HUMAN_CONFIRMED' || !resolved.semantics) return {
    role: input.role, labelBg: input.labelBg, required: true, explicitCode: input.explicitCode, prelude60SuggestedCode: suggested,
    semanticState: 'EXPLICIT_CODE_NOT_REVIEWED',
    safetyNote: `Кодът ${input.explicitCode} не е resolved human-confirmed technical semantic за ролята ${input.role}.`,
  }
  const semantics = resolved.semantics
  return {
    role: input.role,
    labelBg: input.labelBg,
    required: true,
    explicitCode: input.explicitCode,
    prelude60SuggestedCode: suggested,
    semanticState: 'EXPLICIT_REVIEWED_WORKING_SEMANTICS',
    workingSemantic: `${semantics.workingDimensions.fullWorkingDimensionMm} mm работен размер · ${semantics.workingDimensions.visibleWidthMm} mm видима ширина`,
    safetyNote: 'Human-confirmed working semantics only; exact contour, deductions and manufacturing tolerances are NOT established.',
  }
}

export function buildFacadeFlowRealUserIntegratedSnapshot(
  state: FacadeFlowRealUserWorkflowV2V6State,
  profiles: CatalogueProfile[],
): FacadeFlowRealUserIntegratedSnapshot {
  const draftProposal = buildFacadeFlowParametricConstructionProposal(state.workingIntent)
  const proposal = state.drawingReviewStatus === 'HUMAN_REVIEWED'
    ? humanReviewFacadeFlowParametricProposal(draftProposal, { topologyChecked: true, assumptionsAccepted: state.drawingAssumptionsAccepted })
    : draftProposal
  const handoff = buildFacadeFlowAi04ConstructorHandoff(proposal, profiles)
  const needsSash = proposal.fields.some((field) => field.role === 'OPENING_SASH')
  const needsMullion = proposal.dividers.length > 0
  const profileRoles = [
    prepareRole({ role: 'FRAME', labelBg: 'Каса', required: true, explicitCode: state.workingIntent.profiles.frame, system: state.workingIntent.profiles.system }),
    prepareRole({ role: 'SASH', labelBg: 'Крило', required: needsSash, explicitCode: state.workingIntent.profiles.sash, system: state.workingIntent.profiles.system }),
    prepareRole({ role: 'MULLION', labelBg: 'Делител', required: needsMullion, explicitCode: state.workingIntent.profiles.mullion, system: state.workingIntent.profiles.system }),
  ]
  const v4Ready = state.drawingReviewStatus === 'HUMAN_REVIEWED' && handoff.status === 'READY'

  const productionBlockers = unique([
    state.drawingReviewStatus !== 'HUMAN_REVIEWED' ? 'Conceptual drawing topology is not human reviewed.' : '',
    handoff.status !== 'READY' ? 'Editable constructor handoff is not ready.' : '',
    'RULES VALIDATED = NO. Current checkpoint does not contain a production-validated rule set for this product.',
    'PROFILE DATA V1 working semantics do not establish manufacturer assembly compatibility.',
    'Exact joint geometry is not validated.',
    'Production deductions are not validated.',
    'Manufacturing tolerances are not validated.',
  ].filter(Boolean))
  const manufacturingBlockers = unique([
    ...productionBlockers,
    'Production validation gate is locked.',
    'No production-approved DWG/DXF manufacturing writer is enabled.',
    'No machine connectivity or machine-job contract is enabled.',
  ])

  return {
    proposal,
    handoff,
    v2: {
      status: state.drawingReviewStatus,
      conceptualDrawingAvailable: draftProposal.blockers.length === 0,
      humanReviewed: state.drawingReviewStatus === 'HUMAN_REVIEWED',
      blockerCount: draftProposal.blockers.length,
      assumptionCount: draftProposal.assumptions.length,
    },
    v3: {
      conversationalEditingAvailable: true,
      editCount: state.editHistory.length,
      lastEditStatus: state.editHistory.at(-1)?.status ?? null,
      humanReviewResetAfterEdit: true,
    },
    v4: {
      status: v4Ready ? 'READY_FOR_EXPLICIT_CONSTRUCTOR_HANDOFF' : 'BLOCKED',
      profileRoles,
      editableGeometryCandidateAvailable: handoff.editableGeometryCreated,
      explicitHumanHandoffRequired: true,
    },
    v5: {
      status: 'LOCKED',
      blockers: productionBlockers,
      rulesValidated: false,
      productionCompatibilityValidated: false,
      productionUnlockAllowed: false,
    },
    v6: {
      status: 'LOCKED',
      blockers: manufacturingBlockers,
      futureTargets: ['DWG', 'DXF', 'MACHINE_JOB'],
      automaticExportAllowed: false,
      machineConnectivityAllowed: false,
      machineReady: false,
    },
  }
}
