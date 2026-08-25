# Локално стартиране под Windows

## Първоначална подготовка

Друг компютър се нуждае от инсталиран Node.js и еднократно ръчно изпълнение на `npm install` в папката на проекта. `node_modules` не е част от проекта и launcher-ът никога не инсталира зависимости.

## Стартиране

Най-лесният начин е double-click върху `START_FACADEFLOW_LOCAL.cmd`. Той отваря отделен Edge/Chrome app прозорец с изолиран project-local browser profile. Обикновен browser tab не може надеждно да управлява lifecycle-а. Launcher-ът:

1. проверява Node, npm и dependencies;
2. изгражда production версията;
3. стартира статичен server само на `127.0.0.1`;
4. избира първия свободен порт между 4173 и 4180;
5. показва и отваря точния локален URL в dedicated app mode;
6. при затваряне на app прозореца спира само matching server и изчиства временния profile.

При нормално затваряне на app прозореца terminal-ът се затваря автоматично. Ctrl+C също почиства двата managed child процеса. Manual server режимът продължава да изисква Ctrl+C.

Алтернативно:

- development: `npm run dev`;
- production build и server: `npm run local`;
- вече съществуващ `dist`: `npm run local:serve`;
- managed app прозорец: `npm run local:app`.

За Desktop shortcut стартирайте `CREATE_FACADEFLOW_DESKTOP_SHORTCUT.cmd`. Той използва текущата project папка и Nadezhda ICO; при съществуващ shortcut иска потвърждение.

## Отстраняване на проблеми

- **Node или npm липсва:** инсталирайте Node.js, отворете нов terminal и опитайте отново.
- **`node_modules` липсва:** изпълнете ръчно `npm install` веднъж. Launcher-ът няма да го направи автоматично.
- **Build failure:** прочетете грешката в същия прозорец, коригирайте проекта и стартирайте отново.
- **Порт 4173 е зает:** server-ът автоматично пробва 4174–4180 и отпечатва реалния URL. Не спирайте чуждия процес чрез launcher-а.
- **Всички портове са заети:** освободете един от 4173–4180 и опитайте отново.
- **Браузърът не се отваря:** копирайте изписания `http://127.0.0.1:PORT/` URL ръчно. Server-ът продължава да работи.
- **Празна страница:** проверете terminal-а за build грешка, презаредете без cache и проверете дали `dist/index.html` съществува.
- **PDF не се визуализира:** проверете за `pdf.worker.min-*.mjs` в `dist/assets` след build.
- **OCR assets липсват:** проверете `dist/ocr/worker.min.js`, `tesseract-core-lstm.wasm.js` и `eng.traineddata.gz`, после изпълнете отново `npm run build`.

## Граница за безопасност

Това е loopback static server, а не backend API. Той няма upload, write или mutation endpoints, не слуша в LAN, не изпраща telemetry и не комуникира с машина. Поддържа само симулационните възможности на FacadeFlow Demo.
