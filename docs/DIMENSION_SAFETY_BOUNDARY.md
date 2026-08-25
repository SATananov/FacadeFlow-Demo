# Safety граница на размерните означения

Размерните annotations са визуален слой върху structured project geometry. Те не са производствени размери и не променят geometry, profiles, operations, status или machine readiness.

Не се изчисляват cutting deductions, tolerances, clearances, joints, machining allowances или exact profile sections. `dimensionA/B` никога не се използват като 3D depth; `conceptualDepthMm` остава view-only.

Import-derived стойност се пази като immutable-source evidence. OCR/CAD suggestion не се прилага автоматично. Само индивидуално човешки потвърдено evidence може да стане annotation. Unresolved/rejected/conflicting values остават видими като evidence и не се гадаят.

Всички annotation и evidence записи са `productionApproved: false`/`machineReady: false`. Няма DXF/DWG или production 3D export, backend, database, browser persistence, network, telemetry или machine connection.
