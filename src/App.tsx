import { useMemo, useState } from 'react'
import './App.css'
import './importCenter.css'
import './help.css'
import './contextHelp.css'
import './localLauncher.css'
import './customDesigner.css'
import './threeDPreview.css'
import './dimensions.css'
import './skyGlazing.css'
import './dwgViewer.css'
import './detailDrafting.css'
import './detailDraftViewport.css'
import './headerNavigation.css'
import { OperationsPanel } from './components/OperationsPanel'
import { ProfilePanel } from './components/ProfilePanel'
import { ProfileWorkspace } from './components/ProfileWorkspace'
import { ProductPreview } from './components/ProductPreview'
import { ProductTemplatePicker } from './components/ProductTemplatePicker'
import { SelectedComponentContext } from './components/SelectedComponentContext'
import { DrawingImportWorkspace } from './components/DrawingImportWorkspace'
import { GuidedTour } from './components/GuidedTour'
import { HelpCenter } from './components/HelpCenter'
import { ContextHelp } from './components/ContextHelp'
import { ProfileCatalogue } from './components/ProfileCatalogue'
import { CustomProductDesigner } from './components/CustomProductDesigner'
import { DetailDraftingPlaceholder } from './components/DetailDraftingPlaceholder'
import { SelectedCustomComponentContext } from './components/SelectedCustomComponentContext'
import { operationsForComponent, type ComponentOperations } from './componentOperations'
import { exportComponentSimulation, exportSimulation } from './exportSimulation'
import { affectedComponentIds, calculateProductComponents, productGeometrySignature } from './productCalculations'
import { defaultProduct } from './productData'
import type { ProductParameters, ProductTemplate } from './productTypes'
import { getProductTemplate } from './productTemplates'
import { validateProduct } from './productValidation'
import { defaultOrientation, defaultProfile, defaultProject, emptyOperation } from './sampleData'
import type { MachiningOperation, OperationDraft, Orientation, Profile } from './types'
import { validateAll, validateOperation } from './validation'
import type { CapturedDrawingProduct } from './drawingImportTypes'
import { sampleCatalogueProfiles } from './profileCatalogueData'
import type { ActiveProfileSelection, CatalogueProfile } from './profileCatalogueTypes'
import { initialGeometry } from './customGeometryTree'
import type { CustomProduct } from './customGeometryTypes'
import { changedCustomComponentIds, generateCustomComponents, type CustomComponent } from './customComponentGeneration'
import type { ImportedDimensionEvidence } from './dimensionTypes'

function App() {
  const isLocalApplication = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const [project, setProject] = useState(defaultProject)
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [standaloneOrientation, setStandaloneOrientation] = useState<Orientation>(defaultOrientation)
  const [standaloneOperations, setStandaloneOperations] = useState<MachiningOperation[]>([])
  const [componentOperations, setComponentOperations] = useState<ComponentOperations>({})
  const [componentOrientations, setComponentOrientations] = useState<Record<string, Orientation>>({})
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null)
  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<OperationDraft>(emptyOperation)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [product, setProduct] = useState<ProductParameters>(defaultProduct)
  const [productErrors, setProductErrors] = useState<string[]>([])
  const [showProductPreview, setShowProductPreview] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showDrawingImport, setShowDrawingImport] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [importPreview, setImportPreview] = useState<{ product: ProductParameters; project: string; verified: boolean; evidence: ImportedDimensionEvidence[] } | null>(null)
  const [productFromVerifiedImport, setProductFromVerifiedImport] = useState(false)
  const [importedDimensionEvidence, setImportedDimensionEvidence] = useState<ImportedDimensionEvidence[]>([])
  const [catalogueProfiles, setCatalogueProfiles] = useState<CatalogueProfile[]>(sampleCatalogueProfiles)
  const [activeProfileSelection, setActiveProfileSelection] = useState<ActiveProfileSelection>({ FRAME: 'profile-demo-frame-01', SASH: 'profile-demo-sash-01', MULLION: 'profile-demo-mullion-01' })
  const [showProfileCatalogue, setShowProfileCatalogue] = useState(false)
  const [showDetailDrafting, setShowDetailDrafting] = useState(false)
  const [showCustomDesigner, setShowCustomDesigner] = useState(false)
  const [activeCustomComponentId, setActiveCustomComponentId] = useState<string | null>(null)
  const [customProduct, setCustomProduct] = useState<CustomProduct>(() => { const now = new Date().toISOString(); return { id: crypto.randomUUID(), name: 'Нестандартен прозорец 001', width: 1400, height: 1200, frameProfileId: 'profile-demo-frame-01', frameCreated: false, mullionProfileId: 'profile-demo-mullion-01', geometry: initialGeometry(), status: 'DRAFT', humanReviewConfirmed: false, createdAt: now, updatedAt: now, simulationOnly: true, machineReady: false } })

  const productTemplate = useMemo(() => getProductTemplate(product.templateId), [product.templateId])
  const productComponents = useMemo(() => calculateProductComponents(product, profile.code), [product, profile.code])
  const activeComponent = useMemo(() => productComponents.find((component) => component.id === activeComponentId) ?? null, [productComponents, activeComponentId])
  const customComponents = useMemo(() => generateCustomComponents(customProduct, catalogueProfiles), [customProduct, catalogueProfiles])
  const activeCustomComponent = useMemo(() => customComponents.find((component) => component.id === activeCustomComponentId) ?? null, [customComponents, activeCustomComponentId])
  const operationComponentKey = activeCustomComponent ? `custom:${customProduct.id}:${activeCustomComponent.id}` : activeComponent?.id
  const currentProfile = useMemo(() => activeCustomComponent ? { ...profile, code: activeCustomComponent.profileCode, length: activeCustomComponent.nominalLength } : activeComponent ? { ...profile, length: activeComponent.nominalLength } : profile, [activeComponent, activeCustomComponent, profile])
  const currentOrientation = operationComponentKey ? componentOrientations[operationComponentKey] ?? 'left' : standaloneOrientation
  const operations = operationComponentKey ? operationsForComponent(componentOperations, operationComponentKey) : standaloneOperations
  const savedValidation = useMemo(() => validateAll(project, currentProfile, operations), [project, currentProfile, operations])
  const validation = useMemo(() => ({ valid: savedValidation.valid && formErrors.length === 0, errors: [...savedValidation.errors, ...formErrors.map((error) => `Текуща операция: ${error}`)] }), [savedValidation, formErrors])

  const setOperations = (updater: (items: MachiningOperation[]) => MachiningOperation[]) => {
    if (operationComponentKey) setComponentOperations((all) => ({ ...all, [operationComponentKey]: updater(operationsForComponent(all, operationComponentKey)) }))
    else setStandaloneOperations(updater)
  }
  const cancelOperation = () => { setEditingId(null); setDraft(emptyOperation); setFormErrors([]) }
  const submitOperation = () => {
    const result = validateOperation(draft, currentProfile)
    setFormErrors(result.errors)
    if (!result.valid) return
    setOperations((items) => editingId ? items.map((item) => item.id === editingId ? { ...draft, id: editingId } : item) : [...items, { ...draft, id: crypto.randomUUID() }])
    cancelOperation()
  }
  const moveOperation = (index: number, direction: -1 | 1) => setOperations((items) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return items
    const next = [...items], current = next[index], adjacent = next[target]
    if (!current || !adjacent) return items
    next[index] = adjacent; next[target] = current
    return next
  })
  const changeProduct = (next: ProductParameters): boolean => {
    const geometryChanged = productGeometrySignature(product) !== productGeometrySignature(next)
    if (geometryChanged) {
      const nextComponents = calculateProductComponents(next, profile.code)
      const idsWithOperations = Object.entries(componentOperations).filter(([, items]) => items.length > 0).map(([id]) => id)
      const affected = affectedComponentIds(productComponents, nextComponents, idsWithOperations)
      if (affected.length > 0) {
        const confirmed = window.confirm(`Новата схема или размери променят ${affected.length} детайла с операции. Само засегнатите симулационни операции ще бъдат изчистени. Да продължа ли?`)
        if (!confirmed) return false
      }
      if (affected.length > 0) {
        setComponentOperations((all) => Object.fromEntries(Object.entries(all).filter(([id]) => !affected.includes(id))))
        setComponentOrientations((all) => Object.fromEntries(Object.entries(all).filter(([id]) => !affected.includes(id))))
      }
      if (activeComponentId && !nextComponents.some((component) => component.id === activeComponentId && !affected.includes(component.id))) setActiveComponentId(null)
      if (previewSelectedId && !nextComponents.some((component) => component.id === previewSelectedId)) setPreviewSelectedId(null)
      cancelOperation()
    }
    setProductFromVerifiedImport(false)
    setImportedDimensionEvidence([])
    setProduct(next)
    if (productErrors.length) setProductErrors(validateProduct(next).errors)
    return true
  }
  const selectTemplate = (template: ProductTemplate) => {
    const firstOpening = template.fields.find((field) => field.state === 'opening')
    const changed = changeProduct({ ...product, templateId: template.id, type: template.category, openingDirection: firstOpening?.openingDirection ?? 'left' })
    if (changed) setShowTemplatePicker(false)
  }
  const openProductPreview = () => {
    const result = validateProduct(product)
    setProductErrors(result.errors)
    if (result.valid) setShowProductPreview(true)
  }
  const openComponent = (componentId: string) => {
    setActiveCustomComponentId(null); setActiveComponentId(componentId); setPreviewSelectedId(componentId); setShowProductPreview(false); cancelOperation()
  }
  const openCustomComponent = (component: CustomComponent) => { setActiveComponentId(null); setActiveCustomComponentId(component.id); setShowCustomDesigner(false); cancelOperation() }
  const returnToStandalone = () => { setActiveComponentId(null); setActiveCustomComponentId(null); cancelOperation() }
  const changeOrientation = (orientation: Orientation) => {
    if (operationComponentKey) setComponentOrientations((items) => ({ ...items, [operationComponentKey]: orientation }))
    else setStandaloneOrientation(orientation)
  }
  const performExport = () => {
    if (activeComponent) exportComponentSimulation({ project, profile: currentProfile, sourceProduct: product, selectedComponent: activeComponent, localOrientation: currentOrientation, operations, validation })
    else exportSimulation({ project, profile: activeCustomComponent ? currentProfile : profile, orientation: activeCustomComponent ? currentOrientation : standaloneOrientation, operations: activeCustomComponent ? operations : standaloneOperations, validation })
  }
  const commitCustomProduct = (previous: CustomProduct, next: CustomProduct): boolean => {
    const previousComponents = generateCustomComponents(previous, catalogueProfiles), nextComponents = generateCustomComponents(next, catalogueProfiles)
    const operationIds = Object.entries(componentOperations).filter(([key, items]) => key.startsWith(`custom:${previous.id}:`) && items.length > 0).map(([key]) => key.slice(`custom:${previous.id}:`.length))
    const affected = changedCustomComponentIds(previousComponents, nextComponents, operationIds)
    if (affected.length && !window.confirm(`Промяната засяга ${affected.length} детайла с операции. Само операциите на премахнатите или несъвместими детайли ще бъдат изчистени. Да продължа ли?`)) return false
    if (affected.length) setComponentOperations((all) => Object.fromEntries(Object.entries(all).filter(([key]) => !affected.some((id) => key === `custom:${previous.id}:${id}`))))
    if (activeCustomComponentId && !nextComponents.some((item) => item.id === activeCustomComponentId && !affected.includes(item.id))) setActiveCustomComponentId(null)
    setCustomProduct(next)
    return true
  }
  const updateCatalogue = (next: CatalogueProfile[], changedProfileId?: string): boolean => {
    if (changedProfileId && [customProduct.frameProfileId, customProduct.mullionProfileId, ...customComponents.map((item) => item.profileId)].includes(changedProfileId)) {
      const hasOperations = Object.entries(componentOperations).some(([key, items]) => key.startsWith(`custom:${customProduct.id}:`) && items.length > 0)
      if (!window.confirm(`Профилът се използва от черновата${hasOperations ? ' и има свързани операции' : ''}. Промяната ще върне изделието в NEEDS_REVIEW. Да продължа ли?`)) return false
      setCustomProduct((item) => ({ ...item, status: 'NEEDS_REVIEW', humanReviewConfirmed: false, updatedAt: new Date().toISOString() }))
    }
    setCatalogueProfiles(next)
    if (changedProfileId && next.find((item) => item.id === changedProfileId)?.status === 'ARCHIVED') setActiveProfileSelection((selection) => Object.fromEntries(Object.entries(selection).filter(([, id]) => id !== changedProfileId)))
    return true
  }
  const loadVerifiedDrawingProduct = (item: CapturedDrawingProduct): boolean => {
    if (item.status !== 'VERIFIED') return false
    const template = getProductTemplate(item.templateId)
    const loaded = changeProduct({ ...product, templateId: item.templateId, type: template.category, width: item.width, height: item.height })
    if (!loaded) return false
    setProject(item.projectReference)
    setProductFromVerifiedImport(true)
    setImportedDimensionEvidence(item.dimensionEvidence ?? [])
    setShowDrawingImport(false)
    return true
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <img className="nadezhda-header-logo" src="/branding/nadezhda-header.png" alt="Надежда - алуминиева и PVC дограма"/>
        <div className="brand">
          <h1>FacadeFlow Demo</h1>
          <p>Визуална подготовка на операции за алуминиеви профили</p>
        </div>
        <div className="safety-badge">
          <span>●</span> СИМУЛАЦИЯ — БЕЗ ВРЪЗКА С МАШИНА
        </div>
        {isLocalApplication && <div className="local-application-badge">ЛОКАЛНО ПРИЛОЖЕНИЕ</div>}
        <nav className="app-header-actions" aria-label="Основни действия"><button type="button" className="help-action" data-help-id="help-button" onClick={() => setShowHelp(true)}>Помощ</button><button type="button" className="drawing-import-action" data-help-id="unified-import" onClick={() => setShowDrawingImport(true)}>Импортирай проект / чертеж</button><button type="button" className="catalogue-action" onClick={() => setShowProfileCatalogue(true)}>Каталог на профилите</button><button type="button" className="detail-drafting-action" onClick={() => setShowDetailDrafting(true)}>Чертане на детайл</button></nav>
      </header>
      <main>
        <div className={`mode-indicator ${activeComponent || activeCustomComponent ? 'component-mode' : ''}`}>
          {activeCustomComponent ? 'Детайл от нестандартно изделие' : activeComponent ? 'Детайл от изделие' : 'Самостоятелен профил'}
        </div>
        {activeComponent && (
          <SelectedComponentContext
            component={activeComponent}
            onBackToProduct={() => setShowProductPreview(true)}
            onStandalone={returnToStandalone}
          />
        )}
        {activeCustomComponent && (
          <SelectedCustomComponentContext
            component={activeCustomComponent}
            onBack={() => setShowCustomDesigner(true)}
            onStandalone={returnToStandalone}
          />
        )}
        {!activeComponent && !activeCustomComponent && <section className="product-creation-choices" aria-label="Създаване на изделие"><button type="button" onClick={() => setShowTemplatePicker(true)}>Избери типова схема</button><button type="button" className="primary" onClick={() => setShowCustomDesigner(true)}>Начертай нестандартен прозорец</button></section>}
        <div className="layout">
          <ProfilePanel
            project={project}
            profile={profile}
            orientation={currentOrientation}
            product={product}
            productTemplate={productTemplate}
            productErrors={productErrors}
            onProject={setProject}
            onProfile={(next) => {
              setProfile(next)
              if (formErrors.length) {
                setFormErrors(
                  validateOperation(
                    draft,
                    activeComponent ? { ...next, length: activeComponent.nominalLength } : next,
                  ).errors,
                )
              }
            }}
            onOrientation={changeOrientation}
            onProduct={changeProduct}
            onProductPreview={openProductPreview}
            onChooseTemplate={() => setShowTemplatePicker(true)}
            onApplyRecommendedDimensions={() => changeProduct({
              ...product,
              width: productTemplate.recommendedWidth,
              height: productTemplate.recommendedHeight,
            })}
          />
          <ProfileWorkspace
            profile={currentProfile}
            operations={operations}
            orientation={currentOrientation}
          />
          <OperationsPanel
            draft={draft}
            operations={operations}
            editingId={editingId}
            errors={formErrors}
            onDraft={(next) => {
              setDraft(next)
              if (formErrors.length) {
                setFormErrors(validateOperation(next, currentProfile).errors)
              }
            }}
            onSubmit={submitOperation}
            onEdit={(operation) => {
              const { id, ...values } = operation
              setEditingId(id)
              setDraft(values)
              setFormErrors([])
            }}
            onDelete={(id) => {
              setOperations((items) => items.filter((item) => item.id !== id))
              if (editingId === id) cancelOperation()
            }}
            onMove={moveOperation}
            onCancel={cancelOperation}
          />
        </div>
        <section
          className={`validation-bar ${validation.valid ? 'valid' : 'invalid'}`}
          data-help-id="validation-status"
          aria-live="polite"
        >
          <div>
            <span className="state-icon">{validation.valid ? '✓' : '!'}</span>
            <div>
              <b>{validation.valid ? 'Готово за визуална проверка' : 'Има грешки'}</b>
              <p id="readiness-explanation">
                {validation.valid
                  ? `${operations.length} операции · Данните са валидни за симулация.`
                  : `Коригирайте видимите грешки преди тестовия export. ${validation.errors.join(' ')}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="export"
            data-help-id="simulation-export"
            disabled={!validation.valid}
            aria-describedby="readiness-explanation"
            title={!validation.valid ? 'Export-ът е недостъпен, докато има грешки.' : undefined}
            onClick={performExport}
          >
            ⇩ Експортирай тестов JSON
          </button><ContextHelp helpId="simulation-export"/><ContextHelp helpId="draft"/><ContextHelp helpId="needs-review"/><ContextHelp helpId="verified"/><ContextHelp helpId="machine-ready"/>
        </section>
      </main>
      <footer>FacadeFlow Demo · Phase 01 + 02A + 02B · Само визуална симулация</footer>
      {showProductPreview && (
        <ProductPreview
          product={product}
          project={project}
          profileCode={profile.code}
          profileSystem={profile.system}
          selectedComponentId={previewSelectedId}
          onSelectComponent={setPreviewSelectedId}
          onOpenComponent={(component) => openComponent(component.id)}
          onClose={() => setShowProductPreview(false)}
          verifiedImport={productFromVerifiedImport}
          importedDimensionEvidence={importedDimensionEvidence}
        />
      )}
      {showTemplatePicker && (
        <ProductTemplatePicker
          selectedTemplateId={product.templateId}
          onSelect={selectTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
      {showDrawingImport && (
        <DrawingImportWorkspace
          baseProduct={product}
          onPreview={(previewProduct, previewProject) => setImportPreview({ product: previewProduct, project: previewProject, verified: false, evidence: [] })}
          onLoadVerified={loadVerifiedDrawingProduct}
          onClose={() => setShowDrawingImport(false)}
        />
      )}
      {showProfileCatalogue && <ProfileCatalogue profiles={catalogueProfiles} selection={activeProfileSelection} onProfiles={updateCatalogue} onSelection={setActiveProfileSelection} onClose={() => setShowProfileCatalogue(false)}/>}
      {showDetailDrafting && <DetailDraftingPlaceholder onClose={() => setShowDetailDrafting(false)}/>}
      {showCustomDesigner && <CustomProductDesigner initial={customProduct} profiles={catalogueProfiles} activeProfiles={activeProfileSelection} selectedComponentId={activeCustomComponentId} onCommit={commitCustomProduct} onOpenComponent={openCustomComponent} onClose={() => setShowCustomDesigner(false)}/>}
      {importPreview && (
        <ProductPreview
          product={importPreview.product}
          project={importPreview.project || 'Чернова от скица'}
          profileCode={profile.code}
          profileSystem={profile.system}
          selectedComponentId={null}
          onSelectComponent={() => undefined}
          onOpenComponent={() => undefined}
          onClose={() => setImportPreview(null)}
          importedSource
          verifiedImport={importPreview.verified}
          importedDimensionEvidence={importPreview.evidence}
        />
      )}
      {showHelp && (
        <HelpCenter
          onClose={() => setShowHelp(false)}
          onStartTour={() => { setShowHelp(false); setShowTour(true) }}
        />
      )}
      {showTour && (
        <GuidedTour onClose={() => setShowTour(false)}/>
      )}
    </div>
  )
}

export default App
