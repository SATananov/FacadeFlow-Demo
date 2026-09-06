export type AiPromptKnowledgeCorpus04Track =
  | 'MULTI_PRODUCT_EXPLICIT'
  | 'ORDINAL_CORRECTION'
  | 'GROUP_REFERENCE_OVERRIDE'
  | 'AMBIGUOUS_REFERENCE_SAFETY'

export interface AiPromptKnowledgeCorpus04ExpectedItem {
  order: number
  category: 'WINDOW' | 'DOOR'
  mark: string
  quantity: number
  widthMm: number
  heightMm: number
  finishIncludes: string
  glazingIncludes: string
  correctionCount?: number
}

export interface AiPromptKnowledgeCorpus04Case {
  id: string
  track: AiPromptKnowledgeCorpus04Track
  prompt: string
  expectedItems: AiPromptKnowledgeCorpus04ExpectedItem[]
  unresolvedOrderReferenceCount: number
  tags: string[]
}

const pad = (value: number) => String(value).padStart(3, '0')
const FRAME = '482.30'
const SASH = '482.05'
const MULLION = '482.21'

function windowText(mark: string, quantity: number, width: number, height: number, ral: string, glazing: 'двоен' | 'троен' = 'двоен') {
  return `${quantity} бр. прозорец ${mark} ${width}x${height} mm, PRELUDE 60, каса ${FRAME}, крило ${SASH}, делител ${MULLION}, 2 полета: първо fixed, второ tilt-turn надясно, ${glazing} стъклопакет, RAL ${ral}, черна дръжка, 3 скрити панти`
}

function doorText(mark: string, quantity: number, width: number, height: number, ral: string, glazing: 'двоен' | 'троен' = 'двоен') {
  return `${quantity} бр. врата ${mark} ${width}x${height} mm, PRELUDE 60, каса ${FRAME}, крило ${SASH}, еднокрила, turn надясно, ${glazing} стъклопакет, RAL ${ral}, черна дръжка, 3 скрити панти, праг нисък алуминиев`
}

function explicitCase(index: number): AiPromptKnowledgeCorpus04Case {
  const w1 = 1200 + index * 5
  const w2 = 1400 + index * 5
  const h1 = 1300 + (index % 10) * 10
  const h2 = 2100 + (index % 8) * 10
  const mark1 = `W-${400 + index}`
  const mark2 = `D-${400 + index}`
  const q1 = (index % 3) + 1
  const q2 = (index % 2) + 1
  return {
    id: `CP4-EXP-${pad(index)}`,
    track: 'MULTI_PRODUCT_EXPLICIT',
    prompt: `Поръчка: Изделие 1: ${windowText(mark1, q1, w1, h1, '7016')}; Изделие 2: ${doorText(mark2, q2, w2, h2, '9016')}`,
    expectedItems: [
      { order: 1, category: 'WINDOW', mark: mark1, quantity: q1, widthMm: w1, heightMm: h1, finishIncludes: '7016', glazingIncludes: 'двоен' },
      { order: 2, category: 'DOOR', mark: mark2, quantity: q2, widthMm: w2, heightMm: h2, finishIncludes: '9016', glazingIncludes: 'двоен' },
    ],
    unresolvedOrderReferenceCount: 0,
    tags: ['multi-product', 'quantity-groups', 'no-leakage'],
  }
}

function ordinalCorrectionCase(index: number): AiPromptKnowledgeCorpus04Case {
  const base = 1250 + index * 5
  const correctedWidth = 1650 + index * 5
  const correctedHeight = 1450 + (index % 9) * 10
  const marks = [`W-${500 + index}`, `W-${600 + index}`, `D-${500 + index}`]
  const language = index % 2 === 0
    ? `Корекция: второто да стане ${correctedWidth}x${correctedHeight} mm и RAL 9016`
    : `Correction: second item ${correctedWidth}x${correctedHeight} mm and RAL 9016`
  return {
    id: `CP4-ORD-${pad(index)}`,
    track: 'ORDINAL_CORRECTION',
    prompt: `Изделие 1: ${windowText(marks[0], 1, base, 1300, '7016')}; Изделие 2: ${windowText(marks[1], 1, base + 100, 1400, '7016')}; Изделие 3: ${doorText(marks[2], 1, 950, 2100, '7016')}; ${language}`,
    expectedItems: [
      { order: 1, category: 'WINDOW', mark: marks[0], quantity: 1, widthMm: base, heightMm: 1300, finishIncludes: '7016', glazingIncludes: 'двоен', correctionCount: 0 },
      { order: 2, category: 'WINDOW', mark: marks[1], quantity: 1, widthMm: correctedWidth, heightMm: correctedHeight, finishIncludes: '9016', glazingIncludes: 'двоен', correctionCount: 1 },
      { order: 3, category: 'DOOR', mark: marks[2], quantity: 1, widthMm: 950, heightMm: 2100, finishIncludes: '7016', glazingIncludes: 'двоен', correctionCount: 0 },
    ],
    unresolvedOrderReferenceCount: 0,
    tags: ['ordinal-reference', 'correction', 'no-cross-item-leakage'],
  }
}

function groupOverrideCase(index: number): AiPromptKnowledgeCorpus04Case {
  const marks = [`W-${700 + index}`, `W-${800 + index}`, `W-${900 + index}`, `D-${700 + index}`]
  const language = index % 2 === 0
    ? 'Корекция: последните два да са RAL 9016 и троен стъклопакет'
    : 'Correction: last two products RAL 9016 and triple glazing'
  return {
    id: `CP4-GRP-${pad(index)}`,
    track: 'GROUP_REFERENCE_OVERRIDE',
    prompt: `Item 1: ${windowText(marks[0], 1, 1100 + index, 1200, '7016')}; Item 2: ${windowText(marks[1], 2, 1200 + index, 1300, '7016')}; Item 3: ${windowText(marks[2], 1, 1300 + index, 1400, '7016')}; Item 4: ${doorText(marks[3], 1, 1000, 2200, '7016')}; ${language}`,
    expectedItems: [
      { order: 1, category: 'WINDOW', mark: marks[0], quantity: 1, widthMm: 1100 + index, heightMm: 1200, finishIncludes: '7016', glazingIncludes: 'двоен', correctionCount: 0 },
      { order: 2, category: 'WINDOW', mark: marks[1], quantity: 2, widthMm: 1200 + index, heightMm: 1300, finishIncludes: '7016', glazingIncludes: 'двоен', correctionCount: 0 },
      { order: 3, category: 'WINDOW', mark: marks[2], quantity: 1, widthMm: 1300 + index, heightMm: 1400, finishIncludes: '9016', glazingIncludes: index % 2 === 0 ? 'троен' : 'triple', correctionCount: 1 },
      { order: 4, category: 'DOOR', mark: marks[3], quantity: 1, widthMm: 1000, heightMm: 2200, finishIncludes: '9016', glazingIncludes: index % 2 === 0 ? 'троен' : 'triple', correctionCount: 1 },
    ],
    unresolvedOrderReferenceCount: 0,
    tags: ['group-reference', 'last-two', 'bounded-propagation'],
  }
}

function ambiguousReferenceCase(index: number): AiPromptKnowledgeCorpus04Case {
  const marks = [`W-${1000 + index}`, `W-${1100 + index}`, `D-${1000 + index}`]
  const vague = index % 2 === 0
    ? 'Корекция: промени го на RAL 9016'
    : 'Correction: make it RAL 9016'
  return {
    id: `CP4-AMB-${pad(index)}`,
    track: 'AMBIGUOUS_REFERENCE_SAFETY',
    prompt: `Изделие 1: ${windowText(marks[0], 1, 1200 + index, 1300, '7016')}; Изделие 2: ${windowText(marks[1], 1, 1400 + index, 1500, '7016')}; Изделие 3: ${doorText(marks[2], 1, 950, 2150, '7016')}; ${vague}`,
    expectedItems: [
      { order: 1, category: 'WINDOW', mark: marks[0], quantity: 1, widthMm: 1200 + index, heightMm: 1300, finishIncludes: '7016', glazingIncludes: 'двоен', correctionCount: 0 },
      { order: 2, category: 'WINDOW', mark: marks[1], quantity: 1, widthMm: 1400 + index, heightMm: 1500, finishIncludes: '7016', glazingIncludes: 'двоен', correctionCount: 0 },
      { order: 3, category: 'DOOR', mark: marks[2], quantity: 1, widthMm: 950, heightMm: 2150, finishIncludes: '7016', glazingIncludes: 'двоен', correctionCount: 0 },
    ],
    unresolvedOrderReferenceCount: 1,
    tags: ['ambiguous-reference', 'no-guess', 'human-review'],
  }
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_04: AiPromptKnowledgeCorpus04Case[] = [
  ...Array.from({ length: 50 }, (_, index) => explicitCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => ordinalCorrectionCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => groupOverrideCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => ambiguousReferenceCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_04_EXPECTED_COUNTS = {
  TOTAL: 200,
  MULTI_PRODUCT_EXPLICIT: 50,
  ORDINAL_CORRECTION: 50,
  GROUP_REFERENCE_OVERRIDE: 50,
  AMBIGUOUS_REFERENCE_SAFETY: 50,
} as const
