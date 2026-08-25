import { calculateProductComponents, fieldComponentPrefix } from './productCalculations'
import type { ProductParameters } from './productTypes'
import { getProductTemplate } from './productTemplates'
import { barNode, CONCEPTUAL_GLASS_DEPTH_MM, createScene } from './threeDSceneBuilder'
import type { Component3DNode, Product3DScene } from './threeDTypes'
import { templateToOrderedModel } from './structuredProductWorkflow'

export function templateProductTo3DScene(product: ProductParameters, profileCode: string, conceptualDepthMm: number, verifiedImport = false): Product3DScene {
  const orderedModel = templateToOrderedModel(product)
  const template = getProductTemplate(product.templateId), components = calculateProductComponents(product, profileCode), byId = new Map(components.map((item) => [item.id, item]))
  if (!orderedModel.frame.exists) throw new Error('Шаблонът изисква валидни общи размери преди структуриране.')
  const face = product.frameFaceWidth, innerWidth = product.width - face * 2, innerHeight = product.height - face * 2, sashFace = face * .55
  const nodes: Component3DNode[] = [barNode('FRAME-TOP-01', 'FRAME', 'frame-root', profileCode, product.width, face, conceptualDepthMm, 0, product.height / 2 - face / 2), barNode('FRAME-BOTTOM-01', 'FRAME', 'frame-root', profileCode, product.width, face, conceptualDepthMm, 0, -product.height / 2 + face / 2), barNode('FRAME-LEFT-01', 'FRAME', 'frame-root', profileCode, face, product.height, conceptualDepthMm, -product.width / 2 + face / 2, 0), barNode('FRAME-RIGHT-01', 'FRAME', 'frame-root', profileCode, face, product.height, conceptualDepthMm, product.width / 2 - face / 2, 0)]
  template.dividers.forEach((divider) => { const x1 = -innerWidth / 2 + divider.x1 * innerWidth, x2 = -innerWidth / 2 + divider.x2 * innerWidth, y1 = innerHeight / 2 - divider.y1 * innerHeight, y2 = innerHeight / 2 - divider.y2 * innerHeight; nodes.push(divider.orientation === 'vertical' ? barNode(divider.id, 'DIVIDER', divider.id, profileCode, product.mullionWidth, Math.abs(y2 - y1), conceptualDepthMm * .9, x1, (y1 + y2) / 2) : barNode(divider.id, 'DIVIDER', divider.id, profileCode, Math.abs(x2 - x1), product.mullionWidth * .55, conceptualDepthMm * .9, (x1 + x2) / 2, y1)) })
  template.fields.forEach((field) => {
    const width = field.width * innerWidth, height = field.height * innerHeight
    const cx = -innerWidth / 2 + field.x * innerWidth + width / 2, cy = innerHeight / 2 - field.y * innerHeight - height / 2
    const lowerDivider = template.dividers.find((item) => item.orientation === 'horizontal' && item.x1 <= field.x && item.x2 >= field.x + field.width && item.y1 > field.y && item.y1 < field.y + field.height)
    if (lowerDivider) {
      const upperFraction = (lowerDivider.y1 - field.y) / field.height, upperHeight = height * upperFraction, lowerHeight = height - upperHeight
      nodes.push(barNode(`GLAZING-${field.id}`, 'GLAZING', field.id, undefined, Math.max(1, width - face * .25), Math.max(1, upperHeight - face * .15), CONCEPTUAL_GLASS_DEPTH_MM, cx, cy + (height - upperHeight) / 2, -conceptualDepthMm * .12))
      nodes.push(barNode(`PANEL-${field.id}`, 'PANEL', field.id, undefined, Math.max(1, width - face * .25), Math.max(1, lowerHeight - face * .15), CONCEPTUAL_GLASS_DEPTH_MM * 1.4, cx, cy - (height - lowerHeight) / 2, -conceptualDepthMm * .1))
    } else nodes.push(barNode(`GLAZING-${field.id}`, 'GLAZING', field.id, undefined, Math.max(1, width - face * .25), Math.max(1, height - face * .25), CONCEPTUAL_GLASS_DEPTH_MM, cx, cy, -conceptualDepthMm * .12))
    if (field.state === 'fixed') return
    const prefix = fieldComponentPrefix(template, field), group = `OPENING-${field.id}`, code = byId.get(`${prefix}-TOP-01`)?.profileCode
    const bars = [barNode(`${prefix}-TOP-01`, 'SASH', field.id, code, width, sashFace, conceptualDepthMm * .75, cx, cy + height / 2 - sashFace / 2), barNode(`${prefix}-BOTTOM-01`, 'SASH', field.id, code, width, sashFace, conceptualDepthMm * .75, cx, cy - height / 2 + sashFace / 2), barNode(`${prefix}-LEFT-01`, 'SASH', field.id, code, sashFace, height, conceptualDepthMm * .75, cx - width / 2 + sashFace / 2, cy), barNode(`${prefix}-RIGHT-01`, 'SASH', field.id, code, sashFace, height, conceptualDepthMm * .75, cx + width / 2 - sashFace / 2, cy)]
    bars.forEach((item) => nodes.push({ ...item, openingGroupId: group, openingDirection: field.openingDirection, openingConfirmed: field.directionConfirmed }))
  })
  return createScene(`3d-${product.templateId}-${product.width}x${product.height}`, verifiedImport ? 'VERIFIED_IMPORT' : 'TEMPLATE', product.templateId, product.width, product.height, conceptualDepthMm, nodes)
}
