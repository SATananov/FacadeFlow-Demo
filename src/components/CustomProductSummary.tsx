import type { CustomComponent } from '../customComponentGeneration'

interface Props { components: CustomComponent[]; selectedId: string | null; onSelect: (id: string) => void; onOpen: (component: CustomComponent) => void }
export function CustomProductSummary({ components, selectedId, onSelect, onOpen }: Props) {
  return <section className="custom-summary"><h3>Симулационен компонентен списък</h3><div className="component-table-wrap"><table><thead><tr><th>ID</th><th>Роля</th><th>Профил</th><th>Номинална демонстрационна дължина</th><th>Източник</th><th></th></tr></thead><tbody>{components.map((item) => <tr key={item.id} className={selectedId === item.id ? 'selected-component-row' : ''}><td>{item.id}</td><td>{item.role}</td><td>{item.profileCode}</td><td>{Math.round(item.nominalLength * 100) / 100} mm · PROVISIONAL</td><td>{item.sourcePath}</td><td><button onFocus={() => onSelect(item.id)} onClick={() => onOpen(item)}>Отвори профила</button></td></tr>)}</tbody></table></div><p className="custom-production-warning">Номиналната дължина не е производствен размер. Формулите за сглобка и отнемане предстоят за потвърждение.</p></section>
}

