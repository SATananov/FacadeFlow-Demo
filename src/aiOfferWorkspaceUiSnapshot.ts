import type { FacadeFlowOfferCompletenessReviewRuntime } from './aiPromptOfferCompletenessReviewRuntime'

export interface FacadeFlowOfferWorkspaceUiSnapshot {
  moduleNumber: number
  widthMm: number | null
  heightMm: number | null
  quantity: number | null
  system: string | null
  finish: string | null
  glazing: string | null
  hardware: string | null
  frameSummary: string
  sashSummary: string
  dividerSummary: string
  openingSummary: string
  reviewStatus: 'INCOMPLETE' | 'READY_FOR_HUMAN_REVIEW' | 'HUMAN_CONFIRMED'
  completeChecks: number
  totalChecks: number
  unresolvedChecks: number
  visibleStateKey: string
}

export function buildFacadeFlowOfferWorkspaceUiSnapshot(
  runtime: FacadeFlowOfferCompletenessReviewRuntime,
  selectedModuleNumber: number | null,
): FacadeFlowOfferWorkspaceUiSnapshot | null {
  const offer = runtime.commercialRuntime.offerRuntime
  const multiModule = offer.multiModule
  const moduleNumber = multiModule.modules.some((entry) => entry.moduleNumber === selectedModuleNumber)
    ? selectedModuleNumber
    : multiModule.activeModuleNumber
  if (moduleNumber === null) return null

  const entry = multiModule.modules.find((candidate) => candidate.moduleNumber === moduleNumber)
  if (!entry) return null
  const frame = entry.runtime.currentFrame
  const settings = offer.moduleSettings.find((candidate) => candidate.moduleNumber === moduleNumber)?.effective ?? {}
  const quantity = runtime.commercialRuntime.moduleQuantities.find((candidate) => candidate.moduleNumber === moduleNumber)?.effectiveQuantity ?? null
  const review = runtime.moduleReviews.find((candidate) => candidate.moduleNumber === moduleNumber)
  const sashCells = frame?.cells.filter((cell) => cell.hasSash) ?? []
  const dividerLabels = frame?.dividers.map((divider) => divider.label) ?? []
  const completeChecks = review?.checks.filter((item) => item.status === 'COMPLETE').length ?? 0
  const totalChecks = review?.checks.length ?? 0

  return {
    moduleNumber,
    widthMm: frame?.frameWidthMm ?? null,
    heightMm: frame?.frameHeightMm ?? null,
    quantity,
    system: settings.system ?? null,
    finish: settings.finish ?? null,
    glazing: settings.glazing ?? null,
    hardware: settings.hardware ?? null,
    frameSummary: frame?.frameWidthMm && frame.frameHeightMm ? `${frame.frameWidthMm} × ${frame.frameHeightMm} mm` : '—',
    sashSummary: sashCells.length ? sashCells.map((cell) => `${cell.label}: ${cell.sashLabel ?? 'крило'}`).join(' | ') : '—',
    dividerSummary: dividerLabels.length ? dividerLabels.join(' | ') : '—',
    openingSummary: sashCells.length ? sashCells.map((cell) => `${cell.label}: ${cell.sashLabel ?? 'отваряемо'}`).join(' | ') : '—',
    reviewStatus: review?.status ?? 'INCOMPLETE',
    completeChecks,
    totalChecks,
    unresolvedChecks: Math.max(0, totalChecks - completeChecks),
    visibleStateKey: `${runtime.visibleStateKey}|selected=${moduleNumber}`,
  }
}
