import type { CombinedAnalysisJob } from './combinedAnalysisTypes'
export function combinedWarnings(job: Pick<CombinedAnalysisJob, 'schemeRankings' | 'candidates' | 'geometryFeatures'>): string[] {
  const warnings: string[] = []
  const widths = job.candidates.filter((item) => item.type === 'OVERALL_WIDTH'), heights = job.candidates.filter((item) => item.type === 'OVERALL_HEIGHT')
  if (widths.length > 1) warnings.push('Има конкуриращи се предложения за обща ширина.')
  if (heights.length > 1) warnings.push('Има конкуриращи се предложения за обща височина.')
  if ((job.schemeRankings[0]?.similarity ?? 0) - (job.schemeRankings[1]?.similarity ?? 0) < 8) warnings.push('Схемното съвпадение е двусмислено.')
  const width = Number(widths[0]?.normalizedValue), height = Number(heights[0]?.normalizedValue)
  if (Number.isFinite(width) && Number.isFinite(height) && Math.abs(width / height - job.geometryFeatures.aspectRatio) > .65) warnings.push('Съотношението на предложените размери се различава от видимата геометрия.')
  return warnings
}
