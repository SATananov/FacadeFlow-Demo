import type { CustomGeometryNode, CustomLeafNode, GeometryRect, SplitOrientation } from './customGeometryTypes'

export const PROVISIONAL_MIN_FIELD_MM = 100
export const initialGeometry = (): CustomLeafNode => ({ kind: 'LEAF', id: 'field-root', fieldType: 'FIXED' })

export function updateGeometryNode(root: CustomGeometryNode, id: string, updater: (node: CustomGeometryNode) => CustomGeometryNode): CustomGeometryNode {
  if (root.id === id) return updater(root)
  if (root.kind === 'LEAF') return root
  return { ...root, first: updateGeometryNode(root.first, id, updater), second: updateGeometryNode(root.second, id, updater) }
}

export function findGeometryNode(root: CustomGeometryNode, id: string): CustomGeometryNode | undefined {
  if (root.id === id) return root
  if (root.kind === 'LEAF') return undefined
  return findGeometryNode(root.first, id) ?? findGeometryNode(root.second, id)
}

export function splitField(root: CustomGeometryNode, id: string, orientation: SplitOrientation, position: number): CustomGeometryNode {
  return updateGeometryNode(root, id, (node) => node.kind === 'LEAF' ? { kind: 'SPLIT', id: `split-${id}`, orientation, position, first: { ...node, id: `${id}.1` }, second: { ...node, id: `${id}.2` } } : node)
}

export function removeSplit(root: CustomGeometryNode, id: string): CustomGeometryNode {
  return updateGeometryNode(root, id, (node) => node.kind === 'SPLIT' ? { kind: 'LEAF', id: id.replace(/^split-/, ''), fieldType: 'FIXED' } : node)
}

export function projectGeometry(root: CustomGeometryNode, bounds: GeometryRect): Array<{ node: CustomGeometryNode; rect: GeometryRect }> {
  const items = [{ node: root, rect: bounds }]
  if (root.kind === 'LEAF') return items
  const first = root.orientation === 'VERTICAL' ? { ...bounds, width: root.position } : { ...bounds, height: root.position }
  const second = root.orientation === 'VERTICAL' ? { ...bounds, x: bounds.x + root.position, width: bounds.width - root.position } : { ...bounds, y: bounds.y + root.position, height: bounds.height - root.position }
  return [...items, ...projectGeometry(root.first, first), ...projectGeometry(root.second, second)]
}

export function geometryHasNestedSplit(node: CustomGeometryNode): boolean { return node.kind === 'SPLIT' && (node.first.kind === 'SPLIT' || node.second.kind === 'SPLIT') }

