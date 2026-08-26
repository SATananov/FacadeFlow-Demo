// GPL-dependent boundary. All other FacadeFlow modules depend only on DwgDecoder and neutral types.
import { DwgDecoderError, type DwgDecoder } from './dwgDecoder'
import { DWG_LIMITS, type DwgDecodeOptions, type DwgDecodeResult } from './dwgViewerTypes'

type WorkerResponse = { id: string; kind: 'result'; result: DwgDecodeResult } | { id: string; kind: 'error'; message: string } | { id: string; kind: 'progress'; progress: number; message: string }

export class LibreDwgWorkerDecoder implements DwgDecoder {
  private worker: Worker | null = null
  private rejectCurrent: ((reason: Error) => void) | null = null
  private readonly onProgress?: (progress: number, message: string) => void
  constructor(onProgress?: (progress: number, message: string) => void) { this.onProgress = onProgress }

  decode(bytes: ArrayBuffer, options: DwgDecodeOptions = {}): Promise<DwgDecodeResult> {
    this.cancel()
    const worker = new Worker(new URL('./workers/dwgDecodeWorker.ts', import.meta.url), { type: 'module', name: 'facadeflow-local-dwg-decoder' })
    this.worker = worker
    const id = crypto.randomUUID()
    return new Promise((resolve, reject) => {
      this.rejectCurrent = reject
      const timeout = window.setTimeout(() => { worker.terminate(); if (this.worker === worker) this.worker = null; reject(new DwgDecoderError('Локалното DWG декодиране надвиши безопасния срок.', 'TIMEOUT')) }, DWG_LIMITS.workerTimeoutMs)
      const finish = () => { window.clearTimeout(timeout); worker.terminate(); if (this.worker === worker) this.worker = null; this.rejectCurrent = null }
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== id) return
        if (event.data.kind === 'progress') { this.onProgress?.(event.data.progress, event.data.message); return }
        finish()
        if (event.data.kind === 'result') resolve(event.data.result); else reject(new DwgDecoderError(event.data.message, event.data.message.startsWith('LIMIT_') ? 'LIMIT_EXCEEDED' : 'DECODE_FAILED'))
      }
      worker.onerror = () => { finish(); reject(new DwgDecoderError('Изолираният DWG worker приключи неочаквано.', 'DECODE_FAILED')) }
      worker.postMessage({ id, bytes, options }, [bytes])
    })
  }
  cancel() { if (!this.worker) return; this.worker.terminate(); this.worker = null; this.rejectCurrent?.(new DwgDecoderError('Декодирането е прекратено.', 'CANCELLED')); this.rejectCurrent = null }
  async dispose() { this.cancel() }
}
