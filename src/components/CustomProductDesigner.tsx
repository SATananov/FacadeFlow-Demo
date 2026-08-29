import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateCustomComponents, type CustomComponent } from '../customComponentGeneration'
import { exportCustomProduct } from '../customProductExport'
import { findGeometryNode, geometryHasNestedSplit, projectGeometry, removeSplit, splitField, updateGeometryNode } from '../customGeometryTree'
import type { CustomGeometryNode, CustomLeafNode, CustomProduct, SplitOrientation } from '../customGeometryTypes'
import { validateCustomProduct } from '../customGeometryValidation'
import { createHistory, pushHistory, redoHistory, undoHistory } from '../customHistory'
import type { ActiveProfileSelection, CatalogueProfile } from '../profileCatalogueTypes'
import { ContextHelp } from './ContextHelp'
import { CustomProductDrawing } from './CustomProductDrawing'
import { CustomProductSummary } from './CustomProductSummary'
import { SelectedFieldPanel } from './SelectedFieldPanel'
import { Product3DPreview } from './Product3DPreview'
import { customProductTo3DScene } from '../customProduct3DAdapter'
import { calculateCustomDimensions } from '../dimensionCalculations'
import { defaultDimensionVisibility } from '../dimensionTypes'
import { DEFAULT_CONCEPTUAL_DEPTH_MM } from '../threeDSceneBuilder'
import { DimensionControls } from './DimensionControls'
import { DrawingWorkspaceShell } from './DrawingWorkspaceShell'
import { customWorkflowState, structuredWorkflowLabels, structuredWorkflowOrder } from '../structuredProductWorkflow'

interface Props { initial: CustomProduct; profiles: CatalogueProfile[]; activeProfiles: ActiveProfileSelection; selectedComponentId: string | null; onCommit: (previous: CustomProduct, next: CustomProduct) => boolean; onOpenComponent: (component: CustomComponent) => void; onClose: () => void }

export function CustomProductDesigner({ initial, profiles, activeProfiles, selectedComponentId, onCommit, onOpenComponent, onClose }: Props) {
  const [history, setHistory] = useState(() => createHistory(initial)), [selectedFieldId, setSelectedFieldId] = useState('field-root'), [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(selectedComponentId), [reviewChecked, setReviewChecked] = useState(false), [largePreview, setLargePreview] = useState(false), [zoom, setZoom] = useState(1), [view, setView] = useState<'2D' | '3D' | 'SPLIT'>('2D'), [conceptualDepth, setConceptualDepth] = useState(DEFAULT_CONCEPTUAL_DEPTH_MM), [dimensionVisibility, setDimensionVisibility] = useState(defaultDimensionVisibility), [componentsVisible, setComponentsVisible] = useState(false)
  const product = history.present, validation = useMemo(() => validateCustomProduct(product, profiles), [product, profiles]), components = useMemo(() => generateCustomComponents(product, profiles), [product, profiles])
  const workflow = useMemo(() => customWorkflowState(product), [product])
  const dimensionsValid = workflow.DIMENSIONS
  const frameReady = dimensionsValid && workflow.FRAME
  const currentStep = structuredWorkflowOrder.find((step) => !workflow[step]) ?? 'CONCEPTUAL_3D'
  const build3DScene = useCallback((depth: number) => customProductTo3DScene(product, profiles, depth), [product, profiles])
  const nominalLengths = useMemo(() => Object.fromEntries(components.map((component) => [component.id, component.nominalLength])), [components])
  const annotations = useMemo(() => calculateCustomDimensions(product, components, selectedSummaryId, conceptualDepth), [product, components, selectedSummaryId, conceptualDepth])
  useEffect(() => { const fallback = () => setView('2D'); window.addEventListener('facadeflow-3d-unavailable', fallback); return () => window.removeEventListener('facadeflow-3d-unavailable', fallback) }, [])
  const projected = useMemo(() => projectGeometry(product.geometry, { x: 0, y: 0, width: product.width, height: product.height }), [product]), selectedProjection = projected.find(({ node }) => node.id === selectedFieldId), selectedNode = findGeometryNode(product.geometry, selectedFieldId)
  const apply = (next: CustomProduct) => { const status = validateCustomProduct(next, profiles).valid ? 'NEEDS_REVIEW' as const : 'DRAFT' as const; const normalized = { ...next, status, humanReviewConfirmed: false, updatedAt: new Date().toISOString() }; if (!onCommit(product, normalized)) return; setHistory((value) => pushHistory(value, normalized)); setReviewChecked(false); setView('2D') }
  const replaceGeometry = (geometry: CustomGeometryNode) => apply({ ...product, geometry })
  const changeSplit = (orientation: SplitOrientation, position: number) => {
    if (!frameReady) return
    if (selectedNode?.kind === 'SPLIT') replaceGeometry(updateGeometryNode(product.geometry, selectedNode.id, (node) => node.kind === 'SPLIT' ? { ...node, orientation, position } : node))
    else replaceGeometry(splitField(product.geometry, selectedFieldId, orientation, position))
  }
  const undo = () => { const next = undoHistory(history); if (next.present !== product && onCommit(product, next.present)) { setHistory(next); setReviewChecked(false) } }
  const redo = () => { const next = redoHistory(history); if (next.present !== product && onCommit(product, next.present)) { setHistory(next); setReviewChecked(false) } }
  const setTop = (patch: Partial<CustomProduct>) => apply({ ...product, ...patch })
  const verify = () => { if (!reviewChecked || !validation.valid) return; const next = { ...product, status: 'VERIFIED' as const, humanReviewConfirmed: true, updatedAt: new Date().toISOString() }; if (onCommit(product, next)) setHistory((value) => pushHistory(value, next)) }
  const header = <header className="preview-header"><div><span className="preview-badge">СИМУЛАЦИЯ · {product.status}</span><h2 id="custom-designer-title">Конструктор на нестандартен прозорец</h2><p>Структуриран правоъгълен модел — не е свободен CAD и не използва производствени формули.</p></div><button className="preview-close" aria-label="Затвори конструктора" onClick={onClose}>×</button></header>
  const progress = <nav className="structured-workflow" aria-label="Професионална последователност">
      <p><strong>Текуща стъпка:</strong> {structuredWorkflowLabels[currentStep]}</p>
      <ol>{structuredWorkflowOrder.map((step, index) => <li key={step} className={workflow[step] ? 'complete' : step === currentStep ? 'current' : 'blocked'} aria-current={step === currentStep ? 'step' : undefined}><span>{index + 1}</span>{structuredWorkflowLabels[step]}</li>)}</ol>
      {!dimensionsValid && <p className="workflow-requirement" role="status">Въведете валидни положителни общи размери, за да създадете касата.</p>}
      {dimensionsValid && !workflow.FRAME && <p className="workflow-requirement" role="status">Изберете профил и създайте външната каса, преди да добавяте делители или крила.</p>}
    </nav>
  const settings = <div className="custom-designer-toolbar"><label>Име<input value={product.name} onChange={(event) => setTop({ name: event.target.value })}/></label><label>Обща ширина (mm)<input type="number" min="1" value={product.width} onChange={(event) => setTop({ width: Number(event.target.value) })}/></label><label>Обща височина (mm)<input type="number" min="1" value={product.height} onChange={(event) => setTop({ height: Number(event.target.value) })}/></label><label>Каса <ContextHelp helpId="profile-frame"/><select value={product.frameProfileId} onChange={(event) => setTop({ frameProfileId: event.target.value })}><option value="">Изберете</option>{profiles.filter((item) => item.role === 'FRAME' && item.status !== 'ARCHIVED').map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label>Делител <ContextHelp helpId="profile-mullion"/><select value={product.mullionProfileId ?? ''} onChange={(event) => setTop({ mullionProfileId: event.target.value || undefined })}><option value="">Изберете при разделяне</option>{profiles.filter((item) => item.role === 'MULLION' && item.status !== 'ARCHIVED').map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><button className="primary" disabled={!dimensionsValid || !product.frameProfileId || product.frameCreated} onClick={() => setTop({ frameCreated: true })}>{product.frameCreated ? 'Външната каса е създадена' : 'Създай външна каса'}</button><button onClick={undo} disabled={!history.past.length}>Отмени</button><button onClick={redo} disabled={!history.future.length}>Повтори</button></div>
  const toolbar = <><div className="custom-workspace-controls"><div className="view-switch" role="group" aria-label="Изглед на нестандартното изделие"><button type="button" aria-pressed={view === '2D'} onClick={() => setView('2D')}>2D чертеж</button><button type="button" aria-pressed={view === '3D'} disabled={product.status !== 'VERIFIED'} title={product.status !== 'VERIFIED' ? '3D прегледът е достъпен след човешка проверка.' : undefined} onClick={() => setView('3D')}>3D преглед</button><button type="button" aria-pressed={view === 'SPLIT'} disabled={product.status !== 'VERIFIED'} title={product.status !== 'VERIFIED' ? 'Разделеният 3D преглед е достъпен след човешка проверка.' : undefined} onClick={() => setView('SPLIT')}>Разделен изглед</button></div><DimensionControls value={dimensionVisibility} onChange={setDimensionVisibility}/></div>{view !== '3D' && <div className="custom-canvas-controls"><button onClick={() => setZoom((value) => Math.min(1.8, value + .15))}>Увеличи</button><button onClick={() => setZoom((value) => Math.max(.55, value - .15))}>Намали</button><button onClick={() => setZoom(1)}>Побери / нулирай</button><button onClick={() => setLargePreview((value) => !value)}>{largePreview ? 'Редактор' : 'Преглед на изделието'}</button></div>}</>
  const viewport = <>{view !== '2D' && (
      <Product3DPreview
        buildScene={build3DScene}
        selectedId={selectedSummaryId}
        nominalLengths={nominalLengths}
        annotations={annotations}
        dimensionVisibility={dimensionVisibility}
        depth={conceptualDepth}
        onDepth={setConceptualDepth}
        onSelect={setSelectedSummaryId}
        onOpenComponent={(id) => {
          const component = components.find((item) => item.id === id)
          if (component) onOpenComponent(component)
        }}
      />
    )}{view !== '3D' && <div className="custom-canvas"><div className="custom-drawing-scroll"><div style={{ width: `${zoom * 100}%` }}><CustomProductDrawing product={product} selectedFieldId={selectedFieldId} onSelectField={setSelectedFieldId} large={largePreview} annotations={annotations} dimensionVisibility={dimensionVisibility}/></div></div><p className="dimension-legend">Размерите са проектни/геометрични. Производствените отнемания и допуски не са приложени.</p><div className="current-assignments">Активни: каса {activeProfiles.FRAME ?? '—'} · крило {activeProfiles.SASH ?? '—'} · делител {activeProfiles.MULLION ?? '—'}</div></div>}</>
  const properties = view !== '3D' ? <SelectedFieldPanel node={selectedNode} fieldWidth={selectedProjection?.rect.width ?? 0} fieldHeight={selectedProjection?.rect.height ?? 0} profiles={profiles} errors={validation.fieldErrors[selectedFieldId] ?? []} frameReady={frameReady} defaultSashProfileId={activeProfiles.SASH} onSplit={changeSplit} onLeaf={(patch: Partial<CustomLeafNode>) => replaceGeometry(updateGeometryNode(product.geometry, selectedFieldId, (node) => node.kind === 'LEAF' ? { ...node, ...patch } : node))} onRemoveSplit={() => { if (!selectedNode || selectedNode.kind !== 'SPLIT' || !frameReady) return; if (geometryHasNestedSplit(selectedNode) && !window.confirm('Разделянето съдържа вложена геометрия. Да бъде ли премахната?')) return; const parentId = selectedNode.id.replace(/^split-/, ''); replaceGeometry(removeSplit(product.geometry, selectedNode.id)); setSelectedFieldId(parentId) }}/> : undefined
  const status = <>{validation.errors.length > 0 && <div className="custom-validation inline-errors" role="alert"><b>Черновата изисква корекции:</b><ul>{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<section className="custom-component-list-region" aria-labelledby="custom-component-list-title"><div className="custom-component-list-heading"><strong id="custom-component-list-title">Компоненти <span>({components.length})</span></strong><button type="button" aria-expanded={componentsVisible} aria-controls="custom-component-list-content" onClick={() => setComponentsVisible((visible) => !visible)}>{componentsVisible ? 'Скрий компонентите' : 'Покажи компонентите'}</button></div><div id="custom-component-list-content" className="custom-component-list-content" hidden={!componentsVisible}><CustomProductSummary components={components} selectedId={selectedSummaryId} onSelect={setSelectedSummaryId} onOpen={(component) => { setSelectedSummaryId(component.id); onOpenComponent(component) }}/></div></section><footer className="custom-designer-footer"><div><p className="custom-production-warning">Номиналната дължина не е производствен размер. Формулите за сглобка и отнемане предстоят за потвърждение.</p><label><input type="checkbox" checked={reviewChecked} onChange={(event) => setReviewChecked(event.target.checked)}/> Проверих размерите, профилите, разделянето и отваряемостта.</label><small>VERIFIED означава проверена от човек симулация, не технологично или машинно одобрение.</small></div><div><button onClick={() => exportCustomProduct(product, profiles, components, validation)}>Експортирай custom simulation JSON</button><button className="primary" disabled={!validation.valid || !reviewChecked} onClick={verify}>Потвърди след човешка проверка</button></div></footer></>
  return <div className="preview-overlay custom-designer-overlay"><DrawingWorkspaceShell labelId="custom-designer-title" className="custom-designer" header={header} progress={progress} settings={settings} toolbar={toolbar} viewport={viewport} properties={properties} status={status}/></div>
}
