import { interpretFacadeFlowPrompt, type FacadeFlowPromptInterpretationResult } from './aiPromptInterpreter'

export type FacadeFlowOrderPromptInterpreterMode = 'LOCAL_DETERMINISTIC_ORDER'

export interface FacadeFlowOrderPromptItem {
  order: number
  sourceText: string
  interpretation: FacadeFlowPromptInterpretationResult
  correctionsApplied: string[]
}

export interface FacadeFlowOrderPromptInterpretationResult {
  schemaVersion: 'AI-PROMPT-ORDER-01'
  mode: FacadeFlowOrderPromptInterpreterMode
  sourceText: string
  items: FacadeFlowOrderPromptItem[]
  unresolvedOrderReferences: string[]
  warnings: string[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

interface ItemMarker {
  order: number
  markerStart: number
  contentStart: number
}

function extractBaseAndCorrection(sourceText: string) {
  const correctionMatch = /(?:^|[;\n])\s*(?:корекция|корекции|correction|corrections)\s*[:=-]\s*/iu.exec(sourceText)
  if (!correctionMatch || correctionMatch.index === undefined) return { baseText: sourceText, correctionText: '' }
  const markerLengthBeforeContent = correctionMatch[0].length
  return {
    baseText: sourceText.slice(0, correctionMatch.index),
    correctionText: sourceText.slice(correctionMatch.index + markerLengthBeforeContent),
  }
}

function itemMarkers(baseText: string): ItemMarker[] {
  const markerPattern = /(?:изделие|item|product|позиция|position)\s*(\d{1,2})\s*[:=-]\s*/giu
  const matches = [...baseText.matchAll(markerPattern)]
  return matches.map((match) => ({
    order: Number(match[1]),
    markerStart: match.index ?? 0,
    contentStart: (match.index ?? 0) + match[0].length,
  }))
}

function extractItemSegments(baseText: string) {
  const markers = itemMarkers(baseText)
  if (!markers.length) return []
  return markers.map((marker, index) => {
    const next = markers[index + 1]
    const sourceText = normalize(baseText.slice(marker.contentStart, next?.markerStart ?? baseText.length).replace(/[;\s]+$/g, ''))
    return { order: marker.order, sourceText }
  }).filter((item) => item.sourceText)
}

function ordinalTargets(referenceText: string, itemCount: number): number[] {
  const text = referenceText.toLocaleLowerCase('bg')
  if (/(?:последните\s+два|last\s+two)/iu.test(text)) return itemCount >= 2 ? [itemCount - 1, itemCount] : []
  if (/(?:първите\s+два|first\s+two)/iu.test(text)) return itemCount >= 2 ? [1, 2] : []
  if (/(?:всички\s+изделия|всички|all\s+(?:items|products)|\ball\b)/iu.test(text)) return Array.from({ length: itemCount }, (_, index) => index + 1)

  const ordinalMap: Array<[RegExp, number]> = [
    [/(?:първ(?:ото|ият|ия|ата)|first)/iu, 1],
    [/(?:втор(?:ото|ият|ия|ата)|second)/iu, 2],
    [/(?:трет(?:ото|ият|ия|ата)|third)/iu, 3],
    [/(?:четвърт(?:ото|ият|ия|ата)|fourth)/iu, 4],
    [/(?:пет(?:ото|ият|ия|ата)|fifth)/iu, 5],
  ]
  for (const [pattern, value] of ordinalMap) if (pattern.test(text) && value <= itemCount) return [value]
  if (/(?:последн(?:ото|ият|ия|ата)|last\s+(?:item|product)|\blast\b)/iu.test(text)) return itemCount ? [itemCount] : []

  const explicit = text.match(/(?:изделие|item|product|позиция|position)\s*(?:#|№)?\s*(\d{1,2})(?=\s*(?:[:=,-]|$))/iu)
  if (explicit) {
    const value = Number(explicit[1])
    return value >= 1 && value <= itemCount ? [value] : []
  }
  return []
}

function cloneInterpretation(value: FacadeFlowPromptInterpretationResult): FacadeFlowPromptInterpretationResult {
  return structuredClone(value)
}

function patchFromPartial(target: FacadeFlowPromptInterpretationResult, partial: FacadeFlowPromptInterpretationResult) {
  const recognizedIds = new Set(partial.recognized.map((item) => item.id))
  const targetIntent = target.intent
  const sourceIntent = partial.intent

  if (recognizedIds.has('category')) targetIntent.category = sourceIntent.category
  if (recognizedIds.has('mark')) targetIntent.mark = sourceIntent.mark
  if (recognizedIds.has('quantity')) targetIntent.quantity = sourceIntent.quantity
  if (recognizedIds.has('dimensions')) targetIntent.dimensions = { ...sourceIntent.dimensions }
  if (recognizedIds.has('system')) targetIntent.profiles.system = sourceIntent.profiles.system
  if (recognizedIds.has('frame')) targetIntent.profiles.frame = sourceIntent.profiles.frame
  if (recognizedIds.has('sash')) targetIntent.profiles.sash = sourceIntent.profiles.sash
  if (recognizedIds.has('mullion')) targetIntent.profiles.mullion = sourceIntent.profiles.mullion
  if (recognizedIds.has('threshold')) targetIntent.profiles.threshold = sourceIntent.profiles.threshold
  if (recognizedIds.has('finish')) targetIntent.finish.exterior = sourceIntent.finish.exterior
  if (recognizedIds.has('glazing')) targetIntent.glazing.description = sourceIntent.glazing.description
  if (recognizedIds.has('handle')) targetIntent.hardwareDefaults.handle = sourceIntent.hardwareDefaults.handle
  if (recognizedIds.has('hinge-quantity')) targetIntent.hardwareDefaults.hingeQuantity = sourceIntent.hardwareDefaults.hingeQuantity
  if (recognizedIds.has('hinges')) targetIntent.hardwareDefaults.hinges = sourceIntent.hardwareDefaults.hinges
  if (recognizedIds.has('hardware')) targetIntent.hardwareDefaults.mechanism = sourceIntent.hardwareDefaults.mechanism
  if (recognizedIds.has('handle-height')) targetIntent.hardwareDefaults.handleHeightMm = sourceIntent.hardwareDefaults.handleHeightMm

  const topologyExplicit = recognizedIds.has('fields')
  const openingExplicit = recognizedIds.has('opening') || recognizedIds.has('direction') || recognizedIds.has('swing') || recognizedIds.has('lower-panel')
  if ((topologyExplicit || openingExplicit) && sourceIntent.fields.length) targetIntent.fields = structuredClone(sourceIntent.fields)

  target.recognized = [
    ...target.recognized,
    ...partial.recognized.map((entry) => ({ ...entry, id: `correction-${entry.id}` })),
  ]
}

function correctionClauses(correctionText: string) {
  if (!correctionText.trim()) return []
  return correctionText
    .split(/\s*\|\s*|\n+/g)
    .map((value) => normalize(value.replace(/^[;\s]+|[;\s]+$/g, '')))
    .filter(Boolean)
}

export function interpretFacadeFlowOrderPrompt(sourceText: string, orderId = 'prompt-order'): FacadeFlowOrderPromptInterpretationResult {
  const normalizedSource = normalize(sourceText)
  const { baseText, correctionText } = extractBaseAndCorrection(sourceText)
  const segments = extractItemSegments(baseText)
  const items: FacadeFlowOrderPromptItem[] = segments.map((segment) => ({
    order: segment.order,
    sourceText: segment.sourceText,
    interpretation: interpretFacadeFlowPrompt(segment.sourceText, `${orderId}-item-${segment.order}`),
    correctionsApplied: [],
  }))
  const unresolvedOrderReferences: string[] = []
  const warnings: string[] = []

  if (!items.length) unresolvedOrderReferences.push('Не са открити еднозначно номерирани изделия в общия prompt.')
  const sorted = [...items].sort((left, right) => left.order - right.order)
  const expectedOrders = Array.from({ length: sorted.length }, (_, index) => index + 1)
  if (sorted.some((item, index) => item.order !== expectedOrders[index])) {
    unresolvedOrderReferences.push('Номерацията на изделията не е последователна и изисква Human Review.')
  }

  for (const clause of correctionClauses(correctionText)) {
    const targets = ordinalTargets(clause, items.length)
    if (!targets.length) {
      unresolvedOrderReferences.push(`Нееднозначна корекция без сигурна цел: ${clause}`)
      continue
    }
    const partial = interpretFacadeFlowPrompt(clause, `${orderId}-correction`)
    const hasSemanticConflict = partial.unresolved.some((value) => /Конфликт за/iu.test(value))
    if (hasSemanticConflict) {
      unresolvedOrderReferences.push(`Корекцията съдържа вътрешен конфликт и не е приложена: ${clause}`)
      continue
    }
    const patchable = partial.recognized.some((entry) => [
      'category', 'mark', 'quantity', 'dimensions', 'system', 'frame', 'sash', 'mullion', 'threshold',
      'finish', 'glazing', 'handle', 'hinge-quantity', 'hinges', 'hardware', 'handle-height', 'fields',
      'opening', 'direction', 'swing', 'lower-panel',
    ].includes(entry.id))
    if (!patchable) {
      unresolvedOrderReferences.push(`Корекцията няма надеждно разпознаваема стойност и не е приложена: ${clause}`)
      continue
    }
    for (const order of targets) {
      const item = items.find((candidate) => candidate.order === order)
      if (!item) {
        unresolvedOrderReferences.push(`Корекцията сочи липсващо изделие ${order}: ${clause}`)
        continue
      }
      const patched = cloneInterpretation(item.interpretation)
      patchFromPartial(patched, partial)
      item.interpretation = patched
      item.correctionsApplied.push(clause)
    }
    warnings.push(`Корекцията е свързана детерминистично към изделие/изделия ${targets.join(', ')} и остава за Human Review.`)
  }

  return {
    schemaVersion: 'AI-PROMPT-ORDER-01',
    mode: 'LOCAL_DETERMINISTIC_ORDER',
    sourceText: normalizedSource,
    items,
    unresolvedOrderReferences: [...new Set(unresolvedOrderReferences)],
    warnings: [...new Set(warnings)],
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}
