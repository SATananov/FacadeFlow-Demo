# FacadeFlow Demo — текуща архитектура · локална симулация

## Текущ архитектурен checkpoint

FacadeFlow е локална, human-gated среда за симулация, технически преглед и подготовка на структурирани продуктови данни. **PROFILE DATA 01.2A V8 + V8.1 + V8.2 + V8.3 е функционално затворен и независимо одитиран върху SHAREABLE_CLEAN checkpoint `7071c2b`.** Обозначението „V8.1.1“ е исторически follow-up, който е включен във V8.1 и няма самостоятелен closure artifact. V8.3 използва един ясен „работна конфигурация“ workflow за прозорци и врати: след име и положителни размери потребителят може да започне композицията с наличните данни, а неизвестните система/профили остават празни и се попълват по-късно. Human Confirm, unresolved-threshold и production/machine safety gates остават непроменени. След независимия audit е добавен само **V8.3.1 Audit Metadata & Reproducibility Hardening** maintenance слой; той не променя geometry, Composer state или production authority. Историческите секции по-долу остават phase-specific запис; текущият status е в [Current Architecture Status](docs/CURRENT_ARCHITECTURE_STATUS.md).

### AI01 → AI04 — human-authority pipeline

1. **AI01 — Prompt Intelligence**: локална детерминирана интерпретация на natural-language вход към общия `FacadeFlowProductIntent`. Липсващи/нееднозначни стойности остават unresolved; няма LLM/API/model call, automatic Human Confirm или production output.
2. **AI02 — Project Document Intelligence**: source-bound document intake, provenance, explicit product candidates, corroboration и conflict review към същия canonical Product Intent. Противоречащи evidence стойности не се разрешават автоматично и AI02 не създава автоматично geometry.
3. **AI03 — Parametric Construction Proposal**: от Product Intent се създава пропорционално концептуално предложение с полета, делители, налична opening semantics, assumptions и unresolved engineering/details. AI03.5 е UI-only closure polish и не променя inference/evidence/geometry logic. Предложението може да бъде `BLOCKED`, `NEEDS_REVIEW` или `HUMAN_REVIEWED`, но AI03 не го приема автоматично и не го записва директно в конструктора.
4. **Human Review**: човешкото потвърждение е задължителната authority boundary между AI предложение и editable constructor geometry.
5. **AI04 — Human-Approved Proposal → Editable Constructor Geometry**: editable Custom Product Designer draft се създава само след `HUMAN_REVIEWED` AI03 proposal и отделно explicit human acknowledgement. Поддържат се само semantics, които AI04 V1 може да представи безопасно; profile transfer се допуска само при exact selectable catalogue match. След handoff нормалните constructor validation и human review продължават.

AI04 handoff **не** означава engineering или production approval: `rulesValidated=false`, `machineReady=false` и `productionApproved=false` остават заключени. Няма automatic constructor handoff и няма machine output.

### Phase 06C — guided review, catalogue evidence и rule gates

Phase 06C добавя Guided Product Builder, explicit AI→constructor review UX, human-confirmed profile roles, real/demo catalogue visibility, project/product data model и детерминирани rule-source / applicability / evaluation / aggregation foundations. Aggregate state `REVIEWED_COMPLETE` означава само, че наличният evaluation set е прегледан от човек без reviewed `FAIL`; той **не** е синоним на `rulesValidated` и не отключва handoff, production или machine readiness.

### REAL DATA BATCH 01 / WP78 и RP01

WP78 свързва project-system evidence, catalogue visibility, evidence-aware rule review и context-level human decisions. Дори `VALIDATED_FOR_CONTEXT` остава context-only и не създава generic validation, production approval или machine readiness.

RP01.21 затваря и консолидира RP01.1–RP01.20. Текущият real corpus съдържа един реален проект (`Вадим-2`), затова real cross-project corroboration не се твърди. RP01 остава ограничен до `EVIDENCE_ONLY`, `SIMULATION_ONLY` и `READ_ONLY` authority groups; не дава engineering authority, production executable state или machine integration. След RP01.21 следваща major фаза изисква нов explicit human plan и отделна acceptance boundary.

### Clean verification gate

Единственият canonical repository verification command е:

```bash
npm ci
npm run verify
git diff --check
git status --short
```

`npm run verify` включва автоматично всички **shareable** `tests/*.test.ts` чрез `npm run test:regression`, като умишлено изключва `*.internal.test.ts`, след което изпълнява lint и production build. Private RP01 evidence regression е отделен чрез `npm run test:internal-evidence` и се включва в `npm run verify:internal` само когато locked `local-samples/phase05a` evidence е наличен. Така SHAREABLE_CLEAN checkpoint остава самостоятелно възпроизводим, без да публикува private production evidence.

За clean ZIP има два explicit режима:

```powershell
npm run checkpoint:shareable
npm run checkpoint:internal
```

`checkpoint:shareable` изпълнява shareable `npm run verify`, изисква clean Git state и доказан `0 0` sync към `origin/<branch>`, и изключва private evidence (`local-samples/`, DWG/LTE). Shareable checkpoint не може да се създаде с `-SkipVerify`. `checkpoint:internal` изпълнява `npm run verify:internal` и може да запази private evidence само за контролиран вътрешен audit. Всеки checkpoint съдържа `CHECKPOINT_CONTENT_SHA256.txt` и payload SHA-256 в manifest-а; ZIP entries са с deterministic order/fixed timestamp, така че payload provenance не зависи от името или часа на package-ване.

## PRELUDE 60 / Visual Composer current hardening

PRELUDE 60 bridge използва 482.30 като FRAME (64/42 mm), 482.21 като MULLION (84/40 mm) и 482.05 като WINDOW SASH с човешки потвърдена базова геометрия 78/56 mm. Това не промотира effective assembly width за крилото. Стъклодържателят остава отделен, вариращ и засега немоделиран параметър: има прегледан пример 20 mm, а 22 mm е често срещана стойност, но не е универсална константа и не се извежда от разликите 22/44 mm. Работният 7 mm overlap е отделен параметър и се прилага само при explicit selected sash; няма global fallback. Template divider geometry използва numeric `positionRatio`, така че Triple 1/3 и 2/3 не зависят от закръглените display labels 33.33% / 66.67%. Каталожните door-sash 482.26 / 482.27 остават unmapped и не се активират автоматично.

## Работна конфигурация на прозорец / врата

Visual Composer вече е работна среда, а не отделен user-facing DEMO режим. Име + положителни общи размери са достатъчни, за да се започне работа. Профилна система, каса, крило и делител могат да останат „Не е избрано“ и да се попълнят по-късно от десния панел. Unknown стойности не се измислят. Предварително избраната 2/3/4-полева композиция се зарежда автоматично; generic entry остава празен. При врата прагът остава `UNRESOLVED` и production/machine readiness остава `false`. Стъклопакет/стъклодържател 20/22 mm не се моделират или изчисляват автоматично в този слой.

## Профилен каталог и нестандартен прозорец

Прототипът включва in-memory каталог за каса, крило и делител и структуриран конструктор с рекурсивно вертикално/хоризонтално разделяне. `DEMO-FRAME-01`, `DEMO-SASH-01` и `DEMO-MULLION-01` са placeholders, не реални каталожни данни. „Размер A/B“ са временни имена и не участват в производствени формули.

Изберете „Каталог на профилите“ за профилите или „Начертай нестандартен прозорец“ за custom geometry. Компонентите могат да се отварят в operation workspace, но nominal spans не са размери за рязане.

## Концептуален 3D преглед

Структурираните REF и custom изделия имат 2D/3D/split превключване. 3D работи локално чрез Three.js, предлага orbit/zoom/pan, camera presets, visibility и exploded controls. Дълбочината е отделна view-only демонстрационна стойност 70 mm и не използва Размер A/B. При липсващ WebGL приложението автоматично се връща към 2D.

## Синхронизирани размерни означения

2D и 3D използват един dimension model от текущата structured geometry. Общи/field размери, divider позиции и selected nominal length се показват в mm и могат да се скриват само като view setting. Няма cutting deductions или tolerances. Import-derived стойности стават annotations единствено след индивидуално човешко потвърждение; unresolved evidence не се гадае.

Безопасен визуален прототип за подготовка на операции върху един алуминиев профил. Позволява примерни размери, позициониране на пробивания и фрезования и визуална проверка на реда им.

## Стартиране

```bash
npm install
npm run dev
```

Локална production версия: `npm run local`. Под Windows double-click върху `START_FACADEFLOW_LOCAL.cmd` отваря Nadezhda-branded dedicated Edge/Chrome app window с изолиран project-local profile. Затварянето му спира само matching server и затваря launcher terminal-а; `npm run local:serve` остава manual Ctrl+C режим. `CREATE_FACADEFLOW_DESKTOP_SHORTCUT.cmd` създава shortcut със supplied ICO. На нов компютър използвайте Node.js 22.12.0 като reference runtime (`.nvmrc` / `.node-version`); `package.json` допуска поддържаните Node 20.19 / 22.12+ / 24 линии и npm 10/11. След това е необходимо еднократно `npm install` (или `npm ci` за clean verification).

Пълна проверка: `npm run verify`. Подробности и troubleshooting: [Локално стартиране под Windows](docs/LOCAL_WINDOWS_START_BG.md).

## Възможности

- параметри на проект и тестов профил;
- лява или дясна отправна точка;
- SVG визуализация с мащабирани X позиции;
- добавяне, редактиране, изтриване и пренареждане на операции;
- проверки с ясни съобщения на български;
- локален export на `.simulation.json`.
- отделна пропорционална визуализация на фиксиран, еднокрил или двукрил прозорец;
- демонстрационен компонентен списък и печат чрез стандартния browser print dialog.
- избор на детерминиран детайл от изделието и отварянето му в работната зона;
- независими операции за всеки детайл, отделени и от самостоятелния профил;
- component-aware `.simulation.json`, съдържащ само избрания детайл и неговите операции.
- визуална библиотека с девет демонстрационни конструктивни схеми;
- генерирани от общ типизиран модел миниатюри, голям preview и компонентни списъци.
- единна типизирана нотация за фиксирани полета и огледални двулинейни триъгълни символи.
- референтно извлечен каталог от 17 параметрични схеми в пет категории;
- отделна безопасна нотация за демонстрационни посоки на плъзгане;
- изрично прилагане на препоръчителни демонстрационни размери без автоматична подмяна.
- локален import workspace за PDF, PNG и JPG/JPEG технически скици;
- безопасен PDF преглед, навигация по страници, zoom и локален SHA-256;
- ръчно заснемане, проверка, филтриране и дублиране на изделия с проследимост към източника;
- зареждане във workflow само на записи със статус `VERIFIED`;
- локален `.drawing-import.simulation.json` export без оригиналния файл.
- избор на зона върху образ или PDF страница и локално assisted OCR чрез Tesseract.js;
- суров и нормализиран OCR текст, confidence, типизирани размерни предложения и in-memory audit trail;
- изрично приемане, целево поле и човешко потвърждение преди прилагане на предложение.
- отделен режим „Избери изделие с размерите“ за комбиниран локален review пакет;
- top-three REF предложения чрез детерминирано сравнение на aspect ratio, секции, делители и coarse edge features;
- OCR box traceability, предложения за общи размери/количество/референция и финален human-confirmation gate.
- единен локален импортен център с предварителен избор на IMAGE, PDF, CAD, TABULAR или FacadeFlow simulation маршрут;
- обща проверка на signature, extension, MIME, размер и SHA-256 преди route dispatch;
- безопасен DWG/DXF header inspection и foundation metadata екран без CAD parsing или conversion.
- вграден български Help Center с търсене, 12-стъпков quick start, guided tour и keyboard-accessible contextual help;
- безопасен loopback Windows launcher и Node static server само за production `dist`, без backend API;

## Ограничения и безопасност

Това е само UI симулация. Няма backend, база данни, автентикация, мрежова комуникация или машинна връзка. Прототипът **не трябва да управлява, свързва или изпраща данни към машина**. Не създава LTE, XM, G-code, CNC или MECAL файлове и не прави предположения за реални производствени формати.

Phase 02A/02B/02C използва само опростена демонстрационна геометрия. Номиналните дължини, ориентациите, схемите и примерните ъгли не са производствени изчисления и изискват проверка от технолог. Локалната координатна система на детайла не е машинна координатна система. Номерата на схемите не съответстват на външен каталог.

Посоката на триъгълния символ в Phase 02D е демонстрационна. Изгледът отвътре/отвън и страната на пантите предстоят за потвърждение от технолог. Placeholder типовете за накланяне и комбинирано отваряне не се визуализират като потвърдена нотация.

Phase 02E пресъздава референтните концепции параметрично, без да вгражда или разпространява външното растерно изображение. Стрелките при плъзгащите конструкции не потвърждават обков, релси или производствена конфигурация.

Phase 03A обработва избрания PDF или образ само в паметта на браузъра. Файлът не се качва и не се записва в `localStorage` или `IndexedDB`. Няма OCR, AI разпознаване, автоматично измерване, извличане на мащаб, DXF/DWG parsing или автоматичен избор на профил. Потребителят въвежда всички продуктови данни ръчно. Вградените PDF действия, връзки, скриптове и прикачени файлове не се изпълняват.

Phase 03B добавя само подпомагащи OCR предложения. Tesseract worker, baseline WASM core и English trained data са локални assets; cache е изключен и няма CDN или външна OCR услуга. Поддържат се English/Latin текст и числа. Българският trained-data пакет не е включен в тази фаза. OCR резултатът е недоверено доказателство: никога не се прилага автоматично и не избира схема, категория, профил или производствени настройки.

Phase 03C комбинира потвърдена crop зона на изделие, размерни линии и означения. Сравнението с REF-01–REF-17 използва само съществуващата типизирана демонстрационна геометрия и прости explainable features; не се използва trained geometry model. Сходството не е вероятност. Схема и размери се прилагат само след отделни решения и checkbox „Проверих схемата и размерите по оригиналния чертеж.“

След ръчно стартирания Phase 03C анализ може да се създаде автоматично попълнена, но непроверена editable чернова. Тя винаги е `NEEDS_REVIEW`, не създава операции и не се зарежда в component workflow преди отделната проверка на схема и всички размери. Автоматично откриване на множество изделия върху цяла страница остава извън тази фаза.

JSON export-ът е означен с `simulationOnly: true`. Вижте [границата за безопасност](docs/SAFETY_BOUNDARY.md), [Phase 03D](docs/PHASE_03D_ACCEPTANCE.md), [Phase 03D.1 Help](docs/PHASE_03D_1_HELP_ACCEPTANCE.md), [ръководството](docs/USER_GUIDE_BG.md) и [матрицата на форматите](docs/IMPORT_FORMAT_MATRIX.md).

Конструкторът за нестандартно изделие следва експертно потвърден ред: валидни общи размери, създаване на външна каса, делители, отделно създадени крила, посоки само върху тези крила, човешка проверка и едва след нея концептуален 3D преглед. REF шаблоните и проверените импорти се представят чрез същия структуриран модел. Това не добавя производствени формули или машинна готовност.

## Phase 05A — SkyGlazing read-only проверка

Unified import center поддържа изрично избрани локални SkyGlazing XML и LTE файлове за inert структурна проверка и barcode-only сравнение. XML с DOCTYPE/ENTITY се отхвърля. LTE fixed-width полетата извън наблюдаваните tokens остават `UNRESOLVED`.

Phase 05B добавя отделен локален read-only DWG viewer чрез `@mlightcad/libredwg-web@0.7.10`/LibreDWG WASM. Той е разрешен само като непрехвърляем вътрешен evaluation прототип: **INTERNAL EVALUATION ONLY — EXTERNAL DISTRIBUTION NOT APPROVED**. Преди публикуване, deploy, продажба, прехвърляне или друго разпространение е задължителен нов GPL/правен преглед. Viewer-ът не редактира, не конвертира и не експортира DWG и не създава изделия или операции. Вижте [license review](docs/PHASE_05B_DWG_VIEWER_LICENSE_REVIEW.md) и [acceptance](docs/PHASE_05B_DWG_VIEWER_ACCEPTANCE.md).

Източниците остават in-memory с SHA-256 provenance, `simulationOnly: true` и `machineReady: false`. Няма XML/LTE/DWG export, автоматично създаване на изделия или операции, backend, upload, network request или machine communication. Реалните evidence файлове в `local-samples/` са private и игнорирани от Git. Вижте [Phase 05A acceptance](docs/PHASE_05A_SKYGLAZING_READ_ONLY_ACCEPTANCE.md).

## Phase 06B.1 — AI-ready visual shell

FacadeFlow има отделен локален AI-ready workspace за бъдещи проектни документи, natural-language заявки, скици, единични поръчки и технически детайли. В тази фаза AI модел не е свързан: няма автоматична геометрия, backend или производствен изход. Human review, rules validation и source evidence са задължителни граници. Виж `docs/PHASE_06B_1_AI_READY_VISUAL_SHELL_ACCEPTANCE.md`.


## Phase 06B.2.1 + 06B.2.2 — Unified CAD + AI Visual System

Главният shell и AI launchpad използват общ industrial/CAD визуален език с локални outline SVG иконки, blueprint previews и компактна навигация. Това е само UX/визуална фаза: AI моделът остава `NOT_CONNECTED`, автоматична геометрия не е разрешена и съществуващите import/designer/CAD callbacks не са променени. Виж `docs/PHASE_06B_2_1_2_UNIFIED_CAD_AI_VISUAL_ACCEPTANCE.md`.

## Phase 06B.2.3 — Unified FacadeFlow Workspace Shell

AI еталонът вече определя общия shell за Конструктор, Импорт, Каталог, Помощ и Custom CAD: единен технически header, еднакъв back action, Nadezhda logo горе вдясно и full-workspace поведение вместо големи modal прозорци върху основния екран. Вътрешните CAD/document viewport-и запазват локалния си scroll/pan/zoom там, където е функционално необходим. Виж `docs/PHASE_06B_2_3_UNIFIED_WORKSPACE_SHELL_ACCEPTANCE.md`.
