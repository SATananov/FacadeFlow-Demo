# Граница за безопасност

## Phase 04A/04B

Профилният каталог е in-memory симулация без SQL, база данни, `localStorage` или IndexedDB. Размер A/B са непотвърдени неутрални стойности и не се тълкуват като ширина, дълбочина или производствен параметър.

Конструкторът изчислява само правоъгълни полета и nominal spans. Няма сглобки, отнемания, ъгли, просвети, glazing/gasket deductions, machining allowances или optimization. `VERIFIED` е човешки преглед на симулация; `machineReady` остава `false`. Export-ите са само simulation JSON — без машина, backend или network.

## PROFILE DATA 01.1–01.2A V8 — PRELUDE 60 effective geometry boundary

PRELUDE 60 вече има ограничен source-backed application bridge, но това **не** е производствена геометрия. 482.30 (каса) е човешки потвърдена като 64 mm височина / 42 mm видима ширина, 482.21 (делител) като 84/40 mm, а 482.05 (WINDOW крило) като 78/56 mm базова профилна геометрия. Потвърдените 78/56 mm не се приемат автоматично за effective assembly width на крилото в конкретна сглобка.


Разликите в потвърдените базови размери са 22 mm при касата (64-42), 22 mm при крилото (78-56) и 44 mm при делителя (84-40), но тези аритметични разлики **не** са универсална формула за стъклодържател. Прегледан пример показва стъклодържател 20 mm, а технологът посочва 22 mm като масово срещана стойност. Затова glazing-bead размерът е `DEFERRED_NOT_MODELED`: не се избира, не се изчислява, не се извежда от 22/44 mm и не участва в геометрията на V8.2. Той е отделен и от 7 mm sash overlap.

Работната стойност 7 mm за PRELUDE застъпване на крилото е системен, човешки прегледан параметър, но остава editable и изисква exact production confirmation. Няма global fallback. Застъпване не се прилага без изрично избран съвместим SASH профил и не се извежда от Размер A/B.

Visual Composer използва канонични числови `positionRatio` стойности за геометрията на template делителите. Процентният `placement` текст е само presentation label и не е geometry source. Това предотвратява закръгляване като 33.33% да разкъсва adjacency при триполеви изделия.

Текущият application bridge маркира PRELUDE 482.05 като WINDOW sash. Той не трябва да се предлага или приема като DOOR sash. Каталожните 482.26 и 482.27 остават `CATALOG_ONLY_UNMAPPED` и не се активират, докато технолог не потвърди ролята и нужната геометрия. В V8.3 WINDOW и DOOR влизат в една работна конфигурация с текущите налични данни; липсващите стойности остават празни. При DOOR `thresholdStatus = UNRESOLVED` остава видим и блокира производственото/пълното техническо потвърждение, без да блокира работата по композицията.

Всички тези слоеве запазват `machineReady: false` и `productionApproved: false`; не създават cutting deductions, machining dimensions, machine export или production authorization.


## PROFILE DATA 01.2A V8.3 — working configuration boundary

Работният конструктор е достъпен след име на изделието и положителни общи размери, дори ако профилната система или някои профили още не са известни. Това е permission за редактиране на непълна конфигурация, а не техническо одобрение. Празните полета не се попълват с fallback, примерни или inferred стойности.

WINDOW и DOOR използват текущата structured конфигурация директно. Старият отделен user-facing Door DEMO gate не е authority boundary. Строгият `validateStructuredConfiguration` / Human Confirm остава отделен и не се отслабва. При врата прагът остава `UNRESOLVED`, а acknowledgement-ът в Composer потвърждава само, че човекът разбира това ограничение.

Стъклопакетът и стъклодържателят остават deferred. Нито 20 mm, нито 22 mm се въвеждат или изчисляват автоматично. Това остава отделно от 7 mm PRELUDE sash overlap.

## Phase 04C

3D е концептуална проекция само от structured product data. `conceptualDepthMm` не произлиза от Размер A/B. Няма точни сечения, hardware модел, производствена геометрия или 3D production export. Three.js ресурсите са в локалния bundle; няма CDN/cloud viewer. Scene metadata е `conceptualOnly: true`, `productionGeometryApproved: false`, `machineReady: false`.

## Phase 04D

2D/3D annotations са един view-only слой от project geometry. Няма production deductions, tolerances или exact section. OCR/CAD/manual dimension evidence пази immutable source traceability; само individually accepted и human-confirmed values участват. Unresolved/conflicting стойности не се прилагат и `machineReady` остава `false`.

FacadeFlow Demo Phase 01 + Phase 02A–02E + Phase 03A е локален визуален прототип. Файловите export-и са единствено четими симулационни JSON файлове с `simulationOnly: true`, включително `.drawing-import.simulation.json`. Прегледът на изделието може да се отпечата само чрез стандартния диалог на браузъра.

## Изрично извън обхвата

- връзка, управление или команди към производствена машина;
- backend, база данни, акаунти или автентикация;
- изпращане на данни по мрежа;
- LTE, XM, G-code, CNC или MECAL файлове;
- предположения за реални MECAL формати;
- гаранция за производствена или машинна годност.
- реални производствени формули или одобрени разкрои.

Експортираният JSON и продуктовата визуализация не са производствени данни и не трябва да управляват оборудване. Геометрията, дължините и ъглите в Phase 02A са демонстрационни и изискват проверка от технолог.

Ориентацията и X координатите на избран детайл в Phase 02B използват локална демонстрационна координатна система. Те не описват и не трябва да се съпоставят автоматично с оси на MECAL или друга машина. Данните се пазят само в паметта на текущата browser сесия.

Схемите в Phase 02C представят единствено конструктивни концепции. Номерата им са вътрешни за демонстрацията и не съответстват на външен каталог или технологична класификация. Полетата, делителите и символите не представляват производствено одобрен проект.

Триъгълните символи в Phase 02D показват само демонстрационна посока. Те не потвърждават изглед отвътре/отвън или страна на пантите. Нотациите `TILT_PLACEHOLDER` и `TILT_TURN_PLACEHOLDER` са резервирани типове и не представляват проверени технологични символи.

Каталогът `REF-01`–`REF-17` в Phase 02E е извлечен като параметрична конструктивна концепция от визуална референция. Растерната референция не се вгражда, копира или разпространява. Категориите, пропорциите, долните панели и плъзгащите стрелки не са одобрена производствена класификация, обков или релсова конфигурация и изискват човешко одобрение.

## Phase 03A — граница на импорта

- PDF, PNG и JPG/JPEG се четат локално и остават само в паметта на отворената страница.
- Оригиналните файлове не се записват в `localStorage`, `IndexedDB`, backend или cloud услуга.
- PDF.js получава единствено локален byte buffer. Приложението не визуализира интерактивен PDF annotation слой и не изпълнява действия, скриптове, връзки или прикачени файлове.
- SHA-256 се изчислява локално чрез Web Crypto API и служи само за проследимост.
- Не се извършва OCR, AI анализ, автоматично измерване, извличане на мащаб, автоматичен избор на схема/профил или PDF-to-machine преобразуване.
- Само човешки проверен запис със статус `VERIFIED` може да бъде зареден в продуктовия workflow. Промяна на размер или схема връща статуса към `NEEDS_REVIEW`.
- Import export-ът съдържа метаданни, hash и ръчно въведени записи, но не съдържа оригиналния PDF/образ. Той е маркиран с `machineReady: false` и `requiresHumanApproval: true`.

## Phase 03B — граница на OCR предложенията

- OCR се изпълнява локално с пакетирани Tesseract.js worker, baseline WASM core и English trained data. Няма CDN, external AI/OCR API или backend endpoint.
- OCR cache е изключен (`cacheMethod: none`); source, crop, jobs и audit trail не се пазят в `localStorage` или `IndexedDB`.
- OCR разпознава English/Latin текст и числа. Кирилицата не е поддържана в Phase 03B и това ограничение е видимо за потребителя.
- Суровият OCR текст остава непроменено evidence. Нормализацията и parser предложенията се показват отделно.
- Нито едно предложение не се приема или прилага автоматично. Изискват се единично приемане, избор на целево поле и българско потвърждение със стара и нова стойност.
- OCR няма целеви достъп до template ID, category, profile system/code, component operations, machine settings или verification status.
- Промяна на ширина или височина на VERIFIED чернова използва съществуващата защита и връща `NEEDS_REVIEW`.
- OCR evidence се добавя само като optional section в `.drawing-import.simulation.json`, маркиран с `ocrAutomaticallyApplied: false`, `machineReady: false` и `requiresHumanApproval: true`.

## Phase 03C — граница на комбинирания анализ

- Комбинираният анализ работи само върху изрично потвърдена локална crop зона и не променя оригиналния source.
- Geometry ranking използва детерминирани coarse image features и typed REF-01–REF-17 геометрия. Не използва trained geometry model, cloud AI или външна референция.
- „Демонстрационно сходство“ не е вероятност, класификация или автоматично решение.
- OCR bounding boxes, dimension orientation и parser стойности са проследими предложения. Не се извличат мащаб или милиметри от pixels.
- Нито схема, нито размер се приемат автоматично. Прилагането изисква решения за предложенията и финално човешко потвърждение по оригинала.
- Profile system/code, component operations и machine settings не са target fields на комбинирания анализ.
- Optional combined export evidence остава в `.drawing-import.simulation.json` с `automaticallyApplied: false`, `trainedGeometryModelUsed: false`, `machineReady: false` и `requiresHumanApproval: true`.

## Phase 03D Foundation — граница на единния импортен център

- Всички маршрути четат избрания файл локално и създават само in-memory source session с `simulationOnly: true`, `machineReady: false` и `requiresHumanApproval: true`.
- Signature, extension, MIME, size и SHA-256 се проверяват преди route dispatch; името на файла никога не е единствено основание за доверие.
- IMAGE/PDF използват съществуващите локални Phase 03A–03C потоци.
- DWG/DXF са ограничени до header/signature metadata. Няма CAD entity parsing, render, conversion, shell execution, external iframe, cloud upload или online converter.
- CSV/XLSX и FacadeFlow simulation JSON са foundation inspection маршрути без product creation, column mapping или session restore.
- Import center не създава операции, не избира реални профили и не променя machine readiness.

## Phase 03D.1 — граница на помощта

- Help Center, guided tour и contextual popovers са read-only UI слой без достъп до project/product/profile/operation setters.
- Обиколката само намира елементи чрез стабилни `data-help-id`, scroll-ва и маркира; никога не задейства целта.
- Няма persistence на completion/activity, analytics, tracking, network или автоматичен fixture import.
- Обясненията разграничават човешкото `VERIFIED` от технологично одобрение и винаги оставят `machineReady: false`.

## Phase 03E — граница на локалния launcher

- Custom Node server обслужва само `dist` и bind-ва изключително към `127.0.0.1`; не е backend API и няма upload/write/mutation route.
- Launcher-ът не инсталира dependencies, не иска administrator права и не променя firewall, execution policy или Windows startup.
- Няма LAN/wildcard bind, online tunnel, external CDN, telemetry, analytics, log files или remote logging.
- Localhost badge обозначава начина на стартиране, но не променя `simulationOnly`, human-review gates или `machineReady: false`.
- Ctrl+C или затваряне на притежаващия terminal спира приложението; няма service, tray, background restart или отделен stop launcher.

## Phase 03E.1 — граница на managed app window

- Dedicated browser използва уникален `.facadeflow-runtime` profile, а не normal user profile; няма extensions, remote debugging или automation port.
- Manager следи server child-а по direct IPC/process handle и browser instance-а по direct spawned process handle с уникален profile.
- Cleanup може да спре само direct child PID-а, който manager-ът е създал; няма WMI, broad process-name или image-name termination.
- Browser/app failure спира новия server; server failure не стартира browser. Няма shutdown HTTP endpoint.
- Branding и Desktop shortcut не променят registry, firewall, execution policy или Windows startup и не превръщат проекта в инсталирано приложение/EXE.

## Phase 05A — SkyGlazing XML/LTE read-only граница

- XML и LTE се четат само след изричен локален избор и остават като immutable bytes/evidence в паметта на текущата browser сесия.
- XML parsing е inert: `DOCTYPE`/`ENTITY` се отхвърлят, няма external resolution, script/link execution, HTML injection или външна XML библиотека.
- LTE има само наблюдавани profile/raw-length/barcode ranges. Всички други fixed-width диапазони остават `UNRESOLVED` до експертно потвърждение.
- XML ↔ LTE matching е авторитетно само за точно trim-нато barcode presence. Не се извеждат length/angle/machining конфликти.
- XML Work записите никога не създават операции; данните не се зареждат в product/component workflow.
- Phase 05B разрешава локално read-only DWG decoding/rendering само за вътрешна evaluation среда чрез изолиран GPL LibreDWG worker. Външно разпространение не е одобрено. Няма edit, conversion, export или предположение, че DWG принадлежи към избраната XML/LTE двойка.
- Приблизителният DWG text режим е само canvas display heuristic за вътрешна четимост. Той използва доказани видими LINE/polyline рамки, живее в React memory и не променя source evidence, decoder entities, imports, XML/LTE comparison, изделия, компоненти, операции или export. `APPROXIMATE_FIELD` не е DWG truth или производствена готовност; source-faithful режимът остава достъпен и Layout1 остава BLOCKED.
- Ръчната DWG визуална корекция е отделен session-only derived display state. Тя изисква явен избор на MTEXT и доказано поле, не променя DWG/source evidence и не се persist-ва или export-ва. `MANUAL_APPROXIMATE_FIELD` винаги е `humanConfirmed: true`, `simulationOnly: true`, `machineReady: false` и `internalEvaluationOnly: true`; clear/reload/new file го премахва.
- Няма XML/LTE/DWG edit или export. Всички модели са `simulationOnly: true`, `machineReady: false`.
- Реалните evidence файлове са защитени чрез `local-samples/` и никога не влизат в Git, `public/` или `dist`.
