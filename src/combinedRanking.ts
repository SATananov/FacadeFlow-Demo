import type { GeometryFeatures, SchemeRanking } from './combinedAnalysisTypes'
import { productTemplates } from './productTemplates'
import { referenceStructureFeatures } from './combinedReferenceFeatures'

const closeness = (actual: number, expected: number, tolerance: number) => Math.max(0, 100 * (1 - Math.abs(actual - expected) / tolerance))
export function rankReferenceSchemes(features: GeometryFeatures): SchemeRanking[] {
  return productTemplates.map((template) => {
    const { verticalSections, horizontalDividers, openingFields, aspectRatio: expectedRatio } = referenceStructureFeatures(template)
    const scores = { aspectRatio: closeness(features.aspectRatio, expectedRatio, Math.max(1, expectedRatio)), verticalSections: closeness(features.verticalSections, verticalSections, 4), horizontalDividers: closeness(features.horizontalDividers, horizontalDividers, 3), edgeDistribution: closeness(features.verticalEdgeShare, verticalSections > 1 ? .58 : .5, .5), structure: closeness(features.edgeDensity, .35 + Math.min(.25, template.dividers.length * .04), .65), openingSymbols: features.openingFields ? closeness(features.openingFields, openingFields, 4) : 50 }
    const similarity = Math.round((scores.aspectRatio * .22 + scores.verticalSections * .24 + scores.horizontalDividers * .16 + scores.edgeDistribution * .12 + scores.structure * .16 + scores.openingSymbols * .1) * 10) / 10
    return { templateId: template.id, referenceNumber: template.displayNumber, title: template.name, category: template.category, similarity, scores, warnings: [] }
  }).sort((a, b) => b.similarity - a.similarity).slice(0, 3).map((item, index, all) => ({ ...item, warnings: index === 0 && all[1] && item.similarity - all[1].similarity < 8 ? ['Схемното съвпадение е двусмислено; сравнете водещите предложения.'] : [] }))
}
