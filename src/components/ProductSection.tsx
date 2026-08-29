import type { ProductParameters, ProductTemplate } from '../productTypes'
import { TemplateDiagram } from './TemplateDiagram'
import { ContextHelp } from './ContextHelp'
import { hasUnusualLegacyDoorProportion, hasValidLegacyProductDimensions } from '../legacyProductTransition'

interface Props {
  product: ProductParameters
  template: ProductTemplate
  errors: string[]
  onChange: (product: ProductParameters) => void
  onPreview: () => void
  onChooseTemplate: () => void
  onApplyRecommendedDimensions: () => void
}

export function ProductSection({ product, template, errors, onChange, onPreview, onChooseTemplate, onApplyRecommendedDimensions }: Props) {
  const field = (key: keyof ProductParameters, value: string) => onChange({
    ...product,
    [key]: key === 'width' || key === 'height' || key === 'frameFaceWidth' || key === 'mullionWidth' ? Number(value) : value,
    ...(key === 'width' || key === 'height' ? { dimensionSource: 'USER_ENTERED' as const } : {}),
  } as ProductParameters)
  const noun = product.productCategory === 'DOOR' ? 'вратата' : product.productCategory === 'WINDOW' ? 'прозореца' : 'изделието'
  const validDimensions = hasValidLegacyProductDimensions(product)

  return <section className="product-section" aria-labelledby="product-section-title">
    <div className="subsection-heading"><h3 id="product-section-title">Изделие</h3><span>Phase 02A</span></div>
    <div className="selected-template-compact" data-help-id="product-template"><TemplateDiagram template={template} compact/><div><b><span>{template.displayNumber}</span> {template.name} <ContextHelp helpId="template"/></b><small>{template.description}</small></div></div>
    <p><b>Избрана схема:</b> {template.name}<br/><b>Размери:</b> {validDimensions ? `${product.width} × ${product.height} mm` : 'Не са зададени'}</p>
    <button type="button" className="choose-template-button" onClick={onChooseTemplate}>Избери схема на {noun}</button>
    <button type="button" className="recommended-size-button" onClick={onApplyRecommendedDimensions}>Приложи примерни размери</button>
    <p className="concept-note">DEMO пример — не е производствено ограничение.</p>
    <div className="field-grid"><label>Обща ширина <span>mm</span><input type="number" min="0.01" value={product.width || ''} onChange={(event) => field('width', event.target.value)} /></label><label>Обща височина <span>mm</span><input type="number" min="0.01" value={product.height || ''} onChange={(event) => field('height', event.target.value)} /></label><label>Лице рамка <span>mm</span><input type="number" min="0.01" value={product.frameFaceWidth} onChange={(event) => field('frameFaceWidth', event.target.value)} /></label>{template.dividers.length > 0 && <label>Ширина делители <span>mm</span><input type="number" min="0.01" value={product.mullionWidth} onChange={(event) => field('mullionWidth', event.target.value)} /></label>}</div>
    {!validDimensions && <div className="product-empty-placeholder" role="status"><b>Няма визуализация на {noun}.</b><span>Въведете общи размери или приложете DEMO пример.</span></div>}
    {hasUnusualLegacyDoorProportion(product) && <p className="hybrid-dimension-warning">Необичайна пропорция за демонстрационна врата — проверете общите размери.</p>}
    {template.fields.some((item) => item.state === 'opening') && <p className="template-opening-note">Посоката на символа е демонстрационна. Изгледът отвътре/отвън и страната на пантите предстоят за потвърждение от технолог.</p>}
    {errors.length > 0 && <div id="product-errors" className="inline-errors product-errors" role="alert"><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <button type="button" disabled={!validDimensions} className="product-preview-button" data-help-id="product-visualization" aria-describedby={errors.length ? 'product-errors' : undefined} onClick={onPreview}>Визуализация на {noun}</button>
    <p className="concept-note">Референтна демонстрационна схема — изисква потвърждение от технолог.</p>
  </section>
}
