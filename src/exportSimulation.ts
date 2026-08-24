import type { MachiningOperation, Orientation, Profile, ValidationResult } from './types'
interface ExportInput { project: string; profile: Profile; orientation: Orientation; operations: MachiningOperation[]; validation: ValidationResult }
export function exportSimulation(input: ExportInput): void {
  const payload = { schemaVersion: '1.0', simulationOnly: true, ...input, generatedAt: new Date().toISOString() }
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${input.project.trim().replace(/[^a-zA-Z0-9а-яА-Я_-]+/g, '-') || 'facadeflow'}.simulation.json`
  link.click()
  URL.revokeObjectURL(url)
}
