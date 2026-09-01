import { createFacadeFlowProductIntent, validateFacadeFlowProductIntent, type FacadeFlowIntentField, type FacadeFlowIntentOpeningDirection, type FacadeFlowIntentOpeningType, type FacadeFlowIntentSwing, type FacadeFlowProductIntent } from './aiProductIntent'

export type FacadeFlowPromptInterpreterMode = 'LOCAL_DETERMINISTIC'

export interface FacadeFlowPromptRecognition {
  id: string
  label: string
  value: string
  confidence: 'HIGH' | 'MEDIUM'
  excerpt: string
}

export interface FacadeFlowPromptInterpretationResult {
  schemaVersion: 'AI01.2'
  mode: FacadeFlowPromptInterpreterMode
  sourceText: string
  intent: FacadeFlowProductIntent
  recognized: FacadeFlowPromptRecognition[]
  unresolved: string[]
  warnings: string[]
  validForHumanReview: boolean
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const numberWords: Record<string, number> = {
  един: 1, една: 1, едно: 1, one: 1, two: 2, два: 2, две: 2, три: 3, three: 3, четири: 4, four: 4,
  пет: 5, five: 5, шест: 6, six: 6,
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
const lower = (text: string) => normalize(text).toLocaleLowerCase('bg')
const cleanCapture = (value: string | undefined) => value?.trim().replace(/[.,;:]+$/g, '') || undefined

function unitMultiplier(unit: string | undefined) {
  const normalized = unit?.toLowerCase()
  if (!normalized || normalized === 'mm' || normalized === 'мм') return 1
  if (normalized === 'cm' || normalized === 'см') return 10
  if (normalized === 'm' || normalized === 'м') return 1000
  return 1
}

function parseDimensions(text: string) {
  const patterns = [
    /\b(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?\s*[xх×]\s*(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?\b/i,
    /\b(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?\s+(?:на|by)\s+(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    const sharedUnit = match[2] || match[4]
    const width = Number(match[1].replace(',', '.')) * unitMultiplier(match[2] || sharedUnit)
    const height = Number(match[3].replace(',', '.')) * unitMultiplier(match[4] || sharedUnit)
    if (width > 0 && height > 0) return { widthMm: width, heightMm: height, excerpt: match[0] }
  }
  return null
}

function parseQuantity(text: string) {
  const patterns = [
    /(?:qty|quantity|количество)\s*[:=]?\s*(\d{1,4})\b/i,
    /\b(\d{1,4})\s*(?:бр\.?|броя|pieces?|pcs?)\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && Number(match[1]) > 0) return { quantity: Number(match[1]), excerpt: match[0] }
  }
  return null
}

function parseFieldCount(text: string) {
  const numeric = text.match(/(\d{1,2})\s*(?:полета|поле|\bfields?\b|\bsections?\b)/i)
  if (numeric && Number(numeric[1]) > 0 && Number(numeric[1]) <= 12) return { count: Number(numeric[1]), excerpt: numeric[0] }
  const words = text.match(/(един|едно|два|две|три|четири|пет|шест|\btwo\b|\bthree\b|\bfour\b|\bfive\b|\bsix\b)\s+(?:полета|поле|fields?|sections?)/i)
  if (words) return { count: numberWords[words[1].toLocaleLowerCase('bg')], excerpt: words[0] }
  return null
}

function parseOpeningType(text: string): { type: FacadeFlowIntentOpeningType; excerpt: string } | null {
  const patterns: Array<[RegExp, FacadeFlowIntentOpeningType]> = [
    [/(?:tilt\s*[-+&/]?\s*turn|отваряемо\s*\+\s*падащо|отваряемо\s+и\s+падащо|осово\s*[- ]?обръщателно)/i, 'TILT_TURN'],
    [/(?:плъзгащо|плъзгащ|\bsliding\b)/i, 'SLIDING'],
    [/(?:падащо|\btilt\b)/i, 'TILT'],
    [/(?:\bturn\b|\bcasement\b)/i, 'TURN'],
    [/(?:фикс(?:ирано|иран|но)?|\bfixed\b)/i, 'FIXED'],
  ]
  for (const [pattern, type] of patterns) {
    const match = text.match(pattern)
    if (match) return { type, excerpt: match[0] }
  }
  return null
}

function parseOperableSignal(text: string): { excerpt: string } | null {
  const match = text.match(/(?:отваряемо|отваряем|\boperable\b|\bopenable\b|\bopening sash\b)/i)
  return match ? { excerpt: match[0] } : null
}

function parseOpeningDirection(text: string): { direction: FacadeFlowIntentOpeningDirection; excerpt: string } | null {
  const patterns: Array<[RegExp, FacadeFlowIntentOpeningDirection]> = [
    [/(?:посока|отваряне|opening)\s*[:=-]?\s*(?:ляво|лява|\bleft\b)/i, 'LEFT'],
    [/(?:посока|отваряне|opening)\s*[:=-]?\s*(?:дясно|дясна|\bright\b)/i, 'RIGHT'],
    [/(?:ляво|\bleft\b)[ -]?(?:отваряне|opening)/i, 'LEFT'],
    [/(?:дясно|\bright\b)[ -]?(?:отваряне|opening)/i, 'RIGHT'],
  ]
  for (const [pattern, direction] of patterns) {
    const match = text.match(pattern)
    if (match) return { direction, excerpt: match[0] }
  }
  return null
}

function parseSwing(text: string): { swing: FacadeFlowIntentSwing; excerpt: string } | null {
  const inward = text.match(/(?:навътре|\binward\b|\binwards\b)/i)
  if (inward) return { swing: 'INWARD', excerpt: inward[0] }
  const outward = text.match(/(?:навън|\boutward\b|\boutwards\b)/i)
  if (outward) return { swing: 'OUTWARD', excerpt: outward[0] }
  return null
}

function captureAfterLabel(text: string, labels: string[]) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const match = text.match(new RegExp(`(?:${escaped})\\s*[:=-]?\\s*([^,;\\n]{1,80})`, 'i'))
  return match ? { value: cleanCapture(match[1]), excerpt: match[0] } : null
}

function parseRal(text: string) {
  const match = text.match(/\bRAL\s*[-:]?\s*(\d{3,4})\b/i)
  return match ? { value: `RAL ${match[1]}`, excerpt: match[0] } : null
}

function parseGlazing(text: string) {
  const triple = text.match(/(?:троен\s+стъклопакет|\btriple\s+glaz(?:ing|ed unit)\b)/i)
  if (triple) return { value: triple[0], excerpt: triple[0] }
  const double = text.match(/(?:двоен\s+стъклопакет|\bdouble\s+glaz(?:ing|ed unit)\b)/i)
  if (double) return { value: double[0], excerpt: double[0] }
  const generic = text.match(/(?:стъклопакет|стъкло|\bglazing unit\b|\bglass\b|\bpanel\b|панел)(?:\s+[^,;.]{0,60})?/i)
  return generic ? { value: cleanCapture(generic[0])!, excerpt: generic[0] } : null
}

function parseHandle(text: string) {
  const keyed = text.match(/(?:дръжка\s+с\s+ключ|\bkeyed\s+handle\b|\blocking\s+handle\b)/i)
  if (keyed) return { value: keyed[0], excerpt: keyed[0] }
  const coloured = text.match(/(?:(?:черна|бяла|сива|\bblack\b|\bwhite\b|\bgrey\b|\bgray\b)\s+дръжка|(?:\bblack\b|\bwhite\b|\bgrey\b|\bgray\b)\s+handle|дръжка\s+[^,;.]{1,50}|\bhandle\b\s+[^,;.]{1,50})/i)
  return coloured ? { value: cleanCapture(coloured[0])!, excerpt: coloured[0] } : null
}

function parseHinges(text: string) {
  const quantity = text.match(/(\d{1,2}|един|една|едно|два|две|три|четири|пет|шест|one|two|three|four|five|six)\s*(?:(?:скрити|видими|concealed|hidden|visible)\s+)?(?:панти|панта|hinges?)/i)
  const descriptor = text.match(/(?:скрити|видими|\bconcealed\b|\bhidden\b|\bvisible\b)\s+(?:панти|hinges?)/i)
  const quantityToken = quantity?.[1]?.toLocaleLowerCase('bg')
  const parsedQuantity = quantityToken ? (/^\d+$/.test(quantityToken) ? Number(quantityToken) : numberWords[quantityToken]) : undefined
  return {
    quantity: parsedQuantity,
    descriptor: descriptor ? cleanCapture(descriptor[0]) : undefined,
    excerpt: [quantity?.[0], descriptor?.[0]].filter(Boolean).join(' · ') || undefined,
  }
}

function positionIndex(token: string, count: number) {
  const value = token.toLocaleLowerCase('bg')
  if (/ляв|left/.test(value)) return 0
  if (/д[ея]с|right/.test(value)) return Math.max(0, count - 1)
  if (/сред|center|middle/.test(value)) return count >= 3 ? Math.floor((count - 1) / 2) : null
  return null
}

function createFields(text: string, count: number | null, evidenceId: string): FacadeFlowIntentField[] {
  if (!count || count < 1) return []
  const fields: FacadeFlowIntentField[] = Array.from({ length: count }, (_, index) => ({
    id: `field-${index + 1}`,
    order: index,
    role: 'UNRESOLVED',
    evidenceIds: [evidenceId],
    unresolved: ['Роля / отваряемост на полето'],
  }))
  const matcher = /(ляв(?:ото|ото поле)?|д[ея]сн(?:ото|ото поле)?|средн(?:ото|ото поле)?|\bleft\b|\bright\b|\bcenter\b|\bmiddle\b)[^,;.]{0,35}?(фикс(?:ирано|иран|но)?|\bfixed\b|отваряемо|отваряем|\bturn\b|tilt\s*[-+&/]?\s*turn|падащо|\btilt\b|плъзгащо|\bsliding\b)/gi
  for (const match of text.matchAll(matcher)) {
    const index = positionIndex(match[1], count)
    if (index === null || index < 0 || index >= fields.length) continue
    const opening = parseOpeningType(match[2])
    const operable = parseOperableSignal(match[2])
    if (!opening && !operable) continue
    const role = opening?.type === 'FIXED' ? 'FIXED' : opening?.type === 'SLIDING' ? 'SLIDING_SASH' : 'OPENING_SASH'
    fields[index] = {
      ...fields[index],
      role,
      openingType: opening?.type,
      unresolved: opening ? [] : ['Тип отваряне на полето'],
    }
  }
  return fields
}

function recognition(id: string, label: string, value: string, excerpt: string, confidence: 'HIGH' | 'MEDIUM' = 'HIGH'): FacadeFlowPromptRecognition {
  return { id, label, value, excerpt, confidence }
}

export function interpretFacadeFlowPrompt(sourceText: string, intentId = 'prompt-intent'): FacadeFlowPromptInterpretationResult {
  const text = normalize(sourceText)
  const normalized = lower(text)
  const intent = createFacadeFlowProductIntent({ id: intentId, sourceKind: 'PROMPT', sourceText: text, aiGenerated: true })
  const evidenceId = `${intentId}-prompt-evidence`
  intent.schemaVersion = 'AI01.1'
  intent.evidence = text ? [{ id: evidenceId, sourceKind: 'PROMPT', sourceName: 'Свободно описание', excerpt: text, strength: 'EXPLICIT' }] : []
  const recognized: FacadeFlowPromptRecognition[] = []

  if (/(?:прозорец|прозорци|\bwindow\b|\bwindows\b)/i.test(text)) {
    intent.category = 'WINDOW'; recognized.push(recognition('category', 'Тип', 'Прозорец', text.match(/(?:прозорец|прозорци|\bwindow\b|\bwindows\b)/i)![0]))
  } else if (/(?:врата|врати|\bdoor\b|\bdoors\b)/i.test(text)) {
    intent.category = 'DOOR'; recognized.push(recognition('category', 'Тип', 'Врата', text.match(/(?:врата|врати|\bdoor\b|\bdoors\b)/i)![0]))
  }

  const mark = text.match(/\b(?:W|D|WIN|DOOR)[-_ ]?\d{1,4}\b/i)
  if (mark) { intent.mark = mark[0].replace(/\s+/g, '-').toUpperCase(); recognized.push(recognition('mark', 'Марка', intent.mark, mark[0])) }

  const dimensions = parseDimensions(text)
  if (dimensions) {
    intent.dimensions = { widthMm: dimensions.widthMm, heightMm: dimensions.heightMm }
    recognized.push(recognition('dimensions', 'Размери', `${dimensions.widthMm} × ${dimensions.heightMm} mm`, dimensions.excerpt))
  }

  const quantity = parseQuantity(text)
  if (quantity) { intent.quantity = quantity.quantity; recognized.push(recognition('quantity', 'Количество', String(quantity.quantity), quantity.excerpt)) }

  const fields = parseFieldCount(text)
  intent.fields = createFields(text, fields?.count ?? null, evidenceId)
  if (fields) recognized.push(recognition('fields', 'Полета', String(fields.count), fields.excerpt))

  const profileSystem = captureAfterLabel(text, ['профилна система', 'система', 'profile system', 'system'])
  if (profileSystem?.value) { intent.profiles.system = profileSystem.value; recognized.push(recognition('system', 'Профилна система', profileSystem.value, profileSystem.excerpt, 'MEDIUM')) }
  const frame = captureAfterLabel(text, ['каса', 'frame profile', 'frame'])
  if (frame?.value) { intent.profiles.frame = frame.value; recognized.push(recognition('frame', 'Каса', frame.value, frame.excerpt, 'MEDIUM')) }
  const sash = captureAfterLabel(text, ['крило профил', 'профил крило', 'sash profile'])
  if (sash?.value) { intent.profiles.sash = sash.value; recognized.push(recognition('sash', 'Крило', sash.value, sash.excerpt, 'MEDIUM')) }
  const mullion = captureAfterLabel(text, ['делител', 'mullion profile', 'mullion'])
  if (mullion?.value) { intent.profiles.mullion = mullion.value; recognized.push(recognition('mullion', 'Делител', mullion.value, mullion.excerpt, 'MEDIUM')) }

  const opening = parseOpeningType(text)
  const operable = parseOperableSignal(text)
  const direction = parseOpeningDirection(text)
  const swing = parseSwing(text)
  if (opening) recognized.push(recognition('opening', 'Отваряемост', opening.type, opening.excerpt))
  else if (operable) recognized.push(recognition('opening', 'Отваряемост', 'ОТВАРЯЕМО · тип неуточнен', operable.excerpt, 'MEDIUM'))
  if (direction) recognized.push(recognition('direction', 'Посока', direction.direction, direction.excerpt))
  if (swing) recognized.push(recognition('swing', 'Навътре / навън', swing.swing, swing.excerpt))

  if (intent.fields.length === 1 && (opening || operable || direction || swing)) {
    const current = intent.fields[0]
    intent.fields[0] = {
      ...current,
      role: opening ? (opening.type === 'FIXED' ? 'FIXED' : opening.type === 'SLIDING' ? 'SLIDING_SASH' : 'OPENING_SASH') : operable ? 'OPENING_SASH' : current.role,
      openingType: opening?.type,
      openingDirection: direction?.direction,
      swing: swing?.swing,
      unresolved: opening ? [] : operable ? ['Тип отваряне на полето'] : current.unresolved,
    }
  } else if (intent.fields.length > 0 && (opening || operable) && !intent.fields.some((field) => field.openingType || field.role === 'OPENING_SASH' || field.role === 'SLIDING_SASH')) {
    intent.unresolved.push('Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле.')
  }
  if (intent.fields.length > 1 && direction) intent.unresolved.push('Посоката на отваряне е разпозната, но не е еднозначно свързана с конкретно поле.')
  if (intent.fields.length > 1 && swing) intent.unresolved.push('Навътре / навън е разпознато, но не е еднозначно свързано с конкретно поле.')

  const ral = parseRal(text)
  if (ral) { intent.finish.exterior = ral.value; recognized.push(recognition('finish', 'Цвят', ral.value, ral.excerpt)) }
  else {
    const colour = text.match(/(?:антрацит|анодизирано|черен|черна|бял|бяла|сив|сива|\bblack\b|\bwhite\b|\banthracite\b|\bgrey\b|\bgray\b)/i)
    if (colour && !/дръжка|handle/i.test(text.slice(Math.max(0, colour.index! - 18), colour.index! + colour[0].length + 18))) {
      intent.finish.exterior = colour[0]; recognized.push(recognition('finish', 'Цвят', colour[0], colour[0], 'MEDIUM'))
    }
  }

  const glazing = parseGlazing(text)
  if (glazing) { intent.glazing.description = glazing.value; recognized.push(recognition('glazing', 'Стъкло / пълнеж', glazing.value, glazing.excerpt, 'MEDIUM')) }

  const handle = parseHandle(text)
  if (handle) { intent.hardwareDefaults.handle = handle.value; recognized.push(recognition('handle', 'Дръжка', handle.value, handle.excerpt, 'MEDIUM')) }
  const hinges = parseHinges(text)
  if (hinges.quantity) { intent.hardwareDefaults.hingeQuantity = hinges.quantity; recognized.push(recognition('hinge-quantity', 'Панти', String(hinges.quantity), hinges.excerpt || `${hinges.quantity}`, 'MEDIUM')) }
  if (hinges.descriptor) { intent.hardwareDefaults.hinges = hinges.descriptor; recognized.push(recognition('hinges', 'Тип панти', hinges.descriptor, hinges.excerpt || hinges.descriptor, 'MEDIUM')) }
  const hardware = captureAfterLabel(text, ['обков', 'hardware'])
  if (hardware?.value) { intent.hardwareDefaults.mechanism = hardware.value; recognized.push(recognition('hardware', 'Обков', hardware.value, hardware.excerpt, 'MEDIUM')) }

  const handleHeight = text.match(/(?:дръжк(?:а|ата)|handle)[^,;.]{0,30}?(\d{3,4})\s*(?:mm|мм)/i)
  if (handleHeight) { intent.hardwareDefaults.handleHeightMm = Number(handleHeight[1]); recognized.push(recognition('handle-height', 'Височина дръжка', `${handleHeight[1]} mm`, handleHeight[0])) }

  if (intent.category === 'DOOR') {
    const threshold = captureAfterLabel(text, ['праг', 'threshold'])
    if (threshold?.value) { intent.profiles.threshold = threshold.value; recognized.push(recognition('threshold', 'Праг', threshold.value, threshold.excerpt, 'MEDIUM')) }
  }

  for (const field of intent.fields) {
    if (field.role === 'OPENING_SASH' && !field.openingType) intent.unresolved.push(`Тип отваряне за поле ${field.order + 1}`)
  }

  if (intent.category === 'UNRESOLVED') intent.unresolved.push('Тип изделие')
  if (intent.dimensions.widthMm === undefined || intent.dimensions.heightMm === undefined) intent.unresolved.push('Общи размери')
  if (!intent.profiles.system) intent.unresolved.push('Профилна система')
  if (!intent.fields.length) intent.unresolved.push('Брой / разпределение на полетата')
  if (!intent.glazing.description) intent.unresolved.push('Стъкло / пълнеж')
  if (!intent.finish.exterior) intent.unresolved.push('Цвят / покритие')

  intent.unresolved = [...new Set(intent.unresolved)]
  intent.status = 'NEEDS_REVIEW'

  const validation = validateFacadeFlowProductIntent(intent)
  const warnings = [...validation.warnings]
  if (recognized.some((item) => item.confidence === 'MEDIUM')) warnings.push('Някои стойности са извлечени от свободен текст с локални deterministic правила и изискват човешка проверка.')
  if (/(?:\ball\b|всички)/i.test(normalized) && intent.fields.length > 1 && opening) warnings.push('Общото описание за отваряемост не се прилага автоматично към всички полета.')

  return {
    schemaVersion: 'AI01.2',
    mode: 'LOCAL_DETERMINISTIC',
    sourceText: text,
    intent,
    recognized,
    unresolved: intent.unresolved,
    warnings: [...new Set(warnings)],
    validForHumanReview: validation.validForHumanReview,
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}
