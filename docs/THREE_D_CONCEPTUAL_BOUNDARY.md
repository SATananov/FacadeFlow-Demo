# Граница на концептуалния 3D модел

3D моделът е помощен изглед на вече структурирано изделие. Той не интерпретира пиксели, PDF или непотвърден OCR и не променя product state.

`conceptualDepthMm` е отделна view-only стойност с демонстрационен default 70 mm. Тя не произлиза от `dimensionA`, `dimensionB` или реално профилно сечение. Правоъгълните solids не представят канали, стени, уплътнения, стъклопакет, обков, връзки или manufacturing deductions.

Camera, visibility, wireframe, transparency, exploded и opening controls са временни визуални настройки. Opening preview не твърди реална панта или hardware кинематика.

Scene metadata винаги е:

- `conceptualOnly: true`
- `productionGeometryApproved: false`
- `machineReady: false`

Няма production 3D export, backend, network/cloud rendering или machine output.
