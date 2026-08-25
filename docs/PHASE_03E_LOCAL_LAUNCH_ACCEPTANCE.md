# Phase 03E — критерии за локално Windows стартиране

## Launcher и lifecycle

- [x] `START_FACADEFLOW_LOCAL.cmd` използва `%~dp0`, работи с интервали в пътя и не изисква administrator права.
- [x] Проверява `package.json`, Node.js, `npm.cmd` и `node_modules`; не изпълнява `npm install`.
- [x] Изпълнява `npm.cmd run build` и не стартира server при build грешка.
- [x] Видимият terminal притежава процеса; Ctrl+C/SIGTERM спира HTTP server-а чисто.
- [x] Няма background service, tray, automatic restart, startup registration, firewall или execution-policy промяна.

## Static server

- [x] Използва само Node built-in modules и обслужва единствено realpath-contained файлове от `dist`.
- [x] Bind-ва само `127.0.0.1`; предпочита 4173 и пробва 4174–4180 без да спира чужд процес.
- [x] Отваря една browser tab заявка само след `listening`; неуспехът не спира server-а и URL остава изписан.
- [x] Позволява само GET/HEAD; останалите методи връщат 405 с `Allow: GET, HEAD`.
- [x] Има MIME types, SPA fallback за application routes, 404 за липсващи assets и няма directory listing.
- [x] Plain, encoded/double-encoded traversal, backslash и null-byte paths се отхвърлят; symlink realpath не може да излезе от `dist`.
- [x] Изпраща `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` и `Cache-Control: no-store` за `index.html`; няма permissive CORS.

## Assets и безопасност

- [x] Production build съдържа PDF.js bundle/worker и локалните OCR worker/core/language assets под `dist/ocr`.
- [x] Header badge „ЛОКАЛНО ПРИЛОЖЕНИЕ“ се показва само при hostname `localhost` или `127.0.0.1` и не заменя simulation/no-machine warning.
- [x] Няма backend API, upload/write endpoints, LAN exposure, online tunnel, runtime CDN, telemetry или remote logging.
- [x] Няма automatic verification, machine-ready state, MECAL/LTE/XM/G-code/CNC generation или machine connectivity.
