import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'

export type HybridCreationRoute = 'STANDARD' | 'SKETCH_ASSISTED' | 'NON_STANDARD'
export type HybridProductCategory = 'WINDOW' | 'DOOR' | 'SLIDING' | 'SHOPFRONT' | 'FACADE_MODULE'
export type HybridWorkflowStep = 'DESIGNER_START' | 'STANDARD_CATEGORY' | 'STANDARD_DRAFT' | 'SKETCH_ROUTE' | 'NON_STANDARD_VIEWPORT'
export type HybridReviewStatus = 'DRAFT'
export type HybridSourceReferenceStatus = 'NONE' | 'ROUTE_SELECTED'
export type StructuredConfigurationStatus = 'EMPTY' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
export type ThresholdRequirementStatus = 'NOT_APPLICABLE' | 'UNRESOLVED'
export type StructuredConfigurationStep = 1 | 2 | 3 | 4 | 5

export interface StructuredProfileConfiguration {
  productCategory: 'WINDOW' | 'DOOR'; productName: string; overallWidth: string; overallHeight: string; profileSystem: string
  frameProfileId: string; sashProfileId: string; mullionProfileId: string; thresholdStatus: ThresholdRequirementStatus
  validationErrors: string[]; humanReviewChecked: boolean; status: StructuredConfigurationStatus
  wizardStep: StructuredConfigurationStep
  sessionOnly: true; simulationOnly: true; machineReady: false; geometryCreated: false; exportAvailable: false
}
export interface HybridFutureCapabilities { structuredConfigurationAvailable: false; sketchUnderlayAvailable: false; semanticGeometryAvailable: false; synchronized2D3DAvailable: false; parametricCorrectionAvailable: false; freeDrawingAvailable: false }
export interface HybridProductDesignerSession {
  id: string; creationRoute: HybridCreationRoute | null; productCategory: HybridProductCategory | null; workflowStep: HybridWorkflowStep
  configuration: StructuredProfileConfiguration | null; humanReviewStatus: HybridReviewStatus; sourceReferenceStatus: HybridSourceReferenceStatus
  geometryEntityCount: 0; futureCapabilities: HybridFutureCapabilities; sessionOnly: true; simulationOnly: true; machineReady: false
  internalEvaluationOnly: true; productionApproved: false; sourceImmutable: true; geometryCreated: false; exportAvailable: false
  dwgWriteAvailable: false; machineConnectivityAvailable: false
}

export const HYBRID_SELECTABLE_CATEGORIES: readonly HybridProductCategory[] = Object.freeze(['WINDOW', 'DOOR'])
export interface ProductSizeSuggestion { id: string; width: string; height: string; label: string }
const WINDOW_NAME_SUGGESTIONS = Object.freeze(['Фиксиран прозорец', 'Еднокрилен прозорец', 'Двукрилен прозорец', 'Трикрилен прозорец', 'Прозорец с горен фикс', 'Прозорец с долен фикс'])
const DOOR_NAME_SUGGESTIONS = Object.freeze(['Еднокрила плътна врата', 'Еднокрила остъклена врата', 'Еднокрила врата — стъкло отгоре, панел отдолу', 'Двукрила плътна врата', 'Двукрила остъклена врата', 'Врата със страничен фикс', 'Врата с два странични фикса', 'Врата с горен фикс'])
const WINDOW_SIZE_SUGGESTIONS: readonly ProductSizeSuggestion[] = Object.freeze([{ id: '600x600', width: '600', height: '600', label: '600 × 600 mm' }, { id: '900x1200', width: '900', height: '1200', label: '900 × 1200 mm' }, { id: '1200x1200', width: '1200', height: '1200', label: '1200 × 1200 mm' }, { id: '1400x1200', width: '1400', height: '1200', label: '1400 × 1200 mm' }, { id: '1800x1400', width: '1800', height: '1400', label: '1800 × 1400 mm' }])
const DOOR_SIZE_SUGGESTIONS: readonly ProductSizeSuggestion[] = Object.freeze([{ id: '900x2000', width: '900', height: '2000', label: '900 × 2000 mm' }, { id: '1000x2100', width: '1000', height: '2100', label: '1000 × 2100 mm' }, { id: '1200x2100', width: '1200', height: '2100', label: '1200 × 2100 mm' }, { id: '1600x2100', width: '1600', height: '2100', label: '1600 × 2100 mm' }])
export const getProductNameSuggestions = (category: StructuredProfileConfiguration['productCategory']): readonly string[] => category === 'DOOR' ? DOOR_NAME_SUGGESTIONS : WINDOW_NAME_SUGGESTIONS
export const getProductSizeSuggestions = (category: StructuredProfileConfiguration['productCategory']): readonly ProductSizeSuggestion[] => category === 'DOOR' ? DOOR_SIZE_SUGGESTIONS : WINDOW_SIZE_SUGGESTIONS
export const hasUnusualDemonstrationalDoorProportion = (width: string | number, height: string | number): boolean => {
  const numericWidth = Number(width), numericHeight = Number(height)
  return Number.isFinite(numericWidth) && Number.isFinite(numericHeight) && numericWidth > 0 && numericHeight > 0 && numericWidth >= numericHeight
}
/** @deprecated Използвайте category-aware pure selector. */
export const PRODUCT_NAME_SUGGESTIONS = WINDOW_NAME_SUGGESTIONS
/** @deprecated Използвайте category-aware pure selector. */
export const PRODUCT_SIZE_PRESETS = WINDOW_SIZE_SUGGESTIONS
export const HYBRID_FUTURE_CAPABILITIES: HybridFutureCapabilities = Object.freeze({ structuredConfigurationAvailable: false, sketchUnderlayAvailable: false, semanticGeometryAvailable: false, synchronized2D3DAvailable: false, parametricCorrectionAvailable: false, freeDrawingAvailable: false })
const activeProfiles = (profiles: CatalogueProfile[]) => profiles.filter((profile) => profile.status !== 'ARCHIVED')
const isPositiveFiniteText = (value: string) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0

export function deriveActiveProfileSystems(profiles: CatalogueProfile[]): string[] { return [...new Set(activeProfiles(profiles).map(({ system }) => system.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bg')) }
export function compatibleProfiles(profiles: CatalogueProfile[], system: string, role: ProfileRole): CatalogueProfile[] { return activeProfiles(profiles).filter((profile) => profile.system === system && profile.role === role) }
export function createStructuredConfiguration(productCategory: 'WINDOW' | 'DOOR'): StructuredProfileConfiguration {
  return { productCategory, productName: '', overallWidth: '', overallHeight: '', profileSystem: '', frameProfileId: '', sashProfileId: '', mullionProfileId: '', thresholdStatus: productCategory === 'DOOR' ? 'UNRESOLVED' : 'NOT_APPLICABLE', validationErrors: [], humanReviewChecked: false, status: 'EMPTY', wizardStep: 1, sessionOnly: true, simulationOnly: true, machineReady: false, geometryCreated: false, exportAvailable: false }
}
export function maximumAccessibleConfigurationStep(configuration: StructuredProfileConfiguration, profiles: CatalogueProfile[]): StructuredConfigurationStep {
  if (!configuration.productName.trim() || !isPositiveFiniteText(configuration.overallWidth) || !isPositiveFiniteText(configuration.overallHeight)) return 2
  if (!configuration.profileSystem || !deriveActiveProfileSystems(profiles).includes(configuration.profileSystem)) return 3
  const frameValid = compatibleProfiles(profiles, configuration.profileSystem, 'FRAME').some((profile) => profile.id === configuration.frameProfileId)
  const sashValid = !configuration.sashProfileId || compatibleProfiles(profiles, configuration.profileSystem, 'SASH').some((profile) => profile.id === configuration.sashProfileId)
  const mullionValid = !configuration.mullionProfileId || compatibleProfiles(profiles, configuration.profileSystem, 'MULLION').some((profile) => profile.id === configuration.mullionProfileId)
  return frameValid && sashValid && mullionValid ? 5 : 4
}
export function moveStructuredConfigurationStep(configuration: StructuredProfileConfiguration, step: StructuredConfigurationStep, profiles: CatalogueProfile[]): StructuredProfileConfiguration {
  return step <= maximumAccessibleConfigurationStep(configuration, profiles) ? { ...configuration, wizardStep: step } : configuration
}
export function validateStructuredConfiguration(configuration: StructuredProfileConfiguration, profiles: CatalogueProfile[]): string[] {
  const errors: string[] = []
  if (!configuration.productName.trim()) errors.push('Въведете име на изделието.')
  if (!isPositiveFiniteText(configuration.overallWidth)) errors.push('Въведете положителна крайна обща ширина.')
  if (!isPositiveFiniteText(configuration.overallHeight)) errors.push('Въведете положителна крайна обща височина.')
  if (!configuration.profileSystem) errors.push('Изберете профилна система.')
  else if (!deriveActiveProfileSystems(profiles).includes(configuration.profileSystem)) errors.push('Избраната профилна система няма активни профили.')
  const validateRole = (id: string, role: ProfileRole, required: boolean, label: string) => {
    if (!id) { if (required) errors.push(`Изберете активен профил за ${label}.`); return }
    if (!compatibleProfiles(profiles, configuration.profileSystem, role).some((profile) => profile.id === id)) errors.push(`Избраният профил за ${label} вече не е съвместим или активен.`)
  }
  validateRole(configuration.frameProfileId, 'FRAME', true, 'каса'); validateRole(configuration.sashProfileId, 'SASH', false, 'крило'); validateRole(configuration.mullionProfileId, 'MULLION', false, 'делител')
  if (configuration.productCategory === 'DOOR') errors.push('Прагът е неразрешен: няма потвърдена роля и профил в текущия каталог.')
  return errors
}
function semanticStatus(configuration: StructuredProfileConfiguration): StructuredConfigurationStatus { return configuration.productName.trim() || configuration.overallWidth || configuration.overallHeight || configuration.profileSystem || configuration.frameProfileId || configuration.sashProfileId || configuration.mullionProfileId ? 'NEEDS_REVIEW' : 'EMPTY' }
export function updateStructuredConfiguration(configuration: StructuredProfileConfiguration, patch: Partial<Pick<StructuredProfileConfiguration, 'productName' | 'overallWidth' | 'overallHeight' | 'profileSystem' | 'frameProfileId' | 'sashProfileId' | 'mullionProfileId' | 'humanReviewChecked'>>, profiles: CatalogueProfile[]): StructuredProfileConfiguration {
  let next = { ...configuration, ...patch, humanReviewChecked: patch.humanReviewChecked ?? false, status: 'NEEDS_REVIEW' as StructuredConfigurationStatus }
  if (patch.profileSystem !== undefined && patch.profileSystem !== configuration.profileSystem) {
    const valid = (id: string, role: ProfileRole) => compatibleProfiles(profiles, patch.profileSystem ?? '', role).some((profile) => profile.id === id)
    next = { ...next, frameProfileId: valid(configuration.frameProfileId, 'FRAME') ? configuration.frameProfileId : '', sashProfileId: valid(configuration.sashProfileId, 'SASH') ? configuration.sashProfileId : '', mullionProfileId: valid(configuration.mullionProfileId, 'MULLION') ? configuration.mullionProfileId : '' }
  }
  next.status = semanticStatus(next); next.validationErrors = validateStructuredConfiguration(next, profiles); return next
}
export function reconcileStructuredConfiguration(configuration: StructuredProfileConfiguration, profiles: CatalogueProfile[]): StructuredProfileConfiguration {
  const systemValid = !configuration.profileSystem || deriveActiveProfileSystems(profiles).includes(configuration.profileSystem)
  const valid = (id: string, role: ProfileRole) => !id || compatibleProfiles(profiles, configuration.profileSystem, role).some((profile) => profile.id === id)
  const changed = !systemValid || !valid(configuration.frameProfileId, 'FRAME') || !valid(configuration.sashProfileId, 'SASH') || !valid(configuration.mullionProfileId, 'MULLION')
  if (!changed) return { ...configuration, validationErrors: validateStructuredConfiguration(configuration, profiles) }
  const next = { ...configuration, profileSystem: systemValid ? configuration.profileSystem : '', frameProfileId: systemValid && valid(configuration.frameProfileId, 'FRAME') ? configuration.frameProfileId : '', sashProfileId: systemValid && valid(configuration.sashProfileId, 'SASH') ? configuration.sashProfileId : '', mullionProfileId: systemValid && valid(configuration.mullionProfileId, 'MULLION') ? configuration.mullionProfileId : '', humanReviewChecked: false, status: 'NEEDS_REVIEW' as const }
  const wizardStep = Math.min(next.wizardStep, maximumAccessibleConfigurationStep(next, profiles)) as StructuredConfigurationStep
  return { ...next, wizardStep, validationErrors: validateStructuredConfiguration(next, profiles) }
}
export function changeStructuredCategory(configuration: StructuredProfileConfiguration, productCategory: 'WINDOW' | 'DOOR', _profiles: CatalogueProfile[]): StructuredProfileConfiguration {
  if (configuration.productCategory === productCategory) return configuration
  return createStructuredConfiguration(productCategory)
}
export function confirmStructuredConfiguration(configuration: StructuredProfileConfiguration, profiles: CatalogueProfile[]): StructuredProfileConfiguration {
  const validationErrors = validateStructuredConfiguration(configuration, profiles)
  if (configuration.wizardStep !== 5) validationErrors.push('Потвърждението е достъпно само в стъпка „Проверка“.')
  if (validationErrors.length || !configuration.humanReviewChecked) return { ...configuration, validationErrors: configuration.humanReviewChecked ? validationErrors : [...validationErrors, 'Потвърдете, че сте проверили размерите, системата и избраните профили.'], status: semanticStatus(configuration) }
  return { ...configuration, validationErrors: [], status: 'HUMAN_CONFIRMED' }
}
export function createHybridProductDesignerSession(id = 'hybrid-product-session'): HybridProductDesignerSession { return Object.freeze({ id, creationRoute: null, productCategory: null, workflowStep: 'DESIGNER_START', configuration: null, humanReviewStatus: 'DRAFT', sourceReferenceStatus: 'NONE', geometryEntityCount: 0, futureCapabilities: HYBRID_FUTURE_CAPABILITIES, sessionOnly: true, simulationOnly: true, machineReady: false, internalEvaluationOnly: true, productionApproved: false, sourceImmutable: true, geometryCreated: false, exportAvailable: false, dwgWriteAvailable: false, machineConnectivityAvailable: false }) }
export function selectHybridCreationRoute(session: HybridProductDesignerSession, route: HybridCreationRoute): HybridProductDesignerSession { const workflowStep: HybridWorkflowStep = route === 'STANDARD' ? 'STANDARD_CATEGORY' : route === 'SKETCH_ASSISTED' ? 'SKETCH_ROUTE' : 'NON_STANDARD_VIEWPORT'; return { ...session, creationRoute: route, productCategory: null, workflowStep, configuration: route === 'STANDARD' ? session.configuration : null, sourceReferenceStatus: route === 'SKETCH_ASSISTED' ? 'ROUTE_SELECTED' : 'NONE', geometryEntityCount: 0 } }
export function selectHybridStandardCategory(session: HybridProductDesignerSession, category: HybridProductCategory, profiles: CatalogueProfile[] = []): HybridProductDesignerSession { if (session.creationRoute !== 'STANDARD' || !HYBRID_SELECTABLE_CATEGORIES.includes(category)) return session; const productCategory = category as 'WINDOW' | 'DOOR'; const configuration = session.configuration ? changeStructuredCategory(session.configuration, productCategory, profiles) : createStructuredConfiguration(productCategory); return { ...session, productCategory: category, workflowStep: 'STANDARD_DRAFT', configuration, geometryEntityCount: 0 } }
export function returnToHybridDesignerStart(session: HybridProductDesignerSession): HybridProductDesignerSession { return createHybridProductDesignerSession(session.id) }
export const canOpenVisualComposer = (configuration: StructuredProfileConfiguration): boolean => configuration.productCategory === 'WINDOW' && configuration.thresholdStatus === 'NOT_APPLICABLE' && configuration.status === 'HUMAN_CONFIRMED'
