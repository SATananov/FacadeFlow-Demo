import type {
  FacadeFlowIntentFieldRole,
  FacadeFlowIntentOpeningDirection,
  FacadeFlowIntentOpeningType,
  FacadeFlowProductIntentCategory,
} from './aiProductIntent'

export type AiPromptKnowledgeCorpus02Track =
  | 'PROFILE_ROLES'
  | 'PROFILE_TOPOLOGY'
  | 'MATERIAL_HARDWARE'
  | 'REVIEW_BOUNDARY'

export type AiPromptKnowledgeCorpus02Language = 'BG' | 'EN' | 'MIXED'

export interface AiPromptKnowledgeCorpus02FieldExpectation {
  index: number
  role?: FacadeFlowIntentFieldRole
  openingType?: FacadeFlowIntentOpeningType
  openingDirection?: FacadeFlowIntentOpeningDirection
  lowerPanelHeightMm?: number
}

export interface AiPromptKnowledgeCorpus02Expectation {
  category?: FacadeFlowProductIntentCategory
  widthMm?: number
  heightMm?: number
  fieldCount?: number
  profileSystemIncludes?: string
  frameProfile?: string
  sashProfile?: string
  mullionProfile?: string
  frameProfileAbsent?: boolean
  sashProfileAbsent?: boolean
  mullionProfileAbsent?: boolean
  finishIncludes?: string
  glazingIncludes?: string
  handleIncludes?: string
  hingeQuantity?: number
  hingesIncludes?: string
  handleHeightMm?: number
  hardwareMechanismIncludes?: string
  fields?: AiPromptKnowledgeCorpus02FieldExpectation[]
  dimensionsUnresolved?: boolean
  unresolvedIncludes?: string[]
  warningsIncludes?: string[]
}

export interface AiPromptKnowledgeCorpus02Case {
  id: string
  track: AiPromptKnowledgeCorpus02Track
  language: AiPromptKnowledgeCorpus02Language
  prompt: string
  expected: AiPromptKnowledgeCorpus02Expectation
  tags: string[]
}

const FRAME = '482.30'
const SASH = '482.05'
const MULLION = '482.21'

const pad = (value: number) => String(value).padStart(3, '0')

function profileRolesCase(index: number): AiPromptKnowledgeCorpus02Case {
  const width = 1500 + index * 10
  const height = 1200 + (index % 10) * 10
  const variant = index % 5
  const prompts = [
    `Прозорец ${width}x${height} мм, профилна система PRELUDE 60, каса ${FRAME}, крило ${SASH}, делител ${MULLION}, три полета, лявото fixed, средното tilt-turn наляво, дясното fixed, двоен стъклопакет, RAL 9016.`,
    `Прозорец ${width} x ${height} mm; профил система PRELUDE 60; профил за каса ${FRAME}; профил за крило ${SASH}; профил за делител ${MULLION}; 3 полета: първо fixed, второ tilt-turn left, трето fixed; двоен стъклопакет; RAL 9016.`,
    `Window ${width}x${height} mm, profile system PRELUDE 60, frame profile ${FRAME}, sash profile ${SASH}, mullion profile ${MULLION}, 3 fields, first fixed, second tilt-turn left, third fixed, double glazing, RAL 9016.`,
    `Window ${width} by ${height} mm; profile family PRELUDE 60; frame section ${FRAME}; sash section ${SASH}; mullion section ${MULLION}; 3 fields; left fixed; middle tilt-turn left; right fixed; double glazing; RAL 9016.`,
    `Направи прозорец ${width} на ${height} мм по PRELUDE 60 — каса ${FRAME}, крило ${SASH}, делител ${MULLION}; три полета, крайните fixed, средното tilt-turn наляво; двоен стъклопакет, RAL 9016.`,
  ]
  return {
    id: `CP2-ROLE-${pad(index)}`,
    track: 'PROFILE_ROLES',
    language: variant === 2 || variant === 3 ? 'EN' : variant === 4 ? 'MIXED' : 'BG',
    prompt: prompts[variant],
    expected: {
      category: 'WINDOW', widthMm: width, heightMm: height, fieldCount: 3,
      profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH, mullionProfile: MULLION,
      glazingIncludes: variant === 2 || variant === 3 ? 'double' : 'двоен', finishIncludes: 'RAL 9016',
      fields: [
        { index: 0, role: 'FIXED' },
        { index: 1, openingType: 'TILT_TURN', openingDirection: 'LEFT' },
        { index: 2, role: 'FIXED' },
      ],
    },
    tags: ['profile-aware', 'known-prelude60', 'profile-role-aliases'],
  }
}

function profileTopologyCase(index: number): AiPromptKnowledgeCorpus02Case {
  const width = 1700 + index * 10
  const height = 1300 + (index % 8) * 10
  const variant = index % 5
  const prompts = [
    `Прозорец ${width}x${height} мм, PRELUDE 60, каса ${FRAME}, крило ${SASH}, делител ${MULLION}, три полета, първо fixed, второ turn надясно, трето fixed, двоен стъклопакет, RAL 7016.`,
    `Прозорец ${width}x${height} мм, система PRELUDE 60, каса ${FRAME}, крило ${SASH}, делител ${MULLION}, две полета, лявото fixed, дясното tilt-turn надясно, двоен стъклопакет, RAL 7016.`,
    `Window ${width}x${height} mm, system PRELUDE 60, frame ${FRAME}, sash ${SASH}, mullion ${MULLION}, 3 fields, first fixed, second tilt-turn right, third fixed, double glazing, RAL 7016.`,
    `Window ${width}x${height} mm, profile system PRELUDE 60, frame profile ${FRAME}, sash profile ${SASH}, 2 fields, left fixed, right turn right, double glazing, RAL 7016.`,
    `Прозорец ${width}x${height} мм; PRELUDE 60; профил каса ${FRAME}; профил крило ${SASH}; профил делител ${MULLION}; 3 полета — лявото fixed, средното tilt-turn left, дясното fixed; двоен стъклопакет; RAL 7016.`,
  ]
  const twoFields = variant === 1 || variant === 3
  return {
    id: `CP2-TOPO-${pad(index)}`,
    track: 'PROFILE_TOPOLOGY',
    language: variant === 2 || variant === 3 ? 'EN' : variant === 4 ? 'MIXED' : 'BG',
    prompt: prompts[variant],
    expected: {
      category: 'WINDOW', widthMm: width, heightMm: height, fieldCount: twoFields ? 2 : 3,
      profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH,
      ...(twoFields ? {} : { mullionProfile: MULLION }),
      glazingIncludes: variant === 2 || variant === 3 ? 'double' : 'двоен', finishIncludes: 'RAL 7016',
      fields: twoFields
        ? [{ index: 0, role: 'FIXED' }, { index: 1, openingType: variant === 1 ? 'TILT_TURN' : 'TURN', openingDirection: 'RIGHT' }]
        : [{ index: 0, role: 'FIXED' }, { index: 1, openingType: variant === 0 ? 'TURN' : 'TILT_TURN', openingDirection: variant === 0 || variant === 2 ? 'RIGHT' : 'LEFT' }, { index: 2, role: 'FIXED' }],
    },
    tags: ['profile-aware', 'field-topology', 'mixed-opening'],
  }
}

function materialHardwareCase(index: number): AiPromptKnowledgeCorpus02Case {
  const width = 900 + index * 5
  const height = 1200 + index * 10
  const variant = index % 5
  const prompts = [
    `Прозорец ${width}x${height} мм, PRELUDE 60, каса ${FRAME}, крило ${SASH}, едно поле tilt-turn наляво, троен стъклопакет, RAL 7016, черна дръжка, 3 скрити панти.`,
    `Прозорец ${width}x${height} мм, система PRELUDE 60, профил за каса ${FRAME}, профил за крило ${SASH}, едно поле turn надясно, двоен стъклопакет, бял профил, бяла дръжка, 2 видими панти, обков стандартен механизъм.`,
    `Window ${width}x${height} mm, PRELUDE 60, frame profile ${FRAME}, sash profile ${SASH}, 1 field tilt-turn left, triple glazing, RAL 7016, black handle, 3 concealed hinges.`,
    `Window ${width}x${height} mm, profile system PRELUDE 60, frame section ${FRAME}, sash section ${SASH}, 1 field turn right, double glazing, white profile, white handle, 2 visible hinges, hardware standard mechanism.`,
    `Прозорец ${width}x${height} мм; PRELUDE 60; каса ${FRAME}; крило ${SASH}; едно поле tilt-turn left; двоен стъклопакет; RAL 9016; black handle; 4 панти; дръжка на 1050 мм.`,
  ]
  return {
    id: `CP2-HW-${pad(index)}`,
    track: 'MATERIAL_HARDWARE',
    language: variant === 2 || variant === 3 ? 'EN' : variant === 4 ? 'MIXED' : 'BG',
    prompt: prompts[variant],
    expected: {
      category: 'WINDOW', widthMm: width, heightMm: height, fieldCount: 1,
      profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH,
      glazingIncludes: variant === 0 || variant === 2 ? (variant === 2 ? 'triple' : 'троен') : (variant === 3 ? 'double' : 'двоен'),
      finishIncludes: variant === 1 || variant === 3 ? (variant === 3 ? 'white' : 'бял') : variant === 4 ? 'RAL 9016' : 'RAL 7016',
      handleIncludes: variant === 0 ? 'черна' : variant === 1 ? 'бяла' : variant === 2 ? 'black' : variant === 3 ? 'white' : 'black',
      hingeQuantity: variant === 0 || variant === 2 ? 3 : variant === 1 || variant === 3 ? 2 : 4,
      ...(variant === 0 ? { hingesIncludes: 'скрити' } : variant === 1 ? { hingesIncludes: 'видими' } : variant === 2 ? { hingesIncludes: 'concealed' } : variant === 3 ? { hingesIncludes: 'visible' } : {}),
      ...(variant === 1 ? { hardwareMechanismIncludes: 'стандартен' } : variant === 3 ? { hardwareMechanismIncludes: 'standard' } : {}),
      ...(variant === 4 ? { handleHeightMm: 1050 } : {}),
      fields: [{ index: 0, openingType: variant === 1 || variant === 3 ? 'TURN' : 'TILT_TURN', openingDirection: variant === 1 || variant === 3 ? 'RIGHT' : 'LEFT' }],
    },
    tags: ['profile-aware', 'glazing', 'finish', 'hardware'],
  }
}

function reviewBoundaryCase(index: number): AiPromptKnowledgeCorpus02Case {
  const variant = index % 5
  const width = 1100 + index * 10
  const height = 1400 + (index % 9) * 10

  if (variant === 0) {
    return {
      id: `CP2-SAFE-${pad(index)}`,
      track: 'REVIEW_BOUNDARY', language: 'BG',
      prompt: `Прозорец 1.${(index % 8) + 1} x 1.${(index % 7) + 2}, PRELUDE 60, каса ${FRAME}, крило ${SASH}, едно поле tilt-turn наляво, двоен стъклопакет, RAL 7016.`,
      expected: {
        category: 'WINDOW', fieldCount: 1, profileSystemIncludes: 'PRELUDE 60', frameProfile: FRAME, sashProfile: SASH,
        dimensionsUnresolved: true, unresolvedIncludes: ['Единици на общите размери', 'Общи размери'],
        fields: [{ index: 0, openingType: 'TILT_TURN', openingDirection: 'LEFT' }],
      },
      tags: ['safety', 'ambiguous-dimensions', 'human-review'],
    }
  }

  if (variant === 1) {
    return {
      id: `CP2-SAFE-${pad(index)}`,
      track: 'REVIEW_BOUNDARY', language: 'BG',
      prompt: `Прозорец ${width}x${height} мм, каса ${FRAME}, крило ${SASH}, едно поле tilt-turn наляво, двоен стъклопакет, RAL 7016.`,
      expected: {
        category: 'WINDOW', widthMm: width, heightMm: height, fieldCount: 1, frameProfile: FRAME, sashProfile: SASH,
        unresolvedIncludes: ['Профилна система'], fields: [{ index: 0, openingType: 'TILT_TURN', openingDirection: 'LEFT' }],
      },
      tags: ['safety', 'missing-profile-system', 'human-review'],
    }
  }

  if (variant === 2) {
    return {
      id: `CP2-SAFE-${pad(index)}`,
      track: 'REVIEW_BOUNDARY', language: 'MIXED',
      prompt: `Window ${width}x${height} mm, PRELUDE 60, frame ${FRAME}, frame 999.${pad(index).slice(-2)}, sash ${SASH}, 1 field tilt-turn left, double glazing, RAL 7016.`,
      expected: {
        category: 'WINDOW', widthMm: width, heightMm: height, fieldCount: 1, profileSystemIncludes: 'PRELUDE 60',
        frameProfileAbsent: true, sashProfile: SASH, unresolvedIncludes: ['Конфликт за профил каса'], warningsIncludes: ['противоречиви профилни референции'],
        fields: [{ index: 0, openingType: 'TILT_TURN', openingDirection: 'LEFT' }],
      },
      tags: ['safety', 'profile-conflict', 'frame-conflict'],
    }
  }

  if (variant === 3) {
    return {
      id: `CP2-SAFE-${pad(index)}`,
      track: 'REVIEW_BOUNDARY', language: 'BG',
      prompt: `Прозорец ${width}x${height} мм, PRELUDE 60, каса ${FRAME}, крило ${SASH}, крило 998.${pad(index).slice(-2)}, едно поле tilt-turn наляво, двоен стъклопакет, RAL 7016.`,
      expected: {
        category: 'WINDOW', widthMm: width, heightMm: height, fieldCount: 1, profileSystemIncludes: 'PRELUDE 60',
        frameProfile: FRAME, sashProfileAbsent: true, unresolvedIncludes: ['Конфликт за профил крило'], warningsIncludes: ['противоречиви профилни референции'],
        fields: [{ index: 0, openingType: 'TILT_TURN', openingDirection: 'LEFT' }],
      },
      tags: ['safety', 'profile-conflict', 'sash-conflict'],
    }
  }

  const unknownFrame = `997.${pad(index).slice(-2)}`
  return {
    id: `CP2-SAFE-${pad(index)}`,
    track: 'REVIEW_BOUNDARY', language: 'EN',
    prompt: `Window ${width}x${height} mm, profile system PRELUDE 60, frame profile ${unknownFrame}, sash profile ${SASH}, 1 field tilt-turn left, double glazing, RAL 7016.`,
    expected: {
      category: 'WINDOW', widthMm: width, heightMm: height, fieldCount: 1, profileSystemIncludes: 'PRELUDE 60',
      frameProfile: unknownFrame, sashProfile: SASH,
      fields: [{ index: 0, openingType: 'TILT_TURN', openingDirection: 'LEFT' }],
    },
    tags: ['safety', 'unknown-explicit-profile', 'no-catalogue-validation'],
  }
}

/**
 * AI PROMPT KNOWLEDGE CORPUS 02
 * 200 deterministic synthetic/private-safe prompts focused on profile-aware construction language.
 * Known PRELUDE 60 role references are used only as language/evidence anchors. This corpus does not
 * validate catalogue compatibility, close PROFILE DATA 03, unlock automatic geometry, or grant production authority.
 */
export const AI_PROMPT_KNOWLEDGE_CORPUS_02: readonly AiPromptKnowledgeCorpus02Case[] = [
  ...Array.from({ length: 50 }, (_, index) => profileRolesCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => profileTopologyCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => materialHardwareCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => reviewBoundaryCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_02_EXPECTED_COUNTS = {
  PROFILE_ROLES: 50,
  PROFILE_TOPOLOGY: 50,
  MATERIAL_HARDWARE: 50,
  REVIEW_BOUNDARY: 50,
  TOTAL: 200,
} as const
