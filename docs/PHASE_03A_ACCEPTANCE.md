# Phase 03A — критерии за приемане

## Локален import и защита

- [x] Действието „Импортирай техническа скица“ отваря достъпен import workspace.
- [x] Валидни PNG и JPG/JPEG файлове се проверяват по разширение и binary signature и се визуализират локално.
- [x] Валидни едностранични и многостранични PDF файлове се визуализират локално чрез Mozilla PDF.js.
- [x] Неподдържаните, празните и malformed файловете се отхвърлят с българско съобщение.
- [x] Файл над конфигурирания максимален размер се отхвърля.
- [x] PDF над конфигурирания максимален брой страници се отхвърля.
- [x] PDF страниците имат предишна/следваща навигация и директен номер на страница.
- [x] Viewer-ът поддържа zoom in, zoom out, fit page и reset, без промяна на оригинала.
- [x] SHA-256 се изчислява локално чрез Web Crypto API.
- [x] Оригиналът остава immutable и не се записва в `localStorage` или `IndexedDB`.
- [x] PDF actions, annotation links, скриптове и attachments не се изпълняват.

## Ръчно заснемане и проверка

- [x] Изделията се създават само чрез ръчно въведени стойности; няма OCR, AI или автоматично измерване.
- [x] Всеки запис има стабилен local ID, source име/hash/страница, схема, размери, количество, статус и timestamps.
- [x] Липсващи или невалидни размери, страница, количество и задължителни референции блокират записването.
- [x] Записите могат да се редактират, дублират и изтриват след потвърждение.
- [x] Списъкът се филтрира по source страница и review статус.
- [x] Промяна на размер или схема след `VERIFIED` автоматично задава `NEEDS_REVIEW`.
- [x] Само `VERIFIED` запис може да бъде зареден в съществуващия component workflow.
- [x] Съществуващото предупреждение за засегнати component operations се изпълнява преди подмяна на продуктови данни.
- [x] Самостоятелните profile operations не се променят при зареждане на изделие.

## Preview, export и забрани

- [x] Всеки валиден запис може да отвори съществуващия симулационен product preview.
- [x] Import session export-ът завършва само на `.drawing-import.simulation.json`.
- [x] Export-ът включва source metadata и SHA-256, captured products, review statuses, validation, `simulationOnly: true`, `machineReady: false` и `requiresHumanApproval: true`.
- [x] Оригиналният source файл не се включва в export-а.
- [x] Няма backend, network request, cloud/AI API или постоянна browser storage.
- [x] Няма DXF/DWG parsing, PDF-to-machine conversion, MECAL/LTE/XM, G-code, CNC output или комуникация с машина.
