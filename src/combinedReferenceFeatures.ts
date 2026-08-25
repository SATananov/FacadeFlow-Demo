import type { ProductTemplate } from './productTypes'
export function referenceStructureFeatures(template: ProductTemplate) {
  return {
    verticalSections: new Set(template.fields.map((field) => `${field.x}:${field.width}`)).size,
    horizontalDividers: template.dividers.filter((divider) => divider.orientation === 'horizontal').length,
    openingFields: template.fields.filter((field) => field.state === 'opening').length,
    aspectRatio: template.recommendedWidth / template.recommendedHeight,
  }
}
