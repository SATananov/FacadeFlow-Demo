import { productTypeLabels } from '../productData'
import type { ProductParameters } from '../productTypes'

interface Props {
  product: ProductParameters
  errors: string[]
  onChange: (product: ProductParameters) => void
  onPreview: () => void
}

export function ProductSection({ product, errors, onChange, onPreview }: Props) {
  const field = (key: keyof ProductParameters, value: string) => onChange({
    ...product,
    [key]: key === 'width' || key === 'height' || key === 'frameFaceWidth' || key === 'mullionWidth' ? Number(value) : value,
  } as ProductParameters)

  return <section className="product-section" aria-labelledby="product-section-title">
    <div className="subsection-heading"><h3 id="product-section-title">Изделие</h3><span>Phase 02A</span></div>
    <label>Тип изделие<select value={product.type} onChange={(event) => field('type', event.target.value)}>{Object.entries(productTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <div className="field-grid"><label>Обща ширина <span>mm</span><input type="number" min="0.01" value={product.width} onChange={(event) => field('width', event.target.value)} /></label><label>Обща височина <span>mm</span><input type="number" min="0.01" value={product.height} onChange={(event) => field('height', event.target.value)} /></label><label>Лице рамка <span>mm</span><input type="number" min="0.01" value={product.frameFaceWidth} onChange={(event) => field('frameFaceWidth', event.target.value)} /></label>{product.type === 'double' && <label>Централен делител <span>mm</span><input type="number" min="0.01" value={product.mullionWidth} onChange={(event) => field('mullionWidth', event.target.value)} /></label>}</div>
    {product.type !== 'fixed' && <fieldset className="opening-direction"><legend>Посока на отваряне</legend><label className="radio"><input type="radio" name="product-opening" checked={product.openingDirection === 'left'} onChange={() => field('openingDirection', 'left')} /> Ляво</label><label className="radio"><input type="radio" name="product-opening" checked={product.openingDirection === 'right'} onChange={() => field('openingDirection', 'right')} /> Дясно</label></fieldset>}
    {errors.length > 0 && <div id="product-errors" className="inline-errors product-errors" role="alert"><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <button type="button" className="product-preview-button" aria-describedby={errors.length ? 'product-errors' : undefined} onClick={onPreview}>Визуализирай изделието</button>
  </section>
}
