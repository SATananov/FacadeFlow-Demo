import type { DrawingImportLimits, DrawingSourceFile } from './drawingImportTypes'
import { calculateSha256 } from './drawingImportHash'
import { identifyDrawingFile } from './drawingImportValidation'

export async function prepareDrawingSource(file: File, limits: DrawingImportLimits): Promise<DrawingSourceFile> {
  const bytes = await file.arrayBuffer()
  const identified = identifyDrawingFile(file, bytes, limits)
  if (!identified.kind) throw new Error(identified.errors.join(' '))
  let pageCount = 1
  if (identified.kind === 'PDF') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    try {
      const task = pdfjs.getDocument({ data: bytes.slice(0), disableFontFace: true, useSystemFonts: true, useWorkerFetch: false, useWasm: false, stopAtErrors: true })
      const pdf = await task.promise
      pageCount = pdf.numPages
      await task.destroy()
    } catch {
      throw new Error('PDF файлът е повреден или не може да бъде прочетен безопасно.')
    }
    if (pageCount > limits.maximumPdfPages) throw new Error(`PDF файлът надвишава ограничението от ${limits.maximumPdfPages} страници.`)
  } else {
    try {
      const image = await createImageBitmap(file)
      image.close()
    } catch {
      throw new Error('Изображението е повредено или не може да бъде прочетено безопасно.')
    }
  }
  return {
    file,
    bytes,
    objectUrl: identified.kind === 'PDF' ? undefined : URL.createObjectURL(file),
    metadata: {
      fileName: file.name,
      mimeType: file.type || (identified.kind === 'PDF' ? 'application/pdf' : identified.kind === 'PNG' ? 'image/png' : 'image/jpeg'),
      kind: identified.kind,
      sizeBytes: file.size,
      sha256: await calculateSha256(bytes),
      pageCount,
    },
  }
}

export function releaseDrawingSource(source: DrawingSourceFile | null): void {
  if (source?.objectUrl) URL.revokeObjectURL(source.objectUrl)
}
