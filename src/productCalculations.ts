import type { ProductComponent, ProductParameters, ProductTemplate, TemplateField } from './productTypes'
import { getProductTemplate } from './productTemplates'

export function calculateProductComponents(product: ProductParameters, profileCode: string): ProductComponent[] {
  if (!Number.isFinite(product.width) || product.width <= 0 || !Number.isFinite(product.height) || product.height <= 0) return []
  const template = getProductTemplate(product.templateId)
  const innerHeight = product.height - product.frameFaceWidth * 2
  const innerWidth = product.width - product.frameFaceWidth * 2
  const components: ProductComponent[] = []
  const add = (id: string, role: string, nominalLength: number, orientation: 'horizontal' | 'vertical', angle = 45, field?: TemplateField) => components.push({ id, number: components.length + 1, role, profileCode, nominalLength, quantity: 1, suggestedLeftAngle: angle, suggestedRightAngle: angle, orientation, sourceProductType: template.category, sourceTemplateId: template.id, label: `${role} — ${id}`, openingDirection: field?.openingDirection, openingNotation: field?.openingNotation, directionConfirmed: field?.directionConfirmed, confirmedOpeningNotation: field?.confirmedOpeningNotation })
  add('FRAME-TOP-01', 'Горен профил на рамката', product.width, 'horizontal')
  add('FRAME-BOTTOM-01', 'Долен профил на рамката', product.width, 'horizontal')
  add('FRAME-LEFT-01', 'Ляв профил на рамката', product.height, 'vertical')
  add('FRAME-RIGHT-01', 'Десен профил на рамката', product.height, 'vertical')
  template.dividers.forEach((divider, index) => {
    const length = divider.orientation === 'vertical' ? innerHeight * Math.abs(divider.y2 - divider.y1) : innerWidth * Math.abs(divider.x2 - divider.x1)
    const role = divider.id === 'MULLION-CENTER-01' ? 'Централен вертикален делител' : `${divider.orientation === 'vertical' ? 'Вертикален' : 'Хоризонтален'} делител ${index + 1}`
    add(divider.id, role, length, divider.orientation, 90)
  })
  template.fields.filter((field) => field.state !== 'fixed').forEach((field) => {
    const sashWidth = innerWidth * field.width
    const sashHeight = innerHeight * field.height
    const prefix = fieldComponentPrefix(template, field)
    add(`${prefix}-TOP-01`, `Горен профил на поле ${field.id}`, sashWidth, 'horizontal', 45, field)
    add(`${prefix}-BOTTOM-01`, `Долен профил на поле ${field.id}`, sashWidth, 'horizontal', 45, field)
    add(`${prefix}-LEFT-01`, `Ляв профил на поле ${field.id}`, sashHeight, 'vertical', 45, field)
    add(`${prefix}-RIGHT-01`, `Десен профил на поле ${field.id}`, sashHeight, 'vertical', 45, field)
  })
  return components
}

export function fieldComponentPrefix(template: ProductTemplate, field: TemplateField): string {
  if (field.state === 'sliding') return `SLIDING-PANEL-${field.componentKey}`
  if (template.libraryCategory === 'BALCONY_DOORS' || template.libraryCategory === 'SINGLE_DOORS' || template.libraryCategory === 'DOUBLE_DOORS') return `DOOR-LEAF-${field.componentKey}`
  return `SASH-${field.componentKey}`
}

export function productGeometrySignature(product: ProductParameters): string {
  return [product.productCategory, product.templateId, product.width, product.height, product.frameFaceWidth, product.mullionWidth].join('|')
}

export function affectedComponentIds(previous: ProductComponent[], next: ProductComponent[], idsWithOperations: string[]): string[] {
  const nextById = new Map(next.map((component) => [component.id, component]))
  return idsWithOperations.filter((id) => {
    const before = previous.find((component) => component.id === id)
    const after = nextById.get(id)
    return !before || !after || before.nominalLength !== after.nominalLength || before.orientation !== after.orientation || before.role !== after.role
  })
}
