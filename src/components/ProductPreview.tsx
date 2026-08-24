import { useEffect, useRef } from 'react'
import { calculateProductComponents } from '../productCalculations'
import { productTypeLabels } from '../productData'
import type { ProductParameters } from '../productTypes'
import { ProductDrawing } from './ProductDrawing'

interface Props { product: ProductParameters; project: string; profileCode: string; profileSystem: string; onClose: () => void }

export function ProductPreview({ product, project, profileCode, profileSystem, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const modal = useRef<HTMLElement>(null)
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
  return <div className="preview-overlay" role="presentation"><section ref={modal} className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title" aria-describedby="preview-safety"><div className="preview-header"><div><span className="preview-badge">СИМУЛАЦИЯ</span><h2 id="preview-title">Визуализация на изделието</h2><p>{productTypeLabels[product.type]} · {profileSystem} · {project}</p></div><button ref={closeButton} type="button" className="preview-close" aria-label="Затвори визуализацията" onClick={onClose}>×</button></div>
    <div className="preview-content"><div className="product-drawing-wrap"><ProductDrawing product={product}/></div><section className="component-list" aria-labelledby="component-list-title"><h3 id="component-list-title">Симулационен компонентен списък</h3><div className="component-table-wrap"><table><thead><tr><th>№</th><th>Роля</th><th>Код</th><th>Номинална дължина</th><th>Бр.</th><th>Ъгли</th></tr></thead><tbody>{components.map((component) => <tr key={component.number}><td>{component.number}</td><td>{component.role}</td><td>{component.profileCode || 'Без код'}</td><td>{component.nominalLength} mm</td><td>{component.quantity}</td><td>{component.suggestedAngles}</td></tr>)}</tbody></table></div></section></div>
    <div className="preview-footer"><p id="preview-safety"><b>Демонстрационна геометрия — изисква проверка от технолог.</b><br/>Примерните дължини и ъгли не са одобрени производствени изчисления.</p><div><button type="button" className="print-button" onClick={() => window.print()}>Разпечатай визуализация</button><button type="button" className="secondary-button" onClick={onClose}>Затвори</button></div></div>
  </section></div>
}
