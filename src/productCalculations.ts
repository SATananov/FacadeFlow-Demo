import type { ProductComponent, ProductParameters } from './productTypes'
import { getProductTemplate } from './productTemplates'

export function calculateProductComponents(product: ProductParameters, profileCode: string): ProductComponent[] {
  const template = getProductTemplate(product.templateId)
  const innerHeight = product.height - product.frameFaceWidth * 2
  const innerWidth = product.width - product.frameFaceWidth * 2
  const components: ProductComponent[] = []
  const add = (id: string, role: string, nominalLength: number, orientation: 'horizontal' | 'vertical', angle = 45) => components.push({ id, number: components.length + 1, role, profileCode, nominalLength, quantity: 1, suggestedLeftAngle: angle, suggestedRightAngle: angle, orientation, sourceProductType: template.category, label: `${role} — ${id}` })
  add('FRAME-TOP-01', 'Горен профил на рамката', product.width, 'horizontal')
  add('FRAME-BOTTOM-01', 'Долен профил на рамката', product.width, 'horizontal')
  add('FRAME-LEFT-01', 'Ляв профил на рамката', product.height, 'vertical')
  add('FRAME-RIGHT-01', 'Десен профил на рамката', product.height, 'vertical')
  template.dividers.forEach((divider, index) => {
    const length = divider.orientation === 'vertical' ? innerHeight * Math.abs(divider.y2 - divider.y1) : innerWidth * Math.abs(divider.x2 - divider.x1)
    const role = divider.id === 'MULLION-CENTER-01' ? 'Централен вертикален делител' : `${divider.orientation === 'vertical' ? 'Вертикален' : 'Хоризонтален'} делител ${index + 1}`
    add(divider.id, role, length, divider.orientation, 90)
  })
  template.fields.filter((field) => field.state === 'opening').forEach((field) => {
    const sashWidth = innerWidth * field.width
    const sashHeight = innerHeight * field.height
    const prefix = `SASH-${field.componentKey}`
    add(`${prefix}-TOP-01`, `Горен профил на поле ${field.id}`, sashWidth, 'horizontal')
    add(`${prefix}-BOTTOM-01`, `Долен профил на поле ${field.id}`, sashWidth, 'horizontal')
    add(`${prefix}-LEFT-01`, `Ляв профил на поле ${field.id}`, sashHeight, 'vertical')
    add(`${prefix}-RIGHT-01`, `Десен профил на поле ${field.id}`, sashHeight, 'vertical')
  })
  return components
}

export function productGeometrySignature(product: ProductParameters): string {
  return [product.templateId, product.width, product.height, product.frameFaceWidth, product.mullionWidth].join('|')
}

export function affectedComponentIds(previous: ProductComponent[], next: ProductComponent[], idsWithOperations: string[]): string[] {
  const nextById = new Map(next.map((component) => [component.id, component]))
  return idsWithOperations.filter((id) => {
    const before = previous.find((component) => component.id === id)
    const after = nextById.get(id)
    return !before || !after || before.nominalLength !== after.nominalLength || before.orientation !== after.orientation || before.role !== after.role
  })
}
