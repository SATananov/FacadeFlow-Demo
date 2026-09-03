import type {
  NadezhdaProjectMaterialKind,
  NadezhdaProjectPlacementKind,
  NadezhdaProjectSourceKind,
} from './nadezhdaProjectPatternSchema'

export const NADEZHDA_DOCUMENT_PATTERN_EXTRACTOR_VERSION = 'REALDATA02.2' as const

export type NadezhdaDocumentPatternCandidateKind =
  | 'SITE_LOCATION'
  | 'OFFER_VARIANT'
  | 'PRODUCT_GROUP'
  | 'PLACEMENT'
  | 'MODULE_REFERENCE'
  | 'QUANTITY'
  | 'WIDTH_MM'
  | 'HEIGHT_MM'
  | 'SYSTEM'
  | 'COLOR'
  | 'GLAZING'
  | 'HARDWARE'
  | 'REINFORCEMENT'
  | 'INCLUDED_SECTION'
  | 'EXCLUDED_SECTION'
  | 'INCLUDED_ITEM'
  | 'EXCLUDED_ITEM'
  | 'PRICE_TEXT'
  | 'VAT_MODE'
  | 'SPECIFICATION_SECTION'

export type NadezhdaDocumentPatternValue = string | number
export type NadezhdaDocumentCommercialSection = 'INCLUDED' | 'EXCLUDED' | null

export interface NadezhdaDocumentPatternInput {
  sourceId: string
  sourceKind: NadezhdaProjectSourceKind
  sourceReference: string
  text: string
}

export interface NadezhdaDocumentPatternContext {
  offerVariantLabel: string | null
  productGroupLabel: string | null
  material: NadezhdaProjectMaterialKind | null
  placement: Array<{ kind: NadezhdaProjectPlacementKind; label: string }>
  moduleExternalReference: string | null
  commercialSection: NadezhdaDocumentCommercialSection
}

export interface NadezhdaDocumentPatternEvidence {
  id: string
  sourceKind: NadezhdaProjectSourceKind
  sourceReference: string
  locator: string
  rawText: string
  privateSource: true
}

export interface NadezhdaDocumentPatternCandidate {
  id: string
  kind: NadezhdaDocumentPatternCandidateKind
  value: NadezhdaDocumentPatternValue
  confidence: 'EXACT_PATTERN'
  lineNumber: number
  context: NadezhdaDocumentPatternContext
  evidence: NadezhdaDocumentPatternEvidence
}

export interface NadezhdaDocumentPatternExtractionSafety {
  privateSource: true
  readOnly: true
  sourceEvidenceOnly: true
  automaticDraftCreationAllowed: false
  automaticAttributeInferenceAllowed: false
  automaticModuleMergeAllowed: false
  automaticProductionDecisionAllowed: false
  productionLocked: true
  machineReady: false
  productionApproved: false
}

export interface NadezhdaDocumentPatternExtractionResult {
  extractorVersion: typeof NADEZHDA_DOCUMENT_PATTERN_EXTRACTOR_VERSION
  sourceId: string
  sourceKind: NadezhdaProjectSourceKind
  sourceReference: string
  candidates: NadezhdaDocumentPatternCandidate[]
  warnings: string[]
  safety: NadezhdaDocumentPatternExtractionSafety
}

const safety: NadezhdaDocumentPatternExtractionSafety = Object.freeze({
  privateSource: true,
  readOnly: true,
  sourceEvidenceOnly: true,
  automaticDraftCreationAllowed: false,
  automaticAttributeInferenceAllowed: false,
  automaticModuleMergeAllowed: false,
  automaticProductionDecisionAllowed: false,
  productionLocked: true,
  machineReady: false,
  productionApproved: false,
})

function compactWhitespace(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').trim()
}

function stripBullet(value: string): string {
  return compactWhitespace(value).replace(/^[·•*-]\s*/, '').trim()
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function cloneContext(context: NadezhdaDocumentPatternContext): NadezhdaDocumentPatternContext {
  return {
    ...context,
    placement: context.placement.map((item) => ({ ...item })),
  }
}

function isStrongContextHeading(line: string): boolean {
  return /^(?:вариант\s*\d+|(?:pvc|al)\s*[-–]?\s*(?:дограма|врати?)|алуминиев[аи]?\s+(?:дограма|врати?)|етаж(?:\s|:|-)|секция(?:\s|:|-)|модул\s*:)/i.test(stripBullet(line))
}

function detectProductGroup(line: string): { label: string; material: NadezhdaProjectMaterialKind } | null {
  const normalized = stripBullet(line)
  if (/^(?:профил|система)\s*:/i.test(normalized)) return null
  if (/PVC.*врат/i.test(normalized)) return { label: normalized, material: 'PVC' }
  if (/(?:AL.*врат|алуминиев[аи]?.*врат)/i.test(normalized)) return { label: normalized, material: 'ALUMINIUM' }
  if (/PVC.*дограма/i.test(normalized)) return { label: normalized, material: 'PVC' }
  if (/(?:AL.*дограма|алуминиев[аи]?.*дограма)/i.test(normalized)) return { label: normalized, material: 'ALUMINIUM' }
  return null
}

export function extractNadezhdaDocumentPatterns(input: NadezhdaDocumentPatternInput): NadezhdaDocumentPatternExtractionResult {
  const candidates: NadezhdaDocumentPatternCandidate[] = []
  const warnings: string[] = []
  const lines = input.text.replace(/\r\n?/g, '\n').split('\n')
  let ordinal = 0
  let context: NadezhdaDocumentPatternContext = {
    offerVariantLabel: null,
    productGroupLabel: null,
    material: null,
    placement: [],
    moduleExternalReference: null,
    commercialSection: null,
  }

  const push = (kind: NadezhdaDocumentPatternCandidateKind, value: NadezhdaDocumentPatternValue, lineNumber: number, rawText: string): void => {
    ordinal += 1
    const evidenceId = `e-${input.sourceId}-l${lineNumber}-${ordinal}`
    candidates.push({
      id: `c-${input.sourceId}-${ordinal}`,
      kind,
      value,
      confidence: 'EXACT_PATTERN',
      lineNumber,
      context: cloneContext(context),
      evidence: {
        id: evidenceId,
        sourceKind: input.sourceKind,
        sourceReference: input.sourceReference,
        locator: `line:${lineNumber}`,
        rawText,
        privateSource: true,
      },
    })
  }

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const rawText = lines[index] ?? ''
    const line = compactWhitespace(rawText)

    if (!line) {
      context = { ...context, commercialSection: null }
      continue
    }

    const stripped = stripBullet(line)

    if (/^спецификация(?:\s+на\s+дограма)?\s*:?$/i.test(stripped)) {
      context = {
        ...context,
        offerVariantLabel: null,
        productGroupLabel: null,
        material: null,
        moduleExternalReference: null,
        commercialSection: null,
      }
      push('SPECIFICATION_SECTION', 'PROJECT_GEOMETRY', lineNumber, rawText)
      continue
    }

    if (/^В\s+(?:посочената\s+)?цена\s+не\s+са\s+включени\s*:?$/i.test(stripped)) {
      context = { ...context, commercialSection: 'EXCLUDED', moduleExternalReference: null }
      push('EXCLUDED_SECTION', 'EXCLUDED', lineNumber, rawText)
      continue
    }
    if (/^В\s+цената\s+са\s+включени\s*:?$/i.test(stripped)) {
      context = { ...context, commercialSection: 'INCLUDED', moduleExternalReference: null }
      push('INCLUDED_SECTION', 'INCLUDED', lineNumber, rawText)
      continue
    }

    if (context.commercialSection && !isStrongContextHeading(stripped)) {
      const kind = context.commercialSection === 'INCLUDED' ? 'INCLUDED_ITEM' : 'EXCLUDED_ITEM'
      push(kind, stripped, lineNumber, rawText)
      continue
    }

    const siteMatch = stripped.match(/^обект\s*:\s*(.+)$/i)
    if (siteMatch?.[1]) {
      push('SITE_LOCATION', siteMatch[1].trim(), lineNumber, rawText)
      continue
    }

    const variantMatch = stripped.match(/^вариант\s*(\d+)\s*:?(.*)$/i)
    if (variantMatch?.[1]) {
      const label = `Вариант ${variantMatch[1]}`
      context = {
        ...context,
        offerVariantLabel: label,
        productGroupLabel: null,
        material: null,
        moduleExternalReference: null,
        commercialSection: null,
      }
      push('OFFER_VARIANT', label, lineNumber, rawText)
    }

    const productGroupSource = variantMatch?.[2]?.trim() || stripped
    const productGroup = detectProductGroup(productGroupSource)
    if (productGroup) {
      context = {
        ...context,
        productGroupLabel: productGroup.label,
        material: productGroup.material,
        moduleExternalReference: null,
        commercialSection: null,
      }
      push('PRODUCT_GROUP', productGroup.label, lineNumber, rawText)
    }

    const floorMatch = stripped.match(/^етаж\s*[:\-]?\s*(.+)$/i)
    if (floorMatch?.[1]) {
      const label = `Етаж ${floorMatch[1].trim()}`
      context = {
        ...context,
        placement: [{ kind: 'FLOOR', label }],
        moduleExternalReference: null,
        commercialSection: null,
      }
      push('PLACEMENT', label, lineNumber, rawText)
      continue
    }

    const sectionMatch = stripped.match(/^секция\s*[:\-]?\s*(.+)$/i)
    if (sectionMatch?.[1]) {
      const label = `Секция ${sectionMatch[1].trim()}`
      context = {
        ...context,
        placement: [{ kind: 'SECTION', label }],
        moduleExternalReference: null,
        commercialSection: null,
      }
      push('PLACEMENT', label, lineNumber, rawText)
      continue
    }

    const moduleMatch = stripped.match(/^модул\s*:\s*([\p{L}\p{N}._\/-]+)\s*$/iu)
    if (moduleMatch?.[1]) {
      context = { ...context, moduleExternalReference: moduleMatch[1], commercialSection: null }
      push('MODULE_REFERENCE', moduleMatch[1], lineNumber, rawText)
      continue
    }

    const quantityMatch = stripped.match(/^брой\s*:\s*([\d\s.,]+)\s*$/i)
    if (quantityMatch?.[1]) {
      const value = parseNumber(quantityMatch[1])
      if (value !== null) push('QUANTITY', value, lineNumber, rawText)
      continue
    }

    const widthMatch = stripped.match(/^L\s*=\s*([\d\s.,]+)\s*mm\s*$/i)
    if (widthMatch?.[1]) {
      const value = parseNumber(widthMatch[1])
      if (value !== null) push('WIDTH_MM', value, lineNumber, rawText)
      continue
    }

    const heightMatch = stripped.match(/^H\s*=\s*([\d\s.,]+)\s*mm\s*$/i)
    if (heightMatch?.[1]) {
      const value = parseNumber(heightMatch[1])
      if (value !== null) push('HEIGHT_MM', value, lineNumber, rawText)
      continue
    }

    const systemMatch = stripped.match(/^(?:профил|система)\s*:\s*(.+)$/i)
    if (systemMatch?.[1]) push('SYSTEM', systemMatch[1].trim(), lineNumber, rawText)

    const colorMatch = stripped.match(/^цвят\s*:?[\s„“”"']*(.+?)[„“”"']?\s*$/i)
    if (colorMatch?.[1]) push('COLOR', colorMatch[1].trim(), lineNumber, rawText)

    const glazingMatch = stripped.match(/^стъклопакет\s*:?[\s„“”"']*(.+?)[„“”"']?\s*$/i)
    if (glazingMatch?.[1]) push('GLAZING', glazingMatch[1].trim(), lineNumber, rawText)

    const hardwareMatch = stripped.match(/^обков[\s„“”"']*:?[\s„“”"']*(.+?)[„“”"']?\s*$/i)
    if (hardwareMatch?.[1]) push('HARDWARE', hardwareMatch[1].trim(), lineNumber, rawText)

    const reinforcementMatch = stripped.match(/^армировка\s*:?[\s„“”"']*(.+?)[„“”"']?\s*$/i)
    if (reinforcementMatch?.[1]) push('REINFORCEMENT', reinforcementMatch[1].trim(), lineNumber, rawText)

    if (/^цена\s*:/i.test(stripped) || /^обща\s+цена\s*:/i.test(stripped)) {
      push('PRICE_TEXT', stripped, lineNumber, rawText)
      if (/без\s+ддс/i.test(stripped)) push('VAT_MODE', 'EXCLUDED', lineNumber, rawText)
      else if (/с\s+ддс/i.test(stripped)) push('VAT_MODE', 'INCLUDED', lineNumber, rawText)
    }
  }

  if (!compactWhitespace(input.text)) warnings.push('Източникът няма текст за deterministic pattern extraction.')
  if (!candidates.some((item) => item.kind === 'MODULE_REFERENCE')) warnings.push('Не са разпознати явни редове „Модул:“; модулна структура не се предполага автоматично.')
  if (candidates.some((item) => item.kind === 'MODULE_REFERENCE') && !candidates.some((item) => item.kind === 'WIDTH_MM' || item.kind === 'HEIGHT_MM')) {
    warnings.push('Разпознати са модули без явни L/H размери; размери не се извеждат автоматично.')
  }

  return {
    extractorVersion: NADEZHDA_DOCUMENT_PATTERN_EXTRACTOR_VERSION,
    sourceId: input.sourceId,
    sourceKind: input.sourceKind,
    sourceReference: input.sourceReference,
    candidates,
    warnings,
    safety,
  }
}
