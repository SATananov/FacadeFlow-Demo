import type { CapturedDrawingProduct, DrawingImportValidation, DrawingSourceMetadata } from './drawingImportTypes'

interface Input {
  source: DrawingSourceMetadata
  products: CapturedDrawingProduct[]
  validation: DrawingImportValidation
}

export function exportDrawingImportSimulation({ source, products, validation }: Input): void {
  const payload = {
    schemaVersion: '3.0',
    simulationOnly: true,
    machineReady: false,
    requiresHumanApproval: true,
    source,
    capturedProducts: products,
    reviewStatuses: products.map(({ id, status }) => ({ id, status })),
    validation,
    generatedAt: new Date().toISOString(),
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  const baseName = source.fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9а-яА-Я_-]+/g, '-') || 'drawing-import'
  link.download = `${baseName}.drawing-import.simulation.json`
  link.click()
  URL.revokeObjectURL(url)
}
