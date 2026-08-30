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
import { CUSTOM_GRID_STEPS, DEFAULT_CUSTOM_GRID_STEP, formatSnapReadout, snapModelPoint, type CustomGridStep, type ModelCoordinates } from '../customDrawingCoordinates'
import { appendCustomDrawingLine, createCustomDrawingLineLayer, findCustomDrawingLine, getCustomDrawingLineTranslation, removeCustomDrawingLine, translateCustomDrawingLine, updateCustomDrawingLine, updateCustomDrawingLineEndpoint, type CustomDrawingLineEndpoint } from '../customDrawingLines'
import { createDefaultCadDisplayState, type CadDisplayState, type CadTool } from '../cad/cadTypes'
import { CadStatusBar } from './CadStatusBar'
import { CadWorkbenchGridLayer } from './CadWorkbenchGridLayer'
import { CadWorkbenchGuideLayer } from './CadWorkbenchGuideLayer'
import { CadLinePropertiesPanel } from './CadLinePropertiesPanel'

interface Props { initial: CustomProduct; profiles: CatalogueProfile[]; activeProfiles: ActiveProfileSelection; selectedComponentId: string | null; onCommit: (previous: CustomProduct, next: CustomProduct) => boolean; onOpenComponent: (component: CustomComponent) => void; onClose: () => void }

export function CustomProductDesigner({ initial, profiles, activeProfiles, selectedComponentId, onCommit, onOpenComponent, onClose }: Props) {
  const [history, setHistory] = useState(() => createHistory(initial)), [selectedFieldId, setSelectedFieldId] = useState('field-root'), [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(selectedComponentId), [reviewChecked, setReviewChecked] = useState(false), [largePreview, setLargePreview] = useState(false), [zoom, setZoom] = useState(1), [view, setView] = useState<'2D' | '3D' | 'SPLIT'>('2D'), [conceptualDepth, setConceptualDepth] = useState(DEFAULT_CONCEPTUAL_DEPTH_MM), [dimensionVisibility, setDimensionVisibility] = useState(defaultDimensionVisibility), [componentsVisible, setComponentsVisible] = useState(false), [gridVisible, setGridVisible] = useState(true), [gridStep, setGridStep] = useState<CustomGridStep>(DEFAULT_CUSTOM_GRID_STEP), [cursorCoordinates, setCursorCoordinates] = useState<ModelCoordinates | null>(null), [snappingEnabled, setSnappingEnabled] = useState(true), [lineHistory, setLineHistory] = useState(() => createHistory(createCustomDrawingLineLayer())), [lineToolActive, setLineToolActive] = useState(false), [lineStartPoint, setLineStartPoint] = useState<ModelCoordinates | null>(null), [selectedDrawingLineId, setSelectedDrawingLineId] = useState<string | null>(null), [lineEndpointDrag, setLineEndpointDrag] = useState<{ lineId: string; endpoint: CustomDrawingLineEndpoint; point: ModelCoordinates } | null>(null), [lineBodyDrag, setLineBodyDrag] = useState<{ lineId: string; pointerStart: ModelCoordinates; delta: ModelCoordinates } | null>(null)
  const [cadDisplay, setCadDisplay] = useState(createDefaultCadDisplayState)
  const product = history.present, validation = useMemo(() => validateCustomProduct(product, profiles), [product, profiles]), components = useMemo(() => generateCustomComponents(product, profiles), [product, profiles])
  const workflow = useMemo(() => customWorkflowState(product), [product])
  const dimensionsValid = workflow.DIMENSIONS
  const frameReady = dimensionsValid && workflow.FRAME
  const currentStep = structuredWorkflowOrder.find((step) => !workflow[step]) ?? 'CONCEPTUAL_3D'
  const build3DScene = useCallback((depth: number) => customProductTo3DScene(product, profiles, depth), [product, profiles])
  const nominalLengths = useMemo(() => Object.fromEntries(components.map((component) => [component.id, component.nominalLength])), [components])
  const annotations = useMemo(() => calculateCustomDimensions(product, components, selectedSummaryId, conceptualDepth), [product, components, selectedSummaryId, conceptualDepth])
  const snapPoint = useMemo(() => cursorCoordinates ? snapModelPoint(cursorCoordinates, gridStep, snappingEnabled) : null, [cursorCoordinates, gridStep, snappingEnabled])
  const linePreviewPoint = useMemo(() => lineToolActive && lineStartPoint && cursorCoordinates ? snapModelPoint(cursorCoordinates, gridStep, snappingEnabled) : null, [lineToolActive, lineStartPoint, cursorCoordinates, gridStep, snappingEnabled])
  const displayCursorCoordinates = snappingEnabled && snapPoint ? snapPoint : cursorCoordinates
  const activeCadTool: CadTool = lineToolActive ? 'LINE' : 'SELECT'
  const selectedDrawingLine = useMemo(() => findCustomDrawingLine(lineHistory.present, selectedDrawingLineId), [lineHistory.present, selectedDrawingLineId])
  const setCadDisplayFlag = (key: keyof CadDisplayState, checked: boolean) => setCadDisplay((current) => ({ ...current, [key]: checked }))
  useEffect(() => { const fallback = () => setView('2D'); window.addEventListener('facadeflow-3d-unavailable', fallback); return () => window.removeEventListener('facadeflow-3d-unavailable', fallback) }, [])
  useEffect(() => { if (!lineToolActive) return; const cancel = (event: KeyboardEvent) => { if (event.key !== 'Escape') return; setLineStartPoint(null); setLineToolActive(false) }; window.addEventListener('keydown', cancel); return () => window.removeEventListener('keydown', cancel) }, [lineToolActive])
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
  const chooseLinePoint = (rawPoint: ModelCoordinates) => {
    if (!lineToolActive) return
    const point = snapModelPoint(rawPoint, gridStep, snappingEnabled)
    if (!lineStartPoint) { setLineStartPoint(point); return }
    setLineHistory((value) => { const next = appendCustomDrawingLine(value.present, lineStartPoint, point); return next === value.present ? value : pushHistory(value, next) })
    if (lineStartPoint.x !== point.x || lineStartPoint.y !== point.y) setLineStartPoint(null)
  }
  const toggleLineTool = () => { setLineStartPoint(null); setSelectedDrawingLineId(null); setLineEndpointDrag(null); setLineBodyDrag(null); setLineToolActive((active) => !active) }
  const undoLine = () => { setLineStartPoint(null); setSelectedDrawingLineId(null); setLineEndpointDrag(null); setLineBodyDrag(null); setLineHistory((value) => undoHistory(value)) }
  const redoLine = () => { setLineStartPoint(null); setSelectedDrawingLineId(null); setLineEndpointDrag(null); setLineBodyDrag(null); setLineHistory((value) => redoHistory(value)) }
  const updateSelectedDrawingLine = (start: ModelCoordinates, end: ModelCoordinates) => {
    if (!selectedDrawingLineId) return
    setLineHistory((value) => { const next = updateCustomDrawingLine(value.present, selectedDrawingLineId, start, end); return next === value.present ? value : pushHistory(value, next) })
  }
  const deleteSelectedDrawingLine = () => {
    if (!selectedDrawingLineId) return
    setLineHistory((value) => { const next = removeCustomDrawingLine(value.present, selectedDrawingLineId); return next === value.present ? value : pushHistory(value, next) })
    setSelectedDrawingLineId(null)
    setLineEndpointDrag(null)
    setLineBodyDrag(null)
  }
  const beginLineEndpointDrag = (lineId: string, endpoint: CustomDrawingLineEndpoint) => {
    const line = findCustomDrawingLine(lineHistory.present, lineId)
    if (!line || lineToolActive) return
    setSelectedDrawingLineId(lineId)
    setLineBodyDrag(null)
    setLineEndpointDrag({ lineId, endpoint, point: { ...line[endpoint] } })
  }
  const moveLineEndpointDrag = (lineId: string, endpoint: CustomDrawingLineEndpoint, rawPoint: ModelCoordinates) => {
    setLineEndpointDrag((current) => current?.lineId === lineId && current.endpoint === endpoint ? { ...current, point: snapModelPoint(rawPoint, gridStep, snappingEnabled) } : current)
  }
  const commitLineEndpointDrag = (lineId: string, endpoint: CustomDrawingLineEndpoint, rawPoint: ModelCoordinates) => {
    if (!lineEndpointDrag || lineEndpointDrag.lineId !== lineId || lineEndpointDrag.endpoint !== endpoint) return
    const point = snapModelPoint(rawPoint, gridStep, snappingEnabled)
    setLineHistory((value) => { const next = updateCustomDrawingLineEndpoint(value.present, lineId, endpoint, point); return next === value.present ? value : pushHistory(value, next) })
    setLineEndpointDrag(null)
  }
  const beginLineBodyDrag = (lineId: string, pointerStart: ModelCoordinates) => {
    const line = findCustomDrawingLine(lineHistory.present, lineId)
    if (!line || lineToolActive || selectedDrawingLineId !== lineId) return
    setLineEndpointDrag(null)
    setLineBodyDrag({ lineId, pointerStart: { ...pointerStart }, delta: { x: 0, y: 0 } })
  }
  const moveLineBodyDrag = (lineId: string, rawPoint: ModelCoordinates) => {
    setLineBodyDrag((current) => current?.lineId === lineId ? { ...current, delta: getCustomDrawingLineTranslation(current.pointerStart, rawPoint, gridStep, snappingEnabled) } : current)
  }
  const commitLineBodyDrag = (lineId: string, rawPoint: ModelCoordinates) => {
    if (!lineBodyDrag || lineBodyDrag.lineId !== lineId) return
    const delta = getCustomDrawingLineTranslation(lineBodyDrag.pointerStart, rawPoint, gridStep, snappingEnabled)
    setLineHistory((value) => { const next = translateCustomDrawingLine(value.present, lineId, delta); return next === value.present ? value : pushHistory(value, next) })
    setLineBodyDrag(null)
  }
  const lineToolStatus = lineToolActive ? (lineStartPoint ? 'Изберете крайна точка · Esc отказва' : 'Изберете начална точка · Esc отказва') : lineEndpointDrag ? `Преместване ${lineEndpointDrag.lineId} · ${lineEndpointDrag.endpoint === 'start' ? 'начало' : 'край'} · Esc отказва` : lineBodyDrag ? `Преместване ${lineBodyDrag.lineId} · цяла линия · Esc отказва` : selectedDrawingLine ? `Избрана ${selectedDrawingLine.id}` : 'Линия: неактивна'
  useEffect(() => { if (lineEndpointDrag && selectedDrawingLineId !== lineEndpointDrag.lineId) setLineEndpointDrag(null) }, [lineEndpointDrag, selectedDrawingLineId])
  useEffect(() => { if (lineBodyDrag && selectedDrawingLineId !== lineBodyDrag.lineId) setLineBodyDrag(null) }, [lineBodyDrag, selectedDrawingLineId])
  useEffect(() => {
    if (lineToolActive || !selectedDrawingLineId) return
    const handleLineSelectionKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, select, textarea, [contenteditable=\"true\"]')) return
      if (event.key === 'Escape') {
        if (lineEndpointDrag) { setLineEndpointDrag(null); return }
        if (lineBodyDrag) { setLineBodyDrag(null); return }
        setSelectedDrawingLineId(null)
        return
      }
      if (lineEndpointDrag || lineBodyDrag) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      event.preventDefault()
      setLineHistory((value) => { const next = removeCustomDrawingLine(value.present, selectedDrawingLineId); return next === value.present ? value : pushHistory(value, next) })
      setSelectedDrawingLineId(null)
    }
    window.addEventListener('keydown', handleLineSelectionKeys)
    return () => window.removeEventListener('keydown', handleLineSelectionKeys)
  }, [lineToolActive, selectedDrawingLineId, lineEndpointDrag, lineBodyDrag])
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
  const toolbar = <div className="custom-workspace-controls">
    <div className="view-switch" role="group" aria-label="Изглед на нестандартното изделие">
      <button type="button" aria-pressed={view === '2D'} onClick={() => setView('2D')}>2D чертеж</button>
      <button type="button" aria-pressed={view === '3D'} disabled={product.status !== 'VERIFIED'} title={product.status !== 'VERIFIED' ? '3D прегледът е достъпен след човешка проверка.' : undefined} onClick={() => setView('3D')}>3D преглед</button>
      <button type="button" aria-pressed={view === 'SPLIT'} disabled={product.status !== 'VERIFIED'} title={product.status !== 'VERIFIED' ? 'Разделеният 3D преглед е достъпен след човешка проверка.' : undefined} onClick={() => setView('SPLIT')}>Разделен изглед</button>
    </div>
    {view !== '3D' && <div className="custom-line-tool-controls" role="group" aria-label="Инструмент линия">
      <button type="button" aria-pressed={!lineToolActive} onClick={() => { setLineStartPoint(null); setLineEndpointDrag(null); setLineBodyDrag(null); setLineToolActive(false) }}>Избор</button>
      <button type="button" aria-pressed={lineToolActive} onClick={toggleLineTool}>Линия</button>
      <button type="button" disabled={!lineHistory.past.length} onClick={undoLine}>Отмени линия</button>
      <button type="button" disabled={!lineHistory.future.length} onClick={redoLine}>Повтори линия</button>
      <span className="custom-line-tool-status" role="status">{lineToolStatus}</span>
    </div>}
    {view !== '3D' && <div className="custom-grid-controls" role="group" aria-label="Координатна мрежа и прихващане">
      <label className="custom-grid-toggle"><input type="checkbox" checked={gridVisible} onChange={(event) => setGridVisible(event.target.checked)}/> Мрежа</label>
      <label>Стъпка на мрежата <select value={gridStep} onChange={(event) => setGridStep(Number(event.target.value) as CustomGridStep)}>{CUSTOM_GRID_STEPS.map((step) => <option key={step} value={step}>{step} mm</option>)}</select></label>
      <label className="custom-snap-toggle"><input type="checkbox" checked={snappingEnabled} onChange={(event) => setSnappingEnabled(event.target.checked)}/> Прихващане</label>
      <span className="custom-snap-mode" aria-label="Режим на прихващане">GRID</span>
      <output className="custom-cursor-coordinates" aria-live="polite">{formatSnapReadout(cursorCoordinates, snapPoint, snappingEnabled)}</output>
    </div>}
    {view !== '3D' && <div className="custom-canvas-controls">
      <button onClick={() => setZoom((value) => Math.min(3, value + .25))}>Увеличи</button>
      <button onClick={() => setZoom((value) => Math.max(.5, value - .25))}>Намали</button>
      <button onClick={() => setZoom(1)}>Побери / нулирай</button>
      <button onClick={() => setLargePreview((value) => !value)}>{largePreview ? 'Редактор' : 'Преглед на изделието'}</button>
    </div>}
    {view !== '3D' && <div className="custom-cad-display-controls" role="group" aria-label="CAD помощни визуализации">
      <label><input type="checkbox" checked={cadDisplay.showMajorGrid} disabled={!gridVisible} onChange={(event) => setCadDisplayFlag('showMajorGrid', event.target.checked)}/> Главна мрежа</label>
      <label><input type="checkbox" checked={cadDisplay.showAxes} onChange={(event) => setCadDisplayFlag('showAxes', event.target.checked)}/> Оси X/Y</label>
      <label><input type="checkbox" checked={cadDisplay.showRulers} onChange={(event) => setCadDisplayFlag('showRulers', event.target.checked)}/> Линийки</label>
      <label><input type="checkbox" checked={cadDisplay.showCoordinates} onChange={(event) => setCadDisplayFlag('showCoordinates', event.target.checked)}/> Координати до курсора</label>
    </div>}
    <DimensionControls value={dimensionVisibility} onChange={setDimensionVisibility}/>
  </div>
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
    )}{view !== '3D' && <div className="custom-canvas">
      <div className="custom-drawing-scroll">
        <div className="custom-drawing-zoom" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <div className="custom-drawing-stage">
            <CadWorkbenchGridLayer
              productWidth={product.width}
              productHeight={product.height}
              gridVisible={gridVisible}
              gridStep={gridStep}
              showMajorGrid={cadDisplay.showMajorGrid}
            />
            <CustomProductDrawing
              product={product}
              selectedFieldId={selectedDrawingLine ? '' : selectedFieldId}
              onSelectField={setSelectedFieldId}
              onClearDrawingLineSelection={() => setSelectedDrawingLineId(null)}
              large={largePreview}
              annotations={annotations}
              dimensionVisibility={dimensionVisibility}
              snapPoint={snapPoint}
              snappingEnabled={snappingEnabled}
              zoom={zoom}
              drawingLines={lineHistory.present.lines}
              selectedDrawingLineId={selectedDrawingLineId}
              lineSelectionEnabled={!lineToolActive}
              onSelectDrawingLine={setSelectedDrawingLineId}
              lineEndpointEditingEnabled={!lineToolActive}
              lineEndpointDrag={lineEndpointDrag}
              onBeginLineEndpointDrag={beginLineEndpointDrag}
              onMoveLineEndpointDrag={moveLineEndpointDrag}
              onCommitLineEndpointDrag={commitLineEndpointDrag}
              onCancelLineEndpointDrag={() => setLineEndpointDrag(null)}
              lineBodyEditingEnabled={!lineToolActive}
              lineBodyDrag={lineBodyDrag}
              onBeginLineBodyDrag={beginLineBodyDrag}
              onMoveLineBodyDrag={moveLineBodyDrag}
              onCommitLineBodyDrag={commitLineBodyDrag}
              onCancelLineBodyDrag={() => setLineBodyDrag(null)}
              lineStartPoint={lineStartPoint}
              linePreviewPoint={linePreviewPoint}
              onCanvasPoint={chooseLinePoint}
              cursorCoordinates={displayCursorCoordinates}
              showCoordinates={cadDisplay.showCoordinates}
              onCursorCoordinates={(next) => setCursorCoordinates((current) => current?.x === next?.x && current?.y === next?.y ? current : next)}
            />
            <CadWorkbenchGuideLayer
              productWidth={product.width}
              productHeight={product.height}
              gridStep={gridStep}
              zoom={zoom}
              showAxes={cadDisplay.showAxes}
              showRulers={cadDisplay.showRulers}
            />
          </div>
        </div>
      </div>
      <CadStatusBar tool={activeCadTool} gridVisible={gridVisible} gridStep={gridStep} snappingEnabled={snappingEnabled} cursorCoordinates={displayCursorCoordinates} zoom={zoom}/>
      <p className="dimension-legend">Размерите са проектни/геометрични. Производствените отнемания и допуски не са приложени.</p>
      <div className="current-assignments">Активни: каса {activeProfiles.FRAME ?? '—'} · крило {activeProfiles.SASH ?? '—'} · делител {activeProfiles.MULLION ?? '—'}</div>
    </div>}</>
  const properties = view !== '3D' ? selectedDrawingLine ? <CadLinePropertiesPanel line={selectedDrawingLine} onUpdate={updateSelectedDrawingLine} onDelete={deleteSelectedDrawingLine} onClose={() => setSelectedDrawingLineId(null)}/> : <SelectedFieldPanel node={selectedNode} fieldWidth={selectedProjection?.rect.width ?? 0} fieldHeight={selectedProjection?.rect.height ?? 0} profiles={profiles} errors={validation.fieldErrors[selectedFieldId] ?? []} frameReady={frameReady} defaultSashProfileId={activeProfiles.SASH} onSplit={changeSplit} onLeaf={(patch: Partial<CustomLeafNode>) => replaceGeometry(updateGeometryNode(product.geometry, selectedFieldId, (node) => node.kind === 'LEAF' ? { ...node, ...patch } : node))} onRemoveSplit={() => { if (!selectedNode || selectedNode.kind !== 'SPLIT' || !frameReady) return; if (geometryHasNestedSplit(selectedNode) && !window.confirm('Разделянето съдържа вложена геометрия. Да бъде ли премахната?')) return; const parentId = selectedNode.id.replace(/^split-/, ''); replaceGeometry(removeSplit(product.geometry, selectedNode.id)); setSelectedFieldId(parentId) }}/> : undefined
  const status = <>{validation.errors.length > 0 && <div className="custom-validation inline-errors" role="alert"><b>Черновата изисква корекции:</b><ul>{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<section className="custom-component-list-region" aria-labelledby="custom-component-list-title"><div className="custom-component-list-heading"><strong id="custom-component-list-title">Компоненти <span>({components.length})</span></strong><button type="button" aria-expanded={componentsVisible} aria-controls="custom-component-list-content" onClick={() => setComponentsVisible((visible) => !visible)}>{componentsVisible ? 'Скрий компонентите' : 'Покажи компонентите'}</button></div><div id="custom-component-list-content" className="custom-component-list-content" hidden={!componentsVisible}><CustomProductSummary components={components} selectedId={selectedSummaryId} onSelect={setSelectedSummaryId} onOpen={(component) => { setSelectedSummaryId(component.id); onOpenComponent(component) }}/></div></section><footer className="custom-designer-footer"><div><p className="custom-production-warning">Номиналната дължина не е производствен размер. Формулите за сглобка и отнемане предстоят за потвърждение.</p><label><input type="checkbox" checked={reviewChecked} onChange={(event) => setReviewChecked(event.target.checked)}/> Проверих размерите, профилите, разделянето и отваряемостта.</label><small>VERIFIED означава проверена от човек симулация, не технологично или машинно одобрение.</small></div><div><button onClick={() => exportCustomProduct(product, profiles, components, validation)}>Експортирай custom simulation JSON</button><button className="primary" disabled={!validation.valid || !reviewChecked} onClick={verify}>Потвърди след човешка проверка</button></div></footer></>
  return <div className="preview-overlay custom-designer-overlay"><DrawingWorkspaceShell labelId="custom-designer-title" className="custom-designer" header={header} progress={progress} settings={settings} toolbar={toolbar} viewport={viewport} properties={properties} status={status}/></div>
}
