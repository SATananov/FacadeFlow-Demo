# Phase 03D.1 — критерии за помощ и обиколка

## Help Center

- [x] Постоянният текстов бутон „Помощ“ отваря диалог без промяна или загуба на workflow данни.
- [x] Налични са 11-те изисквани раздела, вътрешна навигация, `aria-current` и локално търсене.
- [x] „Бърз старт“ съдържа 12 последователни стъпки и очакваното видимо състояние преди продължаване.
- [x] Форматите, снимането, маркирането, OCR, combined analysis, операциите, статусите, export-ът, речникът и troubleshooting случаите са обяснени на български.
- [x] Demo fixture указанията са само инструкции; файлове не се fetch-ват, импортират или bundle-ват автоматично.

## Guided tour и contextual help

- [x] Обиколката има Напред, Назад, Пропусни, Затвори и рестарт от Help.
- [x] Целите използват `data-help-id`, а не DOM позиции или brittle CSS селектори.
- [x] Наличната цел се scroll-ва във видимата област и се маркира, без действието ѝ да се активира.
- [x] Липсваща цел от друг workflow се обяснява, без автоматично отваряне на екрана.
- [x] Escape затваря текущия Help/tour/popover слой; диалозите ограничават Tab focus.
- [x] Context help се активира с mouse или keyboard и се затваря с Escape, outside click или собствен бутон.
- [x] DRAFT, NEEDS_REVIEW, VERIFIED и `machineReady: false` имат отделни plain-language обяснения; VERIFIED не означава production approval.

## Accessibility, responsive и safety

- [x] Видим focus, текстови labels, `aria-live` за tour step, mobile layout без horizontal page overflow и reduced-motion режим.
- [x] Помощните компоненти получават само close/tour navigation callbacks и нямат достъп до product/profile/operation setters.
- [x] Няма `localStorage`, `IndexedDB`, analytics, tracking, network request, automatic import или workflow mutation.
- [x] Help не създава операции, не bypass-ва verification, не задава machine readiness и не генерира machine output.
