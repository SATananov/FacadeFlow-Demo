# Phase 06A.4 — Visual Template Composer Foundation

## Реализирано и UX поток

- Потвърдена валидна конфигурация за прозорец отключва „Отвори визуалния конструктор“. Непотвърдена конфигурация и врата с неразрешен праг остават блокирани.
- Composer-ът е desktop-first работно място с breadcrumb/header, библиотека, концептуално SVG поле, свойства и toolbar за Undo, Redo и потвърдено изчистване.
- Връщането към конфигурацията и повторното отваряне пазят композицията само докато full-screen React сесията остава mounted.
- Шест DEMO шаблона имат стабилни ID: фиксиран, еднокрилен, двукрилен, трикрилен, с горен фикс и с долен фикс.
- Шаблоните определят само полета и делители. Всички полета започват без opening direction, дръжка или панти; отваряемите полета изискват изричен човешки избор на посока.
- Библиотеката съдържа семантични делители, типове полета, шест opening нотации и DEMO placeholder дръжка/панти. 3D е disabled и означено „Предстои“.

## Semantic ownership и validation

- Шаблонът създава полета със stable field ID и нормализиран визуален rectangle, field type, opening direction, attached handle/hinge ID и human review state.
- Всеки поставен компонент има stable session ID, parent field ID, role, placement, `source: DEMO`, `simulationOnly: true`, `machineReady: false` и `productionApproved: false`.
- Координатите служат само за концептуално SVG представяне; semantic records са източникът на състояние.
- Отваряне, дръжка и панти се отхвърлят върху фиксирано поле. Има максимум една дръжка; пантите са отделни ръчно добавени семантични компоненти без автоматичен брой.
- Всяка панта има собствено session ID, родителско поле, страна според изрично избраната посока и ограничена концептуална позиция `0..1`. Може да се избира, изтрива и мести вертикално чрез drag-and-drop или клавиатурно достъпния контрол в панела със свойства.
- Фиксиране е явно потребителско действие и премахва несъвместимите opening/hardware назначения. Невалидно действие не мутира полета или компоненти и показва съобщение.
- Редакция след `HUMAN_CONFIRMED` връща `NEEDS_REVIEW` и human review state на полетата се нулира.
- `OPENABLE` поле без посока блокира потвърждението. В SVG няма opening символ и се показва „Посоката не е избрана“.
- Undo/Redo използват session snapshots; clear изисква browser confirmation.

## Достъпност

- Шаблоните и компонентите поддържат drag-and-drop, но същите semantic actions са достъпни чрез избор от библиотеката, избор на поле и „Добави към избраното поле“.
- SVG полетата са keyboard-focusable и се избират с Enter/Space. Статусните съобщения използват `aria-live`.
- Изборите и disabled действията не разчитат само на цвят.

## Safety граници и ограничения

- Постоянно се показва „Концептуална 2D композиция — не е производствен чертеж.“
- Заключени са `sessionOnly: true`, `simulationOnly: true`, `machineReady: false`, `internalEvaluationOnly: true`, `productionApproved: false`, `sourceImmutable: true`, `exportAvailable: false`, `dwgWriteAvailable: false`, `machineConnectivityAvailable: false` и `geometryCreated: false`.
- Няма persistence, backend, database, network, telemetry, export, DXF/DWG writer, machine connection, производствени формули, профилни сечения, реални офсети, фуги, допуски, размери за рязане, количества или операции.
- Профилите остават текущите in-memory DEMO selections от потвърдената конфигурация. Дръжките и пантите не са реални каталожни артикули.
- Composer-ът не разделя ръчно поле на нови производствени полета; добавеният делител е само semantic DEMO placeholder. Реална recursive topology редакция остава бъдеща отделно одобрена фаза.

## Автоматизирано приемане

- `npm run test:phase06a4` покрива stable IDs, шаблони, semantic fields/components, validation, hardware maxima, invalid no-mutation, snapshot history, clear, mounted-session повторно отваряне, human review reset, door gate, safety и keyboard-equivalent action.
- Пълните резултати от Phase 05A–06A.4, lint, build, whitespace и privacy/network сканиранията са в финалния implementation отчет.
