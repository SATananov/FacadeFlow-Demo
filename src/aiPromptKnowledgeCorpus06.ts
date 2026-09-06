export type AiPromptKnowledgeCorpus06Track =
  | 'PROJECT_CONTEXT_INHERITANCE'
  | 'EXACT_CONTEXT_OVERRIDE'
  | 'FLOOR_GROUP_SCOPE'
  | 'AMBIGUOUS_CONTEXT_SAFETY'

export interface AiPromptKnowledgeCorpus06ModuleExpectation {
  moduleNumber: number
  floor: string
  room: string
  mark: string
  category: 'WINDOW' | 'DOOR'
  finishIncludes: string
  hardwareIncludes: string
  contextualCorrectionCount: number
}

export interface AiPromptKnowledgeCorpus06Case {
  id: string
  track: AiPromptKnowledgeCorpus06Track
  prompt: string
  projectReference: string
  offerReference: string
  customerName: string
  expectedModules: AiPromptKnowledgeCorpus06ModuleExpectation[]
  unresolvedProjectReferenceCount: number
  tags: string[]
}

const pad = (value: number) => String(value).padStart(3, '0')

function header(index: number) {
  const projectReference = `PRJ-${5000 + index}`
  const offerReference = `OF-${6000 + index}`
  const customerName = `ProjectClient-${pad(index)}`
  return {
    projectReference,
    offerReference,
    customerName,
    text: `Обект: ${projectReference}; Оферта: ${offerReference}; Клиент: ${customerName}; Общи настройки: система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков: HW-A`,
  }
}

function windowText(mark: string, width: number, height: number) {
  return `прозорец ${mark}, ${width} x ${height} mm, 2 полета, лявото fixed, дясното tilt-turn надясно`
}

function doorText(mark: string, width: number, height: number) {
  return `врата ${mark}, ${width} x ${height} mm, еднокрила, turn надясно`
}

function moduleSegment(floor: string, room: string, mark: string, moduleNumber: number, text: string) {
  return `Етаж ${floor} | Помещение ${room} | Марка ${mark} | Модул ${moduleNumber}: ${text}`
}

function standardModules(index: number) {
  const marks = [`W-${7000 + index}`, `W-${8000 + index}`, `W-${9000 + index}`, `D-${7000 + index}`]
  return [
    { moduleNumber: 1, floor: '1', room: '101', mark: marks[0]!, category: 'WINDOW' as const, text: windowText(marks[0]!, 1200 + index, 1300) },
    { moduleNumber: 2, floor: '1', room: '102', mark: marks[1]!, category: 'WINDOW' as const, text: windowText(marks[1]!, 1400 + index, 1500) },
    { moduleNumber: 3, floor: '2', room: '203', mark: marks[2]!, category: 'WINDOW' as const, text: windowText(marks[2]!, 1600 + index, 1500) },
    { moduleNumber: 4, floor: '2', room: '204', mark: marks[3]!, category: 'DOOR' as const, text: doorText(marks[3]!, 950, 2150) },
  ]
}

function basePrompt(index: number) {
  const info = header(index)
  const modules = standardModules(index)
  return {
    info,
    modules,
    text: `${info.text}; ${modules.map((module) => moduleSegment(module.floor, module.room, module.mark, module.moduleNumber, module.text)).join('; ')}`,
  }
}

function inheritanceCase(index: number): AiPromptKnowledgeCorpus06Case {
  const base = basePrompt(index)
  return {
    id: `CP6-CTX-${pad(index)}`,
    track: 'PROJECT_CONTEXT_INHERITANCE',
    prompt: base.text,
    projectReference: base.info.projectReference,
    offerReference: base.info.offerReference,
    customerName: base.info.customerName,
    expectedModules: base.modules.map((module) => ({
      moduleNumber: module.moduleNumber,
      floor: module.floor,
      room: module.room,
      mark: module.mark,
      category: module.category,
      finishIncludes: '7016',
      hardwareIncludes: 'HW-A',
      contextualCorrectionCount: 0,
    })),
    unresolvedProjectReferenceCount: 0,
    tags: ['project-context', 'offer-inheritance', 'floor-room-mark-module'],
  }
}

function exactOverrideCase(index: number): AiPromptKnowledgeCorpus06Case {
  const base = basePrompt(100 + index)
  const target = base.modules[2]!
  const correction = `Корекция: етаж ${target.floor}, помещение ${target.room}, марка ${target.mark}: цвят RAL 9016`
  return {
    id: `CP6-EXACT-${pad(index)}`,
    track: 'EXACT_CONTEXT_OVERRIDE',
    prompt: `${base.text}; ${correction}`,
    projectReference: base.info.projectReference,
    offerReference: base.info.offerReference,
    customerName: base.info.customerName,
    expectedModules: base.modules.map((module) => ({
      moduleNumber: module.moduleNumber,
      floor: module.floor,
      room: module.room,
      mark: module.mark,
      category: module.category,
      finishIncludes: module.moduleNumber === target.moduleNumber ? '9016' : '7016',
      hardwareIncludes: 'HW-A',
      contextualCorrectionCount: module.moduleNumber === target.moduleNumber ? 1 : 0,
    })),
    unresolvedProjectReferenceCount: 0,
    tags: ['exact-context-target', 'local-override', 'no-sibling-leakage'],
  }
}

function floorGroupCase(index: number): AiPromptKnowledgeCorpus06Case {
  const base = basePrompt(200 + index)
  const correction = 'Корекция: всички модули на етаж 2: обков: HW-B'
  return {
    id: `CP6-FLOOR-${pad(index)}`,
    track: 'FLOOR_GROUP_SCOPE',
    prompt: `${base.text}; ${correction}`,
    projectReference: base.info.projectReference,
    offerReference: base.info.offerReference,
    customerName: base.info.customerName,
    expectedModules: base.modules.map((module) => ({
      moduleNumber: module.moduleNumber,
      floor: module.floor,
      room: module.room,
      mark: module.mark,
      category: module.category,
      finishIncludes: '7016',
      hardwareIncludes: module.floor === '2' ? 'HW-B' : 'HW-A',
      contextualCorrectionCount: module.floor === '2' ? 1 : 0,
    })),
    unresolvedProjectReferenceCount: 0,
    tags: ['floor-group-scope', 'bounded-group-override', 'no-cross-floor-leakage'],
  }
}

function ambiguousContextCase(index: number): AiPromptKnowledgeCorpus06Case {
  const info = header(300 + index)
  const marks = [`W-${4000 + index}`, `W-${5000 + index}`, `W-${6000 + index}`, `D-${4000 + index}`]
  const modules = [
    { moduleNumber: 1, floor: '1', room: '101', mark: marks[0]!, category: 'WINDOW' as const, text: windowText(marks[0]!, 1250 + index, 1300) },
    { moduleNumber: 2, floor: '1', room: '203', mark: marks[1]!, category: 'WINDOW' as const, text: windowText(marks[1]!, 1450 + index, 1500) },
    { moduleNumber: 3, floor: '2', room: '203', mark: marks[2]!, category: 'WINDOW' as const, text: windowText(marks[2]!, 1650 + index, 1500) },
    { moduleNumber: 4, floor: '2', room: '204', mark: marks[3]!, category: 'DOOR' as const, text: doorText(marks[3]!, 960, 2160) },
  ]
  const prompt = `${info.text}; ${modules.map((module) => moduleSegment(module.floor, module.room, module.mark, module.moduleNumber, module.text)).join('; ')}; Корекция: в помещение 203 смени цвета на RAL 9016`
  return {
    id: `CP6-AMB-${pad(index)}`,
    track: 'AMBIGUOUS_CONTEXT_SAFETY',
    prompt,
    projectReference: info.projectReference,
    offerReference: info.offerReference,
    customerName: info.customerName,
    expectedModules: modules.map((module) => ({
      moduleNumber: module.moduleNumber,
      floor: module.floor,
      room: module.room,
      mark: module.mark,
      category: module.category,
      finishIncludes: '7016',
      hardwareIncludes: 'HW-A',
      contextualCorrectionCount: 0,
    })),
    unresolvedProjectReferenceCount: 1,
    tags: ['ambiguous-room', 'no-guess', 'human-review', 'no-cross-floor-leakage'],
  }
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_06: AiPromptKnowledgeCorpus06Case[] = [
  ...Array.from({ length: 50 }, (_, index) => inheritanceCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => exactOverrideCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => floorGroupCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => ambiguousContextCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_06_EXPECTED_COUNTS = {
  TOTAL: 200,
  PROJECT_CONTEXT_INHERITANCE: 50,
  EXACT_CONTEXT_OVERRIDE: 50,
  FLOOR_GROUP_SCOPE: 50,
  AMBIGUOUS_CONTEXT_SAFETY: 50,
} as const
