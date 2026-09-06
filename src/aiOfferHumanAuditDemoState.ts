import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
  type FacadeFlowOfferCompletenessReviewRuntime,
} from './aiPromptOfferCompletenessReviewRuntime'
import type { FacadeFlowOfferCustomerDetails } from './aiOfferPartyDetails'

export const FACADEFLOW_HUMAN_AUDIT_DEMO_SOURCE = [
  'Нова оферта.',
  'Система PRELUDE 60.',
  'Цвят RAL 7016.',
  'Двоен стъклопакет.',
  'Обков ROTO NX.',
].join('\n')

export const FACADEFLOW_HUMAN_AUDIT_DEMO_CUSTOMER: Readonly<FacadeFlowOfferCustomerDetails> = Object.freeze({
  kind: 'PERSON',
  name: 'Иван Иванов',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  projectAddress: '',
})

export const FACADEFLOW_HUMAN_AUDIT_DEMO_COMMANDS = Object.freeze([
  'Модул 1, 3 броя, каса 1200 х 1400 mm',
  'Раздели Модул 1 вертикално на 3 равни части',
  'Клетка 2 е фиксирана',
  'Постави крило в клетка 3, отваряемо и падащо, дясно',
  'Клетка 4 е фиксирана',
] as const)

export interface FacadeFlowHumanAuditDemoState {
  runtime: FacadeFlowOfferCompletenessReviewRuntime
  customer: FacadeFlowOfferCustomerDetails
  selectedModuleNumber: number
}

export function createFacadeFlowHumanAuditDemoState(
  interpretationId = 'human-audit-demo',
): FacadeFlowHumanAuditDemoState {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime(
    FACADEFLOW_HUMAN_AUDIT_DEMO_SOURCE,
    interpretationId,
  )

  for (const command of FACADEFLOW_HUMAN_AUDIT_DEMO_COMMANDS) {
    runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, command)
  }

  return {
    runtime,
    customer: { ...FACADEFLOW_HUMAN_AUDIT_DEMO_CUSTOMER },
    selectedModuleNumber: 1,
  }
}
