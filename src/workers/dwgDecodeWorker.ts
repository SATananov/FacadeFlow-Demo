/// <reference lib="webworker" />
// GPL-dependent adapter worker. INTERNAL EVALUATION ONLY — EXTERNAL DISTRIBUTION NOT APPROVED.
import { createModule, Dwg_File_Type, LibreDwg } from '@mlightcad/libredwg-web'
import wasmUrl from '../../node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.wasm?url'
import { normalizeDwgDatabase } from '../dwgEntityNormalization'
import type { DwgDecodeOptions } from '../dwgViewerTypes'

interface DecodeMessage { id: string; bytes: ArrayBuffer; options: DwgDecodeOptions }

self.onmessage = async (event: MessageEvent<DecodeMessage>) => {
  const { id, bytes, options } = event.data
  try {
    self.postMessage({ id, kind: 'progress', progress: 0.1, message: 'Зареждане на локалния DWG декодер…' })
    const decoder = LibreDwg.createByWasmInstance(await createModule({ locateFile: () => wasmUrl }))
    self.postMessage({ id, kind: 'progress', progress: 0.35, message: 'Локално декодиране на DWG…' })
    const pointer = decoder.dwg_read_data(bytes, Dwg_File_Type.DWG)
    if (typeof pointer !== 'number' || pointer === 0) throw new Error('LibreDWG не върна валидна структура.')
    try {
      const converted = decoder.convertEx(pointer)
      self.postMessage({ id, kind: 'progress', progress: 0.75, message: 'Безопасно нормализиране на геометрията…' })
      const result = normalizeDwgDatabase(converted.database as unknown as Parameters<typeof normalizeDwgDatabase>[0], options)
      if (converted.stats.unknownEntityCount > 0) {
        result.unsupportedCounts.LIBREDWG_UNKNOWN = converted.stats.unknownEntityCount
        result.warnings.push({ code: 'UNSUPPORTED_ENTITY', message: `${converted.stats.unknownEntityCount} обекта не са разпознати от LibreDWG.`, count: converted.stats.unknownEntityCount })
      }
      self.postMessage({ id, kind: 'result', result })
    } finally { decoder.dwg_free(pointer) }
  } catch (reason) {
    self.postMessage({ id, kind: 'error', message: reason instanceof Error ? reason.message : 'Неуспешно локално DWG декодиране.' })
  }
}
