import type { DwgDrawableEntity, DwgLayer } from './dwgViewerTypes'

export function extractDwgLayers(entities: DwgDrawableEntity[], initiallyOff: ReadonlySet<string> = new Set()): DwgLayer[] {
  const counts = new Map<string, number>()
  for (const entity of entities) counts.set(entity.layer, (counts.get(entity.layer) ?? 0) + 1)
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([name, entityCount]) => ({ name, entityCount, initiallyVisible: !initiallyOff.has(name) }))
}

export const toggleDwgLayer = (visible: ReadonlySet<string>, layer: string) => {
  const next = new Set(visible)
  if (next.has(layer)) next.delete(layer); else next.add(layer)
  return next
}
