# Phase 05A — приемане на SkyGlazing read-only проверката

## Поддържани локални източници

- SkyGlazing UTF-8 XML с корен `Order` — inert structural inspection, без изпълнение и без export.
- ASCII LTE с CRLF и наблюдавани fixed-width записи — read-only inspection, без редакция и без export.
- Двойка XML + LTE — сравнение единствено по точно съвпадение на trim-натия баркод.
- DWG — само съществуващата signature/header проверка (`AC10xx`); без entity parsing, render или conversion.

## Отхвърляне и XML сигурност

- Празен, прекалено голям, неподдържан, extension-mismatched или malformed файл се отхвърля с българска грешка.
- XML с `DOCTYPE` или `ENTITY` декларация се отхвърля преди структурен parsing.
- Няма external entity resolution, script execution, link handling, attachment handling, `dangerouslySetInnerHTML`, CDN XML library или network request.
- Непознат Generator се показва като read-only структура с ясно предупреждение и не получава потвърдена SkyGlazing семантика.
- LTE ред с различна от наблюдаваната ширина 149 се показва с validation warning; всички непотвърдени fixed-width диапазони остават `UNRESOLVED`.
- Повтарящ или липсващ баркод остава `UNRESOLVED` и не се съпоставя еднозначно.

## Read-only таблици и сравнение

- XML таблицата показва само наблюдавани Piece/DXF/размерни текстове, barcode, Work count и distinct Work names. Параметрите не са потвърдена машинна семантика.
- LTE таблицата показва line number, profile token, raw length token, barcode и immutable original line. Другите диапазони нямат измислени имена.
- Статусите са `MATCHED`, `XML_ONLY`, `LTE_ONLY`, `CONFLICT` и `UNRESOLVED`.
- Phase 05A създава `MATCHED`, `XML_ONLY`, `LTE_ONLY` или `UNRESOLVED` само от barcode presence/cardinality. `CONFLICT` не се извежда автоматично от дължини, ъгли или непотвърдени полета.
- Филтрите покриват всички статуси, barcode search и profile search.

## Очакван локален sample резултат

Реалните локални файлове не се именуват и не се копират в tracked content. При изричен ръчен избор проверената двойка дава:

- XML: 46 Bar, 46 Piece, 220 Work, 46 уникални баркода и 4 DXF профила;
- LTE: 84 записа, ширина 149, 84 уникални баркода и 4 профилни групи;
- сравнение: `MATCHED: 46`, `XML_ONLY: 0`, `LTE_ONLY: 38`, `CONFLICT: 0`, `UNRESOLVED: 0`.

DWG sample-ът има валидна `AC1018` signature, но не се предполага връзка с XML/LTE двойката.

## Privacy и regression

- `.gitignore` съдържа `local-samples/`, `*.dwg`, `*.DWG`, `*.lte`, `*.LTE`; XML не се игнорира глобално.
- Реалните sample bytes, имена, project identifiers, barcodes, profile data и Work параметри не присъстват в source, tests, docs, `public/` или `dist`.
- Тестовете използват само синтетични fixtures.
- Phase 01–04D behavior, ordered workflow, dimensions, stable component IDs, operations и съществуващи simulation exports не се променят.

## Абсолютна граница

Всеки evidence/comparison запис е `simulationOnly: true` и `machineReady: false`. Няма XML/LTE/DWG generation, edit, export, product creation, operation creation, production formula, MECAL/LTE/XM/G-code/CNC output, backend, upload, LAN service или machine communication.
