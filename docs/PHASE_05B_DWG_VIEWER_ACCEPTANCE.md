# Phase 05B — локален read-only DWG viewer

> **INTERNAL EVALUATION ONLY — EXTERNAL DISTRIBUTION NOT APPROVED**

- [x] DWG decoder-ът е изолиран зад неутрален `DwgDecoder` interface и browser worker.
- [x] Точната evaluation dependency е `@mlightcad/libredwg-web@0.7.10` (`GPL-3.0`) с локален WASM asset.
- [x] Има постоянен видим лицензен warning; общият repository license не е променен.
- [x] Файлът се пази само в browser memory; няма upload, persistence, backend или runtime CDN.
- [x] Лимитът е 20 MB, 250 000 entities, 32 block levels, ограничен текст/координати и 45 s worker timeout.
- [x] Има clear/cancel, SHA-256, AC version, progress и безопасно worker termination.
- [x] Canvas поддържа fit, reset, wheel zoom, pointer pan, светъл/тъмен фон, layers и text toggle.
- [x] Phase 05B.1 нормализира безопасно Model Space TEXT/MTEXT, като пази immutable `rawText` и използва отделен `displayText` само за canvas.
- [x] Поддържат се `\\U+XXXX`, `\\P`, `\\~`, escaped backslash/braces, завършени `\\A/\\C/\\F/\\H/\\Q/\\T/\\W` controls, decoder lowercase `\\f/\\p` variants и четим plain-text вариант на `\\S...;`; malformed/unknown controls остават evidence с warning.
- [x] Централизиран text LOD праг от 2.5 screen pixels скрива glyphs при общ fit и ги показва при zoom-in, без да променя geometry bounds или viewport state.
- [x] Source text height, insertion point, rotation, width factor и наличните alignment/attachment/line-spacing стойности се запазват; canvas използва локален `Arial, sans-serif` fallback без външни font downloads.
- [x] Model е единственото renderable пространство. Откритият Layout1 се показва като disabled metadata-only запис с достъпно обяснение.
- [x] Layout1 остава BLOCKED: runtime output за реалния AC1018 sample съдържа 0 Paper Space entities, 0 VIEWPORT entities и 0 plot settings, затова не се симулират лист, viewport transforms или clipping.
- [x] Phase 05B.2 открива navigation-only секции само от доказани затворени правоъгълни полилинии или четири axis-aligned LINE edges с общ layer и съвпадащи endpoints.
- [x] Централизираните относителни прагове изискват минимум 20% drawing width, 2% drawing height, 2% drawing area и поне 8 съдържащи се entities; невалидни, малки, вложени и почти идентични bounds се отхвърлят.
- [x] Section hit-testing работи в Model world coordinates; движение до 5 px е click, а по-голямо движение остава pan.
- [x] Section fit използва съществуващия `fitDwgView`, реалния ResizeObserver размер, 40 px padding и запазено aspect ratio. Няма отделна transform система.
- [x] Активната секция има ненатрапчив teal highlight, достъпен списък и „Назад към целия чертеж“; Escape връща whole Model, без да затваря import workspace.
- [x] При активна секция „Нулирай изгледа“ възстановява section fit; „Покажи целия чертеж“ изчиства selection; resize refit-ва активните bounds.
- [x] Ако boundary layer на активната секция бъде скрит, selection се изчиства детерминистично и canvas се връща към whole Model fit. Другите layer toggles не променят viewport state.
- [x] Section ID е session-local navigation ID, не product/component ID; selection не декодира повторно, не променя entities/text evidence и не влиза в ordered workflow.
- [x] Phase 05B.3 пази TEXT и MTEXT като отделни source kinds; TEXT остава single-line и използва собствените alignment flags/points.
- [x] MTEXT се пренася само при finite положителен source `rectWidth`. Липсващата width не се заменя с inferred cell, nearest LINE geometry или произволен `maxWidth`.
- [x] Wrapping измерва точния canvas fallback font, преобразува CSS pixels обратно в drawing units и включва width factor точно веднъж.
- [x] `\\P` остава задължителна paragraph граница; думите се запазват, а дума над source width използва детерминистичен character fallback без загуба.
- [x] Деветте MTEXT attachment позиции използват extent на целия multiline block; source line-spacing factor се прилага върху 3-on-5 baseline spacing.
- [x] Rotation се прилага само в canvas transform. Layout helper не променя rotation, geometry bounds, section detection, LOD или viewport state.
- [x] Няма vertical clipping: runtime `rectHeight` не е надежден за засегнатите записи, а `columnWidth` липсва. Source `rectWidth` управлява само wrapping.
- [x] Доказаните source контроли `\\H<number>x;` и `\\W<number>;` се пазят като immutable runs и се измерват/рисуват с run-level metrics. Absolute `\\H<number>;` не се прилага без потвърдена unit semantics; font switch остава локална metadata/fallback информация без download.
- [x] `extentsWidth` е проверен статистически спрямо `rectWidth` и остава source glyph extent за validation/bounds, а не вторична wrap ширина. Не се използва inferred cell clipping или nearest-LINE constraint.
- [x] Layout резултатът съдържа същите run позиции и локален rendered bbox, които canvas renderer използва; attachment 1, 3 и 5 се изчисляват върху целия действителен multi-run/multi-line block.
- [x] Реалният runtime gate установява положителен `rectWidth` при 4 502 от 5 450 source MTEXT записа и при 583 от 726 дълги записа; 143 дълги source записа остават без доказана width граница.
- [x] Показват се source handles/layers, entity counts, unsupported entities и resource/XREF warnings, когато decoder-ът ги предоставя.
- [x] DIMENSION не се преизчислява; неподдържаните entities не се представят като успешни.
- [x] Safety flags са винаги read-only/simulation/internal-only и никога machine-ready.
- [x] Няма edit, save, DWG/DXF/SVG/PDF/XML/LTE export, component conversion, operations или machine connection.
- [ ] Реалният игнориран AC1018 sample изисква ръчна визуална проверка след автоматичната decoder проверка.

Автоматичните тестове покриват bounds, transforms, recursive/deep blocks, entity limit, invalid coordinates, layers, fit/zoom, Unicode/MTEXT normalization, immutable raw evidence, text mapping/LOD, section detection/deduplication/nesting/ranking/hit-testing/focus lifecycle, layout capability status, unsupported reporting и safety flags. Worker lifecycle се проверява чрез build и ръчно cancel/clear; browser timeout не се ускорява изкуствено в production кода.

Font metric fidelity не може да бъде гарантирана без оригиналните source fonts. Прототипът не ги изтегля и не твърди Autodesk или production-identical визуализация. GPL интеграцията остава **INTERNAL EVALUATION ONLY — EXTERNAL DISTRIBUTION NOT APPROVED**.

Phase 05B.3 е **PARTIAL** спрямо Autodesk text layout: source-width wrapping и доказаните относителни run metrics са приложени, но записите без положителен `rectWidth`, vertical columns и оригиналните font metrics не се измислят. Видим текст без доказана source ширина остава отчетено ограничение, а не се прикрива с cell clipping.

## Phase 05B.4 — отделен приблизителен визуален режим

- [x] Source-faithful режимът остава достъпен и не променя decoder output, `rawText`, entities, insertion points, source bounds или stable IDs.
- [x] „Подреди текстовете визуално“ е включено по подразбиране само в React memory и е означено с „Приблизителен изглед“.
- [x] Приблизителният режим е display-only heuristic и не е DWG truth, production data или export.
- [x] Pure visual-field detector доказва rectangular polylines, четири LINE edges и grid faces със съставени непрекъснати collinear страни.
- [x] Gap в страна не създава field; почти еднаквите bounds се дедупликират детерминистично.
- [x] Assignment изисква reference point строго вътре, една section membership, достатъчен размер спрямо text height и най-малкото валидно enclosing поле.
- [x] Boundary ambiguity, nearest-but-not-containing field, micro/icon field и липса на доказана клетка остават unresolved.
- [x] MTEXT с положителен `rectWidth` винаги остава source-driven.
- [x] High-confidence assignment използва padding, съществуващия run-aware layout, visual wrap width, ограничен display anchor и clip само до доказаното поле.
- [x] Derived metadata не влиза в source evidence или export и пази заключените safety flags.
- [x] Изключването на toggle премахва approximate rendering без decode и без промяна на viewport/selection.
- [x] При layer toggle detector-ът се преизчислява само от видимите edges; скрит доказващ edge премахва assignment детерминистично.
- [x] Layout1 остава disabled/BLOCKED; GPL интеграцията остава INTERNAL EVALUATION ONLY.

Реалният игнориран runtime gate откри 2 287 visual fields, 428 high-confidence assignments и 520 unresolved no-width MTEXT записа. В първата секция 47 от 91 no-width записа са assigned, 44 са unresolved; 3 от 10 дълги no-width записа имат доказано поле. Главният наблюдаван overflow не е доказуемо коригиран и gate-ът не е отслабен — Phase 05B.4 остава **PARTIAL**.
