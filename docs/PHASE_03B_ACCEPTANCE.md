# Phase 03B — критерии за приемане

## Локална OCR архитектура

- [x] Tesseract.js worker, baseline LSTM core и English trained data са локални assets под `public/ocr`.
- [x] Няма CDN URL, external OCR/AI API или backend endpoint.
- [x] OCR cache е изключен; source, crop, jobs и audit не се пазят в `localStorage` или `IndexedDB`.
- [x] Поддържат се English/Latin текст и числа; липсата на Bulgarian trained data е видимо документирана.
- [x] Максималните crop pixels, едновременни jobs, retained jobs и text length са ограничени.

## Зона и OCR job

- [x] Потребителят може да избере зона с pointer drag върху image или изобразена PDF страница.
- [x] Има клавиатурна алтернатива с X/Y/width/height в original rendered pixels.
- [x] Зоната се ограничава в source bounds, пази PDF page association и не извлича технически мащаб.
- [x] Crop preview се показва отделно и оригиналът остава immutable.
- [x] Job states са READY, PROCESSING, COMPLETED, FAILED и CANCELLED.
- [x] Progress се съобщава чрез `aria-live`, worker failure е безопасно обработен и job може да бъде прекратен.
- [x] Празният OCR резултат приключва безопасно без автоматично предложение.
- [x] Source removal и workspace close прекратяват worker-а и изчистват OCR jobs/crops/audit от паметта.

## Прецизно маркиране и потвърждение

- [x] OCR зона може да се начертае с drag във всички четири посоки; отрицателните drag посоки се нормализират.
- [x] Pointer capture запазва drag операцията при кратко напускане на правоъгълника и работи за mouse, touch и pen.
- [x] Селекцията може да се премества чрез drag във вътрешността ѝ.
- [x] Осем видими handles позволяват resize от четирите ъгъла и четирите средни точки на страните.
- [x] Draw, move и resize остават ограничени в реалните source bounds и имат минимален размер.
- [x] Accidental click без реален drag се отхвърля и не създава OCR зона.
- [x] Zoom in/out, fit page, reset и scroll запазват canonical original-source coordinates.
- [x] „Маркирай наново“ и „Изчисти зоната“ имат отделно и ясно поведение.
- [x] Numeric X/Y/width/height полетата остават клавиатурна алтернатива.
- [x] Escape отменя активния draw/move/resize, без да изтрива предишната завършена зона; непроменена confirmed зона може да бъде възстановена.
- [x] Selection mode има crosshair, постоянна инструкция, подчертана active surface и действие „Откажи маркирането“.
- [x] Overlay-ът има teal border, pale halo, затъмнена външна област, live pixel size и touch-friendly handles.
- [x] Преди explicit confirmation зоната е `DRAFT_SELECTION`: crop preview не се показва и OCR не е достъпно.
- [x] „Потвърди избраната зона“ създава `CONFIRMED_SELECTION` и едва тогава генерира crop.
- [x] След потвърждение уголеменият preview „Избрана зона за OCR“ се показва непосредствено под source viewer-а със page и pixel coordinates.
- [x] Confirmed section предоставя „Разпознай избраната зона локално“, „Промени зоната“ и „Изчисти зоната“.
- [x] Move/resize или „Промени зоната“ инвалидира confirmed crop, скрива preview и изисква ново потвърждение.
- [x] Reconfirmation генерира нов crop от актуалните canonical coordinates.
- [x] OCR използва единствено последната изрично потвърдена зона.
- [x] Phase 03C има отделна combined selection цел и не променя raw OCR evidence, candidate review или confirmation правилата на Phase 03B.

## Предложения и човешки контрол

- [x] Суров и нормализиран текст се показват отделно с confidence, lines, hash, page, rectangle, language и timestamp metadata.
- [x] Parser-ът разпознава numeric dimension, width/height pair, W/H и Ш/В pair, diameter и radius; non-finite и извънразумни стойности се отхвърлят.
- [x] Всяко предложение има stable local ID, type, units, OCR/parser confidence, source trace, status и timestamp.
- [x] Ниската увереност е означена с текст „Ниска увереност“, не само с цвят.
- [x] Приемането и отхвърлянето са единични; няма bulk acceptance.
- [x] Стойността може да бъде редактирана преди приемане.
- [x] Прието предложение изисква explicit target field и Bulgarian confirmation със стара/нова стойност.
- [x] Отхвърлянето не променя черновата.
- [x] Прилагането на width/height към VERIFIED запис го връща към `NEEDS_REVIEW`.
- [x] Template, category, profile system/code, component operations, machine settings и verification не се променят автоматично.
- [x] In-memory audit trail записва job, candidate actions, applied field, old/new values, timestamps и `humanConfirmed`.

## Export и забрани

- [x] Само съществуващият `.drawing-import.simulation.json` получава optional OCR section.
- [x] OCR section съдържа jobs, raw evidence, candidates/statuses, audit trail, `ocrAssisted: true` и `ocrAutomaticallyApplied: false`.
- [x] Export-ът остава `simulationOnly: true`, `machineReady: false` и `requiresHumanApproval: true`.
- [x] OCR резултат никога не се прилага автоматично.
- [x] Няма machine connectivity, MECAL/LTE/XM, G-code, CNC или друг machine-file output.
- [x] Phase 03D IMAGE/PDF маршрутите запазват локалния OCR worker, evidence, confirmation и audit поведение без промяна.
