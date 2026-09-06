import {
  interpretFacadeFlowOfferPrompt,
  type FacadeFlowOfferModule,
  type FacadeFlowOfferPromptInterpretationResult,
} from './aiPromptOfferInterpreter'

export type FacadeFlowProjectPromptInterpreterMode = 'LOCAL_DETERMINISTIC_PROJECT_CONTEXT'

export interface FacadeFlowProjectModuleContext {
  moduleNumber: number
  floor: string
  room: string
  mark: string
  sourceText: string
  offerModule: FacadeFlowOfferModule
  contextualCorrectionsApplied: string[]
}

export interface FacadeFlowProjectPromptInterpretationResult {
  schemaVersion: 'AI-PROMPT-PROJECT-01'
  mode: FacadeFlowProjectPromptInterpreterMode
  sourceText: string
  projectReference?: string
  offer: FacadeFlowOfferPromptInterpretationResult
  modules: FacadeFlowProjectModuleContext[]
  unresolvedProjectReferences: string[]
  warnings: string[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

interface ProjectModuleSegment {
  moduleNumber: number
  floor: string
  room: string
  mark: string
  sourceText: string
  markerStart: number
  contentStart: number
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
const normalizedKey = (text: string) => normalize(text).toLocaleLowerCase('bg')

function extractBaseAndCorrections(sourceText: string) {
  const correctionMatch = /(?:^|[;\n])\s*(?:корекция|корекции|correction|corrections)\s*[:=-]\s*/iu.exec(sourceText)
  if (!correctionMatch || correctionMatch.index === undefined) return { baseText: sourceText, correctionText: '' }
  return {
    baseText: sourceText.slice(0, correctionMatch.index),
    correctionText: sourceText.slice(correctionMatch.index + correctionMatch[0].length),
  }
}

function projectModuleSegments(baseText: string) {
  const markerPattern = /(?:етаж|floor)\s*([^|;]+?)\s*\|\s*(?:помещение|стая|room)\s*([^|;]+?)\s*\|\s*(?:марка|mark)\s*([^|;]+?)\s*\|\s*(?:модул|module)\s*(\d{1,3})\s*[:=-]\s*/giu
  const matches = [...baseText.matchAll(markerPattern)]
  const modules: ProjectModuleSegment[] = matches.map((match, index) => {
    const markerStart = match.index ?? 0
    const contentStart = markerStart + match[0].length
    const nextStart = matches[index + 1]?.index ?? baseText.length
    return {
      floor: normalize(match[1] ?? ''),
      room: normalize(match[2] ?? ''),
      mark: normalize(match[3] ?? ''),
      moduleNumber: Number(match[4]),
      markerStart,
      contentStart,
      sourceText: normalize(baseText.slice(contentStart, nextStart).replace(/[;\s]+$/g, '')),
    }
  }).filter((module) => module.sourceText)

  const prefix = normalize((matches.length ? baseText.slice(0, matches[0]?.index ?? 0) : baseText).replace(/[;\s]+$/g, ''))
  return { prefix, modules }
}

function parseProjectReference(prefix: string) {
  const match = prefix.match(/(?:обект|project)\s*[:#№-]?\s*([A-ZА-Я0-9][A-ZА-Я0-9._/-]{1,40})(?=\s*(?:;|,|\.|$))/iu)
  return match?.[1]
}

function correctionClauses(correctionText: string) {
  if (!correctionText.trim()) return []
  return correctionText
    .split(/\s*\|\|\s*|\n+/g)
    .map((value) => normalize(value.replace(/^[;\s]+|[;\s]+$/g, '')))
    .filter(Boolean)
}

function isOfferScope(clause: string) {
  return /(?:общ(?:ите|и)\s+настройки|за\s+цялата\s+оферта|цялата\s+оферта|офертата\s+като\s+цяло|offer\s+defaults|whole\s+offer|offer-wide)/iu.test(clause)
}

function selectorValue(clause: string, pattern: RegExp) {
  const match = clause.match(pattern)
  return match?.[1] ? normalize(match[1].replace(/[,;:.]+$/g, '')) : undefined
}

function contextualTargets(clause: string, modules: ProjectModuleSegment[]) {
  const floor = selectorValue(clause, /(?:етаж|floor)\s*([A-ZА-Я0-9._/-]+)/iu)
  const room = selectorValue(clause, /(?:помещение|стая|room)\s*([A-ZА-Я0-9._/-]+)/iu)
  const mark = selectorValue(clause, /(?:марка|mark)\s*([A-ZА-Я0-9._/-]+)/iu)
  const moduleText = selectorValue(clause, /(?:модул|module)\s*(?:#|№)?\s*(\d{1,3})/iu)
  const moduleNumber = moduleText ? Number(moduleText) : undefined
  const hasSelector = floor !== undefined || room !== undefined || mark !== undefined || moduleNumber !== undefined

  const matches = modules.filter((module) => {
    if (floor !== undefined && normalizedKey(module.floor) !== normalizedKey(floor)) return false
    if (room !== undefined && normalizedKey(module.room) !== normalizedKey(room)) return false
    if (mark !== undefined && normalizedKey(module.mark) !== normalizedKey(mark)) return false
    if (moduleNumber !== undefined && module.moduleNumber !== moduleNumber) return false
    return true
  })

  const explicitGroupScope = /(?:всички|all\b|двата|двете|both\b)/iu.test(clause)
  return { hasSelector, matches, explicitGroupScope }
}

function correctionPayload(clause: string) {
  const colonIndex = clause.indexOf(':')
  return colonIndex >= 0 ? normalize(clause.slice(colonIndex + 1)) : clause
}

function buildOfferBase(prefix: string, modules: ProjectModuleSegment[]) {
  const moduleText = modules.map((module) => `Модул ${module.moduleNumber}: ${module.sourceText}`).join('; ')
  return normalize([prefix, moduleText].filter(Boolean).join('; '))
}

export function interpretFacadeFlowProjectPrompt(sourceText: string, projectId = 'prompt-project'): FacadeFlowProjectPromptInterpretationResult {
  const normalizedSource = normalize(sourceText)
  const { baseText, correctionText } = extractBaseAndCorrections(sourceText)
  const { prefix, modules: projectSegments } = projectModuleSegments(baseText)
  const unresolvedProjectReferences: string[] = []
  const warnings: string[] = []
  const contextualCorrections = new Map<number, string[]>()

  if (!projectSegments.length) unresolvedProjectReferences.push('Не са открити еднозначни проектни адреси Етаж / Помещение / Марка / Модул.')

  const duplicateModuleNumbers = projectSegments
    .map((module) => module.moduleNumber)
    .filter((value, index, values) => values.indexOf(value) !== index)
  if (duplicateModuleNumbers.length) {
    unresolvedProjectReferences.push(`Дублирани номера на модули в проектния контекст: ${[...new Set(duplicateModuleNumbers)].join(', ')}`)
  }

  const duplicateContextKeys = projectSegments
    .map((module) => `${normalizedKey(module.floor)}|${normalizedKey(module.room)}|${normalizedKey(module.mark)}`)
    .filter((value, index, values) => values.indexOf(value) !== index)
  if (duplicateContextKeys.length) unresolvedProjectReferences.push('Дублиран проектен адрес Етаж / Помещение / Марка изисква Human Review.')

  const offerCorrectionClauses: string[] = []
  for (const clause of correctionClauses(correctionText)) {
    if (isOfferScope(clause)) {
      offerCorrectionClauses.push(clause)
      warnings.push('Project layer делегира offer-wide корекцията към Offer / Defaults слоя и запазва Human Review.')
      continue
    }

    const targetResult = contextualTargets(clause, projectSegments)
    if (!targetResult.hasSelector) {
      unresolvedProjectReferences.push(`Нееднозначна проектна корекция без Етаж / Помещение / Марка / Модул: ${clause}`)
      continue
    }
    if (!targetResult.matches.length) {
      unresolvedProjectReferences.push(`Проектната корекция не сочи съществуващ модул: ${clause}`)
      continue
    }
    if (targetResult.matches.length > 1 && !targetResult.explicitGroupScope) {
      unresolvedProjectReferences.push(`Проектната корекция съвпада с повече от един модул и няма изричен групов scope: ${clause}`)
      continue
    }

    for (const target of targetResult.matches) {
      offerCorrectionClauses.push(`модул ${target.moduleNumber}: ${correctionPayload(clause)}`)
      const applied = contextualCorrections.get(target.moduleNumber) ?? []
      applied.push(clause)
      contextualCorrections.set(target.moduleNumber, applied)
    }
    warnings.push(`Проектната корекция е ограничена до модул/модули ${targetResult.matches.map((module) => module.moduleNumber).join(', ')} и остава за Human Review.`)
  }

  const offerPrompt = [
    buildOfferBase(prefix, projectSegments),
    offerCorrectionClauses.length ? `Корекция: ${offerCorrectionClauses.join(' | ')}` : '',
  ].filter(Boolean).join('; ')
  const offer = interpretFacadeFlowOfferPrompt(offerPrompt, `${projectId}-offer`)

  const modules: FacadeFlowProjectModuleContext[] = projectSegments.map((segment) => {
    const offerModule = offer.modules.find((module) => module.moduleNumber === segment.moduleNumber)
    if (!offerModule) {
      unresolvedProjectReferences.push(`Модул ${segment.moduleNumber} липсва след Offer интерпретацията.`)
      const fallback = offer.modules[0]
      if (!fallback) throw new Error('Project interpreter requires at least one parsed offer module.')
      return {
        moduleNumber: segment.moduleNumber,
        floor: segment.floor,
        room: segment.room,
        mark: segment.mark,
        sourceText: segment.sourceText,
        offerModule: fallback,
        contextualCorrectionsApplied: contextualCorrections.get(segment.moduleNumber) ?? [],
      }
    }
    const parsedMark = offerModule.effectiveInterpretation.intent.mark
    if (parsedMark && normalizedKey(parsedMark) !== normalizedKey(segment.mark)) {
      unresolvedProjectReferences.push(`Марка ${segment.mark} в проектния адрес не съвпада с марката ${parsedMark} в Модул ${segment.moduleNumber}.`)
    }
    return {
      moduleNumber: segment.moduleNumber,
      floor: segment.floor,
      room: segment.room,
      mark: segment.mark,
      sourceText: segment.sourceText,
      offerModule,
      contextualCorrectionsApplied: contextualCorrections.get(segment.moduleNumber) ?? [],
    }
  })

  return {
    schemaVersion: 'AI-PROMPT-PROJECT-01',
    mode: 'LOCAL_DETERMINISTIC_PROJECT_CONTEXT',
    sourceText: normalizedSource,
    projectReference: parseProjectReference(prefix),
    offer,
    modules,
    unresolvedProjectReferences: [...new Set(unresolvedProjectReferences)],
    warnings: [...new Set(warnings)],
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}
