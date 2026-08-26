# Матрица на импортните формати

| Източник | Статус | Поведение |
|---|---|---|
| JPG/JPEG/PNG | Реализирано | Локален viewer, OCR, combined analysis и provisional drafts |
| PDF | Реализирано | Локален PDF.js viewer, страници, OCR, combined analysis и provisional drafts |
| OCR | Реализирано локално | English/Latin/числа; резултатът е предложение за човешка проверка |
| SkyGlazing XML | Phase 05A read-only | UTF-8 inert structural inspection; DOCTYPE/ENTITY rejection; без product/operation creation или export |
| LTE | Phase 05A read-only | ASCII fixed-width evidence и barcode-only comparison; непотвърдените диапазони остават UNRESOLVED; без export |
| DWG | Само безопасен прием/header inspection | Проверява `AC10xx`, SHA-256 и metadata; без entity parsing/render/conversion |
| DXF | Само безопасна inspection проверка | Проверява текстова структура; без geometry parsing/render/conversion |
| CSV/XLSX | Планирано | Metadata и SHA-256; без speculative column mapping |
| FacadeFlow simulation JSON import | Планирано | Проверка на точен marker/schema; без session restore |
| MECAL/XM/G-code/CNC | Забранено | Не се приема, генерира или предава |
| XML/LTE/DWG output | Забранено | Phase 05A никога не създава, редактира или експортира тези формати |

Нито един маршрут не качва файл, не използва online converter и не комуникира с машина.
