import type { DwgLayer } from '../dwgViewerTypes'

export function DwgLayersPanel({ layers, visible, onToggle }: { layers: DwgLayer[]; visible: ReadonlySet<string>; onToggle: (layer: string) => void }) {
  return <aside className="dwg-layers" aria-labelledby="dwg-layers-title"><h4 id="dwg-layers-title">Слоеве ({layers.length})</h4><div>{layers.map((layer) => <label key={layer.name}><input type="checkbox" checked={visible.has(layer.name)} onChange={() => onToggle(layer.name)}/><span title={layer.name}>{layer.name}</span><small>{layer.entityCount}</small></label>)}</div></aside>
}
