# Phase 03E.1 — Branding и managed app window

## Branding

- [x] Оригиналните Nadezhda PNG/ICO файлове са копирани byte-identical в `public/branding`.
- [x] Пълното лого заменя временния FF block, запазва пропорциите и има смислен alt text.
- [x] FacadeFlow Demo, subtitle, local и simulation/no-machine badges остават видими.
- [x] Header-ът се свива и wrap-ва без хоризонтален overflow.
- [x] Favicon и title са branded и production build включва трите assets.

## Managed lifecycle

- [x] Manager стартира точно един `local-server.mjs --no-open` child и чака machine-readable loopback readiness.
- [x] Server failure не стартира browser; browser failure изпраща IPC shutdown до новия server.
- [x] Edge се търси първо само в известни locations, после Chrome в известните му locations.
- [x] Browser използва app mode, уникален project-local profile и няма extensions, remote debugging или automation port.
- [x] App closure, abnormal exit и Ctrl+C почистват exact child identity и `.facadeflow-runtime`.
- [x] Няма `taskkill /IM`, broad process-name matching или shutdown HTTP endpoint.
- [x] Manual `local`, `local:serve`, `dev` остават налични; `local:app` build-ва managed режима.

## Shortcut и безопасност

- [x] ASCII-only helper създава Desktop shortcut с project-relative target, working directory и supplied ICO.
- [x] Existing shortcut изисква потвърждение преди replacement.
- [x] `.facadeflow-runtime/` е игнорирана; няма registry/startup/firewall/execution-policy промяна.
- [x] Няма backend API, upload, LAN bind, external service/CDN, telemetry, machine output или connectivity.
