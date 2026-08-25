import type { CustomComponent } from '../customComponentGeneration'

interface Props { component: CustomComponent; onBack: () => void; onStandalone: () => void }
export function SelectedCustomComponentContext({ component, onBack, onStandalone }: Props) {
  return <section className="component-context" aria-labelledby="custom-component-context-title"><div><span className="context-badge">СИМУЛАЦИЯ</span><div><b id="custom-component-context-title">Детайл от нестандартно изделие</b><p><strong>{component.id}</strong> · {component.role} · {component.profileCode} · {component.nominalLength} mm · {component.calculationStatus}</p></div></div><p className="coordinate-warning">Номинална демонстрационна дължина — не е производствен или машинен размер.</p><div className="context-actions"><button onClick={onBack}>Назад към конструктора</button><button onClick={onStandalone}>Самостоятелен профил</button></div></section>
}

