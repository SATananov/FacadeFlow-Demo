import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const ui = readFileSync('src/components/RealDataStagingHumanMappingFoundation.tsx', 'utf8')
const model = readFileSync('src/aiRealDataStaging.ts', 'utf8')

test('06C.3.9.0 staging workflow is visibly Bulgarian', () => {
  for (const text of ['КАРАНТИНА / ПОДГОТОВКА', 'ЧОВЕШКИ ПРЕГЛЕД НА СЪПОСТАВЯНЕТО', 'СЪПОСТАВЯНЕ · ПОТВЪРДЕНО ОТ ЧОВЕК', 'ПРЕГЛЕД ЗА АКТИВИРАНЕ']) assert.match(ui, new RegExp(text))
})

test('06C.3.9.0 mapping columns and decisions are visibly Bulgarian', () => {
  for (const text of ['ИЗХОДНА СТОЙНОСТ', 'РЕШЕНИЕ ЗА СЪПОСТАВЯНЕ', 'КАНДИДАТ ЗА СТАНДАРТНА СТОЙНОСТ', 'ДОКАЗАТЕЛСТВА', 'ПРОВЕРИЛ', 'ЗАПАЗИ ИЗТОЧНИКА', 'СЪПОСТАВИ КЪМ СТАНДАРТНА СТОЙНОСТ', 'ПОТВЪРДИ КАТО НЕУТОЧНЕНО']) assert.match(ui, new RegExp(text))
})

test('06C.3.9.0 keeps stable internal mapping enums unchanged', () => {
  for (const value of ['KEEP_SOURCE', 'MAP_TO_CANONICAL', 'ACKNOWLEDGED_UNRESOLVED', 'HUMAN_CONFIRMED']) assert.match(model, new RegExp(value))
})

test('06C.3.9.0 remains display-only and keeps activation and production locked', () => {
  for (const text of ['АВТОМАТИЧНО СЪПОСТАВЯНЕ: НЕ', 'ПРЕГЛЕД ЗА АКТИВИРАНЕ: ЗАКЛЮЧЕН', 'ПРОИЗВОДСТВО: ЗАКЛЮЧЕНО', 'ГОТОВО ЗА МАШИНА: НЕ']) assert.match(ui, new RegExp(text))
  for (const unsafe of ['acceptedIntoActiveData: true', 'persistenceAllowed: true', 'rulesValidated: true', 'productionLocked: false', 'machineReady: true']) assert.doesNotMatch(model + ui, new RegExp(unsafe))
})
