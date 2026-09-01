import { facadeFlowPromptIntentToGuidedPatch } from './aiPromptGuidedBridge'
import type { FacadeFlowProductIntent } from './aiProductIntent'
import type { FacadeFlowGuidedProductDraft } from './aiWorkspaceTypes'
import type { CatalogueProfile } from './profileCatalogueTypes'

export interface FacadeFlowDocumentGuidedBridgeResult {
  schemaVersion: 'AI02.3'
  patch: Partial<FacadeFlowGuidedProductDraft>
  transferred: string[]
  notTransferred: string[]
  humanReviewRequired: true
  sourceEvidenceRequired: true
  automaticGeometryAllowed: false
  rulesValidated: false
  simulationOnly: true
  machineReady: false
}

export function facadeFlowDocumentIntentToGuidedPatch(intent: FacadeFlowProductIntent, profiles: CatalogueProfile[]): FacadeFlowDocumentGuidedBridgeResult {
  const base = facadeFlowPromptIntentToGuidedPatch(intent, profiles)
  const sourceSummary = intent.evidence.map((item) => `${item.sourceName}${item.location ? ` · ${item.location}` : ''}`).join('\n')
  const notTransferred = [...base.notTransferred]
  if (intent.unresolved.length) notTransferred.push(`НЕУТОЧНЕНО ОТ ДОКУМЕНТИТЕ: ${intent.unresolved.join('; ')}`)
  const notes = [
    'AI02 DOCUMENT SOURCE — локално deterministic извличане; изисква човешка проверка.',
    sourceSummary,
    intent.sourceText,
    notTransferred.length ? `НЕПРЕХВЪРЛЕНО: ${notTransferred.join(' ')}` : '',
  ].filter(Boolean).join('\n')
  return {
    schemaVersion: 'AI02.3',
    patch: { ...base.patch, notes, reviewAccepted: false, status: 'NEEDS_REVIEW' },
    transferred: [...base.transferred.filter((item) => item !== 'Източник / бележки'), 'Документален provenance / бележки'],
    notTransferred,
    humanReviewRequired: true,
    sourceEvidenceRequired: true,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    simulationOnly: true,
    machineReady: false,
  }
}
