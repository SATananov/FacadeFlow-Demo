import { useEffect, useRef } from 'react'
import { calculateProductComponents } from '../productCalculations'
import type { ProductComponent, ProductParameters } from '../productTypes'
import { getProductTemplate, templateCategoryLabels } from '../productTemplates'
import { ProductDrawing } from './ProductDrawing'
import { OpeningLegend } from './OpeningLegend'

interface Props { product: ProductParameters; project: string; profileCode: string; profileSystem: string; selectedComponentId: string | null; onSelectComponent: (componentId: string) => void; onOpenComponent: (component: ProductComponent) => void; onClose: () => void }

export function ProductPreview({ product, project, profileCode, profileSystem, selectedComponentId, onSelectComponent, onOpenComponent, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const modal = useRef<HTMLElement>(null)
  const template = getProductTemplate(product.templateId)
  const components = calculateProductComponents(product, profileCode)
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButton.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const focusable = modal.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); previouslyFocused?.focus() }
  }, [onClose])
  return <div className="preview-overlay" role="presentation"><section ref={modal} className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title" aria-describedby="preview-safety"><div className="preview-header"><div><span className="preview-badge">СИМУЛАЦИЯ</span><h2 id="preview-title">Визуализация на изделието</h2><p>{templateCategoryLabels[template.libraryCategory]} · Референтна схема {template.displayNumber} — {template.name} · {profileSystem} · {project}</p></div><button ref={closeButton} type="button" className="preview-close" aria-label="Затвори визуализацията" onClick={onClose}>×</button></div>
    <OpeningLegend/><div className="preview-content"><div className="product-drawing-wrap"><ProductDrawing product={product} template={template} selectedComponentId={selectedComponentId} onSelectComponent={onSelectComponent}/></div><section className="component-list" aria-labelledby="component-list-title"><h3 id="component-list-title">Симулационен компонентен списък</h3><div className="component-table-wrap"><table><thead><tr><th>№ / ID</th><th>Роля</th><th>Код</th><th>Номинална дължина</th><th>Бр.</th><th>Примерни ъгли Л/Д</th><th></th></tr></thead><tbody>{components.map((component) => { const selected = component.id === selectedComponentId; return <tr key={component.id} className={selected ? 'selected-component-row' : undefined} aria-selected={selected}><td><b>{component.number}</b><small>{component.id}</small></td><td>{component.role}</td><td>{component.profileCode || 'Без код'}</td><td>{component.nominalLength} mm</td><td>{component.quantity}</td><td>{component.suggestedLeftAngle}° / {component.suggestedRightAngle}°</td><td><button type="button" className="open-component-button" aria-pressed={selected} onFocus={() => onSelectComponent(component.id)} onClick={() => onOpenComponent(component)}>Отвори профила</button></td></tr> })}</tbody></table></div></section></div>
    <div className="preview-footer"><p id="preview-safety"><b>Референтна демонстрационна схема — изисква потвърждение от технолог.</b><br/>Посоката на символа е демонстрационна. Изгледът отвътре/отвън и страната на пантите предстоят за потвърждение от технолог.<br/>Плъзгащите стрелки не потвърждават обков или релсова конфигурация. Примерните дължини и ъгли не са одобрени производствени изчисления.</p><div><button type="button" className="print-button" onClick={() => window.print()}>Разпечатай визуализация</button><button type="button" className="secondary-button" onClick={onClose}>Затвори</button></div></div>
  </section></div>
}
