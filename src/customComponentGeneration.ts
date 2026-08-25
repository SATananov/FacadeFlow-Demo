import type { CatalogueProfile } from './profileCatalogueTypes'
import type { CustomGeometryNode, CustomProduct, GeometryRect } from './customGeometryTypes'

export interface CustomComponent {
  id: string
  role: 'FRAME' | 'MULLION' | 'SASH'
  label: string
  profileId: string
  profileCode: string
  nominalLength: number
  sourcePath: string
  orientation: 'horizontal' | 'vertical'
  calculationStatus: 'PROVISIONAL'
  requiresExpertFormula: true
}

const profileCode = (profiles: CatalogueProfile[], id?: string) => profiles.find((item) => item.id === id)?.code ?? 'НЕИЗБРАН'

function nestedComponents(node: CustomGeometryNode, bounds: GeometryRect, product: CustomProduct, profiles: CatalogueProfile[]): CustomComponent[] {
  if (node.kind === 'LEAF') {
    if (node.fieldType !== 'OPENING_SASH') return []
    const base = `SASH-${node.id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`
    const common = { role: 'SASH' as const, profileId: node.sashProfileId ?? '', profileCode: profileCode(profiles, node.sashProfileId), sourcePath: node.id, calculationStatus: 'PROVISIONAL' as const, requiresExpertFormula: true as const }
    return [
      { ...common, id: `${base}-TOP`, label: 'Горен профил на крило', nominalLength: bounds.width, orientation: 'horizontal' },
      { ...common, id: `${base}-RIGHT`, label: 'Десен профил на крило', nominalLength: bounds.height, orientation: 'vertical' },
      { ...common, id: `${base}-BOTTOM`, label: 'Долен профил на крило', nominalLength: bounds.width, orientation: 'horizontal' },
      { ...common, id: `${base}-LEFT`, label: 'Ляв профил на крило', nominalLength: bounds.height, orientation: 'vertical' },
    ]
  }
  const firstBounds = node.orientation === 'VERTICAL' ? { ...bounds, width: node.position } : { ...bounds, height: node.position }
  const secondBounds = node.orientation === 'VERTICAL' ? { ...bounds, x: bounds.x + node.position, width: bounds.width - node.position } : { ...bounds, y: bounds.y + node.position, height: bounds.height - node.position }
  const divider: CustomComponent = { id: `MULLION-${node.orientation}-${node.id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`, role: 'MULLION', label: node.orientation === 'VERTICAL' ? 'Вертикален делител' : 'Хоризонтален делител', profileId: product.mullionProfileId ?? '', profileCode: profileCode(profiles, product.mullionProfileId), nominalLength: node.orientation === 'VERTICAL' ? bounds.height : bounds.width, sourcePath: node.id, orientation: node.orientation === 'VERTICAL' ? 'vertical' : 'horizontal', calculationStatus: 'PROVISIONAL', requiresExpertFormula: true }
  return [divider, ...nestedComponents(node.first, firstBounds, product, profiles), ...nestedComponents(node.second, secondBounds, product, profiles)]
}

export function generateCustomComponents(product: CustomProduct, profiles: CatalogueProfile[]): CustomComponent[] {
  const common = { role: 'FRAME' as const, profileId: product.frameProfileId, profileCode: profileCode(profiles, product.frameProfileId), sourcePath: 'frame-root', calculationStatus: 'PROVISIONAL' as const, requiresExpertFormula: true as const }
  return [
    { ...common, id: 'FRAME-TOP-01', label: 'Горен профил', nominalLength: product.width, orientation: 'horizontal' },
    { ...common, id: 'FRAME-RIGHT-01', label: 'Десен профил', nominalLength: product.height, orientation: 'vertical' },
    { ...common, id: 'FRAME-BOTTOM-01', label: 'Долен профил', nominalLength: product.width, orientation: 'horizontal' },
    { ...common, id: 'FRAME-LEFT-01', label: 'Ляв профил', nominalLength: product.height, orientation: 'vertical' },
    ...nestedComponents(product.geometry, { x: 0, y: 0, width: product.width, height: product.height }, product, profiles),
  ]
}

export function changedCustomComponentIds(previous: CustomComponent[], next: CustomComponent[], withOperations: string[]): string[] {
  return withOperations.filter((id) => {
    const before = previous.find((item) => item.id === id), after = next.find((item) => item.id === id)
    return !before || !after || before.profileId !== after.profileId || before.nominalLength !== after.nominalLength || before.orientation !== after.orientation
  })
}
