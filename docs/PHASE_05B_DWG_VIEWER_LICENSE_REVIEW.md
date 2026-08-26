# Phase 05B — преглед на лицензите за локален DWG viewer

Дата на прегледа: 26 август 2026 г.

## Човешко решение за вътрешна оценка

> **INTERNAL EVALUATION ONLY — EXTERNAL DISTRIBUTION NOT APPROVED**

Собственикът разреши локален LibreDWG/WebAssembly технически прототип само за вътрешна фирмена оценка. Phase 05B не трябва да бъде публикувана, deploy-вана, продавана, прехвърляна, push-вана или разпространявана. Това решение не прелицензира FacadeFlow и не разрешава външно разпространение на GPL decoder/worker/WASM или на общия build. Преди всяко външно или търговско използване е задължителен нов лицензен и правен преглед.

Използваната вътрешна evaluation версия е `@mlightcad/libredwg-web@0.7.10`, npm integrity `sha512-L9wnwQn8cgHIr6I5El/8TgKSXaRacW9vytSpsU19xufmrnAAqEEGcW0MU92PgEiDKuQtU4GBenERIDfSrbY99g==`, license `GPL-3.0`. Пакетът няма runtime dependencies и няма `install`/`postinstall` script. Tarball-ът включва JavaScript wrapper/loader и `wasm/libredwg-web.wasm` (9 960 337 bytes), които се включват локално от Vite build-а. Инсталацията е извършена с `--ignore-scripts`.

### Dependency и bundled-runtime inventory

| Компонент | Версия / произход | Лиценз | Роля и бележка |
| --- | --- | --- | --- |
| `@mlightcad/libredwg-web` | `0.7.10` | `GPL-3.0` | Единствената нова директна npm dependency; няма npm runtime dependencies. |
| GNU LibreDWG | bundled в package WASM | `GPL-3.0-or-later` upstream | Реалният DWG decoder; package metadata обозначава общия артефакт като GPL-3.0. |
| `libredwg-web.wasm` | 9 960 337 bytes от npm tarball | GPL package artifact | Включва се като локален Vite asset; няма CDN. |
| Emscripten loader/glue | `wasm/libredwg-web.js` от tarball | включен в GPL package distribution | Зарежда локалния WASM в worker; tarball не предоставя отделен license file за glue кода. |
| zlib runtime | Emscripten `USE_ZLIB=1`, compiled в WASM | zlib license upstream | Няма отделен npm пакет или runtime файл. |
| mimalloc allocator | Emscripten `MALLOC=mimalloc`, compiled в WASM | MIT upstream | Няма отделен npm пакет или runtime файл. |

Публикуваният npm tarball не съдържа отделен `LICENSE` файл и не предоставя component-level SBOM за compiled WASM. Затова тази таблица се основава на package metadata, upstream LibreDWG лиценза и публикуваните build scripts. Това е допустимо единствено по даденото internal-evaluation решение и остава блокер за външно разпространение.

## Първоначално решение на лицензионната граница

**Първоначален резултат: BLOCKED.** След горното изрично човешко решение е разрешена единствено непрехвърляема вътрешна техническа оценка; външното разпространение остава блокирано.

Няма доказан вариант, който едновременно:

- декодира локално DWG `AC1018` в браузъра;
- може да бъде включен и разпространяван с текущия проект без неизяснени copyleft или договорни задължения;
- има проверими лицензи за директния пакет и всички worker, WASM, decoder и други runtime активи;
- запазва изцяло локалната архитектура без cloud услуга или backend.

Това е техническа оценка на публикуваните лицензи, а не правен съвет. Интеграция може да започне само след изрично продуктово и правно решение за един от описаните пътища.

## Проверени варианти

### GNU LibreDWG и `@mlightcad/libredwg-web`

- GNU LibreDWG е лицензиран под `GPL-3.0-or-later`.
- `@mlightcad/libredwg-web` е браузърен JavaScript/WASM parser, базиран на LibreDWG, и репозиторият му е обозначен с `GPL-3.0`.
- Това не е само attribution задължение. При разпространение на GPL worker/WASM/decoder активите трябва да бъдат изпълнени приложимите GPL изисквания, включително лицензни известия и предоставяне на съответния source code. Обхватът спрямо останалото приложение не трябва да се предполага без правен преглед.
- Технически LibreDWG декларира поддръжка за DWG версии, включващи `AC1018`, но това не премахва лицензионната пречка и не гарантира пълно entity покритие за конкретния частен файл.

**Резултат:** технически възможен кандидат, но не е одобрен за включване или разпространение в текущия проект.

### `@mlightcad/cad-simple-viewer` с LibreDWG converter

- Основният viewer stack е предимно MIT, но DWG loading не е част от MIT-only пътя.
- Официалната документация изисква отделен `@mlightcad/libredwg-converter`, worker и WASM; DWG converter-ът и активите му са GPL-3.0.
- Изолацията в Web Worker не отменя задълженията за самия разпространяван GPL компонент. Авторите изрично предупреждават за GPL propagation риск и препоръчват правен преглед.
- Viewer-ът включва и функции извън тесния read-only Phase 05B обхват; евентуална бъдеща интеграция трябва допълнително да премахне edit/export/network-capable plugins и да докаже локалните font/runtime активи.

**Резултат:** не преминава лицензионната граница без изрично GPL compliance решение.

### Собственическият parser на mlightcad

- Публикуван е като заместител на GPL converter-а, но е собственически компонент.
- В прегледаната публична документация няма лицензни условия, договор и redistributable runtime package, които дават право този проект да го копира и разпространява.

**Резултат:** потенциален търговски път, блокиран до получаване и одобряване на писмен лиценз и пълен списък на runtime активите.

### Open Design Alliance Drawings SDK

- ODA предлага професионален DWG SDK с поддръжка на `AC1018`.
- SDK е собственически и се лицензира чрез membership/subscription. Публикуваните условия разграничават commercial distribution и web употреба и посочват, че правото за разпространение зависи от активния абонамент.
- Проектът няма предоставен ODA договор, build/runtime пакет или разрешение за browser redistribution.

**Резултат:** технически способен, но не може да бъде интегриран без закупен и прегледан подходящ лиценз.

### DXF-only permissive parsers

- MIT parser-и като `dxf-parser` обработват текстов DXF, а не бинарен DWG.
- Те не удовлетворяват изискването за директно визуализиране на локалния `AC1018` DWG и използването им би означавало забранена предварителна DWG конверсия с друг инструмент.

**Резултат:** не са кандидат за Phase 05B.

### Cloud и външни conversion услуги

Autodesk/ODA cloud viewer-и, online converters и подобни услуги са извън допустимия дизайн: изискват upload или network комуникация и нарушават local-only границата.

**Резултат:** изрично изключени.

## Необходими решения преди продължаване

Изберете и документирайте един от следните пътища:

1. **GPL compliance път:** одобрение за разпространение на GPL-3.0 decoder/worker/WASM, план за corresponding source, notices, license text, build reproducibility и правен преглед на границата с приложението.
2. **Собственически път:** писмен лиценз, който изрично разрешава offline browser redistribution, плюс проверен manifest на всички decoder/WASM/font/runtime активи.
3. **Без DWG viewer:** Phase 05B остава блокирана, а съществуващата безопасна `AC10xx` header inspection функционалност се запазва.

До такова решение не трябва да се изпълнява `npm install` за DWG library, да се копира decoder/WASM binary или да се добавя rendering код.

## Проверка на частния sample

Частният игнориран файл е проверен само чрез immutable header metadata:

- signature/version: `AC1018`;
- не е декодиран и не е визуализиран;
- не е свързан по предположение с XML/LTE източници;
- не е копиран в `src`, `public`, `dist` или Git;
- името и SHA-256 не се записват в tracked документацията.

Поради лицензионния stop gate няма entity counts, layer list, unsupported-entity отчет или screenshot. Това не трябва да се представя като неуспешно разпознаване на чертежа — decoder изобщо не е стартиран.

## Запазени граници

- Няма DWG export, edit, conversion или automatic geometry interpretation.
- Няма XML/LTE връзка по предположение.
- Няма backend, upload, network request, telemetry или cloud service.
- Няма production formula, operation generation, machine-ready state, MECAL/LTE/XM/G-code/CNC output или machine communication.
- Съществуващата Phase 05A функционалност остава непроменена.

## Източници за повторен преглед

- GNU LibreDWG project и manual — лиценз `GPL-3.0-or-later` и заявено DWG version coverage.
- `mlightcad/libredwg-web` repository — браузърен LibreDWG parser, `GPL-3.0`.
- `mlightcad/cad-viewer` README — MIT core, opt-in GPL DWG converter, отделни worker/WASM активи и proprietary alternative.
- Open Design Alliance Drawings SDK, pricing и membership FAQ — proprietary subscription/distribution условия.
- `dxf-parser` package documentation — MIT, DXF-only функционалност.

Лицензите и commercial terms трябва да бъдат проверени отново непосредствено преди бъдеща интеграция.
