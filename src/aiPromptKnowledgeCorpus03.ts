import type {
  FacadeFlowIntentFieldRole,
  FacadeFlowIntentOpeningDirection,
  FacadeFlowIntentOpeningType,
  FacadeFlowIntentSwing,
  FacadeFlowProductIntentCategory,
} from './aiProductIntent'

export type AiPromptKnowledgeCorpus03Track =
  | 'COMPOSITE_COMPLETE'
  | 'DENSE_MIXED_LANGUAGE'
  | 'DOOR_PANEL_COMPLETE'
  | 'CONFLICT_AND_INCOMPLETE'

export type AiPromptKnowledgeCorpus03Language = 'BG' | 'EN' | 'MIXED'

export interface AiPromptKnowledgeCorpus03FieldExpectation {
  index: number
  role?: FacadeFlowIntentFieldRole
  openingType?: FacadeFlowIntentOpeningType
  openingDirection?: FacadeFlowIntentOpeningDirection
  swing?: FacadeFlowIntentSwing
  lowerPanelHeightMm?: number
  lowerPanelUpperGlazed?: boolean
}

export interface AiPromptKnowledgeCorpus03Expectation {
  category?: FacadeFlowProductIntentCategory
  mark?: string
  quantity?: number
  widthMm?: number
  heightMm?: number
  fieldCount?: number
  profileSystemIncludes?: string
  frameProfile?: string
  sashProfile?: string
  mullionProfile?: string
  thresholdIncludes?: string
  finishIncludes?: string
  glazingIncludes?: string
  handleIncludes?: string
  hingeQuantity?: number
  hingesIncludes?: string
  handleHeightMm?: number
  hardwareMechanismIncludes?: string
  fields?: AiPromptKnowledgeCorpus03FieldExpectation[]
  dimensionsUnresolved?: boolean
  frameProfileAbsent?: boolean
  finishAbsent?: boolean
  glazingAbsent?: boolean
  hingeQuantityAbsent?: boolean
  unresolvedIncludes?: string[]
  warningsIncludes?: string[]
  unresolvedCount?: number
}

export interface AiPromptKnowledgeCorpus03Case {
  id: string
  track: AiPromptKnowledgeCorpus03Track
  language: AiPromptKnowledgeCorpus03Language
  prompt: string
  expected: AiPromptKnowledgeCorpus03Expectation
  tags: string[]
}

const FRAME = '482.30'
const SASH = '482.05'
const MULLION = '482.21'

const pad = (value: number) => String(value).padStart(3, '0')
const quantityWordBg = (quantity: number) => ['един', 'два', 'три', 'четири'][quantity - 1] ?? String(quantity)

function compositeCompleteCase(index: number): AiPromptKnowledgeCorpus03Case {
  const variant = index % 5
  const width = 1500 + index * 10
  const height = 1200 + (index % 12) * 10
  const quantity = (index % 4) + 1
  const mark = `W-${300 + index}`
  const handleHeight = 950 + (index % 5) * 25

  if (variant === 0) {
    return {
      id: `CP3-COMP-${pad(index)}`,
      track: 'COMPOSITE_COMPLETE', language: 'BG',
      prompt: `Количество ${quantity} бр. прозорец ${mark} ${width}x${height} мм, система PRELUDE 60, каса ${FRAME}, крило ${SASH}, делител ${MULLION}, 3 полета: първо fixed, второ tilt-turn наляво, трето fixed, двоен стъклопакет, RAL 7016, черна дръжка, 3 скрити панти, дръжка на ${handleHeight} мм, обков стандартен механизъм.`,
      expected: {
        category: 'WINDOW', mark, quantity, widthMm: width, heightMm: height, fieldCount: 3,
        profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
        finishIncludes: 'RAL 7016', glazingIncludes: 'двоен', handleIncludes: 'черна', hingeQuantity: 3,
        hingesIncludes: 'скрити', handleHeightMm: handleHeight, hardwareMechanismIncludes: 'стандартен', unresolvedCount: 0,
        fields: [{ index: 0, role: 'FIXED' }, { index: 1, openingType: 'TILT_TURN', openingDirection: 'LEFT' }, { index: 2, role: 'FIXED' }],
      },
      tags: ['whole-construction', 'complete', 'dense-attributes'],
    }
  }

  if (variant === 1) {
    return {
      id: `CP3-COMP-${pad(index)}`,
      track: 'COMPOSITE_COMPLETE', language: 'EN',
      prompt: `Window ${mark}, qty ${quantity}, ${width}x${height} mm, profile system PRELUDE 60, frame ${FRAME}, sash ${SASH}, mullion ${MULLION}, 4 fields: F1=fixed; F2=turn right; F3=tilt-turn left; F4=fixed; triple glazing; RAL 9016; black handle; 4 concealed hinges; handle ${handleHeight} mm; hardware standard mechanism.`,
      expected: {
        category: 'WINDOW', mark, quantity, widthMm: width, heightMm: height, fieldCount: 4,
        profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
        finishIncludes: 'RAL 9016', glazingIncludes: 'triple', handleIncludes: 'black', hingeQuantity: 4,
        hingesIncludes: 'concealed', handleHeightMm: handleHeight, hardwareMechanismIncludes: 'standard', unresolvedCount: 0,
        fields: [{ index: 0, role: 'FIXED' }, { index: 1, openingType: 'TURN', openingDirection: 'RIGHT' }, { index: 2, openingType: 'TILT_TURN', openingDirection: 'LEFT' }, { index: 3, role: 'FIXED' }],
      },
      tags: ['whole-construction', 'complete', 'f-number-binding'],
    }
  }

  if (variant === 2) {
    return {
      id: `CP3-COMP-${pad(index)}`,
      track: 'COMPOSITE_COMPLETE', language: 'MIXED',
      prompt: `Прозорец ${mark} ${width}x${height} mm, qty ${quantity}, PRELUDE 60, профил каса ${FRAME}, sash profile ${SASH}, mullion ${MULLION}, 2 полета: лявото fixed, дясното tilt-turn right, двоен стъклопакет, RAL 7016, black handle, 3 concealed hinges, дръжка на ${handleHeight} mm, hardware standard mechanism.`,
      expected: {
        category: 'WINDOW', mark, quantity, widthMm: width, heightMm: height, fieldCount: 2,
        profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
        finishIncludes: 'RAL 7016', glazingIncludes: 'двоен', handleIncludes: 'black', hingeQuantity: 3,
        hingesIncludes: 'concealed', handleHeightMm: handleHeight, hardwareMechanismIncludes: 'standard', unresolvedCount: 0,
        fields: [{ index: 0, role: 'FIXED' }, { index: 1, openingType: 'TILT_TURN', openingDirection: 'RIGHT' }],
      },
      tags: ['whole-construction', 'complete', 'mixed-language'],
    }
  }

  if (variant === 3) {
    return {
      id: `CP3-COMP-${pad(index)}`,
      track: 'COMPOSITE_COMPLETE', language: 'BG',
      prompt: `Искам ${quantityWordBg(quantity)} броя прозорци ${mark}, размер ${width} на ${height} мм, профилна система PRELUDE 60, профил за каса ${FRAME}, профил за крило ${SASH}, профил за делител ${MULLION}; три полета — крайните fixed, средното turn надясно; троен стъклопакет, RAL 9016, бяла дръжка, 2 видими панти, дръжка на ${handleHeight} мм, обков стандартен механизъм.`,
      expected: {
        category: 'WINDOW', mark, quantity, widthMm: width, heightMm: height, fieldCount: 3,
        profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
        finishIncludes: 'RAL 9016', glazingIncludes: 'троен', handleIncludes: 'бяла', hingeQuantity: 2,
        hingesIncludes: 'видими', handleHeightMm: handleHeight, hardwareMechanismIncludes: 'стандартен', unresolvedCount: 0,
        fields: [{ index: 0, role: 'FIXED' }, { index: 1, openingType: 'TURN', openingDirection: 'RIGHT' }, { index: 2, role: 'FIXED' }],
      },
      tags: ['whole-construction', 'complete', 'conversational-dense'],
    }
  }

  return {
    id: `CP3-COMP-${pad(index)}`,
    track: 'COMPOSITE_COMPLETE', language: 'MIXED',
    prompt: `WINDOW ${mark} ${width}x${height} mm; quantity ${quantity}; PRELUDE 60; frame section ${FRAME}; sash section ${SASH}; mullion section ${MULLION}; 3 fields: field 1 fixed; поле 2 tilt-turn наляво; F3=fixed; double glazing; RAL 7016; white handle; 3 visible hinges; handle ${handleHeight} mm; обков standard mechanism.`,
    expected: {
      category: 'WINDOW', mark, quantity, widthMm: width, heightMm: height, fieldCount: 3,
      profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
      finishIncludes: 'RAL 7016', glazingIncludes: 'double', handleIncludes: 'white', hingeQuantity: 3,
      hingesIncludes: 'visible', handleHeightMm: handleHeight, hardwareMechanismIncludes: 'standard', unresolvedCount: 0,
      fields: [{ index: 0, role: 'FIXED' }, { index: 1, openingType: 'TILT_TURN', openingDirection: 'LEFT' }, { index: 2, role: 'FIXED' }],
    },
    tags: ['whole-construction', 'complete', 'mixed-binding-styles'],
  }
}

function denseMixedLanguageCase(index: number): AiPromptKnowledgeCorpus03Case {
  const variant = index % 5
  const baseWidth = 1600 + index * 10
  const baseHeight = 1200 + (index % 10) * 10
  const quantity = (index % 3) + 1
  const mark = `WIN-${400 + index}`
  const widthCm = baseWidth / 10
  const heightCm = baseHeight / 10
  const widthM = (baseWidth / 1000).toFixed(2)
  const heightM = (baseHeight / 1000).toFixed(2)

  const dimensions = variant === 0
    ? `${widthCm} cm x ${heightCm} cm`
    : variant === 1
      ? `${widthM} m x ${heightM} m`
      : variant === 2
        ? `${baseWidth} mm by ${heightCm} cm`
        : variant === 3
          ? `${widthCm} x ${heightCm} cm`
          : `${baseWidth}x${baseHeight} mm`

  const fieldPhrase = variant % 2 === 0
    ? '4 fields: F1=fixed; F2=turn right; F3=tilt-turn left; F4=fixed'
    : '4 полета: първо fixed; второ turn надясно; трето tilt-turn наляво; четвърто fixed'

  return {
    id: `CP3-MIX-${pad(index)}`,
    track: 'DENSE_MIXED_LANGUAGE', language: variant === 0 || variant === 4 ? 'MIXED' : variant === 2 ? 'EN' : 'MIXED',
    prompt: `Window ${mark}, qty ${quantity}, ${dimensions}; система PRELUDE 60; frame profile ${FRAME}; профил за крило ${SASH}; mullion profile ${MULLION}; ${fieldPhrase}; triple glazing; RAL 7016; black handle; 4 concealed hinges; hardware standard mechanism.`,
    expected: {
      category: 'WINDOW', mark, quantity, widthMm: baseWidth, heightMm: baseHeight, fieldCount: 4,
      profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
      finishIncludes: 'RAL 7016', glazingIncludes: 'triple', handleIncludes: 'black', hingeQuantity: 4,
      hingesIncludes: 'concealed', hardwareMechanismIncludes: 'standard', unresolvedCount: 0,
      fields: [
        { index: 0, role: 'FIXED' },
        { index: 1, openingType: 'TURN', openingDirection: 'RIGHT' },
        { index: 2, openingType: 'TILT_TURN', openingDirection: 'LEFT' },
        { index: 3, role: 'FIXED' },
      ],
    },
    tags: ['whole-construction', 'mixed-units', 'mixed-language', 'dense-technical'],
  }
}

function doorPanelCompleteCase(index: number): AiPromptKnowledgeCorpus03Case {
  const variant = index % 5
  const width = 900 + (index % 8) * 10
  const height = 2100 + (index % 9) * 10
  const quantity = (index % 2) + 1
  const mark = `D-${500 + index}`
  const panelHeight = 400 + (index % 9) * 20
  const threshold = `THR-${pad(index)}`
  const opensRight = index % 2 === 0
  const directionBg = opensRight ? 'надясно' : 'наляво'
  const directionEn = opensRight ? 'right' : 'left'
  const swing = index % 3 === 0 ? 'OUTWARD' as const : 'INWARD' as const
  const swingBg = swing === 'OUTWARD' ? 'навън' : 'навътре'
  const swingEn = swing === 'OUTWARD' ? 'outward' : 'inward'

  const topology = variant === 0
    ? 'еднокрила,'
    : variant === 1
      ? 'single-leaf,'
      : variant === 2
        ? 'едно отваряемо крило;'
        : variant === 3
          ? 'single leaf;'
          : 'еднокрилна врата; 1 поле;'

  const quantityPhrase = variant === 0 ? `${quantity} бр.,` : variant === 1 ? `${quantity} pcs,` : `quantity ${quantity},`
  const mixed = variant === 1 || variant === 3
  const directionPhrase = mixed ? `turn ${directionEn} ${swingEn}` : `turn ${directionBg} ${swingBg}`
  const panelPhrase = mixed
    ? `lower panel ${panelHeight} mm, upper zone glazed`
    : `долен панел ${panelHeight} мм, горната част остъклена`
  const glazingExpectation = mixed ? 'Горна остъклена зона' : 'Горна остъклена зона'
  const handle = mixed ? 'black handle' : 'черна дръжка'
  const hinges = mixed ? '3 concealed hinges' : '3 скрити панти'
  const thresholdPhrase = mixed ? `threshold ${threshold}` : `праг ${threshold}`

  return {
    id: `CP3-DOOR-${pad(index)}`,
    track: 'DOOR_PANEL_COMPLETE', language: mixed ? 'MIXED' : 'BG',
    prompt: `Врата ${mark} ${width}x${height} мм, ${quantityPhrase} PRELUDE 60, каса ${FRAME}, крило ${SASH}, ${topology} ${directionPhrase}, ${panelPhrase}, RAL 7016, ${handle}, ${hinges}, ${thresholdPhrase}.`,
    expected: {
      category: 'DOOR', mark, quantity, widthMm: width, heightMm: height, fieldCount: 1,
      profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, thresholdIncludes: threshold,
      finishIncludes: 'RAL 7016', glazingIncludes: glazingExpectation, handleIncludes: mixed ? 'black' : 'черна',
      hingeQuantity: 3, hingesIncludes: mixed ? 'concealed' : 'скрити', unresolvedCount: 0,
      fields: [{
        index: 0, openingType: 'TURN', openingDirection: opensRight ? 'RIGHT' : 'LEFT', swing,
        lowerPanelHeightMm: panelHeight, lowerPanelUpperGlazed: true,
      }],
    },
    tags: ['whole-construction', 'door', 'lower-panel', 'single-leaf-punctuation'],
  }
}

function conflictAndIncompleteCase(index: number): AiPromptKnowledgeCorpus03Case {
  const variant = index % 5
  const width = 1700 + index * 10
  const height = 1300 + (index % 10) * 10
  const base = `Прозорец W-${600 + index} ${width}x${height} мм, PRELUDE 60, каса ${FRAME}, крило ${SASH}, делител ${MULLION}, 3 полета: първо fixed, второ tilt-turn наляво, трето fixed, двоен стъклопакет, RAL 7016, black handle, 3 concealed hinges.`

  if (variant === 0) {
    const conflictingFrame = `999.${pad(index).slice(-2)}`
    return {
      id: `CP3-REVIEW-${pad(index)}`,
      track: 'CONFLICT_AND_INCOMPLETE', language: 'MIXED',
      prompt: `Прозорец W-${600 + index} 1.${(index % 8) + 1} x 1.${(index % 7) + 2}, PRELUDE 60, каса ${FRAME}, frame ${conflictingFrame}, крило ${SASH}, 3 полета: първо fixed, второ tilt-turn наляво, трето fixed, двоен стъклопакет, RAL 7016, black handle, 3 concealed hinges.`,
      expected: {
        category: 'WINDOW', mark: `W-${600 + index}`, fieldCount: 3, profileSystemIncludes: 'PRELUDE 60',
        frameProfileAbsent: true, sashProfile: SASH, dimensionsUnresolved: true,
        finishIncludes: 'RAL 7016', glazingIncludes: 'двоен', hingeQuantity: 3,
        unresolvedIncludes: ['Единици на общите размери', 'Конфликт за профил каса', 'Общи размери'],
        warningsIncludes: ['противоречиви профилни референции', 'двусмислени или липсващи единици'],
        fields: [{ index: 0, role: 'FIXED' }, { index: 1, openingType: 'TILT_TURN', openingDirection: 'LEFT' }, { index: 2, role: 'FIXED' }],
      },
      tags: ['human-review', 'multi-conflict', 'profile-conflict', 'ambiguous-dimensions'],
    }
  }

  if (variant === 1) {
    const prompt = base.replace('RAL 7016', 'RAL 7016, но цветът е RAL 9016')
    return {
      id: `CP3-REVIEW-${pad(index)}`,
      track: 'CONFLICT_AND_INCOMPLETE', language: 'BG', prompt,
      expected: {
        category: 'WINDOW', mark: `W-${600 + index}`, widthMm: width, heightMm: height, fieldCount: 3,
        profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
        finishAbsent: true, glazingIncludes: 'двоен', hingeQuantity: 3,
        unresolvedIncludes: ['Конфликт за цвят / покритие', 'Цвят / покритие'],
        warningsIncludes: ['противоречиви стойности за цвят / покритие'],
      },
      tags: ['human-review', 'semantic-conflict', 'finish-conflict'],
    }
  }

  if (variant === 2) {
    const prompt = base.replace('двоен стъклопакет', 'двоен стъклопакет, а после е записан троен стъклопакет')
    return {
      id: `CP3-REVIEW-${pad(index)}`,
      track: 'CONFLICT_AND_INCOMPLETE', language: 'BG', prompt,
      expected: {
        category: 'WINDOW', mark: `W-${600 + index}`, widthMm: width, heightMm: height, fieldCount: 3,
        profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
        finishIncludes: 'RAL 7016', glazingAbsent: true, hingeQuantity: 3,
        unresolvedIncludes: ['Конфликт за стъкло / пълнеж', 'Стъкло / пълнеж'],
        warningsIncludes: ['противоречиви стойности за стъкло / пълнеж'],
      },
      tags: ['human-review', 'semantic-conflict', 'glazing-conflict'],
    }
  }

  if (variant === 3) {
    const prompt = base.replace('3 concealed hinges', '2 concealed hinges, но спецификацията казва 3 hinges')
    return {
      id: `CP3-REVIEW-${pad(index)}`,
      track: 'CONFLICT_AND_INCOMPLETE', language: 'MIXED', prompt,
      expected: {
        category: 'WINDOW', mark: `W-${600 + index}`, widthMm: width, heightMm: height, fieldCount: 3,
        profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
        finishIncludes: 'RAL 7016', glazingIncludes: 'двоен', hingeQuantityAbsent: true, hingesIncludes: 'concealed',
        unresolvedIncludes: ['Конфликт за брой панти'], warningsIncludes: ['противоречиви стойности за брой панти'],
      },
      tags: ['human-review', 'semantic-conflict', 'hinge-conflict'],
    }
  }

  return {
    id: `CP3-REVIEW-${pad(index)}`,
    track: 'CONFLICT_AND_INCOMPLETE', language: 'BG',
    prompt: `Прозорец W-${600 + index} ${width}x${height} мм, каса ${FRAME}, крило ${SASH}, 2 полета: лявото fixed, дясното tilt-turn надясно, долен панел 450 мм, двоен стъклопакет, RAL 7016, black handle, 3 hinges.`,
    expected: {
      category: 'WINDOW', mark: `W-${600 + index}`, widthMm: width, heightMm: height, fieldCount: 2,
      frameProfile: FRAME, sashProfile: SASH, finishIncludes: 'RAL 7016', glazingIncludes: 'двоен', hingeQuantity: 3,
      unresolvedIncludes: ['Профилна система', 'Долният панел е разпознат, но не е еднозначно свързан'],
      fields: [{ index: 0, role: 'FIXED' }, { index: 1, openingType: 'TILT_TURN', openingDirection: 'RIGHT' }],
    },
    tags: ['human-review', 'incomplete', 'missing-profile-system', 'ambiguous-lower-panel-binding'],
  }
}

/**
 * AI PROMPT KNOWLEDGE CORPUS 03
 * 200 deterministic synthetic/private-safe prompts that exercise whole-construction understanding.
 * The layer raises prompt density but preserves the same safety boundary: interpretation is evidence for
 * Human Review only. It does not validate catalogue compatibility, close AI05.3 or PROFILE DATA 03,
 * unlock automatic geometry, or grant machine/production authority.
 */
export const AI_PROMPT_KNOWLEDGE_CORPUS_03: readonly AiPromptKnowledgeCorpus03Case[] = [
  ...Array.from({ length: 50 }, (_, index) => compositeCompleteCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => denseMixedLanguageCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => doorPanelCompleteCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => conflictAndIncompleteCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_03_EXPECTED_COUNTS = {
  COMPOSITE_COMPLETE: 50,
  DENSE_MIXED_LANGUAGE: 50,
  DOOR_PANEL_COMPLETE: 50,
  CONFLICT_AND_INCOMPLETE: 50,
  TOTAL: 200,
} as const
