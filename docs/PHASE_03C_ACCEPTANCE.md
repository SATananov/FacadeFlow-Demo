# Phase 03C — критерии за приемане

## Combined selection и локална обработка

- [x] „Избери изделие с размерите“ е отделен режим за една зона с geometry, dimension lines и близки labels.
- [x] Зоната използва същия canonical original-source coordinate model, move/resize handles и DRAFT_SELECTION gate.
- [x] Crop се генерира само след „Потвърди избраната зона“; анализ не започва автоматично.
- [x] Само „Анализирай изделието и размерите локално“ стартира обработката.
- [x] Оригиналният source остава immutable и browser-memory-only.
- [x] Локалните Tesseract worker/core/English data се използват повторно с изключен cache.
- [x] Няма Bulgarian OCR claim; numeric/Latin recognition остава видимо ограничено.

## Geometry ranking

- [x] Geometry representation е детерминиран low-resolution grayscale/edge вариант със запазено aspect ratio и нормализиран canvas.
- [x] REF features се извличат единствено от typed REF-01–REF-17 template geometry.
- [x] Ranking използва aspect ratio, vertical sections, horizontal dividers, coarse edge distribution, structure density и opening-field feature.
- [x] Показват се само top-three предложения с per-feature breakdown и етикет „Демонстрационно сходство“.
- [x] Близки top scores създават ambiguity warning; схема не се избира или прилага автоматично.
- [x] Ръчен избор на всяка REF схема остава наличен.

## OCR, dimensions и traceability

- [x] Raw и normalized OCR се пазят отделно; line bounding boxes и confidence се показват върху evidence crop.
- [x] Parser-ът поддържа overall width/height pairs, explicit W/H и Ш/В, diameter, radius, quantity, product reference, generic dimension и text-only fallback.
- [x] Horizontal-edge position може да предложи width, vertical-edge position може да предложи height; липса на видима ориентация оставя GENERIC_DIMENSION.
- [x] Размер не се определя по това коя стойност е по-голяма; липсващи размери и scale не се извеждат.
- [x] Всеки candidate има stable ID, raw text, normalized value, type/unit, OCR/parser confidence, source box/page, status и warning.
- [x] Конкуриращи width/height стойности, low confidence, aspect mismatch и близки scheme scores остават видими warnings.

## Human approval, audit и export

- [x] Review екранът синхронизира source evidence, proposed product и proposed data.
- [x] Candidate стойностите могат да се редактират, приемат и отхвърлят поотделно; няма bulk или automatic acceptance.
- [x] Manual width/height/reference fields в черновата остават достъпни и всички OCR предложения могат да бъдат игнорирани.
- [x] Финалният summary показва scheme, accepted width/height/quantity/reference, unresolved count и original crop.
- [x] Прилагане е блокирано до checkbox „Проверих схемата и размерите по оригиналния чертеж.“
- [x] Прилагат се само explicit accepted fields и човешки потвърдената scheme; geometry промяна връща VERIFIED към NEEDS_REVIEW.
- [x] Profile system/code и component operations никога не се променят автоматично; съществуващият operation data-loss gate остава при зареждане във workflow.
- [x] In-memory audit съдържа scheme ranking, OCR evidence, candidate decisions, previous/new values, confirmation и timestamps.
- [x] Optional `.drawing-import.simulation.json` section съдържа `combinedRecognitionAssisted: true`, `automaticallyApplied: false`, `trainedGeometryModelUsed: false`, `simulationOnly: true`, `machineReady: false` и `requiresHumanApproval: true`.
- [x] Няма runtime external network, persistent browser storage, machine output или connectivity.

## Автоматична временна editable чернова

- [x] След explicit combined crop confirmation и ръчно стартиран local analysis се създава provisional recognition-derived draft.
- [x] При налични валидни scheme, overall width и overall height се попълват предложените template/width/height, а quantity и product reference се добавят само когато са открити.
- [x] При двусмислен или непълен резултат не се измисля стойност: създава се непълна `NEEDS_REVIEW` чернова с подчертани липсващи полета.
- [x] Автоматичната чернова винаги е `recognitionDerived: true`, `automaticallyPopulated: true`, `humanVerified: false`, `machineReady: false` и `simulationOnly: true`.
- [x] Source hash, page и canonical crop coordinates се пазят в черновата.
- [x] Веднага се показват side-by-side original crop и генерирана editable product visualization, а detected fields/confidence/warnings и unresolved candidates са отделно под тях.
- [x] Действията „Коригирай предложението“, „Избери друга схема“, „Отхвърли автоматичната чернова“ и „Потвърди след проверка“ са налични.
- [x] Всяко предложено поле може да бъде редактирано преди verification.
- [x] Verification е блокирано при липсваща/невалидна схема, ширина, височина или количество.
- [x] Само checkbox „Проверих схемата и всички размери по оригиналния чертеж.“ плюс „Потвърди след проверка“ задават `VERIFIED` и подават записа към съществуващия защитен product/component load path.
- [x] Provisional draft никога не създава operations, не избира реален profile code и не става machine-ready.
- [x] Бъдещо автоматично откриване на няколко изделия на страница не е реализирано; всеки бъдещ detection трябва да създава независим `NEEDS_REVIEW` запис със собствено evidence.
- [x] Phase 03D IMAGE/PDF route dispatch запазва combined selection, ranking, provisional draft и human verification gate.
