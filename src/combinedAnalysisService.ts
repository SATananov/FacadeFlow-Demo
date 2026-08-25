import { parseCombinedCandidates } from './combinedDimensionParsing'
import { extractGeometryFeatures } from './combinedGeometry'
import { rankReferenceSchemes } from './combinedRanking'
import type { CombinedAnalysisJob } from './combinedAnalysisTypes'
import { combinedWarnings } from './combinedValidation'
import { runLocalOcr, type OcrRunControl } from './ocrService'
import type { OcrSelection } from './ocrTypes'

export async function runCombinedAnalysis(selection: OcrSelection, sourceSha256: string, onProgress: (message: string) => void, register: (control: OcrRunControl) => void): Promise<CombinedAnalysisJob> {
  const id = crypto.randomUUID(), createdAt = new Date().toISOString()
  onProgress('Извличане на демонстрационни geometry features…')
  const geometryFeatures = await extractGeometryFeatures(selection.imageDataUrl)
  const schemeRankings = rankReferenceSchemes(geometryFeatures)
  onProgress('Локално OCR на означенията…')
  const ocr = await runLocalOcr(selection.imageDataUrl, (progress, status) => onProgress(`${status} ${Math.round(progress * 100)}%`), register)
  const evidence = new Image(); evidence.src = selection.imageDataUrl; await evidence.decode()
  const candidates = parseCombinedCandidates(ocr.normalizedText, ocr.items, ocr.confidence, selection.page, evidence.naturalWidth, evidence.naturalHeight)
  const partial = { schemeRankings, candidates, geometryFeatures }
  return { id, sourceSha256, sourcePage: selection.page, crop: selection.rectangle, evidenceImageDataUrl: selection.imageDataUrl, evidenceWidth: evidence.naturalWidth, evidenceHeight: evidence.naturalHeight, createdAt, completedAt: new Date().toISOString(), geometryFeatures, schemeRankings, rawOcrText: ocr.rawText, normalizedOcrText: ocr.normalizedText, ocrConfidence: ocr.confidence, ocrItems: ocr.items, candidates, warnings: combinedWarnings(partial), state: 'COMPLETED' }
}
