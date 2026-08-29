# Phase 06A.7 — интерактивна концептуална 3D визуализация

## Обхват

Прозоречният и вратният semantic composer споделят един Canvas 2D-базиран концептуален 3D preview. Достъпните tabs `2D` и `3D` не променят композицията, history или review статуса. `3D` е недостъпен преди поставяне на шаблон и показва същите stable semantic field и hardware ID.

## Scene модел и DEMO дълбочини

Pure adapters изграждат `ConceptualScene` директно от текущото window/door състояние. Nodes описват каса, крила, делители, стъкло, плътни панели, дръжки, панти и предупредителна линия за праг. Всеки node е `conceptualPreviewOnly: true` и `productionGeometry: false`; глобално `geometryCreated: false`.

Unitless константите за frame, sash, glass, panel и hardware depth са само за визуален обем. Те не са милиметри, не се записват като product data и не представляват профилни сечения, дебелини, фуги или производствени сглобки.

## Прозорци и врати

Window adapter показва външна каса, фиксирани и отваряеми полета, крила, стъкло, semantic делители и ръчно добавен hardware. Door adapter показва едно/две крила, странични и горни фиксове, плътен, остъклен и комбиниран пълнеж, multiple hinges и максимум една дръжка. При врата постоянно присъства `Праг: НЕРАЗРЕШЕН`; не се създава 3D threshold profile.

Предната страна използва текущия DEMO външен цвят, задната — вътрешния. Неизбраните цветове имат неутрален preview. Стъклото е леко прозрачно, а панелът — непрозрачен. Не се използват RAL или texture assets.

Browser дефектът със сивите профили беше причинен от renderer fallback `#72878b`, прилаган безусловно върху пет от шестте depth-sorted faces. Поправеният pipeline е: semantic color ID → централизирано DEMO mapping → front/back material → pure RGB shading за всяка face → Canvas `fillStyle`. Няма общ сив заместител за страничните faces.

DEMO mapping: `WHITE → #f4f4ef`, `ANTHRACITE → #465156`, `BLACK → #20272a`, `BROWN → #79533c`, `SILVER → #b9c2c4`; неизбран и `CUSTOM` използват неутрално `#8a989b`. Свободното CUSTOM описание остава текст в properties и не се разпознава като реален цвят. Glass използва собствените `#b9e1e7/#ccecf0` с conceptual прозрачност, hardware остава контрастно `#26383c`, а solid panel използва лек нюанс на текущата видима страна.

## Камера и гледни точки

Локалният session-only view state съдържа `yaw`, `pitch` и `zoom`. Pointer drag използва capture; pointer up освобождава capture, pointer cancel завършва безопасно, а Escape възстановява камерата отпреди текущия drag. Pitch и zoom са ограничени. Wheel се прихваща само върху canvas.

Готовите гледни точки са `Отпред`, `Отзад`, `Отляво`, `Отдясно`, `Изометрия`, `Побери в изгледа` и `Нулирай изгледа`. Отпред използва външния, а отзад вътрешния цвят. Camera actions не създават Undo записи и не reset-ват review.

## Selection и accessibility

Screen-space hit testing избира field, sash, glass/panel, handle или hinge чрез съществуващия semantic ID. Изборът се запазва при връщане в 2D и не е semantic edit. Малкият hardware има screen-space tolerance. Декоративни frame части и threshold warning не са selectable.

Canvas има `tabIndex`, описателен Bulgarian `aria-label`, видим focus и клавиши: стрелки, `+`, `-`, `0`, `F`, Escape. Извън canvas има инструкции и semantic fallback списък за избор без hit testing.

## Rendering, responsive и performance

Canvas е HiDPI-aware чрез CSS размер, `devicePixelRatio` и `ResizeObserver`. Използват се pure projection, painter/depth sorting, conceptual shading и selected highlight. Прерисуване се планира само при dirty dependency чрез единичен `requestAnimationFrame`; няма постоянен animation loop. Observer и pending frame се cleanup-ват.

Safety предупреждението е компактен ред в нормалния layout над canvas, а допълнителните обяснения са в keyboard-accessible `<details>`. Няма floating overlay върху продукта. Opening label се създава само върху semantic `SASH`: комбинираният glass/panel пълнеж не го дублира, fixed glazing няма label, а двойната врата има максимум по един label за всяко крило.

Първото отваряне изчислява fit от projected bounds, наличните width/height и безопасен padding. Същата pure функция обслужва `Побери в изгледа`, Reset и presets. Resize запазва ръчно избраната камера, когато сцената остава изцяло видима, и преизчислява fit само ако продуктът би излязъл извън viewport-а. Не се използва независимо X/Y разтягане.

Desktop запазва library/canvas/properties структурата и независимия scroll. Controls wrap-ват при ограничена ширина. Narrow layout позволява нормален page scroll без хоризонтално преливане.

## Safety

Запазени са `sessionOnly: true`, `simulationOnly: true`, `machineReady: false`, `internalEvaluationOnly: true`, `productionApproved: false`, `sourceImmutable: true`, `geometryCreated: false`, `exportAvailable: false`, `dwgWriteAvailable: false`, `machineConnectivityAvailable: false`, `productionGeometry: false` и `conceptualPreviewOnly: true`.

Няма WebGL/3D dependency в реализацията, network assets, backend, persistence, telemetry, screenshot или 3D export, STL/OBJ/glTF, production depth, profile cross-sections, cutting geometry, quantities, operations или machine connection.

## Ограничения

Крилата не са кинематично анимирани. Opening state е концептуален label/overlay. Няма pinch zoom, photorealism, реални дълбочини, дебелини или производствени изчисления.

## Category-context regression correction

Категорията `WINDOW`/`DOOR` в session-only конструктора е единственият източник за видимия контекст, предложенията и съответния composer. Първоначалният дефект беше причинен от два независими state клона: локалната modal сесия пазеше избраната врата, а главният Phase 02 workspace продължаваше да показва началния прозоречен `REF-01` с `1400 × 1200 mm`.

Сесията на конструктора вече остава в корена на приложението при затваряне. Главният екран показва отделна карта „Продължи с изделието“ с explicit категория, име, размери и review status. Legacy зоната е означена недвусмислено като „Самостоятелен профил — това още не е изделието“ и не представя профилния rectangle като door/window preview.

Реална смяна `WINDOW ↔ DOOR` създава чист category draft: премахва старите име, размери, система и профилни selections, връща review в `EMPTY`, затваря composer preview чрез новата стъпка и не избира заместители. Повторно избиране на същата категория запазва съвместимия session state. DEMO размер се прилага само след отделното човешко действие „Приложи примерни размери“; изборът в списъка сам по себе си не променя ширината и височината.

Category transition не създава и не прехвърля операции, component roles или производствени данни. Самостоятелните profile operations и immutable source evidence не се мутират.

Legacy Phase 02 picker също използва explicit stable `productCategory: WINDOW | DOOR | COMBINED` за всеки `REF-01`–`REF-17`. Pure `selectLegacyProductTemplate` transaction обновява template ID, категория, име, semantic template fields и opening data като една стойност. При смяна на категорията задава `width/height = 0` и `dimensionSource = EMPTY`; UI затваря стария preview, премахва selected component и не извежда component list.

Dimension provenance е `EMPTY`, `USER_ENTERED`, `WINDOW_DEMO_PRESET`, `DOOR_DEMO_PRESET` или `COMBINED_DEMO_PRESET`. Template click никога не прилага размер. „Приложи примерни размери“ е отделно човешко действие. Ръчно въведена широка врата запазва точните стойности и получава само conceptual warning, без auto-fix или производствено правило. Standalone profile length/cross-section и product overall dimensions остават отделни state модели.

## Manual browser checklist

## Focused viewport correction

Visual composer-ите за прозорец и врата използват един focused desktop workspace с `100dvh`, compact header/safety/toolbar, оставащо flex/grid пространство с `min-height: 0`, независим vertical scroll в двата странични панела и central drawable без scroll на самото изделие. При тесен изглед колоните се подреждат вертикално и normal page scroll отново е разрешен.

Централната колона също е самостоятелен normal browser scroll container с достъпно име „Централна работна зона — превъртаемо съдържание“. Scrollbar-ът е върху семантичния container, а не върху canvas-а; показва details, инструкции и accessibility fallback под запазената drawable височина. Wheel върху 3D canvas остава camera zoom с `preventDefault`, докато wheel върху съдържанието под него превърта колоната. Scroll не влиза в semantic history и не променя camera/product state. При narrow layout вътрешните scroll области се премахват в полза на normal page scroll.

Старият door `ResizeObserver` публикуваше „Изгледът е побран“ при всяко resize, без да измерва видимата drawable зона. Success статусът вече се допуска само след валидно положително измерване и pure containment проверка на четирите страни. 2D visual bounds включват целия `800 × 520` viewBox: горната размерна линия, изделието, долния праг и надписа `Праг: НЕРАЗРЕШЕН`. Fit използва един и същ X/Y scale и съвпадащи geometric centers; toolbar-ът и properties panel-ът не участват в drawable размерите. Semantic history и safety flags не се променят от layout/fit.

Задължителната реална Chrome проверка се изпълнява при `1920 × 1080`, `1366 × 768` и `1024 × 768` с измерване на drawable bounds, visual bounds, top/bottom gaps и containment. Unit/layout тестовете не заместват тази човешка/браузърна проверка.

1. Потвърдете, че `3D` е disabled без шаблон и enabled след поставяне на window/door шаблон.
2. Превключете 2D → 3D → 2D и проверете, че selection, композицията и review статусът са непроменени.
3. Проверете window fixed/opening fields, делители, handle, hinges и вътрешен/външен цвят.
4. Проверете осемте door templates, всички infill варианти, multiple hinges и дръжка.
5. Проверете `Праг: НЕРАЗРЕШЕН` без 3D threshold profile.
6. Завъртете с mouse, touch/pen и клавиатура; проверете pointer capture, cancel и Escape.
7. Проверете wheel zoom, clamp, всички presets, Fit и Reset.
8. Изберете field и hardware от canvas и от достъпния списък; върнете се в 2D и проверете selection.
9. Resize-нете desktop, 1024 px и narrow viewport; проверете canvas, wrapping, scroll и липса на horizontal overflow.
10. Потвърдете постоянно видимите предупреждения, че 3D е концептуален и дълбочините не са производствени.
