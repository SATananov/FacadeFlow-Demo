import type { OpeningNotation, ProductTemplate, TemplateField } from './productTypes'

const fixed = (id: string, componentKey: string, x: number, y: number, width: number, height: number): TemplateField => ({ id, componentKey, x, y, width, height, state: 'fixed', openingNotation: 'FIXED' })
const opening = (id: string, componentKey: string, x: number, y: number, width: number, height: number, openingDirection: 'left' | 'right'): TemplateField => {
  const openingNotation: OpeningNotation = openingDirection === 'left' ? 'SIDE_TRIANGLE_LEFT' : 'SIDE_TRIANGLE_RIGHT'
  return { id, componentKey, x, y, width, height, state: 'opening', openingNotation, openingDirection }
}

export const productTemplates: ProductTemplate[] = [
  { id: 'WINDOW-01', displayNumber: '01', name: 'Фиксиран прозорец', description: 'Едно неподвижно остъклено поле.', category: 'fixed', fields: [fixed('FIELD-01', 'FIXED', 0, 0, 1, 1)], dividers: [], simulationOnly: true },
  { id: 'WINDOW-02', displayNumber: '02', name: 'Еднокрил прозорец — ляво отваряне', description: 'Едно отваряемо крило с лява посока.', category: 'single', fields: [opening('FIELD-01', 'SINGLE', 0, 0, 1, 1, 'left')], dividers: [], simulationOnly: true },
  { id: 'WINDOW-03', displayNumber: '03', name: 'Еднокрил прозорец — дясно отваряне', description: 'Едно отваряемо крило с дясна посока.', category: 'single', fields: [opening('FIELD-01', 'SINGLE', 0, 0, 1, 1, 'right')], dividers: [], simulationOnly: true },
  { id: 'WINDOW-04', displayNumber: '04', name: 'Двукрил прозорец', description: 'Две отваряеми полета с централен делител.', category: 'double', fields: [opening('FIELD-LEFT', 'LEFT', 0, 0, .5, 1, 'left'), opening('FIELD-RIGHT', 'RIGHT', .5, 0, .5, 1, 'right')], dividers: [{ id: 'MULLION-CENTER-01', orientation: 'vertical', x1: .5, y1: 0, x2: .5, y2: 1 }], simulationOnly: true },
  { id: 'WINDOW-05', displayNumber: '05', name: 'Фиксирано поле + отваряемо дясно крило', description: 'Ляво фиксирано и дясно отваряемо поле.', category: 'mixed', fields: [fixed('FIELD-LEFT', 'FIXED-LEFT', 0, 0, .5, 1), opening('FIELD-RIGHT', 'RIGHT', .5, 0, .5, 1, 'right')], dividers: [{ id: 'MULLION-CENTER-01', orientation: 'vertical', x1: .5, y1: 0, x2: .5, y2: 1 }], simulationOnly: true },
  { id: 'WINDOW-06', displayNumber: '06', name: 'Отваряемо ляво крило + фиксирано поле', description: 'Ляво отваряемо и дясно фиксирано поле.', category: 'mixed', fields: [opening('FIELD-LEFT', 'LEFT', 0, 0, .5, 1, 'left'), fixed('FIELD-RIGHT', 'FIXED-RIGHT', .5, 0, .5, 1)], dividers: [{ id: 'MULLION-CENTER-01', orientation: 'vertical', x1: .5, y1: 0, x2: .5, y2: 1 }], simulationOnly: true },
  { id: 'WINDOW-07', displayNumber: '07', name: 'Трикрил прозорец', description: 'Отваряеми крайни крила и фиксиран център.', category: 'triple', fields: [opening('FIELD-LEFT', 'LEFT', 0, 0, 1/3, 1, 'left'), fixed('FIELD-CENTER', 'FIXED-CENTER', 1/3, 0, 1/3, 1), opening('FIELD-RIGHT', 'RIGHT', 2/3, 0, 1/3, 1, 'right')], dividers: [{ id: 'DIVIDER-VERTICAL-01', orientation: 'vertical', x1: 1/3, y1: 0, x2: 1/3, y2: 1 }, { id: 'DIVIDER-VERTICAL-02', orientation: 'vertical', x1: 2/3, y1: 0, x2: 2/3, y2: 1 }], simulationOnly: true },
  { id: 'WINDOW-08', displayNumber: '08', name: 'Двукрил прозорец с горно фиксирано поле', description: 'Горно фиксирано поле и две долни крила.', category: 'double', fields: [fixed('FIELD-TOP', 'FIXED-TOP', 0, 0, 1, .3), opening('FIELD-LOWER-LEFT', 'LOWER-LEFT', 0, .3, .5, .7, 'left'), opening('FIELD-LOWER-RIGHT', 'LOWER-RIGHT', .5, .3, .5, .7, 'right')], dividers: [{ id: 'TRANSOM-TOP-01', orientation: 'horizontal', x1: 0, y1: .3, x2: 1, y2: .3 }, { id: 'MULLION-LOWER-CENTER-01', orientation: 'vertical', x1: .5, y1: .3, x2: .5, y2: 1 }], simulationOnly: true },
  { id: 'WINDOW-09', displayNumber: '09', name: 'Четириполен прозорец', description: 'Два реда и две колони с демонстрационни полета.', category: 'four-field', fields: [fixed('FIELD-TOP-LEFT', 'FIXED-TOP-LEFT', 0, 0, .5, .5), opening('FIELD-TOP-RIGHT', 'TOP-RIGHT', .5, 0, .5, .5, 'right'), opening('FIELD-BOTTOM-LEFT', 'BOTTOM-LEFT', 0, .5, .5, .5, 'left'), fixed('FIELD-BOTTOM-RIGHT', 'FIXED-BOTTOM-RIGHT', .5, .5, .5, .5)], dividers: [{ id: 'DIVIDER-HORIZONTAL-01', orientation: 'horizontal', x1: 0, y1: .5, x2: 1, y2: .5 }, { id: 'DIVIDER-VERTICAL-01', orientation: 'vertical', x1: .5, y1: 0, x2: .5, y2: 1 }], simulationOnly: true },
]

export function getProductTemplate(templateId: string): ProductTemplate {
  return productTemplates.find((template) => template.id === templateId) ?? productTemplates[0]!
}
