# Матрица на импортните формати

| Източник | Статус | Phase 03D поведение |
|---|---|---|
| JPG/JPEG/PNG | Реализирано | Локален viewer, OCR, combined analysis и provisional drafts |
| PDF | Реализирано | Локален PDF.js viewer, страници, OCR, combined analysis и provisional drafts |
| OCR | Реализирано локално | English/Latin/числа; резултатът е предложение за човешка проверка |
| DWG | Само безопасен прием/header inspection | Проверява `AC10xx`, SHA-256 и metadata; без entity parsing/render/conversion |
| DXF | Само безопасна inspection проверка | Проверява текстова структура; без geometry parsing/render/conversion |
| CSV/XLSX | Планирано | Metadata и SHA-256; без speculative column mapping |
| FacadeFlow simulation JSON import | Планирано | Проверка на точен marker/schema; без session restore |
| MECAL/LTE/XM/G-code/CNC | Забранено | Не се приема, генерира или предава |

Нито един маршрут не качва файл, не използва online converter и не комуникира с машина.
