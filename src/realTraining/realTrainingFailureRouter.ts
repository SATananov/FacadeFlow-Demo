export const FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION = 'REAL_TRAINING_FAILURE_ROUTER_01' as const

export type FacadeFlowRealTrainingFailureDomain =
  | 'NONE'
  | 'DOCUMENT_STRUCTURE'
  | 'PROMPT_LANGUAGE'
  | 'CONSTRUCTION_SEMANTICS'
  | 'PROFILE_KNOWLEDGE'
  | 'HUMAN_CONFIRMATION'

export type FacadeFlowRealTrainingNextLayer =
  | 'NO_CHANGE'
  | 'REAL_DATA_EXTRACTOR'
  | 'NEXT_PROMPT_CORPUS'
  | 'AI05'
  | 'PROFILE_DATA'
  | 'HUMAN_REVIEW'

export interface FacadeFlowRealTrainingFailureSignals {
  documentStructurePassed: boolean
  promptLanguagePassed: boolean
  constructionSemanticsPassed: boolean
  requiredProfileKnowledgeAvailable: boolean
  humanConfirmationComplete: boolean
}

export interface FacadeFlowRealTrainingFailureRoute {
  version: typeof FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION
  domain: FacadeFlowRealTrainingFailureDomain
  nextLayer: FacadeFlowRealTrainingNextLayer
  createNewPromptCorpusCase: boolean
  reasonBg: string
  automaticProductionChangeAllowed: false
}

export function routeFacadeFlowRealTrainingFailure(signals: FacadeFlowRealTrainingFailureSignals): FacadeFlowRealTrainingFailureRoute {
  if (!signals.documentStructurePassed) return {
    version: FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION,
    domain: 'DOCUMENT_STRUCTURE',
    nextLayer: 'REAL_DATA_EXTRACTOR',
    createNewPromptCorpusCase: false,
    reasonBg: 'Проблемът е в разчитането на реалния документ; не се създава prompt corpus случай по предположение.',
    automaticProductionChangeAllowed: false,
  }
  if (!signals.promptLanguagePassed) return {
    version: FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION,
    domain: 'PROMPT_LANGUAGE',
    nextLayer: 'NEXT_PROMPT_CORPUS',
    createNewPromptCorpusCase: true,
    reasonBg: 'Реален езиков FAIL е потвърден; следващ Corpus се създава от конкретния проблем, без частен текст.',
    automaticProductionChangeAllowed: false,
  }
  if (!signals.constructionSemanticsPassed) return {
    version: FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION,
    domain: 'CONSTRUCTION_SEMANTICS',
    nextLayer: 'AI05',
    createNewPromptCorpusCase: false,
    reasonBg: 'Езикът е разбран, но конструктивната семантика/чертежът е грешен; поправя се AI05.',
    automaticProductionChangeAllowed: false,
  }
  if (!signals.requiredProfileKnowledgeAvailable) return {
    version: FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION,
    domain: 'PROFILE_KNOWLEDGE',
    nextLayer: 'PROFILE_DATA',
    createNewPromptCorpusCase: false,
    reasonBg: 'Липсва потвърдено профилно знание; допълва се PROFILE DATA с отделна provenance проверка.',
    automaticProductionChangeAllowed: false,
  }
  if (!signals.humanConfirmationComplete) return {
    version: FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION,
    domain: 'HUMAN_CONFIRMATION',
    nextLayer: 'HUMAN_REVIEW',
    createNewPromptCorpusCase: false,
    reasonBg: 'Техническият резултат още чака човешко потвърждение и не става training truth автоматично.',
    automaticProductionChangeAllowed: false,
  }
  return {
    version: FACADEFLOW_REAL_TRAINING_FAILURE_ROUTER_VERSION,
    domain: 'NONE',
    nextLayer: 'NO_CHANGE',
    createNewPromptCorpusCase: false,
    reasonBg: 'Случаят е преминал текущите training gates; може да бъде включен само в curated human-confirmed dataset.',
    automaticProductionChangeAllowed: false,
  }
}
