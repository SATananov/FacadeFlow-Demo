import type {
  FacadeFlowIntentFieldRole,
  FacadeFlowIntentOpeningDirection,
  FacadeFlowIntentOpeningType,
  FacadeFlowProductIntentCategory,
} from './aiProductIntent'

export type AiPromptKnowledgeCorpus01Style = 'CONVERSATIONAL' | 'TECHNICAL' | 'MIXED' | 'INCOMPLETE'
export type AiPromptKnowledgeCorpus01Language = 'BG' | 'EN' | 'MIXED'

export interface AiPromptKnowledgeCorpus01FieldExpectation {
  index: number
  role?: FacadeFlowIntentFieldRole
  openingType?: FacadeFlowIntentOpeningType
  openingDirection?: FacadeFlowIntentOpeningDirection
  lowerPanelHeightMm?: number
}

export interface AiPromptKnowledgeCorpus01Expectation {
  category?: FacadeFlowProductIntentCategory
  widthMm?: number
  heightMm?: number
  quantity?: number
  fieldCount?: number
  profileSystemIncludes?: string
  frameProfile?: string
  sashProfile?: string
  mullionProfile?: string
  finishIncludes?: string
  glazingIncludes?: string
  hingeQuantity?: number
  fields?: AiPromptKnowledgeCorpus01FieldExpectation[]
  dimensionsUnresolved?: boolean
  unresolvedIncludes?: string[]
}

export interface AiPromptKnowledgeCorpus01Case {
  id: string
  style: AiPromptKnowledgeCorpus01Style
  language: AiPromptKnowledgeCorpus01Language
  prompt: string
  expected: AiPromptKnowledgeCorpus01Expectation
  tags: string[]
}

/**
 * AI PROMPT KNOWLEDGE CORPUS 01
 * 200 synthetic/private-safe evaluation prompts.
 * This is regression knowledge, not a literal phrase lookup table.
 */
export const AI_PROMPT_KNOWLEDGE_CORPUS_01: readonly AiPromptKnowledgeCorpus01Case[] =
[
  {
    "id": "CP-CONV-001",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми прозорец 1800 на 1400 мм, три полета, лявото фиксирано, средното tilt-turn с ляво отваряне, дясното фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1400,
      "fieldCount": 3,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-002",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1600x1300, две полета, лявото фиксирано, дясното се отваря надясно.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1300,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-003",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи еднокрил прозорец 900x1200 мм, да се отваря наляво.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 900,
      "heightMm": 1200,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-004",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябва ми врата 950x2150 мм, едно крило, отваряне дясно, навътре, долен панел 500 мм.",
    "expected": {
      "category": "DOOR",
      "widthMm": 950,
      "heightMm": 2150,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 500
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-005",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Прозорец 180 на 140 см, три полета, крайните фиксирани, средното отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1400,
      "fieldCount": 3,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "role": "OPENING_SASH"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-006",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи 4 бр. прозорци 1200x1400 мм, едно поле, fixed.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "quantity": 4,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-007",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Прозорец 1200x1400, едно поле, fixed, черна дръжка и бял профил.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "fieldCount": 1,
      "finishIncludes": "бял"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-008",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 2000x1400, две полета и двете плъзгащи.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2000,
      "heightMm": 1400,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING"
        },
        {
          "index": 1,
          "openingType": "SLIDING"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-009",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Прозорец 2000x1400, две полета, лявото се плъзга надясно, дясното наляво.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2000,
      "heightMm": 1400,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-010",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Балконска врата 900x2100, едно високо крило, долен панел 450 мм, горната част остъклена.",
    "expected": {
      "category": "DOOR",
      "widthMm": 900,
      "heightMm": 2100,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "lowerPanelHeightMm": 450
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-011",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1000x1200 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-012",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1100x1300 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-013",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1200x1400 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-014",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1300x1500 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-015",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1400x1600 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-016",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1500x1400 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-017",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1600x1500 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-018",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1700x1400 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-019",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1800x1500 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-020",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи прозорец 1900x1600 мм, едно поле, да се отваря надясно, двоен стъклопакет.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ],
      "glazingIncludes": "двоен"
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-021",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1000 на 1200 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-022",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1100 на 1300 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-023",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1200 на 1400 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-024",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1300 на 1500 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-025",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1400 на 1600 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-026",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1500 на 1400 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-027",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1600 на 1500 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-028",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1700 на 1400 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-029",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1800 на 1500 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-030",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Искам прозорец 1900 на 1600 мм, две полета, лявото фиксирано, дясното tilt-turn с ляво отваряне.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-031",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1000x2000 мм, едно крило, отваряне дясно, навътре, 2 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1000,
      "heightMm": 2000,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 2
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-032",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1100x2020 мм, едно крило, отваряне дясно, навътре, 3 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1100,
      "heightMm": 2020,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 3
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-033",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1200x2040 мм, едно крило, отваряне дясно, навътре, 2 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1200,
      "heightMm": 2040,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 2
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-034",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1300x2060 мм, едно крило, отваряне дясно, навътре, 3 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1300,
      "heightMm": 2060,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 3
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-035",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1000x2080 мм, едно крило, отваряне дясно, навътре, 2 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1000,
      "heightMm": 2080,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 2
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-036",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1000x2100 мм, едно крило, отваряне дясно, навътре, 3 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1000,
      "heightMm": 2100,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 3
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-037",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1000x2120 мм, едно крило, отваряне дясно, навътре, 2 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1000,
      "heightMm": 2120,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 2
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-038",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1000x2140 мм, едно крило, отваряне дясно, навътре, 3 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1000,
      "heightMm": 2140,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 3
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-039",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1000x2160 мм, едно крило, отваряне дясно, навътре, 2 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1000,
      "heightMm": 2160,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 2
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-040",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Направи ми врата 1000x2180 мм, едно крило, отваряне дясно, навътре, 3 панти.",
    "expected": {
      "category": "DOOR",
      "widthMm": 1000,
      "heightMm": 2180,
      "fieldCount": 1,
      "fields": [
        {
          "index": 0,
          "openingDirection": "RIGHT"
        }
      ],
      "hingeQuantity": 3
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-041",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 1 бр. прозорци 1000x1200, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "quantity": 1,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-042",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 2 бр. прозорци 1100x1300, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "quantity": 2,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-043",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 3 бр. прозорци 1200x1400, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "quantity": 3,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-044",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 4 бр. прозорци 1300x1500, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "quantity": 4,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-045",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 5 бр. прозорци 1400x1600, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "quantity": 5,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-046",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 6 бр. прозорци 1500x1400, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "quantity": 6,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-047",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 1 бр. прозорци 1600x1500, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "quantity": 1,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-048",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 2 бр. прозорци 1700x1400, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "quantity": 2,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-049",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 3 бр. прозорци 1800x1500, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "quantity": 3,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-CONV-050",
    "style": "CONVERSATIONAL",
    "language": "BG",
    "prompt": "Трябват ми 4 бр. прозорци 1900x1600, едно поле, fixed, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "quantity": 4,
      "fieldCount": 1,
      "finishIncludes": "RAL 7016",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "conversational",
      "human-phrasing"
    ]
  },
  {
    "id": "CP-TECH-001",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-101 1000x1200 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 1.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "quantity": 1,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-002",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-102 1100x1300 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 2.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "quantity": 2,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-003",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-103 1200x1400 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 3.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "quantity": 3,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-004",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-104 1300x1500 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 4.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "quantity": 4,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-005",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-105 1400x1600 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 1.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "quantity": 1,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-006",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-106 1500x1400 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 2.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "quantity": 2,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-007",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-107 1600x1500 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 3.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "quantity": 3,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-008",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-108 1700x1400 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 4.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "quantity": 4,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-009",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-109 1800x1500 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 1.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "quantity": 1,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-010",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-110 1900x1600 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 2.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "quantity": 2,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-011",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-111 1000x1200 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 3.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "quantity": 3,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-012",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-112 1100x1300 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 4.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "quantity": 4,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-013",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-113 1200x1400 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 1.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "quantity": 1,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-014",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-114 1300x1500 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 2.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "quantity": 2,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-015",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-115 1400x1600 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 3.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "quantity": 3,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-016",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-116 1500x1400 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 4.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "quantity": 4,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-017",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-117 1600x1500 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 1.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "quantity": 1,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-018",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-118 1700x1400 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 2.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "quantity": 2,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-019",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-119 1800x1500 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 3.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "quantity": 3,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-020",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW W-120 1900x1600 mm; 3 fields; field 1 fixed; field 2 tilt-turn opening: right; field 3 fixed; profile system PRELUDE 60; frame 482.30; sash 482.05; mullion 482.21; RAL 7016; triple glazing; qty 4.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "quantity": 4,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "RIGHT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-021",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1000x1200 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-70; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-022",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1100x1300 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-71; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-023",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1200x1400 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-72; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-024",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1300x1500 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-73; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-025",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1400x1600 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-74; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-026",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1500x1400 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-75; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-027",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1600x1500 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-76; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-028",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1700x1400 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-77; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-029",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1800x1500 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-78; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-030",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1900x1600 mm; 2 fields; F1=FIXED; F2=TURN RIGHT; system SYS-79; 2 hinges; double glazing.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "fieldCount": 2,
      "hingeQuantity": 2,
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-031",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.8 m x 1400 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1400,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-032",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.82 m x 1410 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1820,
      "heightMm": 1410,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-033",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.84 m x 1420 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1840,
      "heightMm": 1420,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-034",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.86 m x 1430 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1860,
      "heightMm": 1430,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-035",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.88 m x 1440 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1880,
      "heightMm": 1440,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-036",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.9 m x 1450 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1450,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-037",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.92 m x 1460 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1920,
      "heightMm": 1460,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-038",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.94 m x 1470 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1940,
      "heightMm": 1470,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-039",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.96 m x 1480 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1960,
      "heightMm": 1480,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-040",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "WINDOW 1.98 m x 1490 mm; 1 field; turn left; system PRELUDE 60; frame 482.30; sash 482.05.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1980,
      "heightMm": 1490,
      "fieldCount": 1,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-041",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-200 900x2100 mm; 1 field; turn right; inward; lower panel 400 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 900,
      "heightMm": 2100,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 400
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-042",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-201 910x2110 mm; 1 field; turn right; inward; lower panel 410 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 910,
      "heightMm": 2110,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 410
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-043",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-202 920x2120 mm; 1 field; turn right; inward; lower panel 420 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 920,
      "heightMm": 2120,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 420
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-044",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-203 930x2130 mm; 1 field; turn right; inward; lower panel 430 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 930,
      "heightMm": 2130,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 430
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-045",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-204 940x2140 mm; 1 field; turn right; inward; lower panel 440 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 940,
      "heightMm": 2140,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 440
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-046",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-205 950x2150 mm; 1 field; turn right; inward; lower panel 450 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 950,
      "heightMm": 2150,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 450
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-047",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-206 960x2160 mm; 1 field; turn right; inward; lower panel 460 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 960,
      "heightMm": 2160,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 460
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-048",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-207 970x2170 mm; 1 field; turn right; inward; lower panel 470 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 970,
      "heightMm": 2170,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 470
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-049",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-208 980x2180 mm; 1 field; turn right; inward; lower panel 480 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 980,
      "heightMm": 2180,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 480
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-TECH-050",
    "style": "TECHNICAL",
    "language": "EN",
    "prompt": "DOOR D-209 990x2190 mm; 1 field; turn right; inward; lower panel 490 mm; triple glazing; keyed handle; 3 concealed hinges.",
    "expected": {
      "category": "DOOR",
      "widthMm": 990,
      "heightMm": 2190,
      "fieldCount": 1,
      "hingeQuantity": 3,
      "glazingIncludes": "triple",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 490
        }
      ]
    },
    "tags": [
      "technical",
      "structured"
    ]
  },
  {
    "id": "CP-MIX-001",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-300, 1000x1200 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-002",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-301, 1100x1300 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-003",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-302, 1200x1400 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-004",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-303, 1300x1500 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-005",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-304, 1400x1600 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-006",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-305, 1500x1400 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-007",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-306, 1600x1500 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-008",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-307, 1700x1400 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-009",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-308, 1800x1500 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-010",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец W-309, 1900x1600 mm, 3 fields: field 1 fixed; field 2 tilt-turn opening: left; field 3 fixed; система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "fieldCount": 3,
      "profileSystemIncludes": "PRELUDE 60",
      "frameProfile": "482.30",
      "sashProfile": "482.05",
      "mullionProfile": "482.21",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TILT_TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-011",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1000x1200, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-012",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1100x1300, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-013",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1200x1400, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-014",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1300x1500, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-015",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1400x1600, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-016",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1500x1400, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-017",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1600x1500, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-018",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1700x1400, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-019",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1800x1500, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-020",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Искам window 1900x1600, 2 полета: лявото fixed, дясното turn right, double glazing, RAL 7016.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "fieldCount": 2,
      "finishIncludes": "RAL 7016",
      "glazingIncludes": "double",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "RIGHT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-021",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 1900x1400, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1400,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-022",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 1930x1410, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1930,
      "heightMm": 1410,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-023",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 1960x1420, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1960,
      "heightMm": 1420,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-024",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 1990x1430, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1990,
      "heightMm": 1430,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-025",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 2020x1440, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2020,
      "heightMm": 1440,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-026",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 2050x1450, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2050,
      "heightMm": 1450,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-027",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 2080x1460, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2080,
      "heightMm": 1460,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-028",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 2110x1470, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2110,
      "heightMm": 1470,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-029",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 2140x1480, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2140,
      "heightMm": 1480,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-030",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Прозорец 2170x1490, 2 fields, и двете плъзгащи, left field slides right, right field slides left.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 2170,
      "heightMm": 1490,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "openingType": "SLIDING",
          "openingDirection": "RIGHT"
        },
        {
          "index": 1,
          "openingType": "SLIDING",
          "openingDirection": "LEFT"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-031",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-400 920x2100 mm, 1 field, turn right, навътре, долен panel 450 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 920,
      "heightMm": 2100,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 450
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-032",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-401 925x2110 mm, 1 field, turn right, навътре, долен panel 455 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 925,
      "heightMm": 2110,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 455
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-033",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-402 930x2120 mm, 1 field, turn right, навътре, долен panel 460 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 930,
      "heightMm": 2120,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 460
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-034",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-403 935x2130 mm, 1 field, turn right, навътре, долен panel 465 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 935,
      "heightMm": 2130,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 465
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-035",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-404 940x2140 mm, 1 field, turn right, навътре, долен panel 470 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 940,
      "heightMm": 2140,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 470
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-036",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-405 945x2150 mm, 1 field, turn right, навътре, долен panel 475 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 945,
      "heightMm": 2150,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 475
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-037",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-406 950x2160 mm, 1 field, turn right, навътре, долен panel 480 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 950,
      "heightMm": 2160,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 480
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-038",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-407 955x2170 mm, 1 field, turn right, навътре, долен panel 485 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 955,
      "heightMm": 2170,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 485
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-039",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-408 960x2180 mm, 1 field, turn right, навътре, долен panel 490 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 960,
      "heightMm": 2180,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 490
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-040",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Врата D-409 965x2190 mm, 1 field, turn right, навътре, долен panel 495 mm, upper part glazed, black handle, бял профил.",
    "expected": {
      "category": "DOOR",
      "widthMm": 965,
      "heightMm": 2190,
      "fieldCount": 1,
      "finishIncludes": "бял",
      "fields": [
        {
          "index": 0,
          "openingType": "TURN",
          "openingDirection": "RIGHT",
          "lowerPanelHeightMm": 495
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-041",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 1 — прозорец 1000 на 1200 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1000,
      "heightMm": 1200,
      "quantity": 1,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-042",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 2 — прозорец 1100 на 1300 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1100,
      "heightMm": 1300,
      "quantity": 2,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-043",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 3 — прозорец 1200 на 1400 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1400,
      "quantity": 3,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-044",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 4 — прозорец 1300 на 1500 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1500,
      "quantity": 4,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-045",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 5 — прозорец 1400 на 1600 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1600,
      "quantity": 5,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-046",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 1 — прозорец 1500 на 1400 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "quantity": 1,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-047",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 2 — прозорец 1600 на 1500 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1500,
      "quantity": 2,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-048",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 3 — прозорец 1700 на 1400 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1700,
      "heightMm": 1400,
      "quantity": 3,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-049",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 4 — прозорец 1800 на 1500 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1500,
      "quantity": 4,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-MIX-050",
    "style": "MIXED",
    "language": "MIXED",
    "prompt": "Qty 5 — прозорец 1900 на 1600 mm; три полета; първото fixed, второто се отваря наляво, третото fixed; двоен glazing unit.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1900,
      "heightMm": 1600,
      "quantity": 5,
      "fieldCount": 3,
      "glazingIncludes": "двоен",
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        },
        {
          "index": 1,
          "openingType": "TURN",
          "openingDirection": "LEFT"
        },
        {
          "index": 2,
          "role": "FIXED"
        }
      ]
    },
    "tags": [
      "mixed-language",
      "shop-floor"
    ]
  },
  {
    "id": "CP-INC-001",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Направи ми прозорец антрацит.",
    "expected": {
      "category": "WINDOW",
      "unresolvedIncludes": [
        "Общи размери",
        "Профилна система",
        "Брой / разпределение на полетата"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-002",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1.8 x 1400 mm, едно поле, fixed.",
    "expected": {
      "category": "WINDOW",
      "fieldCount": 1,
      "dimensionsUnresolved": true,
      "unresolvedIncludes": [
        "Единици на общите размери",
        "Общи размери"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-003",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 180 x 1.4 m, едно поле, fixed.",
    "expected": {
      "category": "WINDOW",
      "fieldCount": 1,
      "dimensionsUnresolved": true,
      "unresolvedIncludes": [
        "Единици на общите размери",
        "Общи размери"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-004",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1.8 x 1.4, 1 field, fixed.",
    "expected": {
      "category": "WINDOW",
      "fieldCount": 1,
      "dimensionsUnresolved": true,
      "unresolvedIncludes": [
        "Единици на общите размери",
        "Общи размери"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-005",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1800x1400, 3 полета, отваряемо, система X.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1400,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-006",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Window 1800x1400, 3 fields, opening: right, inward, system X.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1800,
      "heightMm": 1400,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Посоката на отваряне е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-007",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Врата 900x2100, две полета, долен панел 500 мм.",
    "expected": {
      "category": "DOOR",
      "widthMm": 900,
      "heightMm": 2100,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Долният панел е разпознат, но не е еднозначно свързан с едно конкретно крило."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-008",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Искам прозорец, средното да се отваря наляво.",
    "expected": {
      "category": "WINDOW",
      "unresolvedIncludes": [
        "Общи размери",
        "Брой / разпределение на полетата"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-009",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1400x1400.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1400,
      "unresolvedIncludes": [
        "Профилна система",
        "Брой / разпределение на полетата"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-010",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Door D-9, right opening.",
    "expected": {
      "category": "DOOR",
      "unresolvedIncludes": [
        "Общи размери",
        "Брой / разпределение на полетата"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-011",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1200x1300, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1200,
      "heightMm": 1300,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-012",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1230x1320, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1230,
      "heightMm": 1320,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-013",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1260x1340, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1260,
      "heightMm": 1340,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-014",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1290x1360, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1290,
      "heightMm": 1360,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-015",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1320x1380, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1320,
      "heightMm": 1380,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-016",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1350x1400, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1350,
      "heightMm": 1400,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-017",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1380x1420, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1380,
      "heightMm": 1420,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-018",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1410x1440, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1410,
      "heightMm": 1440,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-019",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1440x1460, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1440,
      "heightMm": 1460,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-020",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1470x1480, три полета.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1470,
      "heightMm": 1480,
      "fieldCount": 3,
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-021",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1300x1400, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1300,
      "heightMm": 1400,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-022",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1320x1410, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1320,
      "heightMm": 1410,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-023",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1340x1420, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1340,
      "heightMm": 1420,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-024",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1360x1430, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1360,
      "heightMm": 1430,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-025",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1380x1440, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1380,
      "heightMm": 1440,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-026",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1400x1450, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1450,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-027",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1420x1460, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1420,
      "heightMm": 1460,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-028",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1440x1470, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1440,
      "heightMm": 1470,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-029",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1460x1480, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1460,
      "heightMm": 1480,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-030",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1480x1490, едно поле, отваряемо.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1480,
      "heightMm": 1490,
      "fieldCount": 1,
      "unresolvedIncludes": [
        "Тип отваряне за поле 1"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-031",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1400x1500, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1400,
      "heightMm": 1500,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-032",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1420x1510, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1420,
      "heightMm": 1510,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-033",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1440x1520, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1440,
      "heightMm": 1520,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-034",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1460x1530, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1460,
      "heightMm": 1530,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-035",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1480x1540, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1480,
      "heightMm": 1540,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-036",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1500x1550, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1550,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-037",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1520x1560, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1520,
      "heightMm": 1560,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-038",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1540x1570, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1540,
      "heightMm": 1570,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-039",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Прозорец 1560x1580, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1560,
      "heightMm": 1580,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-040",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Прозорец 1580x1590, две полета, лявото фиксирано.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1580,
      "heightMm": 1590,
      "fieldCount": 2,
      "fields": [
        {
          "index": 0,
          "role": "FIXED"
        }
      ],
      "unresolvedIncludes": [
        "Профилна система"
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-041",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1500x1400, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1500,
      "heightMm": 1400,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-042",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Window 1520x1410, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1520,
      "heightMm": 1410,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-043",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1540x1420, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1540,
      "heightMm": 1420,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-044",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1560x1430, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1560,
      "heightMm": 1430,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-045",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Window 1580x1440, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1580,
      "heightMm": 1440,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-046",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1600x1450, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1600,
      "heightMm": 1450,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-047",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1620x1460, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1620,
      "heightMm": 1460,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-048",
    "style": "INCOMPLETE",
    "language": "MIXED",
    "prompt": "Window 1640x1470, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1640,
      "heightMm": 1470,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-049",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1660x1480, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1660,
      "heightMm": 1480,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  },
  {
    "id": "CP-INC-050",
    "style": "INCOMPLETE",
    "language": "BG",
    "prompt": "Window 1680x1490, 2 fields, sliding.",
    "expected": {
      "category": "WINDOW",
      "widthMm": 1680,
      "heightMm": 1490,
      "fieldCount": 2,
      "unresolvedIncludes": [
        "Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле."
      ]
    },
    "tags": [
      "incomplete",
      "human-review",
      "safety"
    ]
  }
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_01_EXPECTED_COUNTS = {
  CONVERSATIONAL: 50,
  TECHNICAL: 50,
  MIXED: 50,
  INCOMPLETE: 50,
  TOTAL: 200,
} as const
