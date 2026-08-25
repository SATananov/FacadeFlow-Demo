# Phase 03D Foundation — критерии за приемане

## Единен импортен център

- [x] Главното действие е „Импортирай проект / чертеж“, а диалогът е „Избери източник на проекта“.
- [x] Налични са отделни карти за IMAGE, PDF, CAD, TABULAR и FacadeFlow simulation JSON.
- [x] Файл се избира след маршрут; `accept` филтърът съответства на картата.
- [x] Drag-and-drop преминава през същата проверка и несъответствие дава българска грешка.
- [x] „Назад към избор на формат“ изисква потвърждение при активен източник и изчиства само текущата in-memory import сесия.

## Проверка и маршрутизация

- [x] Общият typed inspection слой записва име, разширение, MIME, размер, SHA-256, binary/text signature, избран маршрут, открит формат, предупреждения и timestamp.
- [x] Поддържат се `SUPPORTED`, `SUPPORTED_FOR_VIEW_ONLY`, `FUTURE_SUPPORT`, `REJECTED` и `FORMAT_MISMATCH`.
- [x] Валидни PNG/JPEG и PDF се насочват към съществуващия viewer, OCR, combined analysis и provisional draft workflow.
- [x] Несъответстващи extension/MIME/signature и произволно преименувани файлове се отхвърлят.
- [x] DWG `AC10xx` header и текстова DXF структура се разпознават без entity parsing или render.
- [x] CSV/XLSX показват само metadata/SHA-256 и `FUTURE_SUPPORT`; няма column mapping.
- [x] Само точният `.drawing-import.simulation.json` marker се разпознава; arbitrary JSON се отхвърля и restore не се извършва.

## Source session и състояния

- [x] Unified source session съдържа stable local ID, route, detected format, metadata, SHA-256, support status, warnings, page count, linked draft IDs, timestamp и задължителните safety flags.
- [x] UI отделя „файл приет“, „визуализируем“, „анализ наличен“, „чернова генерирана“, „човешка проверка“ и „машинна готовност“.
- [x] Машинната готовност винаги е „НЕ“.
- [x] OCR/image/PDF функционалността от Phase 03A–03C остава налична и не е дублирана.

## Безопасност

- [x] Няма upload, backend, runtime CDN, online CAD converter, external viewer iframe или remote API.
- [x] Source файловете не се пазят в `localStorage` или `IndexedDB`.
- [x] Няма автоматично създаване на операции, реален избор на профил или заобикаляне на `NEEDS_REVIEW`.
- [x] Няма MECAL/LTE/XM/G-code/CNC output, machine connectivity или изпълнение на вложено съдържание.
