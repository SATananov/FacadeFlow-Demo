import { createFacadeFlowProductIntent, validateFacadeFlowProductIntent, type FacadeFlowIntentField, type FacadeFlowIntentOpeningDirection, type FacadeFlowIntentOpeningType, type FacadeFlowIntentSwing, type FacadeFlowProductIntent } from './aiProductIntent'
import { aiUiMessageBg } from './aiUiLanguageBg'

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

function toMillimetres(value: number, unit: string | undefined) {
  return Number((value * unitMultiplier(unit)).toFixed(6))
}

type ParsedDimensions =
  | { status: 'PARSED'; widthMm: number; heightMm: number; excerpt: string }
  | { status: 'AMBIGUOUS_UNITS'; excerpt: string }

function parseDimensions(text: string): ParsedDimensions | null {
  const patterns = [
    /\b(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?\s*[xх×]\s*(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?(?!\s*(?:mm|мм|cm|см|m|м))/i,
    /\b(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?\s+(?:на|by)\s+(\d{1,5}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)?(?!\s*(?:mm|мм|cm|см|m|м))/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    const widthRaw = match[1]
    const heightRaw = match[3]
    const widthValue = Number(widthRaw.replace(',', '.'))
    const heightValue = Number(heightRaw.replace(',', '.'))
    const widthUnit = match[2]?.toLowerCase()
    const heightUnit = match[4]?.toLowerCase()
    if (!(widthValue > 0 && heightValue > 0)) continue

    if (widthUnit && heightUnit) {
      return {
        status: 'PARSED',
        widthMm: toMillimetres(widthValue, widthUnit),
        heightMm: toMillimetres(heightValue, heightUnit),
        excerpt: match[0],
      }
    }

    if (!widthUnit && !heightUnit) {
      if (/[.,]/.test(widthRaw) || /[.,]/.test(heightRaw)) return { status: 'AMBIGUOUS_UNITS', excerpt: match[0] }
      return { status: 'PARSED', widthMm: widthValue, heightMm: heightValue, excerpt: match[0] }
    }

    const sharedUnit = widthUnit || heightUnit
    const bareRaw = widthUnit ? heightRaw : widthRaw
    const bareValue = widthUnit ? heightValue : widthValue
    const canShare = sharedUnit === 'cm' || sharedUnit === 'см'
      ? !/[.,]/.test(bareRaw) && bareValue >= 10
      : sharedUnit === 'm' || sharedUnit === 'м'
        ? bareValue <= 20
        : !/[.,]/.test(bareRaw) && bareValue >= 50

    if (!canShare) return { status: 'AMBIGUOUS_UNITS', excerpt: match[0] }
    return {
      status: 'PARSED',
      widthMm: toMillimetres(widthValue, widthUnit || sharedUnit),
      heightMm: toMillimetres(heightValue, heightUnit || sharedUnit),
      excerpt: match[0],
    }
  }
  return null
}

function parseQuantity(text: string) {
  const numericPatterns = [
    /(?:qty|quantity|количество)\s*[:=]?\s*(\d{1,4})\b/i,
    /\b(\d{1,4})\s*(?:бр\.?(?=\s|[,;.]|$)|броя(?=\s|[,;.]|$)|pieces?\b|pcs?\b)/i,
  ]
  for (const pattern of numericPatterns) {
    const match = text.match(pattern)
    if (match && Number(match[1]) > 0) return { quantity: Number(match[1]), excerpt: match[0] }
  }
  const wordMatch = text.match(/(един|една|едно|два|две|три|четири|пет|шест|one|two|three|four|five|six)\s*(?:бр\.?(?=\s|[,;.]|$)|броя(?=\s|[,;.]|$)|pieces?\b|pcs?\b)/i)
  if (wordMatch) {
    const quantity = numberWords[wordMatch[1].toLocaleLowerCase('bg')]
    if (quantity > 0) return { quantity, excerpt: wordMatch[0] }
  }
  return null
}

function parseFieldCount(text: string) {
  const orientation = '(?:(?:вертикални|хоризонтални|vertical|horizontal)\\s+)?'
  const numeric = text.match(new RegExp(`(\\d{1,2})\\s*${orientation}(?:полета|поле|fields?|sections?)`, 'i'))
  if (numeric && Number(numeric[1]) > 0 && Number(numeric[1]) <= 12) return { count: Number(numeric[1]), excerpt: numeric[0] }
  const words = text.match(new RegExp(`(един|едно|два|две|три|четири|пет|шест|two|three|four|five|six)\\s+${orientation}(?:полета|поле|fields?|sections?)`, 'i'))
  if (words) return { count: numberWords[words[1].toLocaleLowerCase('bg')], excerpt: words[0] }
  return null
}

function parseExplicitSingleLeafTopology(text: string) {
  const match = text.match(/(?:едно\s+(?:високо\s+)?(?:отваряемо\s+)?(?:крило|листо)|един\s+(?:висок\s+)?(?:отваряем\s+)?(?:лист|leaf)|еднокрил(?:а|ен|о)?(?=\s|[,;.]|$)|single[- ]leaf)/iu)
  return match ? { count: 1, excerpt: match[0] } : null
}

function parseLowerPanelSemantics(text: string) {
  const panel = text.match(/(?:долен|долния|долната|долно|lower|bottom)\s+(?:(?:непрозрачен|плътен|solid|opaque)\s+)?(?:панел|panel)/i)
  const divider = text.match(/(?:хоризонтален\s+делител|horizontal\s+(?:divider|transom))/i)
  if (!panel) return null
  const height = text.match(/(?:долен|долния|долната|долно|lower|bottom)[^,;.]{0,100}?(?:панел|panel)(?:[^,;.]{0,60}?(?:височина|height)\s*(?:на|of|[:=])?|\s*(?:на|of|[:=])?)\s*(\d{2,4}(?:[.,]\d+)?)\s*(mm|мм|cm|см|m|м)/i)
  const upperGlazed = text.match(/(?:горн(?:ата|а)\s+част[^,;.]{0,40}?(?:остъклена|стъкло)|upper\s+(?:part|zone)[^,;.]{0,40}?(?:glazed|glass))/i)
  return {
    heightMm: height ? toMillimetres(Number(height[1].replace(',', '.')), height[2]) : undefined,
    upperZoneRole: upperGlazed ? 'GLAZING' as const : 'UNRESOLVED' as const,
    excerpt: [divider?.[0], panel?.[0], height?.[0], upperGlazed?.[0]].filter(Boolean).join(' · '),
  }
}

function parseOpeningType(text: string): { type: FacadeFlowIntentOpeningType; excerpt: string } | null {
  const patterns: Array<[RegExp, FacadeFlowIntentOpeningType]> = [
    [/(?:tilt\s*[-+&/]?\s*turn|отваряемо\s*\+\s*падащо|отваряемо\s+и\s+падащо|осово\s*[- ]?(?:обръщателно|откидно))/i, 'TILT_TURN'],
    [/(?:плъзгащо|плъзгащ|плъзгаща|плъзгащи|плъзга|плъзгат|\bsliding\b|\bslides?\b)/i, 'SLIDING'],
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
  const match = text.match(/(?:отваряемо|отваряем|се\s+отваря|отваря\s+се|\boperable\b|\bopenable\b|\bopening sash\b|\bopens?\b)/i)
  return match ? { excerpt: match[0] } : null
}

function parseOpeningDirection(text: string): { direction: FacadeFlowIntentOpeningDirection; excerpt: string } | null {
  const patterns: Array<[RegExp, FacadeFlowIntentOpeningDirection]> = [
    [/(?:посока|отваряне|opening)\s*[:=-]?\s*(?:ляво|лява|наляво|\bleft\b)/i, 'LEFT'],
    [/(?:посока|отваряне|opening)\s*[:=-]?\s*(?:дясно|дясна|надясно|\bright\b)/i, 'RIGHT'],
    [/(?:ляво|\bleft\b)[ -]?(?:отваряне|opening)/i, 'LEFT'],
    [/(?:дясно|\bright\b)[ -]?(?:отваряне|opening)/i, 'RIGHT'],
    [/(?:се\s+)?отваря(?:\s+се)?[^,;.]{0,18}?(?:наляво|към\s+ляво)/i, 'LEFT'],
    [/(?:се\s+)?отваря(?:\s+се)?[^,;.]{0,18}?(?:надясно|към\s+дясно)/i, 'RIGHT'],
    [/\b(?:turn|opens?)\s+(?:to\s+(?:the\s+)?)?left\b/i, 'LEFT'],
    [/\b(?:turn|opens?)\s+(?:to\s+(?:the\s+)?)?right\b/i, 'RIGHT'],
    [/(?:tilt\s*[-+&/]?\s*turn|\bturn\b|отваряемо|отваряем|отваря)\s+(?:наляво|към\s+ляво|\bleft\b)/i, 'LEFT'],
    [/(?:tilt\s*[-+&/]?\s*turn|\bturn\b|отваряемо|отваряем|отваря)\s+(?:надясно|към\s+дясно|\bright\b)/i, 'RIGHT'],
  ]
  for (const [pattern, direction] of patterns) {
    const match = text.match(pattern)
    if (match) return { direction, excerpt: match[0] }
  }
  return null
}


function parseSlidingDirection(text: string): { direction: FacadeFlowIntentOpeningDirection; excerpt: string } | null {
  const patterns: Array<[RegExp, FacadeFlowIntentOpeningDirection]> = [
    [/(?:плъзга(?:що|щ|ща|т)?|плъзване|slide|slides|sliding)[^,;.]{0,24}?(?:наляво|към\s+ляво|\bleft\b)/i, 'LEFT'],
    [/(?:плъзга(?:що|щ|ща|т)?|плъзване|slide|slides|sliding)[^,;.]{0,24}?(?:надясно|към\s+дясно|\bright\b)/i, 'RIGHT'],
    [/(?:наляво|към\s+ляво|\bleft\b)[^,;.]{0,24}?(?:плъзга(?:що|щ|ща|т)?|плъзване|slide|slides|sliding)/i, 'LEFT'],
    [/(?:надясно|към\s+дясно|\bright\b)[^,;.]{0,24}?(?:плъзга(?:що|щ|ща|т)?|плъзване|slide|slides|sliding)/i, 'RIGHT'],
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


function captureExplicitProfileReferences(text: string, labels: string[]) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const matcher = new RegExp(`(?:${escaped})\\s*[:=-]?\\s*([A-ZА-Я0-9]*\\d[A-ZА-Я0-9]*(?:[._-][A-ZА-Я0-9]+)+|[A-ZА-Я]+[-_]?[0-9]+[A-ZА-Я0-9._-]*)(?=\\s*(?:,|;|\\.|\\s+(?:и|and)\\s+|$))`, 'giu')
  return [...text.matchAll(matcher)].map((match) => ({
    value: cleanCapture(match[1])!,
    excerpt: match[0],
  }))
}

function distinctProfileReferences(references: Array<{ value: string; excerpt: string }>) {
  const byKey = new Map<string, { value: string; excerpt: string }>()
  for (const reference of references) {
    const key = reference.value.toLocaleUpperCase('bg')
    if (!byKey.has(key)) byKey.set(key, reference)
  }
  return [...byKey.values()]
}

function parseRal(text: string) {
  const matches = [...text.matchAll(/\bRAL\s*[-:]?\s*(\d{3,4})\b/gi)]
  const values = [...new Set(matches.map((match) => `RAL ${match[1]}`))]
  if (values.length > 1) return { status: 'CONFLICT' as const, values, excerpt: matches.map((match) => match[0]).join(' / ') }
  const match = matches[0]
  return match ? { status: 'PARSED' as const, value: values[0], excerpt: match[0] } : null
}

function parseGlazing(text: string) {
  const tripleMatches = [...text.matchAll(/(?:(?:троен|triple)\s+(?:стъклопакет|glaz(?:ing|ed unit)))/gi)]
  const doubleMatches = [...text.matchAll(/(?:(?:двоен|double)\s+(?:стъклопакет|glaz(?:ing|ed unit)))/gi)]
  if (tripleMatches.length && doubleMatches.length) {
    return {
      status: 'CONFLICT' as const,
      values: [doubleMatches[0][0], tripleMatches[0][0]],
      excerpt: `${doubleMatches[0][0]} / ${tripleMatches[0][0]}`,
    }
  }
  const upperGlazed = text.match(/(?:горн(?:ата|а)\s+част[^,;.]{0,40}?(?:остъклена|стъкло)|upper\s+(?:part|zone)[^,;.]{0,40}?(?:glazed|glass))/i)
  if (upperGlazed) return { status: 'PARSED' as const, value: 'Горна остъклена зона', excerpt: upperGlazed[0] }
  const triple = text.match(/(?:(?:троен|triple)\s+(?:стъклопакет|glaz(?:ing|ed unit)))/i)
  if (triple) return { status: 'PARSED' as const, value: triple[0], excerpt: triple[0] }
  const double = text.match(/(?:(?:двоен|double)\s+(?:стъклопакет|glaz(?:ing|ed unit)))/i)
  if (double) return { status: 'PARSED' as const, value: double[0], excerpt: double[0] }
  const generic = text.match(/(?:стъклопакет|стъкло|\bglazing unit\b|\bglass\b|\bpanel\b|панел)(?:\s+[^,;.]{0,60})?/i)
  return generic ? { status: 'PARSED' as const, value: cleanCapture(generic[0])!, excerpt: generic[0] } : null
}

function parseHandle(text: string) {
  const keyed = text.match(/(?:дръжка\s+с\s+ключ|\bkeyed\s+handle\b|\blocking\s+handle\b)/i)
  if (keyed) return { value: keyed[0], excerpt: keyed[0] }
  const coloured = text.match(/(?:(?:черна|бяла|сива|\bblack\b|\bwhite\b|\bgrey\b|\bgray\b)\s+дръжка|(?:\bblack\b|\bwhite\b|\bgrey\b|\bgray\b)\s+handle|дръжка\s+[^,;.]{1,50}|\bhandle\b\s+[^,;.]{1,50})/i)
  return coloured ? { value: cleanCapture(coloured[0])!, excerpt: coloured[0] } : null
}

function parseHinges(text: string) {
  const quantityPattern = /(\d{1,2}|един|една|едно|два|две|три|четири|пет|шест|one|two|three|four|five|six)\s*(?:(?:скрити|видими|concealed|hidden|visible)\s+)?(?:панти|панта|hinges?)/gi
  const quantityMatches = [...text.matchAll(quantityPattern)]
  const quantities = [...new Set(quantityMatches.map((match) => {
    const token = match[1].toLocaleLowerCase('bg')
    return /^\d+$/.test(token) ? Number(token) : numberWords[token]
  }).filter((value): value is number => Number.isFinite(value)))]
  const descriptor = text.match(/(?:скрити|видими|\bconcealed\b|\bhidden\b|\bvisible\b)\s+(?:панти|hinges?)/i)
  return {
    quantity: quantities.length === 1 ? quantities[0] : undefined,
    quantityConflict: quantities.length > 1 ? quantities : undefined,
    descriptor: descriptor ? cleanCapture(descriptor[0]) : undefined,
    excerpt: [quantityMatches.map((match) => match[0]).join(' / '), descriptor?.[0]].filter(Boolean).join(' · ') || undefined,
  }
}


function positionIndex(token: string, count: number) {
  const value = token.toLocaleLowerCase('bg')
  if (/ляв|left/.test(value)) return 0
  if (/д[ея]с|right/.test(value)) return Math.max(0, count - 1)
  if (/сред|center|middle/.test(value)) return count >= 3 ? Math.floor((count - 1) / 2) : null
  const ordinal: Array<[RegExp, number]> = [
    [/(?:първ|first)/, 0],
    [/(?:втор|second)/, 1],
    [/(?:трет|third)/, 2],
    [/(?:четвърт|fourth)/, 3],
    [/(?:пет|fifth)/, 4],
    [/(?:шест|sixth)/, 5],
  ]
  for (const [pattern, index] of ordinal) if (pattern.test(value)) return index < count ? index : null
  return null
}

function parseFieldLocalDirection(text: string): { direction: FacadeFlowIntentOpeningDirection; excerpt: string } | null {
  const explicit = parseSlidingDirection(text) ?? parseOpeningDirection(text)
  if (explicit) return explicit
  const left = text.match(/(?:наляво|към\s+ляво|^\s*left\b)/i)
  if (left) return { direction: 'LEFT', excerpt: left[0] }
  const right = text.match(/(?:надясно|към\s+дясно|^\s*right\b)/i)
  if (right) return { direction: 'RIGHT', excerpt: right[0] }
  return null
}

function setFieldRoleFromText(fields: FacadeFlowIntentField[], index: number, phrase: string, contextualOpeningType?: FacadeFlowIntentOpeningType) {
  if (index < 0 || index >= fields.length) return
  const opening = parseOpeningType(phrase)
  const operable = parseOperableSignal(phrase)
  const direction = parseFieldLocalDirection(phrase)
  const swing = parseSwing(phrase)
  if (!opening && !operable && !direction && !swing) return
  const current = fields[index]
  const openingType = opening?.type
    ?? (operable && direction ? 'TURN' : undefined)
    ?? (direction && contextualOpeningType ? contextualOpeningType : current.openingType)
  const role = openingType === 'FIXED'
    ? 'FIXED'
    : openingType === 'SLIDING'
      ? 'SLIDING_SASH'
      : openingType || operable || direction || swing
        ? 'OPENING_SASH'
        : current.role
  const unresolved: string[] = []
  if (role === 'OPENING_SASH' && !openingType) unresolved.push('Тип отваряне на полето')
  if ((openingType === 'TURN' || openingType === 'TILT_TURN') && !(direction?.direction ?? current.openingDirection)) unresolved.push('Посока ляво / дясно')
  fields[index] = {
    ...current,
    role,
    openingType,
    openingDirection: direction?.direction ?? current.openingDirection,
    swing: swing?.swing ?? current.swing,
    unresolved,
  }
}

function applyCompoundFieldRoles(text: string, fields: FacadeFlowIntentField[]) {
  if (fields.length < 2) return
  const paired = text.match(/(?:ляв(?:ото|ия)?\s+(?:поле\s+)?и\s+д[ея]сн(?:ото|ия)?\s+(?:поле\s+)?|left\s+and\s+right\s+)(?:(?:са|are)\s+)?(фикс(?:ирани|ирано|иран|но)?|fixed|отваряеми|отваряемо|openable|operable|плъзгащи|sliding)/i)
  if (paired?.[1]) {
    setFieldRoleFromText(fields, 0, paired[1])
    setFieldRoleFromText(fields, fields.length - 1, paired[1])
  }

  const bothSliding = text.match(/(?:и\s+)?двете(?:\s+(?:полета|крила))?\s+(?:(?:са|are)\s+)?(плъзгащи|sliding)/i)
  if (bothSliding?.[1] && fields.length === 2) {
    setFieldRoleFromText(fields, 0, bothSliding[1])
    setFieldRoleFromText(fields, 1, bothSliding[1])
  }

  const edge = text.match(/(?:двете\s+)?(?:крайните|крайни)\s+(?:полета\s+)?(фикс(?:ирани|ирано|иран|но)?|fixed|отваряеми|отваряемо|openable|operable)/i)
  if (edge?.[1]) {
    setFieldRoleFromText(fields, 0, edge[1])
    setFieldRoleFromText(fields, fields.length - 1, edge[1])
  }

  const ordinalPair = /(първ(?:ото|ия)?|втор(?:ото|ия)?|трет(?:ото|ия)?|четвърт(?:ото|ия)?|пет(?:ото|ия)?|шест(?:ото|ия)?|first|second|third|fourth|fifth|sixth)\s+(?:поле\s+)?и\s+(първ(?:ото|ия)?|втор(?:ото|ия)?|трет(?:ото|ия)?|четвърт(?:ото|ия)?|пет(?:ото|ия)?|шест(?:ото|ия)?|first|second|third|fourth|fifth|sixth)\s+(?:поле\s+)?(?:(?:са|are)\s+)?(фикс(?:ирани|ирано|иран|но)?|fixed|отваряеми|отваряемо|openable|operable|плъзгащи|sliding)/gi
  for (const match of text.matchAll(ordinalPair)) {
    const firstIndex = positionIndex(match[1], fields.length)
    const secondIndex = positionIndex(match[2], fields.length)
    if (firstIndex !== null) setFieldRoleFromText(fields, firstIndex, match[3])
    if (secondIndex !== null) setFieldRoleFromText(fields, secondIndex, match[3])
  }
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
  const fieldActionLookahead = '(?:поле\\b|fixed\\b|фикс(?:ирано|иран|ирани|но)?\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|плъзга\\w*|отваряем\\w*)'
  const position = `(ляв(?:ото|ия)|ляво(?=\\s+${fieldActionLookahead})|д[ея]сн(?:ото|ия)|д[ея]сно(?=\\s+${fieldActionLookahead})|средн(?:ото|ия)|средно(?=\\s+${fieldActionLookahead})|първ(?:ото|ия)|първо(?=\\s+${fieldActionLookahead})|втор(?:ото|ия)|второ(?=\\s+${fieldActionLookahead})|трет(?:ото|ия)|трето(?=\\s+${fieldActionLookahead})|четвърт(?:ото|ия)|четвърто(?=\\s+${fieldActionLookahead})|пет(?:ото|ия)|пето(?=\\s+${fieldActionLookahead})|шест(?:ото|ия)|шесто(?=\\s+${fieldActionLookahead})|left(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|right(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|center(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|middle(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|first(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|second(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|third(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|fourth(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|fifth(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b))|sixth(?=\\s+(?:field\\b|fixed\\b|tilt(?:[- ]turn)?\\b|turn\\b|sliding\\b|openable\\b|operable\\b)))`
  const contextualOpeningType: FacadeFlowIntentOpeningType | undefined = /(?:плъзга|\bslid)/i.test(text) ? 'SLIDING' : undefined
  const clauseMatcher = new RegExp(`${position}\\s*(?:поле|field)?\\s*(?:е|is)?\\s*([^,;.]{1,110})`, 'giu')
  for (const match of text.matchAll(clauseMatcher)) {
    const index = positionIndex(match[1], count)
    if (index === null || index < 0 || index >= fields.length) continue
    setFieldRoleFromText(fields, index, match[2], contextualOpeningType)
  }
  const numericClauseMatcher = /(?:поле|field)\s*#?\s*(\d{1,2})\s*(?:е|се|is|[:=-])?\s*([^,;.]{1,110})/giu
  for (const match of text.matchAll(numericClauseMatcher)) {
    const index = Number(match[1]) - 1
    if (index < 0 || index >= fields.length) continue
    setFieldRoleFromText(fields, index, match[2], contextualOpeningType)
  }
  const compactClauseMatcher = /\bF(\d{1,2})\s*[:=-]\s*([^,;.]{1,110})/giu
  for (const match of text.matchAll(compactClauseMatcher)) {
    const index = Number(match[1]) - 1
    if (index < 0 || index >= fields.length) continue
    setFieldRoleFromText(fields, index, match[2], contextualOpeningType)
  }
  applyCompoundFieldRoles(text, fields)
  return fields
}


const openingTypeDisplay: Record<FacadeFlowIntentOpeningType, string> = {
  FIXED: 'Фиксирано',
  TURN: 'Отваряемо',
  TILT: 'Падащо',
  TILT_TURN: 'Осово-откидно',
  SLIDING: 'Плъзгащо',
  OTHER: 'Друго',
  UNRESOLVED: 'Неуточнено',
}

const openingDirectionDisplay: Record<FacadeFlowIntentOpeningDirection, string> = {
  LEFT: 'Ляво',
  RIGHT: 'Дясно',
  UNRESOLVED: 'Неуточнено',
}

const swingDisplay: Record<FacadeFlowIntentSwing, string> = {
  INWARD: 'Навътре',
  OUTWARD: 'Навън',
  UNRESOLVED: 'Неуточнено',
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
  } else if (/(?:плъзгащ(?:а|а се|и|о)?\s+(?:конструкция|система)|плъзгащи\s+(?:панели|крила)|\bsliding\s+(?:construction|system|panels?|sashes?))/i.test(text)) {
    const slidingFamily = text.match(/(?:плъзгащ(?:а|а се|и|о)?\s+(?:конструкция|система)|плъзгащи\s+(?:панели|крила)|\bsliding\s+(?:construction|system|panels?|sashes?))/i)![0]
    intent.category = 'COMBINED'; recognized.push(recognition('category', 'Тип', 'Плъзгаща конструкция', slidingFamily))
  }

  const mark = text.match(/\b(?:W|D|WIN|DOOR)[-_ ]?\d{1,4}\b/i)
  if (mark) { intent.mark = mark[0].replace(/\s+/g, '-').toUpperCase(); recognized.push(recognition('mark', 'Марка', intent.mark, mark[0])) }

  const dimensionWarnings: string[] = []
  const dimensions = parseDimensions(text)
  if (dimensions?.status === 'PARSED') {
    intent.dimensions = { widthMm: dimensions.widthMm, heightMm: dimensions.heightMm }
    recognized.push(recognition('dimensions', 'Размери', `${dimensions.widthMm} × ${dimensions.heightMm} mm`, dimensions.excerpt))
  } else if (dimensions?.status === 'AMBIGUOUS_UNITS') {
    intent.unresolved.push('Единици на общите размери')
    dimensionWarnings.push(`Размерите „${dimensions.excerpt}“ имат двусмислени или липсващи единици и не са приети автоматично.`)
  }

  const quantity = parseQuantity(text)
  if (quantity) { intent.quantity = quantity.quantity; recognized.push(recognition('quantity', 'Количество', String(quantity.quantity), quantity.excerpt)) }

  const fields = parseFieldCount(text)
  const singleLeaf = fields ? null : parseExplicitSingleLeafTopology(text)
  const fieldTopology = fields ?? singleLeaf
  intent.fields = createFields(text, fieldTopology?.count ?? null, evidenceId)
  if (fieldTopology) recognized.push(recognition('fields', 'Полета', String(fieldTopology.count), fieldTopology.excerpt))

  const explicitKnownPrelude = text.match(/\b(?:KMG\s+)?PRELUDE\s*60\b/i)
  const profileSystem = captureAfterLabel(text, ['профилна система', 'профил система', 'система профили', 'система', 'profile system', 'profile family', 'system'])
    ?? (explicitKnownPrelude ? { value: 'PRELUDE 60', excerpt: explicitKnownPrelude[0] } : null)
  if (profileSystem?.value) { intent.profiles.system = profileSystem.value; recognized.push(recognition('system', 'Профилна система', profileSystem.value, profileSystem.excerpt, 'MEDIUM')) }

  const profileConflictWarnings: string[] = []
  const resolveProfileRole = (
    roleName: string,
    recognizedId: string,
    recognizedLabel: string,
    explicitLabels: string[],
    fallbackLabels: string[],
  ) => {
    const explicit = distinctProfileReferences(captureExplicitProfileReferences(text, explicitLabels))
    if (explicit.length > 1) {
      intent.unresolved.push(`Конфликт за профил ${roleName}: ${explicit.map((item) => item.value).join(' / ')}`)
      profileConflictWarnings.push(`Открити са противоречиви профилни референции за ${roleName}; не е избрана автоматично стойност.`)
      return undefined
    }
    const captured = explicit[0] ?? captureAfterLabel(text, fallbackLabels)
    if (captured?.value) recognized.push(recognition(recognizedId, recognizedLabel, captured.value, captured.excerpt, 'MEDIUM'))
    return captured?.value
  }

  intent.profiles.frame = resolveProfileRole(
    'каса',
    'frame',
    'Каса',
    ['профил за каса', 'профил каса', 'рамков профил', 'каса', 'frame profile', 'frame section', 'frame'],
    ['профил за каса', 'профил каса', 'рамков профил', 'каса', 'frame profile', 'frame section', 'frame'],
  )
  intent.profiles.sash = resolveProfileRole(
    'крило',
    'sash',
    'Крило',
    ['крило профил', 'профил крило', 'профил за крило', 'крило', 'sash profile', 'sash section', 'sash'],
    ['крило профил', 'профил крило', 'профил за крило', 'sash profile', 'sash section'],
  )
  intent.profiles.mullion = resolveProfileRole(
    'делител',
    'mullion',
    'Делител',
    ['делители', 'делителя', 'делител', 'профил делител', 'делител профил', 'профил за делител', 'mullion profile', 'mullion section', 'mullion'],
    ['профил делител', 'делител профил', 'профил за делител', 'mullion profile', 'mullion section'],
  )

  const opening = parseOpeningType(text)
  const operable = parseOperableSignal(text)
  const direction = opening?.type === 'SLIDING' ? (intent.fields.length === 1 ? (parseSlidingDirection(text) ?? parseOpeningDirection(text)) : null) : parseOpeningDirection(text)
  const swing = parseSwing(text)
  const hasFixedField = intent.fields.some((field) => field.role === 'FIXED')
  const hasOpenableField = intent.fields.some((field) => field.role === 'OPENING_SASH' || field.role === 'SLIDING_SASH')
  const hasMixedFieldOpening = intent.fields.length > 1 && hasFixedField && hasOpenableField
  if (hasMixedFieldOpening) recognized.push(recognition('opening', 'Отваряемост', 'Смесена конструкция', text))
  else if (opening) recognized.push(recognition('opening', 'Отваряемост', openingTypeDisplay[opening.type], opening.excerpt))
  else if (operable) recognized.push(recognition('opening', 'Отваряемост', direction ? 'Отваряемо' : 'ОТВАРЯЕМО · тип неуточнен', operable.excerpt, direction ? 'HIGH' : 'MEDIUM'))
  if (direction) recognized.push(recognition('direction', 'Посока', openingDirectionDisplay[direction.direction], direction.excerpt))
  if (swing) recognized.push(recognition('swing', 'Навътре / навън', swingDisplay[swing.swing], swing.excerpt))

  if (intent.fields.length === 1 && (opening || operable || direction || swing)) {
    const current = intent.fields[0]
    intent.fields[0] = {
      ...current,
      role: opening ? (opening.type === 'FIXED' ? 'FIXED' : opening.type === 'SLIDING' ? 'SLIDING_SASH' : 'OPENING_SASH') : operable ? 'OPENING_SASH' : current.role,
      openingType: opening?.type ?? (operable && direction ? 'TURN' : undefined),
      openingDirection: direction?.direction,
      swing: swing?.swing,
      unresolved: opening || (operable && direction) ? [] : operable ? ['Тип отваряне на полето'] : current.unresolved,
    }
  } else if (intent.fields.length > 0 && (opening || operable) && !intent.fields.some((field) => field.openingType || field.role === 'OPENING_SASH' || field.role === 'SLIDING_SASH')) {
    intent.unresolved.push('Отваряемостта е разпозната, но не е еднозначно свързана с конкретно поле.')
  }
  const fieldHasBoundDirection = intent.fields.some((field) => field.openingDirection === 'LEFT' || field.openingDirection === 'RIGHT')
  const fieldHasBoundSwing = intent.fields.some((field) => field.swing === 'INWARD' || field.swing === 'OUTWARD')
  if (intent.fields.length > 1 && direction && !fieldHasBoundDirection) intent.unresolved.push('Посоката на отваряне е разпозната, но не е еднозначно свързана с конкретно поле.')
  if (intent.fields.length > 1 && swing && !fieldHasBoundSwing) intent.unresolved.push('Навътре / навън е разпознато, но не е еднозначно свързано с конкретно поле.')

  const lowerPanel = parseLowerPanelSemantics(text)
  if (lowerPanel && intent.fields.length === 1) {
    const current = intent.fields[0]!
    intent.fields[0] = {
      ...current,
      lowerPanel: {
        semanticRole: 'LOWER_PANEL_ZONE',
        dividerOrientation: 'HORIZONTAL',
        heightMm: lowerPanel.heightMm,
        upperZoneRole: lowerPanel.upperZoneRole,
        lowerZoneRole: 'PANEL',
        evidenceIds: [evidenceId],
        unresolved: lowerPanel.heightMm === undefined ? ['Височина на долния панел'] : [],
      },
    }
    recognized.push(recognition('lower-panel', 'Долен панел', lowerPanel.heightMm ? `${lowerPanel.heightMm} mm` : 'Височина неуточнена', lowerPanel.excerpt || 'долен панел', lowerPanel.heightMm ? 'HIGH' : 'MEDIUM'))
    recognized.push(recognition('internal-divider', 'Вътрешен делител', 'Хоризонтален', lowerPanel.excerpt || 'хоризонтален делител'))
    if (lowerPanel.heightMm === undefined) intent.unresolved.push('Височина на долния панел')
  } else if (lowerPanel && intent.fields.length !== 1) {
    intent.unresolved.push('Долният панел е разпознат, но не е еднозначно свързан с едно конкретно крило.')
  }

  const semanticConflictWarnings: string[] = []
  const ral = parseRal(text)
  if (ral?.status === 'CONFLICT') {
    intent.unresolved.push(`Конфликт за цвят / покритие: ${ral.values.join(' / ')}`)
    semanticConflictWarnings.push('Открити са противоречиви стойности за цвят / покритие; не е избрана автоматично стойност.')
  } else if (ral?.status === 'PARSED') {
    intent.finish.exterior = ral.value
    recognized.push(recognition('finish', 'Цвят', ral.value, ral.excerpt))
  } else {
    const colourPattern = /(?:антрацит|анодизирано|черен|черна|бял|бяла|сив|сива|\bblack\b|\bwhite\b|\banthracite\b|\bgrey\b|\bgray\b)/giu
    for (const colour of text.matchAll(colourPattern)) {
      const index = colour.index ?? 0
      const before = text.slice(Math.max(0, index - 14), index)
      const after = text.slice(index + colour[0].length, index + colour[0].length + 14)
      if (/(?:дръжка|handle)\s*$/i.test(before) || /^\s*(?:дръжка|handle)(?=\s|[,;.]|$)/i.test(after)) continue
      intent.finish.exterior = colour[0]
      recognized.push(recognition('finish', 'Цвят', colour[0], colour[0], 'MEDIUM'))
      break
    }
  }

  const glazing = parseGlazing(text)
  if (glazing?.status === 'CONFLICT') {
    intent.unresolved.push(`Конфликт за стъкло / пълнеж: ${glazing.values.join(' / ')}`)
    semanticConflictWarnings.push('Открити са противоречиви стойности за стъкло / пълнеж; не е избрана автоматично стойност.')
  } else if (glazing?.status === 'PARSED') {
    intent.glazing.description = glazing.value
    recognized.push(recognition('glazing', 'Стъкло / пълнеж', glazing.value, glazing.excerpt, 'MEDIUM'))
  }

  const handle = parseHandle(text)
  if (handle) { intent.hardwareDefaults.handle = handle.value; recognized.push(recognition('handle', 'Дръжка', handle.value, handle.excerpt, 'MEDIUM')) }
  const hinges = parseHinges(text)
  if (hinges.quantityConflict) {
    intent.unresolved.push(`Конфликт за брой панти: ${hinges.quantityConflict.join(' / ')}`)
    semanticConflictWarnings.push('Открити са противоречиви стойности за брой панти; не е избрана автоматично стойност.')
  } else if (hinges.quantity) {
    intent.hardwareDefaults.hingeQuantity = hinges.quantity
    recognized.push(recognition('hinge-quantity', 'Панти', String(hinges.quantity), hinges.excerpt || `${hinges.quantity}`, 'MEDIUM'))
  }
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
    if (field.role === 'OPENING_SASH' && (field.openingType === 'TURN' || field.openingType === 'TILT_TURN') && !field.openingDirection) {
      intent.unresolved.push(`Посока ляво / дясно за поле ${field.order + 1}`)
    }
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
  const warnings = [...validation.warnings.map(aiUiMessageBg), ...dimensionWarnings, ...profileConflictWarnings, ...semanticConflictWarnings]
  if (recognized.some((item) => item.confidence === 'MEDIUM')) warnings.push('Някои стойности са извлечени от свободен текст с локални детерминистични правила и изискват човешка проверка.')
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
