import type { OcrRectangle } from './ocrTypes'
export function proposeDimensionOrientation(box: OcrRectangle | undefined, evidenceWidth: number, evidenceHeight: number): 'OVERALL_WIDTH' | 'OVERALL_HEIGHT' | 'AMBIGUOUS' {
  if (!box || !evidenceWidth || !evidenceHeight) return 'AMBIGUOUS'
  const centerX = box.x + box.width / 2, centerY = box.y + box.height / 2
  const nearHorizontalEdge = centerY < evidenceHeight * .28 || centerY > evidenceHeight * .72
  const nearVerticalEdge = centerX < evidenceWidth * .24 || centerX > evidenceWidth * .76
  if (nearHorizontalEdge && !nearVerticalEdge) return 'OVERALL_WIDTH'
  if (nearVerticalEdge && !nearHorizontalEdge) return 'OVERALL_HEIGHT'
  return 'AMBIGUOUS'
}
