export const FACADEFLOW_OFFER_MODULE_PREVIEW_MAX_HEIGHT_PX = 760

export function calculateFacadeFlowOfferModulePreviewMaxWidthPx(
  frameWidthMm: number | null | undefined,
  frameHeightMm: number | null | undefined,
  maxHeightPx = FACADEFLOW_OFFER_MODULE_PREVIEW_MAX_HEIGHT_PX,
): number | null {
  if (typeof frameWidthMm !== 'number' || !Number.isFinite(frameWidthMm) || frameWidthMm <= 0) return null
  if (typeof frameHeightMm !== 'number' || !Number.isFinite(frameHeightMm) || frameHeightMm <= 0) return null
  if (!Number.isFinite(maxHeightPx) || maxHeightPx <= 0) return null

  return Math.max(1, Math.round(maxHeightPx * frameWidthMm / frameHeightMm))
}
