import type { ProductParameters, ProductTemplate } from '../productTypes'
import { TemplateDiagram } from './TemplateDiagram'

interface Props {
  product: ProductParameters
  template: ProductTemplate
  errors: string[]
  onChange: (product: ProductParameters) => void
  onPreview: () => void
  onChooseTemplate: () => void
}

export function ProductSection({ product, template, errors, onChange, onPreview, onChooseTemplate }: Props) {
  const field = (key: keyof ProductParameters, value: string) => onChange({
    ...product,
    [key]: key === 'width' || key === 'height' || key === 'frameFaceWidth' || key === 'mullionWidth' ? Number(value) : value,
  } as ProductParameters)

  return <section className="product-section" aria-labelledby="product-section-title">
    <div className="subsection-heading"><h3 id="product-section-title">Изделие</h3><span>Phase 02A</span></div>
    <div className="selected-template-compact"><TemplateDiagram template={template} compact/><div><b><span>{template.displayNumber}</span> {template.name}</b><small>{template.description}</small></div></div>
    <button type="button" className="choose-template-button" onClick={onChooseTemplate}>Избери схема на изделието</button>
    <div className="field-grid"><label>Обща ширина <span>mm</span><input type="number" min="0.01" value={product.width} onChange={(event) => field('width', event.target.value)} /></label><label>Обща височина <span>mm</span><input type="number" min="0.01" value={product.height} onChange={(event) => field('height', event.target.value)} /></label><label>Лице рамка <span>mm</span><input type="number" min="0.01" value={product.frameFaceWidth} onChange={(event) => field('frameFaceWidth', event.target.value)} /></label>{template.dividers.length > 0 && <label>Ширина делители <span>mm</span><input type="number" min="0.01" value={product.mullionWidth} onChange={(event) => field('mullionWidth', event.target.value)} /></label>}</div>
    {template.fields.some((item) => item.state === 'opening') && <p className="template-opening-note">Посоката на символа е демонстрационна. Изгледът отвътре/отвън и страната на пантите предстоят за потвърждение от технолог.</p>}
    {errors.length > 0 && <div id="product-errors" className="inline-errors product-errors" role="alert"><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <button type="button" className="product-preview-button" aria-describedby={errors.length ? 'product-errors' : undefined} onClick={onPreview}>Визуализирай изделието</button>
    <p className="concept-note">Схемата представя конструктивна концепция, а не производствено одобрен проект.</p>
  </section>
}
