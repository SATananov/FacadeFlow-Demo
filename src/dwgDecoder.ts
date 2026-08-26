import type { DwgDecodeOptions, DwgDecodeResult } from './dwgViewerTypes'

export interface DwgDecoder {
  decode(bytes: ArrayBuffer, options?: DwgDecodeOptions): Promise<DwgDecodeResult>
  cancel(): void
  dispose(): Promise<void>
}

export class DwgDecoderError extends Error {
  readonly code: 'CANCELLED' | 'TIMEOUT' | 'DECODE_FAILED' | 'LIMIT_EXCEEDED'
  constructor(message: string, code: 'CANCELLED' | 'TIMEOUT' | 'DECODE_FAILED' | 'LIMIT_EXCEEDED') {
    super(message)
    this.code = code
    this.name = 'DwgDecoderError'
  }
}
