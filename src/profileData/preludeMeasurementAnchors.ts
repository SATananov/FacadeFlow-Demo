import type { PreludeTechnicalProfileCode, PreludeTechnicalProfileRecord } from './preludeTechnicalInspector'
import { PRELUDE_TECHNICAL_PROFILES } from './preludeTechnicalInspector'

export const PRELUDE_MEASUREMENT_ANCHOR_VERSION = 'AI_WORKSPACE_REBUILD_04' as const

export type PreludeMeasurementAnchorKind = 'WORKING_TOTAL' | 'VISIBLE_WIDTH' | 'DEDUCTION_ZONE'
export type PreludeMeasurementAnchorBindingState = 'SEMANTIC_ONLY_NOT_BOUND_TO_CONTOUR'

export interface PreludeMeasurementAnchorCandidate {
  id: string
  profileCode: PreludeTechnicalProfileCode
  kind: PreludeMeasurementAnchorKind
  labelBg: string
  valueMm: number
  side: 'TOTAL' | 'VISIBLE' | 'A' | 'B'
  evidence: 'HUMAN_CONFIRMED_MEASUREMENT_SEMANTICS'
  bindingState: PreludeMeasurementAnchorBindingState
  startPoint: null
  endPoint: null
  humanGeometryReviewRequired: true
  appliesToProductionAutomatically: false
  machineReady: false
  productionApproved: false
}

function candidatesForProfile(profile: PreludeTechnicalProfileRecord): readonly PreludeMeasurementAnchorCandidate[] {
  const semantics = profile.humanConfirmedWorkingSemantics
  const items: PreludeMeasurementAnchorCandidate[] = [
    {
      id: `${profile.code}-working-total`,
      profileCode: profile.code,
      kind: 'WORKING_TOTAL',
      labelBg: 'Пълен работен размер',
      valueMm: semantics.fullWorkingMm,
      side: 'TOTAL',
      evidence: 'HUMAN_CONFIRMED_MEASUREMENT_SEMANTICS',
      bindingState: 'SEMANTIC_ONLY_NOT_BOUND_TO_CONTOUR',
      startPoint: null,
      endPoint: null,
      humanGeometryReviewRequired: true,
      appliesToProductionAutomatically: false,
      machineReady: false,
      productionApproved: false,
    },
    {
      id: `${profile.code}-visible-width`,
      profileCode: profile.code,
      kind: 'VISIBLE_WIDTH',
      labelBg: 'Видима ширина',
      valueMm: semantics.visibleMm,
      side: 'VISIBLE',
      evidence: 'HUMAN_CONFIRMED_MEASUREMENT_SEMANTICS',
      bindingState: 'SEMANTIC_ONLY_NOT_BOUND_TO_CONTOUR',
      startPoint: null,
      endPoint: null,
      humanGeometryReviewRequired: true,
      appliesToProductionAutomatically: false,
      machineReady: false,
      productionApproved: false,
    },
  ]
  for (let index = 0; index < semantics.zoneSides; index += 1) {
    items.push({
      id: `${profile.code}-deduction-${index + 1}`,
      profileCode: profile.code,
      kind: 'DEDUCTION_ZONE',
      labelBg: semantics.zoneSides === 2 ? `Работна странична зона ${index === 0 ? 'A' : 'B'}` : 'Работна зона към държателя / невидима зона',
      valueMm: semantics.zoneMm,
      side: index === 0 ? 'A' : 'B',
      evidence: 'HUMAN_CONFIRMED_MEASUREMENT_SEMANTICS',
      bindingState: 'SEMANTIC_ONLY_NOT_BOUND_TO_CONTOUR',
      startPoint: null,
      endPoint: null,
      humanGeometryReviewRequired: true,
      appliesToProductionAutomatically: false,
      machineReady: false,
      productionApproved: false,
    })
  }
  return Object.freeze(items.map((item) => Object.freeze(item)))
}

export const PRELUDE_MEASUREMENT_ANCHOR_CANDIDATES: Readonly<Record<PreludeTechnicalProfileCode, readonly PreludeMeasurementAnchorCandidate[]>> = Object.freeze(
  Object.fromEntries(PRELUDE_TECHNICAL_PROFILES.map((profile) => [profile.code, candidatesForProfile(profile)])) as Record<PreludeTechnicalProfileCode, readonly PreludeMeasurementAnchorCandidate[]>,
)

export const PRELUDE_MEASUREMENT_ANCHOR_SAFETY = Object.freeze({
  humanConfirmedMeasurementSemantics: true,
  geometricAnchorPointsValidated: false,
  anchorCoordinatesPresent: false,
  assemblyAnchorsValidated: false,
  productionContourValidated: false,
  automaticGeometryAllowed: false,
  machineReady: false,
  productionApproved: false,
})
