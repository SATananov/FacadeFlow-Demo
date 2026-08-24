import type { ProductParameters } from './productTypes'

export const defaultProduct: ProductParameters = {
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
} as const
