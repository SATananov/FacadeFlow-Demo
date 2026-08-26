import type { SkyGlazingComparison, SkyGlazingComparisonRecord, SkyGlazingLteInspection, SkyGlazingXmlInspection } from './skyGlazingTypes'

export function compareSkyGlazingSources(xml: SkyGlazingXmlInspection, lte: SkyGlazingLteInspection): SkyGlazingComparison {
  const xmlByBarcode = new Map<string, typeof xml.pieces>(), lteByBarcode = new Map<string, typeof lte.records>()
  xml.pieces.forEach((item) => { const list = xmlByBarcode.get(item.normalizedBarcode) ?? []; list.push(item); xmlByBarcode.set(item.normalizedBarcode, list) })
  lte.records.forEach((item) => { const list = lteByBarcode.get(item.normalizedBarcode) ?? []; list.push(item); lteByBarcode.set(item.normalizedBarcode, list) })
  const barcodes = new Set([...xmlByBarcode.keys(), ...lteByBarcode.keys()]), records: SkyGlazingComparisonRecord[] = []
  for (const normalizedBarcode of barcodes) {
    const xmlItems = xmlByBarcode.get(normalizedBarcode) ?? [], lteItems = lteByBarcode.get(normalizedBarcode) ?? []
    if (!normalizedBarcode || xmlItems.length > 1 || lteItems.length > 1) records.push({ normalizedBarcode, status: 'UNRESOLVED', xmlRecord: xmlItems[0], lteRecord: lteItems[0], explanation: 'Липсващ или повтарящ се баркод не позволява еднозначно присъствено съпоставяне.', simulationOnly: true, machineReady: false })
    else if (xmlItems.length && lteItems.length) records.push({ normalizedBarcode, status: 'MATCHED', xmlRecord: xmlItems[0], lteRecord: lteItems[0], explanation: 'Точно съвпадение само по нормализиран баркод.', simulationOnly: true, machineReady: false })
    else if (xmlItems.length) records.push({ normalizedBarcode, status: 'XML_ONLY', xmlRecord: xmlItems[0], explanation: 'Баркодът присъства само в XML.', simulationOnly: true, machineReady: false })
    else records.push({ normalizedBarcode, status: 'LTE_ONLY', lteRecord: lteItems[0], explanation: 'Баркодът присъства само в LTE.', simulationOnly: true, machineReady: false })
  }
  const counts = { MATCHED: 0, XML_ONLY: 0, LTE_ONLY: 0, CONFLICT: 0, UNRESOLVED: 0 }
  records.forEach(({ status }) => { counts[status] += 1 })
  return { records, counts, xmlRecordCount: xml.pieceCount, lteRecordCount: lte.recordCount, matchingRule: 'EXACT_TRIMMED_BARCODE_ONLY', simulationOnly: true, machineReady: false }
}
