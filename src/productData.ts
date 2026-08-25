import type { ProductParameters } from './productTypes'

export const defaultProduct: ProductParameters = {
  templateId: 'WINDOW-01',
  type: 'fixed',
  width: 1400,
  height: 1200,
  frameFaceWidth: 60,
  mullionWidth: 60,
  openingDirection: 'left',
}

export const productTypeLabels = {
  fixed: 'Фиксиран прозорец',
  single: 'Еднокрил прозорец',
  double: 'Двукрил прозорец',
  mixed: 'Комбиниран прозорец',
  triple: 'Трикрил прозорец',
  'four-field': 'Четириполен прозорец',
} as const
