import { interpretFacadeFlowPrompt, type FacadeFlowPromptInterpretationResult } from './aiPromptInterpreter'

export type FacadeFlowOfferPromptInterpreterMode = 'LOCAL_DETERMINISTIC_OFFER'
export type FacadeFlowOfferSharedField = 'system' | 'finish' | 'glazing' | 'handle' | 'hinge-quantity' | 'hinges' | 'hardware'

export interface FacadeFlowOfferDefaults {
  sourceText: string
  interpretation: FacadeFlowPromptInterpretationResult
  sharedFields: FacadeFlowOfferSharedField[]
  correctionsApplied: string[]
}

export interface FacadeFlowOfferModule {
  moduleNumber: number
  sourceText: string
  explicitInterpretation: FacadeFlowPromptInterpretationResult
  effectiveInterpretation: FacadeFlowPromptInterpretationResult
  inheritedFields: FacadeFlowOfferSharedField[]
  explicitOverrideFields: FacadeFlowOfferSharedField[]
  correctionsApplied: string[]
}

export interface FacadeFlowOfferPromptInterpretationResult {
  schemaVersion: 'AI-PROMPT-OFFER-01'
  mode: FacadeFlowOfferPromptInterpreterMode
  sourceText: string
  offerReference?: string
  customerName?: string
  defaults: FacadeFlowOfferDefaults
  modules: FacadeFlowOfferModule[]
  unresolvedOfferReferences: string[]
  warnings: string[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const SHARED_FIELDS: FacadeFlowOfferSharedField[] = ['system', 'finish', 'glazing', 'handle', 'hinge-quantity', 'hinges', 'hardware']
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

interface ModuleMarker {
  moduleNumber: number
  markerStart: number
  contentStart: number
}

function cloneInterpretation(value: FacadeFlowPromptInterpretationResult): FacadeFlowPromptInterpretationResult {
  return structuredClone(value)
}

function extractBaseAndCorrections(sourceText: string) {
  const correctionMatch = /(?:^|[;\n])\s*(?:корекция|корекции|correction|corrections)\s*[:=-]\s*/iu.exec(sourceText)
  if (!correctionMatch || correctionMatch.index === undefined) return { baseText: sourceText, correctionText: '' }
  return {
    baseText: sourceText.slice(0, correctionMatch.index),
    correctionText: sourceText.slice(correctionMatch.index + correctionMatch[0].length),
  }
}

function moduleMarkers(baseText: string): ModuleMarker[] {
  const markerPattern = /(?:модул|module)\s*(\d{1,3})\s*[:=-]\s*/giu
  return [...baseText.matchAll(markerPattern)].map((match) => ({
    moduleNumber: Number(match[1]),
    markerStart: match.index ?? 0,
    contentStart: (match.index ?? 0) + match[0].length,
  }))
}

function extractOfferPrefixAndModules(baseText: string) {
  const markers = moduleMarkers(baseText)
  const prefix = normalize((markers.length ? baseText.slice(0, markers[0].markerStart) : baseText).replace(/[;\s]+$/g, ''))
  const modules = markers.map((marker, index) => {
    const next = markers[index + 1]
    const sourceText = normalize(baseText.slice(marker.contentStart, next?.markerStart ?? baseText.length).replace(/[;\s]+$/g, ''))
    return { moduleNumber: marker.moduleNumber, sourceText }
  }).filter((module) => module.sourceText)
  return { prefix, modules }
}

function parseOfferReference(prefix: string) {
  const match = prefix.match(/(?:оферта|offer)\s*[:#№-]?\s*([A-ZА-Я0-9][A-ZА-Я0-9._/-]{1,40})(?=\s*(?:;|,|\.|$))/iu)
  return match?.[1]
}

function parseCustomerName(prefix: string) {
  const match = prefix.match(/(?:клиент|client|customer)\s*[:=-]\s*([^;,.\n]{2,80})/iu)
  return match?.[1]?.trim()
}

function recognizedSharedFields(result: FacadeFlowPromptInterpretationResult): FacadeFlowOfferSharedField[] {
  const ids = new Set(result.recognized.map((entry) => entry.id))
  return SHARED_FIELDS.filter((field) => ids.has(field))
}

function hasConflictForField(result: FacadeFlowPromptInterpretationResult, field: FacadeFlowOfferSharedField) {
  const patterns: Record<FacadeFlowOfferSharedField, RegExp> = {
    system: /Конфликт за профилна система|Конфликт за система/iu,
    finish: /Конфликт за цвят|Конфликт за покритие/iu,
    glazing: /Конфликт за стъкло|Конфликт за пълнеж/iu,
    handle: /Конфликт за дръжка/iu,
    'hinge-quantity': /Конфликт за брой панти/iu,
    hinges: /Конфликт за .*панти/iu,
    hardware: /Конфликт за обков/iu,
  }
  return result.unresolved.some((value) => patterns[field].test(value))
}

function applySharedField(target: FacadeFlowPromptInterpretationResult, source: FacadeFlowPromptInterpretationResult, field: FacadeFlowOfferSharedField) {
  switch (field) {
    case 'system': target.intent.profiles.system = source.intent.profiles.system; break
    case 'finish': target.intent.finish.exterior = source.intent.finish.exterior; break
    case 'glazing': target.intent.glazing.description = source.intent.glazing.description; break
    case 'handle': target.intent.hardwareDefaults.handle = source.intent.hardwareDefaults.handle; break
    case 'hinge-quantity': target.intent.hardwareDefaults.hingeQuantity = source.intent.hardwareDefaults.hingeQuantity; break
    case 'hinges': target.intent.hardwareDefaults.hinges = source.intent.hardwareDefaults.hinges; break
    case 'hardware': target.intent.hardwareDefaults.mechanism = source.intent.hardwareDefaults.mechanism; break
  }
}

function removeResolvedUnresolved(target: FacadeFlowPromptInterpretationResult, field: FacadeFlowOfferSharedField) {
  const patterns: Partial<Record<FacadeFlowOfferSharedField, RegExp>> = {
    system: /^Профилна система$/u,
    finish: /^Цвят \/ покритие$/u,
    glazing: /^Стъкло \/ пълнеж$/u,
  }
  const pattern = patterns[field]
  if (!pattern) return
  target.intent.unresolved = target.intent.unresolved.filter((value) => !pattern.test(value))
  target.unresolved = [...target.intent.unresolved]
}

function inheritOfferDefaults(
  explicit: FacadeFlowPromptInterpretationResult,
  defaults: FacadeFlowPromptInterpretationResult,
) {
  const effective = cloneInterpretation(explicit)
  const explicitFields = new Set(recognizedSharedFields(explicit))
  const defaultFields = recognizedSharedFields(defaults)
  const inheritedFields: FacadeFlowOfferSharedField[] = []

  for (const field of defaultFields) {
    if (explicitFields.has(field) || hasConflictForField(explicit, field)) continue
    applySharedField(effective, defaults, field)
    removeResolvedUnresolved(effective, field)
    inheritedFields.push(field)
  }
  return { effective, inheritedFields, explicitOverrideFields: [...explicitFields] }
}

function patchSharedFields(target: FacadeFlowPromptInterpretationResult, partial: FacadeFlowPromptInterpretationResult) {
  const fields = recognizedSharedFields(partial)
  for (const field of fields) {
    applySharedField(target, partial, field)
    removeResolvedUnresolved(target, field)
  }
  return fields
}

function correctionClauses(correctionText: string) {
  if (!correctionText.trim()) return []
  return correctionText
    .split(/\s*\|\s*|\n+/g)
    .map((value) => normalize(value.replace(/^[;\s]+|[;\s]+$/g, '')))
    .filter(Boolean)
}

function isOfferScope(clause: string) {
  return /(?:общ(?:ите|и)\s+настройки|за\s+цялата\s+оферта|цялата\s+оферта|офертата\s+като\s+цяло|offer\s+defaults|whole\s+offer|offer-wide)/iu.test(clause)
}

function moduleTargets(clause: string, moduleNumbers: number[]) {
  const text = clause.toLocaleLowerCase('bg')
  const available = new Set(moduleNumbers)
  const unique = (values: number[]) => [...new Set(values)].filter((value) => available.has(value))

  if (/(?:последните\s+два\s+модула|last\s+two\s+modules?)/iu.test(text)) return unique(moduleNumbers.slice(-2))
  if (/(?:първите\s+два\s+модула|first\s+two\s+modules?)/iu.test(text)) return unique(moduleNumbers.slice(0, 2))
  if (/(?:всички\s+модули|all\s+modules?)/iu.test(text)) return unique(moduleNumbers)

  const plural = text.match(/(?:модули|modules?)\s*(\d{1,3})\s*(?:,|и|and|&)\s*(\d{1,3})/iu)
  if (plural) return unique([Number(plural[1]), Number(plural[2])])

  const explicit = text.match(/(?:модул|module)\s*(?:#|№)?\s*(\d{1,3})(?=\s*(?:[:=,.-]|$|\s))/iu)
  if (explicit) return unique([Number(explicit[1])])

  const ordinalMap: Array<[RegExp, number]> = [
    [/(?:първ(?:ият|ия|ията)?\s+модул|first\s+module)/iu, 0],
    [/(?:втор(?:ият|ия|ията)?\s+модул|second\s+module)/iu, 1],
    [/(?:трет(?:ият|ия|ията)?\s+модул|third\s+module)/iu, 2],
    [/(?:четвърт(?:ият|ия|ията)?\s+модул|fourth\s+module)/iu, 3],
    [/(?:пет(?:ият|ия|ията)?\s+модул|fifth\s+module)/iu, 4],
  ]
  for (const [pattern, index] of ordinalMap) if (pattern.test(text) && moduleNumbers[index] !== undefined) return [moduleNumbers[index]]
  if (/(?:последн(?:ият|ия)\s+модул|last\s+module)/iu.test(text) && moduleNumbers.length) return [moduleNumbers[moduleNumbers.length - 1]]
  return []
}

export function interpretFacadeFlowOfferPrompt(sourceText: string, offerId = 'prompt-offer'): FacadeFlowOfferPromptInterpretationResult {
  const normalizedSource = normalize(sourceText)
  const { baseText, correctionText } = extractBaseAndCorrections(sourceText)
  const { prefix, modules: moduleSegments } = extractOfferPrefixAndModules(baseText)
  const unresolvedOfferReferences: string[] = []
  const warnings: string[] = []

  const defaultsInterpretation = interpretFacadeFlowPrompt(prefix, `${offerId}-defaults`)
  const defaults: FacadeFlowOfferDefaults = {
    sourceText: prefix,
    interpretation: defaultsInterpretation,
    sharedFields: recognizedSharedFields(defaultsInterpretation),
    correctionsApplied: [],
  }

  const moduleStates = moduleSegments.map((segment) => ({
    moduleNumber: segment.moduleNumber,
    sourceText: segment.sourceText,
    explicitInterpretation: interpretFacadeFlowPrompt(segment.sourceText, `${offerId}-module-${segment.moduleNumber}`),
    moduleCorrections: [] as FacadeFlowPromptInterpretationResult[],
    correctionTexts: [] as string[],
  }))

  if (!moduleStates.length) unresolvedOfferReferences.push('Не са открити еднозначно номерирани модули в офертата.')
  const sortedNumbers = [...moduleStates].map((module) => module.moduleNumber).sort((a, b) => a - b)
  const expectedNumbers = Array.from({ length: sortedNumbers.length }, (_, index) => index + 1)
  if (sortedNumbers.some((value, index) => value !== expectedNumbers[index])) {
    unresolvedOfferReferences.push('Номерацията на модулите не е последователна и изисква Human Review.')
  }

  for (const clause of correctionClauses(correctionText)) {
    const partial = interpretFacadeFlowPrompt(clause, `${offerId}-correction`)
    const sharedFields = recognizedSharedFields(partial)
    const hasSemanticConflict = partial.unresolved.some((value) => /Конфликт за/iu.test(value))
    if (hasSemanticConflict) {
      unresolvedOfferReferences.push(`Корекцията съдържа вътрешен конфликт и не е приложена: ${clause}`)
      continue
    }
    if (!sharedFields.length) {
      unresolvedOfferReferences.push(`Корекцията няма надеждно разпознаваема обща настройка и не е приложена: ${clause}`)
      continue
    }

    if (isOfferScope(clause)) {
      patchSharedFields(defaults.interpretation, partial)
      defaults.sharedFields = recognizedSharedFields(defaults.interpretation)
      defaults.correctionsApplied.push(clause)
      warnings.push('Промяна на общите настройки на офертата е приложена детерминистично и остава за Human Review.')
      continue
    }

    const targets = moduleTargets(clause, moduleStates.map((module) => module.moduleNumber))
    if (!targets.length) {
      unresolvedOfferReferences.push(`Нееднозначна корекция без сигурен scope оферта/модул: ${clause}`)
      continue
    }
    for (const moduleNumber of targets) {
      const module = moduleStates.find((candidate) => candidate.moduleNumber === moduleNumber)
      if (!module) {
        unresolvedOfferReferences.push(`Корекцията сочи липсващ модул ${moduleNumber}: ${clause}`)
        continue
      }
      module.moduleCorrections.push(partial)
      module.correctionTexts.push(clause)
    }
    warnings.push(`Корекцията е свързана само към модул/модули ${targets.join(', ')} и остава за Human Review.`)
  }

  const modules: FacadeFlowOfferModule[] = moduleStates.map((module) => {
    const inherited = inheritOfferDefaults(module.explicitInterpretation, defaults.interpretation)
    const effective = inherited.effective
    const correctionFields = new Set<FacadeFlowOfferSharedField>()
    for (const partial of module.moduleCorrections) {
      for (const field of patchSharedFields(effective, partial)) correctionFields.add(field)
    }
    return {
      moduleNumber: module.moduleNumber,
      sourceText: module.sourceText,
      explicitInterpretation: module.explicitInterpretation,
      effectiveInterpretation: effective,
      inheritedFields: inherited.inheritedFields.filter((field) => !correctionFields.has(field)),
      explicitOverrideFields: [...new Set([...inherited.explicitOverrideFields, ...correctionFields])],
      correctionsApplied: module.correctionTexts,
    }
  })

  return {
    schemaVersion: 'AI-PROMPT-OFFER-01',
    mode: 'LOCAL_DETERMINISTIC_OFFER',
    sourceText: normalizedSource,
    offerReference: parseOfferReference(prefix),
    customerName: parseCustomerName(prefix),
    defaults,
    modules,
    unresolvedOfferReferences: [...new Set(unresolvedOfferReferences)],
    warnings: [...new Set(warnings)],
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}
