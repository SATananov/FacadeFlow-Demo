import type { FacadeFlowProductIntent } from './aiProductIntent'
import type { FacadeFlowGuidedProductDraft, FacadeFlowGuidedFillType, FacadeFlowGuidedHandleType, FacadeFlowGuidedHardwareType, FacadeFlowGuidedOpeningType } from './aiWorkspaceTypes'
import { catalogueProfileIsSelectable } from './profileCatalogueState'
import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'

export interface FacadeFlowPromptGuidedBridgeResult {
  schemaVersion: 'AI01.3'
  patch: Partial<FacadeFlowGuidedProductDraft>
  transferred: string[]
  notTransferred: string[]
  humanReviewRequired: true
  automaticGeometryAllowed: false
  rulesValidated: false
  simulationOnly: true
  machineReady: false
}

function matchingSystem(profiles: CatalogueProfile[], value: string | undefined) {
  if (!value) return undefined
  return [...new Set(profiles.filter(catalogueProfileIsSelectable).map((profile) => profile.system))]
    .find((system) => system.localeCompare(value, 'bg', { sensitivity: 'base' }) === 0)
}

function matchingProfile(profiles: CatalogueProfile[], system: string | undefined, role: ProfileRole, value: string | undefined) {
  if (!value) return undefined
  return profiles.find((profile) => catalogueProfileIsSelectable(profile)
    && profile.role === role
    && (!system || profile.system === system)
    && (profile.code.localeCompare(value, 'bg', { sensitivity: 'base' }) === 0 || profile.nameBg.localeCompare(value, 'bg', { sensitivity: 'base' }) === 0))
}

function guidedOpening(value: string | undefined): FacadeFlowGuidedOpeningType {
  if (value === 'FIXED' || value === 'TURN' || value === 'TILT' || value === 'TILT_TURN' || value === 'SLIDING' || value === 'OTHER') return value
  return ''
}

function fillType(description: string | undefined): FacadeFlowGuidedFillType {
  if (!description) return ''
  if (/панел|panel/i.test(description)) return 'PANEL'
  if (/стъклопакет|glazing unit|double glaz|triple glaz/i.test(description)) return 'GLAZING_UNIT'
  if (/стъкло|glass/i.test(description)) return 'GLASS'
  return 'OTHER'
}

function handleType(description: string | undefined): FacadeFlowGuidedHandleType {
  if (!description) return ''
  if (/ключ|keyed|locking handle/i.test(description)) return 'KEYED'
  if (/дръжка\s*\/\s*топка|handle\s*\/\s*knob/i.test(description)) return 'HANDLE_KNOB'
  if (/дръжка\s*\/\s*дръжка|handle\s*\/\s*handle/i.test(description)) return 'HANDLE_HANDLE'
  return 'OTHER'
}

function hardwareType(intent: FacadeFlowProductIntent): FacadeFlowGuidedHardwareType {
  const hasHardwareEvidence = Boolean(intent.hardwareDefaults.mechanism || intent.hardwareDefaults.handle || intent.hardwareDefaults.hinges || intent.hardwareDefaults.hingeQuantity || intent.hardwareDefaults.lock)
  if (!hasHardwareEvidence) return ''
  if (intent.fields.some((field) => field.openingType === 'SLIDING')) return 'SLIDING'
  if (intent.category === 'WINDOW') return 'WINDOW'
  if (intent.category === 'DOOR') return 'DOOR'
  return 'OTHER'
}

export function facadeFlowPromptIntentToGuidedPatch(intent: FacadeFlowProductIntent, profiles: CatalogueProfile[]): FacadeFlowPromptGuidedBridgeResult {
  const patch: Partial<FacadeFlowGuidedProductDraft> = { reviewAccepted: false, status: 'NEEDS_REVIEW' }
  const transferred: string[] = []
  const notTransferred: string[] = []
  const transfer = <K extends keyof FacadeFlowGuidedProductDraft>(key: K, value: FacadeFlowGuidedProductDraft[K] | undefined, label: string) => {
    if (value === undefined || value === '') return
    patch[key] = value
    transferred.push(label)
  }

  if (intent.category === 'WINDOW' || intent.category === 'DOOR') transfer('productType', intent.category, 'Тип изделие')
  transfer('name', intent.name || intent.mark, 'Име / марка')
  if (intent.quantity) transfer('quantity', String(intent.quantity), 'Количество')
  if (intent.dimensions.widthMm) transfer('width', String(intent.dimensions.widthMm), 'Ширина')
  if (intent.dimensions.heightMm) transfer('height', String(intent.dimensions.heightMm), 'Височина')

  const catalogueSystem = matchingSystem(profiles, intent.profiles.system)
  if (intent.profiles.system) {
    if (catalogueSystem) transfer('profileSystem', catalogueSystem, 'Профилна система от каталог')
    else transfer('manualProfileSystem', intent.profiles.system, 'Профилна система — ръчно извлечена')
  }
  const effectiveSystem = catalogueSystem || undefined
  const frame = matchingProfile(profiles, effectiveSystem, 'FRAME', intent.profiles.frame)
  const sash = matchingProfile(profiles, effectiveSystem, 'SASH', intent.profiles.sash)
  const mullion = matchingProfile(profiles, effectiveSystem, 'MULLION', intent.profiles.mullion)
  if (frame) transfer('frameProfileId', frame.id, 'Каса от каталог'); else transfer('manualFrameProfile', intent.profiles.frame, 'Каса — ръчно извлечена')
  if (sash) transfer('sashProfileId', sash.id, 'Крило от каталог'); else transfer('manualSashProfile', intent.profiles.sash, 'Крило — ръчно извлечено')
  if (mullion) transfer('mullionProfileId', mullion.id, 'Делител от каталог'); else transfer('manualMullionProfile', intent.profiles.mullion, 'Делител — ръчно извлечен')
  if (intent.category === 'DOOR') transfer('thresholdDescription', intent.profiles.threshold, 'Праг')

  const explicitOpeningFields = intent.fields.filter((field) => field.openingType && field.openingType !== 'UNRESOLVED')
  if (intent.fields.length === 1 && explicitOpeningFields.length === 1) {
    const field = explicitOpeningFields[0]
    transfer('openingType', guidedOpening(field.openingType), 'Отваряемост')
    if (field.openingDirection === 'LEFT' || field.openingDirection === 'RIGHT') transfer('openingDirection', field.openingDirection, 'Посока ляво / дясно')
    if (field.swing === 'INWARD' || field.swing === 'OUTWARD') transfer('inwardOutward', field.swing, 'Навътре / навън')
  } else if (intent.fields.length > 1) {
    notTransferred.push('Топологията и индивидуалната отваряемост на много полета остават само в Product Intent; guided form няма право да ги превръща в автоматична геометрия.')
  }

  const fill = fillType(intent.glazing.description)
  transfer('fillType', fill, 'Вид пълнеж')
  transfer('fillDescription', intent.glazing.description, 'Описание на стъкло / пълнеж')
  if (intent.finish.exterior) {
    transfer('colorMode', 'PROJECT_DEFINED', 'Режим на цвета')
    transfer('exteriorColor', intent.finish.exterior, 'Външен цвят')
    transfer('interiorColor', intent.finish.interior, 'Вътрешен цвят')
  }
  const hwType = hardwareType(intent)
  transfer('hardwareType', hwType, 'Тип обков')
  transfer('hardwareDescription', intent.hardwareDefaults.mechanism || intent.hardwareDefaults.hinges, 'Обков / панти')
  const hType = handleType(intent.hardwareDefaults.handle)
  transfer('handleType', hType, 'Тип дръжка')
  transfer('handleDescription', intent.hardwareDefaults.handle, 'Описание на дръжка')
  if (intent.hardwareDefaults.hingeQuantity) transfer('hingeQuantity', String(intent.hardwareDefaults.hingeQuantity), 'Количество панти')

  const noteParts = [
    'AI01 PROMPT SOURCE — локално deterministic разчитане; изисква човешка проверка.',
    intent.sourceText,
    notTransferred.length ? `НЕПРЕХВЪРЛЕНО: ${notTransferred.join(' ')}` : '',
  ].filter(Boolean)
  transfer('notes', noteParts.join('\n'), 'Източник / бележки')

  return {
    schemaVersion: 'AI01.3', patch, transferred, notTransferred,
    humanReviewRequired: true, automaticGeometryAllowed: false, rulesValidated: false, simulationOnly: true, machineReady: false,
  }
}
