# Phase 06A.9.1 — Unified Drawing Workspace Shell Foundation

## Цел

Phase 06A.9.1 въвежда минимална reusable layout основа за Unified Drawing Workspace и я прилага първо само към `CustomProductDesigner`. Shell-ът организира съществуващия интерфейс така, че на desktop активната стъпка, настройките, инструментите, целият чертеж, избраното поле, properties панелът, status информацията и основните действия да бъдат достъпни без постоянно общо вертикално превъртане.

Фазата е само layout/workspace foundation. Тя не въвежда втори state model и не променя drawing или product функционалност.

## Layout regions

`DrawingWorkspaceShell` приема съществуващото UI съдържание чрез седем именувани региона:

1. `header` — compact workspace header и close действие;
2. `progress` — текуща стъпка и седемте workflow стъпки;
3. `settings` — настройките на текущата стъпка;
4. `toolbar` — съществуващите view, dimension и canvas controls;
5. `viewport` — 2D/3D drawing съдържанието;
6. `properties` — панелът за избраното поле;
7. `status` — validation, review/status и основните footer действия.

Shell-ът управлява единствено подреждането и responsive поведението на тези региони.

## Settings collapse

Показването и скриването на настройките е локален view-only state в shell-а. Съдържанието остава монтирано и се скрива чрез `hidden`, затова стойностите на контролираните полета се запазват. Toggle действието не извиква product handlers, не добавя Undo/Redo history операция и не променя workflow state.

## Annotation toolbar wrapping

Annotation контролите използват wrapping flex layout с `min-width: 0` и без desktop `overflow-x: auto`. Всеки checkbox остава заедно със своя label, а редовете преминават компактно на следващ ред според наличната ширина. При narrow layout label редовете използват нормално пренасяне на текста и минимум 42 px touch target, без хоризонтално изрязване.

## Collapsible component list

Компонентният списък е свит по подразбиране и има постоянна компактна header лента „Компоненти“, актуален брой и бутон „Покажи компонентите“ / „Скрий компонентите“. Toggle state е локален view-only state в `CustomProductDesigner` и не участва в product/session state, history, persistence или export.

Списъкът остава монтиран чрез `hidden`, запазва component selection и при отваряне използва ограничена височина със собствен `overflow-y: auto`. Status, review checkbox, export и confirmation действията са извън collapsible региона и остават налични. Toggle бутонът има `aria-expanded`, `aria-controls`, native keyboard activation и видим `:focus-visible` индикатор.

## Desktop поведение

При ширина над 900 px shell-ът:

- използва наличната динамична viewport височина чрез `calc(100dvh - 24px)`;
- подрежда header, progress, settings, toolbar, main workspace и status в отделни grid редове;
- разпределя оставащата височина към main workspace;
- показва drawing viewport и properties panel в две колони;
- ограничава SVG чертежа в drawing viewport-а, без `transform: scale()` или browser zoom workaround;
- пази toolbar-а над drawing viewport-а без застъпване;
- оставя footer действията достижими;
- не изисква постоянен общ scroll в shell-а.

## Narrow поведение

При ширина до 900 px shell-ът преминава към една колона и нормален вертикален scroll. Viewport и properties регионите се подреждат последователно и не използват desktop overflow containment. Subtitle, стъпките и контролите могат да wrap-ват според наличната ширина.

## Independent properties scroll

Properties регионът е самостоятелен scroll container с `overflow: auto`, `min-height: 0` и stable scrollbar gutter. Scroll поведението му е независимо от drawing viewport-а и не мести header, progress или toolbar. Когато съдържанието се побира, scrollbar не се показва излишно.

## Viewport containment

Drawing регионът използва оставащата main площ. Контейнерът и вътрешният SVG имат ограничени ширина и височина, така че при стандартен zoom целият чертеж и dimension annotations остават видими. Съществуващият zoom wrapper и неговите handlers са запазени.

## Accessibility

- Shell-ът остава modal dialog с `role="dialog"`, `aria-modal="true"` и `aria-labelledby` към съществуващото заглавие.
- Close бутонът запазва съществуващия accessible label и handler.
- Settings регионът има текстов label.
- Collapse бутонът е `type="button"`, има видим текст и актуално `aria-expanded` състояние.
- Съществуващите keyboard, focus, field selection и control semantics не са променяни.
- Скритото settings съдържание не остава достъпно за keyboard navigation, докато е с `hidden`.

## Protected logic

Не са променяни:

- product и workflow state;
- step transitions;
- field selection semantics;
- divider, sash и remove operations;
- component IDs;
- geometry model или calculations;
- validation;
- Undo/Redo semantics;
- pointer и keyboard behavior;
- 2D/3D renderer-и;
- safety flags;
- съществуващите export semantics.

`DetailDraftingPlaceholder` остава функционално непроменен и продължава ясно да означава, че свободното чертане предстои.

## Safety ограничения

Не са добавени production geometry, производствени формули, persistence, network поведение, dependencies или нови export capabilities. Не са добавени координатна мрежа, X/Y координати, snap, нови drawing инструменти, свободно CAD чертане или Line/Polyline/Rectangle/Circle/Arc logic. Симулационните и machine-safety ограничения остават непроменени.

## Browser checklist

Проверено с browser zoom 100%:

- 1920×1080 — PASS;
- 1366×768 — PASS;
- 1024×768 — PASS;
- 390×844 — PASS.

Задължителният 1920×1080 сценарий е изпълнен с изделие 1400×1200 mm, създадена външна каса, вертикално разделяне, избрано поле и скрити настройки.

Резултат при 1920×1080:

- целият чертеж е видим в drawing viewport-а — PASS;
- dimension annotations са видими — PASS, измерени 6 SVG annotation елемента;
- drawing viewport използва основната свободна площ — PASS;
- toolbar е видим и не се застъпва с viewport/header — PASS;
- footer и основните действия са достижими — PASS;
- properties panel има независимо `overflow: auto` поведение — PASS;
- няма horizontal overflow — PASS;
- shell няма постоянно общо vertical scroll-ване (`scrollHeight === clientHeight`, `overflow-y: hidden`) — PASS;
- show/hide settings запазва името и стойностите 1400×1200 — PASS;
- settings toggle не създава history операция — PASS; един Undo след toggle премахва последното вертикално разделяне, а не view промяната, след което Redo го възстановява;
- избраното поле остава ясно маркирано и properties съдържанието му е видимо — PASS.

Финален четиривюпортен workflow след annotation wrapping и component-list collapse:

| Viewport | Annotation overflow | Default collapsed | Selection след reopen/collapse | Canvas след collapse | Shell/page horizontal overflow | Undo/Redo изолация |
| --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | PASS, `1110 = 1110 px` | PASS | PASS | `479 → 627 px` | PASS | PASS |
| 1366×768 | PASS, `952 = 952 px` | PASS | PASS | `240 → 315 px` | PASS | PASS |
| 1024×768 | PASS, `610 = 610 px` | PASS | PASS | `206 → 281 px` | PASS | PASS |
| 390×844 | PASS, `360 = 360 px` | PASS | PASS | normal vertical-flow layout | PASS | PASS |

При всички размери component list използва собствен `overflow-y: auto`; измереният `scrollHeight` е по-голям от `clientHeight`, когато списъкът е отворен. Чертежът остава изцяло в SVG viewport-а и центриран както при отворен, така и при свит списък. Измереното отношение ширина/височина на касата остава `1.166666…` (1400/1200), което потвърждава uniform X/Y scale без `transform: scale()` workaround.

След component toggle един Undo премахва последното вертикално разделяне, а Redo го възстановява. Това потвърждава, че show/hide действията не добавят history операции. Избраният `FRAME-TOP-01` остава избран след свиване и повторно отваряне на списъка.

Човешкият screenshot е създаден извън repository-то в `%TEMP%/FacadeFlow-Phase-06A-9-1-acceptance-1920x1080.png` и не е tracked.

## Автоматични проверки

- `npm run test:phase06a9` — PASS, 5/5;
- `npm run lint` — PASS;
- `npm run build` — PASS;
- `git diff --check` — PASS.

Build-ът запазва известното informational предупреждение за browser externalization на `node:module` и предупреждението за големи chunks; няма build грешки.

## Известно ограничение

Координатна мрежа, snap и свободно drawing/CAD поведение още не са реализирани. Те не са част от Phase 06A.9.1 и shell foundation не ги симулира или представя като налични.
