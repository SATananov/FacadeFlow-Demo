import type { DetectedImportFormat, ImportFormatCardDefinition, ImportRoute } from './importFormatTypes'

export const importFormatCards: ImportFormatCardDefinition[] = [
  { route: 'IMAGE', title: 'Снимка', formats: ['JPG', 'JPEG', 'PNG'], description: 'Сниман или сканиран чертеж с локално OCR и визуално сравнение.', accept: '.jpg,.jpeg,.png,image/jpeg,image/png', badge: 'СНИМКА + OCR' },
  { route: 'PDF', title: 'PDF чертеж', formats: ['PDF'], description: 'Едно- или многостраничен технически чертеж с локално OCR и визуално сравнение.', accept: '.pdf,application/pdf', badge: 'PDF + OCR' },
  { route: 'SKYGLAZING', title: 'SkyGlazing XML / LTE', formats: ['XML', 'LTE'], description: 'Безопасна read-only проверка и barcode-only сравнение на изрично избрани локални файлове.', accept: '.xml,.XML,.lte,.LTE,application/xml,text/xml,text/plain', badge: 'XML / LTE — READ ONLY' },
  { route: 'CAD', title: 'CAD чертеж', formats: ['DWG', 'DXF'], description: 'Векторен CAD източник. DWG анализът предстои след проверка на реален пример.', status: 'Подготвено за безопасен прием — директният анализ предстои.', accept: '.dwg,.dxf,application/acad,application/x-dwg,image/vnd.dwg,application/dxf,text/plain', badge: 'CAD — ПРЕГЛЕД' },
  { route: 'TABULAR', title: 'Таблична спецификация', formats: ['CSV', 'XLSX'], description: 'Списък с изделия, размери, количества и позиции.', status: 'Предстои в следваща фаза.', accept: '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', badge: 'ТАБЛИЦА — ПРЕДСТОИ' },
  { route: 'SIMULATION', title: 'FacadeFlow симулация', formats: ['.drawing-import.simulation.json'], description: 'Възстановяване на локално експортирана симулационна сесия.', status: 'Предстои безопасен импорт.', accept: '.json,application/json', badge: 'СИМУЛАЦИЯ — ПРЕДСТОИ' },
]

export const formatsForRoute: Record<ImportRoute, DetectedImportFormat[]> = { IMAGE: ['PNG', 'JPEG'], PDF: ['PDF'], SKYGLAZING: ['SKYGLAZING_XML', 'LTE'], CAD: ['DWG', 'DXF'], TABULAR: ['CSV', 'XLSX'], SIMULATION: ['FACADEFLOW_SIMULATION_JSON'] }
export const formatCardFor = (route: ImportRoute) => importFormatCards.find((card) => card.route === route) ?? importFormatCards[0]!
