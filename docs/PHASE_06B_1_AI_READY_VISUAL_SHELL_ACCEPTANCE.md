# PHASE 06B.1 — AI-ready visual shell

## Цел

FacadeFlow получава безопасна визуална и типова основа за бъдещ AI слой, без да се свързва AI модел, backend, мрежова услуга или производствен изход.

## Прието поведение

- Главният header съдържа отделен вход `✦ FacadeFlow AI`.
- AI workspace поддържа гъвкав `JOB` scope, без да предполага, че всяка работа е сграда:
  - сграда / голям обект;
  - къща;
  - малък обект / ремонт;
  - единично изделие;
  - нестандартна поръчка;
  - технически детайл.
- След scope се избира вход:
  - проект / документи;
  - естествено описание;
  - скица / чертеж;
  - ръчно без AI.
- Документният и sketch маршрут използват съществуващия Import Center като доверена входна точка.
- Ръчният fallback води към съществуващия Конструктор на изделие или нестандартния CAD.
- Natural-language екранът събира свободно описание, но AI интерпретацията е видимо заключена, докато няма свързан модел и точна Knowledge Base.
- Knowledge Base визуално разделя профили, обков, стъкло, панели, покрития, съвместимости, инженерни правила и източници/ревизии.
- Съществуващият каталог на профилите остава отделният реален каталог и се отваря от Knowledge Base.

## Задължителни граници

- `aiModelStatus = NOT_CONNECTED`.
- `automaticGeometryAllowed = false`.
- `humanReviewRequired = true`.
- `rulesValidationRequired = true`.
- `sourceEvidenceRequired = true`.
- `productionApproved = false`.
- `machineReady = false`.
- Липсващи профили, панти, дръжки, стъкло, размери и други инженерни параметри не се измислят; бъдещият резултат трябва да ги пази като `UNRESOLVED`.
- Няма AI API, `fetch`, WebSocket, backend persistence, DWG write или machine connectivity в тази фаза.

## Бъдеща схема

AI трябва да произвежда само `PROPOSED Product Specification` с evidence, unresolved полета и confidence/provenance. Само човешки потвърден и rules-validated specification може по-късно да бъде подаден към съществуващия FacadeFlow geometry / 2D / 3D / CAD слой.

## Проверки

`npm run test:phase06b1`

Тестовете проверяват job scopes, input modes, Knowledge Base границите, session reset и че AI/machine/automatic geometry остават заключени.
