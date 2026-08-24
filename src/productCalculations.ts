import type { ProductComponent, ProductParameters } from './productTypes'

export function calculateProductComponents(product: ProductParameters, profileCode: string): ProductComponent[] {
  const innerHeight = product.height - product.frameFaceWidth * 2
  const components: ProductComponent[] = [
    { number: 1, role: 'Горен профил', profileCode, nominalLength: product.width, quantity: 1, suggestedAngles: '45° / 45° (примерни)' },
    { number: 2, role: 'Долен профил', profileCode, nominalLength: product.width, quantity: 1, suggestedAngles: '45° / 45° (примерни)' },
    { number: 3, role: 'Ляв профил', profileCode, nominalLength: product.height, quantity: 1, suggestedAngles: '45° / 45° (примерни)' },
    { number: 4, role: 'Десен профил', profileCode, nominalLength: product.height, quantity: 1, suggestedAngles: '45° / 45° (примерни)' },
  ]
  if (product.type === 'double') components.push({ number: 5, role: 'Централен делител', profileCode, nominalLength: innerHeight, quantity: 1, suggestedAngles: '90° / 90° (примерни)' })
  return components
}
