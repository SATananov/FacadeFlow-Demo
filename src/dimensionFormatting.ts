import type { DimensionAnnotation } from './dimensionTypes'
export const formatDimensionValue = (value: number) => `${Math.round(value * 100) / 100} mm`
export const formatDimensionLabel = (annotation: DimensionAnnotation) => annotation.type === 'CONCEPTUAL_DEPTH' ? `Концептуална дълбочина: ${formatDimensionValue(annotation.value)}` : formatDimensionValue(annotation.value)
