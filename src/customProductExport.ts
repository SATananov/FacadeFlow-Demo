import type { CatalogueProfile } from './profileCatalogueTypes'
import type { CustomComponent } from './customComponentGeneration'
import type { CustomProduct } from './customGeometryTypes'
import type { CustomValidation } from './customGeometryValidation'
import { customToOrderedModel } from './structuredProductWorkflow'

export function exportCustomProduct(product: CustomProduct, profiles: CatalogueProfile[], components: CustomComponent[], validation: CustomValidation) {
  const usedIds = new Set([product.frameProfileId, product.mullionProfileId, ...components.map((item) => item.profileId)].filter(Boolean))
  const payload = { schemaVersion: '1.0', customProduct: true, simulationOnly: true, machineReady: false, productionLengthsApproved: false, requiresExpertFormula: true, conceptual3DAvailable: true, conceptualDepthMm: 70, conceptualOnly: true, productionGeometryApproved: false, dimensionAnnotationsAvailable: true, measurementMode: 'PROJECT_GEOMETRY', productionDeductionsApplied: false, manufacturingToleranceApplied: false, exactProfileSectionApplied: false, humanReviewStatus: product.status, orderedStructuredModel: customToOrderedModel(product), overallDimensions: { width: product.width, height: product.height }, geometry: product.geometry, profileSnapshots: profiles.filter((item) => usedIds.has(item.id)), components, validation, warning: 'Номиналната дължина не е производствен размер. Формулите за сглобка и отнемане предстоят за потвърждение.', generatedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), anchor = document.createElement('a')
  anchor.href = url; anchor.download = 'custom-window.simulation.json'; anchor.click(); URL.revokeObjectURL(url)
}
