# Phase 04A — приемане на профилния каталог

Каталогът е локален, in-memory и симулационен. Няма база данни и import на каталог.

- Има точно три начални demonstrational записа: `DEMO-FRAME-01`, `DEMO-SASH-01`, `DEMO-MULLION-01` — по един за `FRAME`, `SASH`, `MULLION`.
- Всеки има стабилен ID, система, код, българско име, `dimensionA`, `dimensionB`, статус, timestamps, `simulationOnly: true`, `requiresHumanApproval: true`.
- UI използва „Размер A“ и „Размер B“ и предупреждава, че значението им не е потвърдено.
- Добавяне, редактиране, дублиране, архивиране, възстановяване и филтри работят в паметта.
- Кодът е задължителен и уникален в система; размерите са положителни крайни числа.
- Архивиран профил не може да се избира за ново изделие.
- Промяна на използван профил изисква потвърждение и връща черновата в `NEEDS_REVIEW`; операции не се изтриват мълчаливо.
- Export-ът е `.profile-catalogue.simulation.json` с `simulationOnly: true`, `machineReady: false`, `requiresHumanApproval: true`.
- Няма `localStorage`, IndexedDB, SQL или друга база данни.

