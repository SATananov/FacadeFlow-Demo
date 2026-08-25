import { useEffect, useRef, useState } from 'react'
import type { ProductTemplate, TemplateCategory } from '../productTypes'
import { productTemplates, templateCategoryLabels } from '../productTemplates'
import { TemplateDiagram } from './TemplateDiagram'
import { OpeningLegend } from './OpeningLegend'

interface Props { selectedTemplateId: string; onSelect: (template: ProductTemplate) => void; onClose: () => void }

export function ProductTemplatePicker({ selectedTemplateId, onSelect, onClose }: Props) {
  const modal = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [category, setCategory] = useState<TemplateCategory | 'ALL'>('ALL')
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButton.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const items = modal.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
      if (!items?.length) return
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus() }
  }, [onClose])
  const categories = Object.keys(templateCategoryLabels) as TemplateCategory[]
  return <div className="preview-overlay template-picker-overlay" role="presentation"><section ref={modal} className="template-picker-modal" role="dialog" aria-modal="true" aria-labelledby="template-picker-title" aria-describedby="template-picker-note"><div className="template-picker-sticky"><div className="preview-header"><div><span className="preview-badge">СИМУЛАЦИЯ</span><h2 id="template-picker-title">Избери референтна схема</h2><p id="template-picker-note">Референтни демонстрационни схеми — окончателната технологична класификация предстои.</p></div><button ref={closeButton} type="button" className="preview-close" aria-label="Затвори библиотеката" onClick={onClose}>×</button></div><OpeningLegend/><div className="category-filter" role="group" aria-label="Филтър по категория"><button type="button" aria-pressed={category === 'ALL'} onClick={() => setCategory('ALL')}>Всички</button>{categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{templateCategoryLabels[item]}</button>)}</div></div><div className="template-catalogue">{categories.filter((item) => category === 'ALL' || category === item).map((item) => <section key={item} aria-labelledby={`category-${item}`}><h3 id={`category-${item}`}>{templateCategoryLabels[item]}</h3><div className="template-grid">{productTemplates.filter((template) => template.libraryCategory === item).map((template) => { const selected = template.id === selectedTemplateId; return <button type="button" key={template.id} className={`template-card ${selected ? 'selected' : ''}`} aria-label={`${template.displayNumber} — ${template.name}. ${template.description}`} aria-pressed={selected} onClick={() => onSelect(template)}><span className="template-number">{template.displayNumber}</span><TemplateDiagram template={template}/><span className="template-name">{template.name}</span><span className="template-description">{template.description}</span><span className="selected-template-state">{selected ? 'Избрана схема' : 'Избери схема'}</span></button>})}</div></section>)}</div><div className="template-picker-safety"><b>Посоката на символа е демонстрационна. Изгледът отвътре/отвън и страната на пантите предстоят за потвърждение от технолог.</b><br/>Референтна демонстрационна схема — изисква потвърждение от технолог.</div></section></div>
}
