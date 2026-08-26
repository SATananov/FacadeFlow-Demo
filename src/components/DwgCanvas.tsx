import { useEffect, useMemo, useRef, useState } from 'react'
import { fitDwgView, zoomDwgView } from '../dwgBounds'
import { canvasPointToDwgWorld, DWG_SECTION_RULES, hitTestDwgSection, isDwgSectionClick } from '../dwgSectionDetection'
import { canvasPixelsToDwgLocal, dwgCanvasFont, layoutDwgText } from '../dwgTextLayout'
import { isDwgTextVisibleAtScale } from '../dwgTextNormalization'
import type { DwgDecodeResult, DwgSection, DwgViewState } from '../dwgViewerTypes'
import { resolveDwgTextDisplayMode, type DwgApproximateTextAssignment } from '../dwgVisualFieldDetection'

interface Props { drawing: DwgDecodeResult; visibleLayers: ReadonlySet<string>; showText: boolean; approximateText: boolean; approximateAssignments: ReadonlyMap<number, DwgApproximateTextAssignment>; dark: boolean; fitToken: number; resetToken: number; selectedSection: DwgSection | null; onSelectSection: (sectionId: string) => void; onBackToDrawing: () => void }
export function DwgCanvas({ drawing, visibleLayers, showText, approximateText, approximateAssignments, dark, fitToken, resetToken, selectedSection, onSelectSection, onBackToDrawing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null), hostRef = useRef<HTMLDivElement>(null), drag = useRef<{ x: number; y: number; view: DwgViewState; panning: boolean } | null>(null), suppressClick = useRef(false), handledResetToken = useRef(resetToken)
  const [size, setSize] = useState({ width: 0, height: 0 }), [view, setView] = useState<DwgViewState>({ scale: 1, offsetX: 0, offsetY: 0 })
  const activeBounds = selectedSection?.bounds ?? drawing.bounds
  useEffect(() => { const observer = new ResizeObserver(([entry]) => { if (entry) setSize({ width: Math.max(320, Math.round(entry.contentRect.width)), height: Math.max(360, Math.round(entry.contentRect.height)) }) }); if (hostRef.current) observer.observe(hostRef.current); return () => observer.disconnect() }, [])
  useEffect(() => {
    if (size.width === 0 || size.height === 0) return
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- external fit command intentionally updates canvas viewport
    setView(fitDwgView(activeBounds, size.width, size.height, selectedSection ? DWG_SECTION_RULES.fitPaddingPixels : 32))
  }, [activeBounds, fitToken, selectedSection, size])
  useEffect(() => {
    if (resetToken === handledResetToken.current || size.width === 0 || size.height === 0) return
    handledResetToken.current = resetToken
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- external reset command intentionally updates canvas viewport
    setView(fitDwgView(activeBounds, size.width, size.height, selectedSection ? DWG_SECTION_RULES.fitPaddingPixels : 32))
  }, [activeBounds, resetToken, selectedSection, size.width, size.height])
  const visibleEntities = useMemo(() => drawing.entities.map((entity, index) => ({ entity, index })).filter(({ entity }) => visibleLayers.has(entity.layer) && (showText || entity.type !== 'TEXT')), [drawing.entities, visibleLayers, showText])
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || size.width === 0 || size.height === 0) return
    const ratio = window.devicePixelRatio || 1; canvas.width = size.width * ratio; canvas.height = size.height * ratio; canvas.style.width = `${size.width}px`; canvas.style.height = `${size.height}px`
    const context = canvas.getContext('2d'); if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.fillStyle = dark ? '#111b20' : '#f6fafb'; context.fillRect(0, 0, size.width, size.height); context.strokeStyle = dark ? '#bce6e8' : '#163b45'; context.fillStyle = dark ? '#f0f7f7' : '#15353d'; context.lineWidth = 1
    const map = (x: number, y: number) => ({ x: x * view.scale + view.offsetX, y: -y * view.scale + view.offsetY })
    for (const { entity, index: entityIndex } of visibleEntities) {
      context.beginPath()
      if (entity.type === 'LINE') { const a = map(entity.start.x, entity.start.y), b = map(entity.end.x, entity.end.y); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke() }
      else if (entity.type === 'POLYLINE') { entity.points.forEach((point, index) => { const p = map(point.x, point.y); if (!index) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y) }); if (entity.closed) context.closePath(); context.stroke() }
      else if (entity.type === 'CIRCLE') { const center = map(entity.center.x, entity.center.y); context.arc(center.x, center.y, entity.radius * view.scale, 0, Math.PI * 2); context.stroke() }
      else if (entity.type === 'ARC') { const center = map(entity.center.x, entity.center.y); context.arc(center.x, center.y, entity.radius * view.scale, -entity.endAngle, -entity.startAngle); context.stroke() }
      else if (entity.type === 'ELLIPSE') { const center = map(entity.center.x, entity.center.y), major = Math.hypot(entity.major.x, entity.major.y) * view.scale, rotation = -Math.atan2(entity.major.y, entity.major.x); context.ellipse(center.x, center.y, major, major * entity.ratio, rotation, -entity.endAngle, -entity.startAngle); context.stroke() }
      else {
        if (!isDwgTextVisibleAtScale(entity.height, view.scale, showText)) continue
        const position = map(entity.position.x, entity.position.y), fontSize = Math.min(512, entity.height * view.scale), candidateAssignment = approximateAssignments.get(entityIndex), assignment = resolveDwgTextDisplayMode(approximateText, candidateAssignment) === 'APPROXIMATE_FIELD' ? candidateAssignment : undefined
        context.save()
        if (assignment) { const topLeft = map(assignment.innerBounds.minX, assignment.innerBounds.maxY), bottomRight = map(assignment.innerBounds.maxX, assignment.innerBounds.minY); context.beginPath(); context.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y); context.clip() }
        context.translate(position.x, position.y)
        context.rotate(-entity.rotation)
        const visualWidth = assignment ? assignment.innerBounds.maxX - assignment.innerBounds.minX : entity.referenceWidth
        const layout = layoutDwgText({ textKind: entity.textKind, displayText: entity.displayText, runs: entity.runs, referenceWidth: visualWidth, textHeight: entity.height, widthFactor: entity.widthFactor, attachmentPoint: entity.attachmentPoint, horizontalAlignment: entity.horizontalAlignment, verticalAlignment: entity.verticalAlignment, lineSpacingFactor: entity.lineSpacing, lineSpacingStyle: entity.lineSpacingStyle }, (text, run) => { context.font = dwgCanvasFont(fontSize * run.heightScale); return canvasPixelsToDwgLocal(context.measureText(text).width, view.scale, entity.widthFactor * run.widthScale) })
        context.textAlign = 'left'
        context.textBaseline = 'top'
        let localOffsetX = 0, localOffsetY = 0
        if (assignment) {
          const corners = [[layout.bounds.minX, layout.bounds.minY], [layout.bounds.maxX, layout.bounds.minY], [layout.bounds.minX, layout.bounds.maxY], [layout.bounds.maxX, layout.bounds.maxY]].map(([x, y]) => ({ x: position.x + (Math.cos(entity.rotation) * x + Math.sin(entity.rotation) * y) * view.scale, y: position.y + (-Math.sin(entity.rotation) * x + Math.cos(entity.rotation) * y) * view.scale }))
          const rendered = { minX: Math.min(...corners.map((point) => point.x)), maxX: Math.max(...corners.map((point) => point.x)), minY: Math.min(...corners.map((point) => point.y)), maxY: Math.max(...corners.map((point) => point.y)) }, topLeft = map(assignment.innerBounds.minX, assignment.innerBounds.maxY), bottomRight = map(assignment.innerBounds.maxX, assignment.innerBounds.minY)
          const screenX = rendered.minX < topLeft.x ? topLeft.x - rendered.minX : rendered.maxX > bottomRight.x ? bottomRight.x - rendered.maxX : 0, screenY = rendered.minY < topLeft.y ? topLeft.y - rendered.minY : rendered.maxY > bottomRight.y ? bottomRight.y - rendered.maxY : 0
          localOffsetX = (Math.cos(entity.rotation) * screenX - Math.sin(entity.rotation) * screenY) / view.scale; localOffsetY = (Math.sin(entity.rotation) * screenX + Math.cos(entity.rotation) * screenY) / view.scale
        }
        layout.lines.forEach((line) => line.runs.forEach((run) => { context.save(); context.translate((localOffsetX + run.x) * view.scale, (localOffsetY + layout.anchorOffsetY + line.y) * view.scale); context.scale(entity.widthFactor * run.widthScale, 1); context.font = dwgCanvasFont(fontSize * run.heightScale); context.fillText(run.text.slice(0, 4096), 0, 0); context.restore() }))
        context.restore()
      }
    }
    if (selectedSection) {
      const topLeft = map(selectedSection.bounds.minX, selectedSection.bounds.maxY), bottomRight = map(selectedSection.bounds.maxX, selectedSection.bounds.minY)
      context.save(); context.strokeStyle = '#008b8b'; context.lineWidth = 2; context.setLineDash([7, 5]); context.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y); context.restore()
    }
  }, [approximateAssignments, approximateText, dark, selectedSection, showText, size, view, visibleEntities])
  return <div ref={hostRef} className={`dwg-canvas-host ${dark ? 'dark' : ''}`}><canvas ref={canvasRef} aria-label="Локално визуализирана read-only DWG геометрия. Щракнете върху доказана секция, за да я фокусирате." title="Щракнете върху секция, за да я покажете на цял екран." tabIndex={0} onKeyDown={(event) => { if (event.key === 'Escape' && selectedSection) { event.preventDefault(); event.stopPropagation(); onBackToDrawing() } }} onWheel={(event) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setView((current) => zoomDwgView(current, event.deltaY < 0 ? 1.15 : 1 / 1.15, event.clientX - rect.left, event.clientY - rect.top)) }} onPointerDown={(event) => { suppressClick.current = false; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, view, panning: false } }} onPointerMove={(event) => { if (!drag.current) return; const current = drag.current; if (!current.panning && !isDwgSectionClick({ x: current.x, y: current.y }, { x: event.clientX, y: event.clientY })) { current.panning = true; suppressClick.current = true } if (current.panning) setView({ ...current.view, offsetX: current.view.offsetX + event.clientX - current.x, offsetY: current.view.offsetY + event.clientY - current.y }) }} onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); drag.current = null }} onPointerCancel={() => { suppressClick.current = true; drag.current = null }} onClick={(event) => { if (suppressClick.current) { suppressClick.current = false; return } const rect = event.currentTarget.getBoundingClientRect(), world = canvasPointToDwgWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, view), section = hitTestDwgSection(drawing.sections, world); if (section) onSelectSection(section.sectionId) }}/></div>
}
