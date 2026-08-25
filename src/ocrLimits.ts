export const ocrLimits = {
  maximumCropPixelArea: 4_000_000,
  maximumConcurrentJobs: 1,
  maximumRetainedJobs: 10,
  maximumTextLength: 10_000,
  minimumDimension: .1,
  maximumDimension: 100_000,
  lowConfidenceThreshold: 70,
} as const
