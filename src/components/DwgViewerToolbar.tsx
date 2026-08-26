import type { DwgLayout } from '../dwgViewerTypes'

interface Props { dark: boolean; showText: boolean; approximateText: boolean; layouts: DwgLayout[]; selectedLayout: string; onFit: () => void; onReset: () => void; onDark: () => void; onText: () => void; onApproximateText: () => void; onLayout: (id: string) => void }
export function DwgViewerToolbar(props: Props) {
  return <div className="dwg-toolbar" role="toolbar" aria-label="Инструменти за DWG преглед">
    <button type="button" onClick={props.onFit}>Покажи целия чертеж</button><button type="button" onClick={props.onReset}>Нулирай изгледа</button>
    <button type="button" aria-pressed={props.dark} onClick={props.onDark}>{props.dark ? 'Светъл фон' : 'Тъмен фон'}</button>
    <button type="button" aria-pressed={props.showText} onClick={props.onText}>{props.showText ? 'Скрий текст' : 'Покажи текст'}</button>
    <label className="dwg-approximate-toggle"><input type="checkbox" checked={props.approximateText} onChange={props.onApproximateText}/>Подреди текстовете визуално</label>
    {props.approximateText && <span className="dwg-approximate-badge">Приблизителен изглед</span>}
    <label>Пространство<select aria-describedby="dwg-layout-status" value={props.selectedLayout} onChange={(event) => props.onLayout(event.target.value)}>{props.layouts.map((layout) => <option key={layout.id} value={layout.id} disabled={!layout.renderable}>{layout.name}{layout.renderable ? '' : ' — не се поддържа от текущия decoder'}</option>)}</select></label>
  </div>
}
