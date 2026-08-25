import { productTypeLabels } from '../productData'
import type { ProductComponent } from '../productTypes'

interface Props { component: ProductComponent; onBackToProduct: () => void; onStandalone: () => void }

export function SelectedComponentContext({ component, onBackToProduct, onStandalone }: Props) {
  return <section className="component-context" aria-labelledby="component-context-title">
    <div><span className="context-badge">СИМУЛАЦИЯ</span><div><b id="component-context-title">Обработван детайл от изделие</b><p><strong>{component.id}</strong> · {component.role} · {productTypeLabels[component.sourceProductType]} · {component.nominalLength} mm · {component.orientation === 'horizontal' ? 'Хоризонтален детайл' : 'Вертикален детайл'}</p></div></div>
    <p className="coordinate-warning">Локална демонстрационна координатна система — не е машинна координатна система.</p>
    <div className="context-actions"><button type="button" onClick={onBackToProduct}>Назад към изделието</button><button type="button" onClick={onStandalone}>Самостоятелен профил</button></div>
  </section>
}
