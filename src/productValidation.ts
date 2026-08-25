import type { ProductParameters, ProductValidationResult } from './productTypes'
import { getProductTemplate } from './productTemplates'

const positive = (value: number) => Number.isFinite(value) && value > 0

export function validateProduct(product: ProductParameters): ProductValidationResult {
  const errors: string[] = []
  if (!positive(product.width)) errors.push('Ширината на изделието трябва да е положително крайно число.')
  if (!positive(product.height)) errors.push('Височината на изделието трябва да е положително крайно число.')
  if (!positive(product.frameFaceWidth)) errors.push('Ширината на рамковия профил трябва да е положително крайно число.')
  if (positive(product.width) && positive(product.frameFaceWidth) && product.width <= product.frameFaceWidth * 2) errors.push('Рамковият профил не оставя възможен вътрешен отвор по ширина.')
  if (positive(product.height) && positive(product.frameFaceWidth) && product.height <= product.frameFaceWidth * 2) errors.push('Рамковият профил не оставя възможен вътрешен отвор по височина.')
  const template = getProductTemplate(product.templateId)
  if (template.dividers.length > 0) {
    if (!positive(product.mullionWidth)) errors.push('Ширината на централния делител трябва да е положително крайно число.')
    const innerWidth = product.width - product.frameFaceWidth * 2
    const innerHeight = product.height - product.frameFaceWidth * 2
    if (template.dividers.some((divider) => divider.orientation === 'vertical') && positive(innerWidth) && positive(product.mullionWidth) && product.mullionWidth >= innerWidth) errors.push('Вертикалният делител не оставя възможни вътрешни отвори.')
    if (template.dividers.some((divider) => divider.orientation === 'horizontal') && positive(innerHeight) && positive(product.mullionWidth) && product.mullionWidth >= innerHeight) errors.push('Хоризонталният делител не оставя възможни вътрешни отвори.')
  }
  return { valid: errors.length === 0, errors }
}
