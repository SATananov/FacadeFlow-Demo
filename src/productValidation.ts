import type { ProductParameters, ProductValidationResult } from './productTypes'

const positive = (value: number) => Number.isFinite(value) && value > 0

export function validateProduct(product: ProductParameters): ProductValidationResult {
  const errors: string[] = []
  if (!positive(product.width)) errors.push('Ширината на изделието трябва да е положително крайно число.')
  if (!positive(product.height)) errors.push('Височината на изделието трябва да е положително крайно число.')
  if (!positive(product.frameFaceWidth)) errors.push('Ширината на рамковия профил трябва да е положително крайно число.')
  if (positive(product.width) && positive(product.frameFaceWidth) && product.width <= product.frameFaceWidth * 2) errors.push('Рамковият профил не оставя възможен вътрешен отвор по ширина.')
  if (positive(product.height) && positive(product.frameFaceWidth) && product.height <= product.frameFaceWidth * 2) errors.push('Рамковият профил не оставя възможен вътрешен отвор по височина.')
  if (product.type === 'double') {
    if (!positive(product.mullionWidth)) errors.push('Ширината на централния делител трябва да е положително крайно число.')
    const innerWidth = product.width - product.frameFaceWidth * 2
    if (positive(innerWidth) && positive(product.mullionWidth) && product.mullionWidth >= innerWidth) errors.push('Централният делител не оставя възможни вътрешни отвори.')
  }
  return { valid: errors.length === 0, errors }
}
