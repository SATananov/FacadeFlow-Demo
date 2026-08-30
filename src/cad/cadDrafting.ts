import type { CustomGridStep, DrawingTransform, ModelCoordinates } from '../customDrawingCoordinates'

export interface CadRulerTick {
  valueMm: number
  major: boolean
}

export function getCadMajorGridStep(step: CustomGridStep): number {
  return step * 5
}

export function getCadRulerStep(step: CustomGridStep, transform: DrawingTransform, zoom: number): number {
  const minimumScreenSpacing = 46
  const safeZoom = Math.max(zoom, 0.1)
  const base = getCadMajorGridStep(step)
  const candidates = [base, base * 2, base * 5, base * 10, base * 20]
  return candidates.find((candidate) => candidate * transform.scale * safeZoom >= minimumScreenSpacing) ?? candidates[candidates.length - 1]
}

export function generateCadRulerTicks(lengthMm: number, labelStepMm: number): CadRulerTick[] {
  if (!Number.isFinite(lengthMm) || lengthMm <= 0 || !Number.isFinite(labelStepMm) || labelStepMm <= 0) return []
  const halfStep = labelStepMm / 2
  const ticks: CadRulerTick[] = []
  for (let value = 0; value <= lengthMm + 1e-9; value += halfStep) {
    const normalized = Math.min(value, lengthMm)
    const majorRatio = normalized / labelStepMm
    ticks.push({ valueMm: normalized, major: Math.abs(majorRatio - Math.round(majorRatio)) < 1e-9 })
    if (normalized === lengthMm) break
  }
  if (ticks.at(-1)?.valueMm !== lengthMm) ticks.push({ valueMm: lengthMm, major: true })
  return ticks
}

export function formatCadStatusCoordinates(point: ModelCoordinates | null): string {
  if (!point) return 'X: — · Y: —'
  return `X: ${Math.round(point.x)} mm · Y: ${Math.round(point.y)} mm`
}
