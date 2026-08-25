# Phase 04B — приемане на конструктора за нестандартен прозорец

- Началото е едно правоъгълно поле; рекурсивните vertical/horizontal splits поддържат вложени произволни правоъгълни композиции.
- Полета/splits имат стабилни path IDs. Делителят принадлежи на split-а и ID съдържа orientation/path.
- Split позицията е в mm или чрез процентен помощник, остава вътре и не допуска нулеви/под временния 100 mm демонстрационен минимум полета.
- Премахване на вложена геометрия изисква българско потвърждение.
- `FIXED`, `OPENING_SASH`, `PLACEHOLDER` се валидират; крилото изисква SASH профил и потвърдена LEFT/RIGHT нотация чрез общия `OpeningSymbol`.
- SVG е пропорционален и показва каса, делители, полета, крило, символи, IDs, размери, split позиции и selection; полетата са достъпни с клавиатура.
- Има zoom/fit/reset, breadcrumb, профилни назначения и грешки по поле.
- Компоненти: точните четири `FRAME-*-01`; един stable divider на split; четири stable SASH компонента на opening field.
- Всеки компонент съдържа profile ID/code, nominal span, source path, orientation, `calculationStatus: PROVISIONAL`, `requiresExpertFormula: true`.
- Undo/redo е in-session. Невалидното е `DRAFT`; валидната промяна е `NEEDS_REVIEW`.
- Съвместимите component IDs пазят операции. Несъвместими/премахнати детайли с операции изискват потвърждение; отказът възстановява състоянието.
- Custom компонент се отваря в съществуващия operation workspace, отделно от standalone операциите.
- `VERIFIED` изисква „Проверих размерите, профилите, разделянето и отваряемостта.“ и не е machine approval.
- Номиналните spans не включват сглобки, deductions, angles, clearances, glazing/gasket deductions, machining allowance или optimization.
- Export-ът съдържа geometry/profile snapshots/components/validation и `customProduct: true`, `simulationOnly: true`, `machineReady: false`, `productionLengthsApproved: false`, `requiresExpertFormula: true`.
- Покрити сценарии: fixed rectangle; vertical/horizontal/nested split; four-field; mixed fields; role profiles; LEFT/RIGHT; invalid/zero/small split; removal confirmation; undo/redo; stable IDs; operation preservation; workspace; warnings; safe export.
- Няма MECAL, LTE, XM, CNC, G-code, backend, network или machine connectivity.

