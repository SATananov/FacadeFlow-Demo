export type AiPromptKnowledgeCorpus05Track =
  | 'OFFER_DEFAULTS_INHERITANCE'
  | 'MODULE_LOCAL_OVERRIDE'
  | 'OFFER_DEFAULT_REVISION'
  | 'AMBIGUOUS_SCOPE_SAFETY'

export interface AiPromptKnowledgeCorpus05ModuleExpectation {
  moduleNumber: number
  category: 'WINDOW' | 'DOOR'
  mark: string
  widthMm: number
  heightMm: number
  systemIncludes: string
  finishIncludes: string
  glazingIncludes: string
  hardwareIncludes: string
  inheritedFields: string[]
  explicitOverrideFields: string[]
  correctionCount: number
}

export interface AiPromptKnowledgeCorpus05Case {
  id: string
  track: AiPromptKnowledgeCorpus05Track
  prompt: string
  offerReference: string
  customerName: string
  expectedModules: AiPromptKnowledgeCorpus05ModuleExpectation[]
  unresolvedOfferReferenceCount: number
  offerCorrectionCount: number
  tags: string[]
}

const pad = (value: number) => String(value).padStart(3, '0')

function windowModule(mark: string, widthMm: number, heightMm: number) {
  return `прозорец ${mark}, ${widthMm} x ${heightMm} mm, 2 полета, лявото fixed, дясното tilt-turn надясно`
}

function doorModule(mark: string, widthMm: number, heightMm: number) {
  return `врата ${mark}, ${widthMm} x ${heightMm} mm, еднокрила, turn надясно`
}

function baseHeader(index: number) {
  const offerReference = `OF-${1000 + index}`
  const customerName = `Клиент-${pad(index)}`
  const defaults = index % 2 === 0
    ? 'Общи настройки: система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков: HW-A'
    : 'Offer defaults: system PRELUDE 60, RAL 7016, double glazing, hardware: HW-A'
  return { offerReference, customerName, header: `Оферта: ${offerReference}; Клиент: ${customerName}; ${defaults}` }
}

function marks(index: number) {
  return [`W-${2000 + index}`, `W-${3000 + index}`, `D-${2000 + index}`]
}

const allDefaultFields = ['system', 'finish', 'glazing', 'hardware']

function defaultInheritanceCase(index: number): AiPromptKnowledgeCorpus05Case {
  const header = baseHeader(index)
  const [mark1, mark2, mark3] = marks(index)
  const width1 = 1200 + index
  const width2 = 1400 + index
  return {
    id: `CP5-DEF-${pad(index)}`,
    track: 'OFFER_DEFAULTS_INHERITANCE',
    prompt: `${header.header}; Модул 1: ${windowModule(mark1, width1, 1300)}; Модул 2: ${windowModule(mark2, width2, 1500)}; Модул 3: ${doorModule(mark3, 950, 2150)}`,
    offerReference: header.offerReference,
    customerName: header.customerName,
    expectedModules: [
      { moduleNumber: 1, category: 'WINDOW', mark: mark1, widthMm: width1, heightMm: 1300, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
      { moduleNumber: 2, category: 'WINDOW', mark: mark2, widthMm: width2, heightMm: 1500, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
      { moduleNumber: 3, category: 'DOOR', mark: mark3, widthMm: 950, heightMm: 2150, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
    ],
    unresolvedOfferReferenceCount: 0,
    offerCorrectionCount: 0,
    tags: ['offer-defaults', 'module-inheritance', 'no-leakage'],
  }
}

function localOverrideCase(index: number): AiPromptKnowledgeCorpus05Case {
  const header = baseHeader(100 + index)
  const [mark1, mark2, mark3] = marks(100 + index)
  const width1 = 1250 + index
  const width2 = 1450 + index
  return {
    id: `CP5-OVR-${pad(index)}`,
    track: 'MODULE_LOCAL_OVERRIDE',
    prompt: `${header.header}; Модул 1: ${windowModule(mark1, width1, 1320)}; Модул 2: ${windowModule(mark2, width2, 1520)}, цвят RAL 9016, троен стъклопакет, обков: HW-B; Модул 3: ${doorModule(mark3, 960, 2160)}`,
    offerReference: header.offerReference,
    customerName: header.customerName,
    expectedModules: [
      { moduleNumber: 1, category: 'WINDOW', mark: mark1, widthMm: width1, heightMm: 1320, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
      { moduleNumber: 2, category: 'WINDOW', mark: mark2, widthMm: width2, heightMm: 1520, systemIncludes: 'PRELUDE 60', finishIncludes: '9016', glazingIncludes: 'троен', hardwareIncludes: 'HW-B', inheritedFields: ['system'], explicitOverrideFields: ['finish', 'glazing', 'hardware'], correctionCount: 0 },
      { moduleNumber: 3, category: 'DOOR', mark: mark3, widthMm: 960, heightMm: 2160, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
    ],
    unresolvedOfferReferenceCount: 0,
    offerCorrectionCount: 0,
    tags: ['module-override', 'bounded-scope', 'no-property-leakage'],
  }
}

function offerRevisionCase(index: number): AiPromptKnowledgeCorpus05Case {
  const header = baseHeader(200 + index)
  const [mark1, mark2, mark3] = marks(200 + index)
  const width1 = 1300 + index
  const width2 = 1500 + index
  const variant = index % 3

  let module2Extra: string
  let correction: string
  let expectedDefaultFinish = '7016'
  let expectedDefaultGlazing = index % 2 === 0 ? 'двоен' : 'double'
  let expectedDefaultHardware = 'HW-A'
  let module2Finish = '7016'
  let module2Glazing = expectedDefaultGlazing
  let module2Hardware = 'HW-A'
  let module2Inherited = ['system', 'glazing', 'hardware']
  let module2Overrides = ['finish']

  if (variant === 0) {
    module2Extra = 'цвят RAL 9016'
    correction = 'Корекция: общите настройки: цвят RAL 9005'
    expectedDefaultFinish = '9005'
    module2Finish = '9016'
  } else if (variant === 1) {
    module2Extra = 'двоен стъклопакет'
    correction = 'Correction: for the whole offer: triple glazing'
    expectedDefaultGlazing = 'triple'
    module2Glazing = 'двоен'
    module2Inherited = ['system', 'finish', 'hardware']
    module2Overrides = ['glazing']
  } else {
    module2Extra = 'обков: HW-B'
    correction = 'Корекция: за цялата оферта: обков: HW-C'
    expectedDefaultHardware = 'HW-C'
    module2Hardware = 'HW-B'
    module2Inherited = ['system', 'finish', 'glazing']
    module2Overrides = ['hardware']
  }

  return {
    id: `CP5-REV-${pad(index)}`,
    track: 'OFFER_DEFAULT_REVISION',
    prompt: `${header.header}; Модул 1: ${windowModule(mark1, width1, 1340)}; Модул 2: ${windowModule(mark2, width2, 1540)}, ${module2Extra}; Модул 3: ${doorModule(mark3, 970, 2170)}; ${correction}`,
    offerReference: header.offerReference,
    customerName: header.customerName,
    expectedModules: [
      { moduleNumber: 1, category: 'WINDOW', mark: mark1, widthMm: width1, heightMm: 1340, systemIncludes: 'PRELUDE 60', finishIncludes: expectedDefaultFinish, glazingIncludes: expectedDefaultGlazing, hardwareIncludes: expectedDefaultHardware, inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
      { moduleNumber: 2, category: 'WINDOW', mark: mark2, widthMm: width2, heightMm: 1540, systemIncludes: 'PRELUDE 60', finishIncludes: module2Finish, glazingIncludes: module2Glazing, hardwareIncludes: module2Hardware, inheritedFields: module2Inherited, explicitOverrideFields: module2Overrides, correctionCount: 0 },
      { moduleNumber: 3, category: 'DOOR', mark: mark3, widthMm: 970, heightMm: 2170, systemIncludes: 'PRELUDE 60', finishIncludes: expectedDefaultFinish, glazingIncludes: expectedDefaultGlazing, hardwareIncludes: expectedDefaultHardware, inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
    ],
    unresolvedOfferReferenceCount: 0,
    offerCorrectionCount: 1,
    tags: ['offer-default-revision', 'explicit-module-wins', 'inheritance-recompute'],
  }
}

function ambiguousScopeCase(index: number): AiPromptKnowledgeCorpus05Case {
  const header = baseHeader(300 + index)
  const [mark1, mark2, mark3] = marks(300 + index)
  const width1 = 1350 + index
  const width2 = 1550 + index
  const variant = index % 3
  const correction = variant === 0
    ? 'Корекция: цвят RAL 9005'
    : variant === 1
      ? 'Correction: triple glazing'
      : 'Корекция: обков: HW-C'
  return {
    id: `CP5-AMB-${pad(index)}`,
    track: 'AMBIGUOUS_SCOPE_SAFETY',
    prompt: `${header.header}; Модул 1: ${windowModule(mark1, width1, 1360)}; Модул 2: ${windowModule(mark2, width2, 1560)}; Модул 3: ${doorModule(mark3, 980, 2180)}; ${correction}`,
    offerReference: header.offerReference,
    customerName: header.customerName,
    expectedModules: [
      { moduleNumber: 1, category: 'WINDOW', mark: mark1, widthMm: width1, heightMm: 1360, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
      { moduleNumber: 2, category: 'WINDOW', mark: mark2, widthMm: width2, heightMm: 1560, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
      { moduleNumber: 3, category: 'DOOR', mark: mark3, widthMm: 980, heightMm: 2180, systemIncludes: 'PRELUDE 60', finishIncludes: '7016', glazingIncludes: index % 2 === 0 ? 'двоен' : 'double', hardwareIncludes: 'HW-A', inheritedFields: allDefaultFields, explicitOverrideFields: [], correctionCount: 0 },
    ],
    unresolvedOfferReferenceCount: 1,
    offerCorrectionCount: 0,
    tags: ['ambiguous-scope', 'no-guess', 'human-review'],
  }
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_05: AiPromptKnowledgeCorpus05Case[] = [
  ...Array.from({ length: 50 }, (_, index) => defaultInheritanceCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => localOverrideCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => offerRevisionCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => ambiguousScopeCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_05_EXPECTED_COUNTS = {
  TOTAL: 200,
  OFFER_DEFAULTS_INHERITANCE: 50,
  MODULE_LOCAL_OVERRIDE: 50,
  OFFER_DEFAULT_REVISION: 50,
  AMBIGUOUS_SCOPE_SAFETY: 50,
} as const
