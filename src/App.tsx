import { useMemo, useState } from 'react'
import './App.css'
import './importCenter.css'
import './help.css'
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

function App() {
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
  const [importPreview, setImportPreview] = useState<{ product: ProductParameters; project: string } | null>(null)

  const productTemplate = useMemo(() => getProductTemplate(product.templateId), [product.templateId])
  const productComponents = useMemo(() => calculateProductComponents(product, profile.code), [product, profile.code])
  const activeComponent = useMemo(() => productComponents.find((component) => component.id === activeComponentId) ?? null, [productComponents, activeComponentId])
  const currentProfile = useMemo(() => activeComponent ? { ...profile, length: activeComponent.nominalLength } : profile, [activeComponent, profile])
  const currentOrientation = activeComponent ? componentOrientations[activeComponent.id] ?? 'left' : standaloneOrientation
  const operations = activeComponent ? operationsForComponent(componentOperations, activeComponent.id) : standaloneOperations
  const savedValidation = useMemo(() => validateAll(project, currentProfile, operations), [project, currentProfile, operations])
  const validation = useMemo(() => ({ valid: savedValidation.valid && formErrors.length === 0, errors: [...savedValidation.errors, ...formErrors.map((error) => `Текуща операция: ${error}`)] }), [savedValidation, formErrors])

  const setOperations = (updater: (items: MachiningOperation[]) => MachiningOperation[]) => {
    if (activeComponent) setComponentOperations((all) => ({ ...all, [activeComponent.id]: updater(operationsForComponent(all, activeComponent.id)) }))
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
    setActiveComponentId(componentId); setPreviewSelectedId(componentId); setShowProductPreview(false); cancelOperation()
  }
  const returnToStandalone = () => { setActiveComponentId(null); cancelOperation() }
  const changeOrientation = (orientation: Orientation) => {
    if (activeComponent) setComponentOrientations((items) => ({ ...items, [activeComponent.id]: orientation }))
    else setStandaloneOrientation(orientation)
  }
  const performExport = () => {
    if (activeComponent) exportComponentSimulation({ project, profile: currentProfile, sourceProduct: product, selectedComponent: activeComponent, localOrientation: currentOrientation, operations, validation })
    else exportSimulation({ project, profile, orientation: standaloneOrientation, operations: standaloneOperations, validation })
  }
  const loadVerifiedDrawingProduct = (item: CapturedDrawingProduct): boolean => {
    if (item.status !== 'VERIFIED') return false
    const template = getProductTemplate(item.templateId)
    const loaded = changeProduct({ ...product, templateId: item.templateId, type: template.category, width: item.width, height: item.height })
    if (!loaded) return false
    setProject(item.projectReference)
    setShowDrawingImport(false)
    return true
  }

  return (
    <div className="app-shell">
      <header>
        <div className="brand-mark">FF</div>
        <div className="brand">
          <h1>FacadeFlow Demo</h1>
          <p>Визуална подготовка на операции за алуминиеви профили</p>
        </div>
        <div className="safety-badge">
          <span>●</span> СИМУЛАЦИЯ — БЕЗ ВРЪЗКА С МАШИНА
        </div>
        <button type="button" className="help-action" data-help-id="help-button" onClick={() => setShowHelp(true)}>Помощ</button>
        <button type="button" className="drawing-import-action" data-help-id="unified-import" onClick={() => setShowDrawingImport(true)}>Импортирай проект / чертеж</button>
      </header>
      <main>
        <div className={`mode-indicator ${activeComponent ? 'component-mode' : ''}`}>
          {activeComponent ? 'Детайл от изделие' : 'Самостоятелен профил'}
        </div>
        {activeComponent && (
          <SelectedComponentContext
            component={activeComponent}
            onBackToProduct={() => setShowProductPreview(true)}
            onStandalone={returnToStandalone}
          />
        )}
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
          onPreview={(previewProduct, previewProject) => setImportPreview({ product: previewProduct, project: previewProject })}
          onLoadVerified={loadVerifiedDrawingProduct}
          onClose={() => setShowDrawingImport(false)}
        />
      )}
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
