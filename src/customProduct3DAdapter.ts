import { generateCustomComponents } from './customComponentGeneration'
import { projectGeometry } from './customGeometryTree'
import type { CustomProduct } from './customGeometryTypes'
import type { CatalogueProfile } from './profileCatalogueTypes'
import { barNode, CONCEPTUAL_GLASS_DEPTH_MM, createScene } from './threeDSceneBuilder'
import type { Component3DNode, Product3DScene } from './threeDTypes'

export function customProductTo3DScene(product: CustomProduct, profiles: CatalogueProfile[], conceptualDepthMm: number): Product3DScene {
  const frameFace = Math.max(20, Math.min(product.width, product.height) * .045), dividerFace = frameFace * .7, sashFace = frameFace * .55
  const components = generateCustomComponents(product, profiles), byId = new Map(components.map((item) => [item.id, item]))
  const nodes: Component3DNode[] = [
    barNode('FRAME-TOP-01', 'FRAME', 'frame-root', byId.get('FRAME-TOP-01')?.profileCode, product.width, frameFace, conceptualDepthMm, 0, product.height / 2 - frameFace / 2),
    barNode('FRAME-RIGHT-01', 'FRAME', 'frame-root', byId.get('FRAME-RIGHT-01')?.profileCode, frameFace, product.height, conceptualDepthMm, product.width / 2 - frameFace / 2, 0),
    barNode('FRAME-BOTTOM-01', 'FRAME', 'frame-root', byId.get('FRAME-BOTTOM-01')?.profileCode, product.width, frameFace, conceptualDepthMm, 0, -product.height / 2 + frameFace / 2),
    barNode('FRAME-LEFT-01', 'FRAME', 'frame-root', byId.get('FRAME-LEFT-01')?.profileCode, frameFace, product.height, conceptualDepthMm, -product.width / 2 + frameFace / 2, 0),
  ]
  for (const { node, rect } of projectGeometry(product.geometry, { x: 0, y: 0, width: product.width, height: product.height })) {
    const cx = rect.x + rect.width / 2 - product.width / 2, cy = product.height / 2 - rect.y - rect.height / 2
    if (node.kind === 'SPLIT') {
      const id = `MULLION-${node.orientation}-${node.id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`, component = byId.get(id)
      nodes.push(node.orientation === 'VERTICAL' ? barNode(id, 'DIVIDER', node.id, component?.profileCode, dividerFace, rect.height, conceptualDepthMm * .9, rect.x + node.position - product.width / 2, cy) : barNode(id, 'DIVIDER', node.id, component?.profileCode, rect.width, dividerFace, conceptualDepthMm * .9, cx, product.height / 2 - rect.y - node.position))
      continue
    }
    nodes.push(barNode(`GLAZING-${node.id}`, node.fieldType === 'PLACEHOLDER' ? 'PLACEHOLDER' : 'GLAZING', node.id, undefined, Math.max(1, rect.width - frameFace), Math.max(1, rect.height - frameFace), CONCEPTUAL_GLASS_DEPTH_MM, cx, cy, -conceptualDepthMm * .12))
    if (node.fieldType !== 'OPENING_SASH') continue
    const prefix = `SASH-${node.id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`, group = `OPENING-${node.id}`, profileCode = byId.get(`${prefix}-TOP`)?.profileCode
    const sashNodes = [barNode(`${prefix}-TOP`, 'SASH', node.id, profileCode, rect.width - frameFace * .35, sashFace, conceptualDepthMm * .75, cx, cy + rect.height / 2 - sashFace), barNode(`${prefix}-BOTTOM`, 'SASH', node.id, profileCode, rect.width - frameFace * .35, sashFace, conceptualDepthMm * .75, cx, cy - rect.height / 2 + sashFace), barNode(`${prefix}-LEFT`, 'SASH', node.id, profileCode, sashFace, rect.height - frameFace * .35, conceptualDepthMm * .75, cx - rect.width / 2 + sashFace, cy), barNode(`${prefix}-RIGHT`, 'SASH', node.id, profileCode, sashFace, rect.height - frameFace * .35, conceptualDepthMm * .75, cx + rect.width / 2 - sashFace, cy)]
    sashNodes.forEach((item) => nodes.push({ ...item, openingGroupId: group, openingDirection: node.openingDirection, openingConfirmed: Boolean(node.openingDirection) }))
  }
  return createScene(`3d-${product.id}`, 'CUSTOM', product.name, product.width, product.height, conceptualDepthMm, nodes)
}
