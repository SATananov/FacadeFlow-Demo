import { createWorker, OEM } from 'tesseract.js'
import { ocrLimits } from './ocrLimits'
import { normalizeOcrText } from './ocrText'
import type { OcrTextItem } from './ocrTypes'

export interface OcrServiceResult { rawText: string; normalizedText: string; confidence: number; items: OcrTextItem[] }
export interface OcrRunControl { cancel: () => Promise<void> }

export async function runLocalOcr(imageDataUrl: string, onProgress: (progress: number, message: string) => void, register: (control: OcrRunControl) => void): Promise<OcrServiceResult> {
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/tesseract-core-lstm.wasm.js',
    langPath: '/ocr',
    cacheMethod: 'none',
    workerBlobURL: false,
    gzip: true,
    logger: ({ progress, status }) => onProgress(progress, status),
  })
  register({ cancel: () => worker.terminate().then(() => undefined) })
  try {
    const result = await worker.recognize(imageDataUrl, {}, { text: true, blocks: true })
    const rawText = result.data.text.slice(0, ocrLimits.maximumTextLength)
    const items = (result.data.blocks ?? []).flatMap((block) => block.paragraphs).flatMap((paragraph) => paragraph.lines).map((line) => ({ text: line.text, confidence: line.confidence, bbox: { x: line.bbox.x0, y: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 } }))
    return { rawText, normalizedText: normalizeOcrText(rawText), confidence: result.data.confidence, items }
  } finally {
    await worker.terminate().catch(() => undefined)
  }
}
