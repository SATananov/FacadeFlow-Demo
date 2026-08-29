import type { ProductDimensionSource, ProductParameters, ProductTemplate } from './productTypes'

export interface LegacyTemplateSelectionTransaction {
  product: ProductParameters
  categoryChanged: boolean
  closePreview: true
  clearSelectedComponent: true
}

export function selectLegacyProductTemplate(product: ProductParameters, template: ProductTemplate): LegacyTemplateSelectionTransaction {
  const categoryChanged = product.productCategory !== template.productCategory
  const firstOpening = template.fields.find((field) => field.state === 'opening')
  return {
    product: {
      ...product,
      templateId: template.id,
      productCategory: template.productCategory,
      productName: template.name,
      type: template.category,
      width: categoryChanged ? 0 : product.width,
      height: categoryChanged ? 0 : product.height,
      dimensionSource: categoryChanged ? 'EMPTY' : product.dimensionSource,
      openingDirection: firstOpening?.openingDirection ?? 'left',
    },
    categoryChanged,
    closePreview: true,
    clearSelectedComponent: true,
  }
}

export function applyLegacyDemoDimensions(product: ProductParameters, template: ProductTemplate): ProductParameters {
  const source: ProductDimensionSource = product.productCategory === 'DOOR' ? 'DOOR_DEMO_PRESET' : product.productCategory === 'WINDOW' ? 'WINDOW_DEMO_PRESET' : 'COMBINED_DEMO_PRESET'
  return { ...product, width: template.recommendedWidth, height: template.recommendedHeight, dimensionSource: source }
}

export const hasValidLegacyProductDimensions = (product: ProductParameters): boolean => Number.isFinite(product.width) && product.width > 0 && Number.isFinite(product.height) && product.height > 0
export const hasUnusualLegacyDoorProportion = (product: ProductParameters): boolean => product.productCategory === 'DOOR' && hasValidLegacyProductDimensions(product) && product.width >= product.height
