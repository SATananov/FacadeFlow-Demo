import type { GeometryFeatures } from './combinedAnalysisTypes'

export async function extractGeometryFeatures(imageDataUrl: string): Promise<GeometryFeatures> {
  const sourceImage = new Image()
  sourceImage.src = imageDataUrl
  await sourceImage.decode()
  const sourceWidth = sourceImage.naturalWidth, sourceHeight = sourceImage.naturalHeight
  const width = 96, height = Math.max(32, Math.round(width * sourceHeight / sourceWidth)), canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) throw new Error('Локалният geometry canvas не е достъпен.')
  context.drawImage(sourceImage, 0, 0, width, height)
  const data = context.getImageData(0, 0, width, height).data, grey = new Float32Array(width * height)
  for (let index = 0; index < grey.length; index++) grey[index] = ((data[index * 4] ?? 0) + (data[index * 4 + 1] ?? 0) + (data[index * 4 + 2] ?? 0)) / 3
  let vertical = 0, horizontal = 0, diagonal = 0
  for (let y = 1; y < height; y++) for (let x = 1; x < width; x++) { const at = y * width + x; vertical += Math.abs((grey[at] ?? 0) - (grey[at - 1] ?? 0)); horizontal += Math.abs((grey[at] ?? 0) - (grey[at - width] ?? 0)); diagonal += Math.abs((grey[at] ?? 0) - (grey[at - width - 1] ?? 0)) }
  canvas.width = 0; canvas.height = 0
  const total = vertical + horizontal || 1
  sourceImage.src = ''
  return { aspectRatio: sourceWidth / sourceHeight, verticalSections: estimatePeaks(grey, width, height, true), horizontalDividers: Math.max(0, estimatePeaks(grey, width, height, false) - 2), edgeDensity: Math.min(1, total / (width * height * 120)), verticalEdgeShare: vertical / total, horizontalEdgeShare: horizontal / total, openingFields: diagonal / total > .42 ? 2 : diagonal / total > .28 ? 1 : 0 }
}

function estimatePeaks(grey: Float32Array, width: number, height: number, vertical: boolean): number {
  const length = vertical ? width : height, sums = new Array<number>(length).fill(0)
  for (let y = 1; y < height; y++) for (let x = 1; x < width; x++) { const at = y * width + x; sums[vertical ? x : y] += Math.abs((grey[at] ?? 0) - (grey[at - (vertical ? 1 : width)] ?? 0)) }
  const threshold = Math.max(...sums) * .58; let groups = 0, active = false
  for (const value of sums) { if (value >= threshold && !active) groups++; active = value >= threshold }
  return Math.max(1, groups - 1)
}
