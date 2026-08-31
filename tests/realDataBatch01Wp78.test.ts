import assert from 'node:assert/strict'
import test from 'node:test'
import { nadezhdaProfileEvidence } from '../src/nadezhdaCatalogueEvidence'
import { WP78_REAL_DATA_BATCH_ID, WP78_SYSTEM_LABEL, wp78RealSourceData } from '../src/realData/wp78'

test('REAL DATA BATCH 01 registers WP 78 from the supplied source without promotion', () => {
  assert.equal(WP78_REAL_DATA_BATCH_ID, 'REAL_DATA_BATCH_01')
  assert.equal(WP78_SYSTEM_LABEL, 'WP 78')
  assert.equal(wp78RealSourceData.system, 'WP 78')
  assert.equal(wp78RealSourceData.source.fileName, 'Al systems 2(1).pdf')
  assert.equal(wp78RealSourceData.source.page, 1)
  assert.equal(wp78RealSourceData.source.sha256, '3A49FAE65D9EB98F1F1F27943ABCF8435A6EE5AE989B79EEC2F4061FC98C82DD')
  assert.equal(wp78RealSourceData.safety.cataloguePromoted, false)
  assert.equal(wp78RealSourceData.safety.humanAuditRequired, true)
})

test('WP 78 preserves the exact source role mapping and comma-form profile codes', () => {
  assert.deepEqual(
    wp78RealSourceData.profiles.map(({ sourceRoleLabel, catalogueRole, code }) => ({ sourceRoleLabel, catalogueRole, code })),
    [
      { sourceRoleLabel: 'Каса', catalogueRole: 'FRAME', code: '78,01' },
      { sourceRoleLabel: 'Делител', catalogueRole: 'MULLION', code: '78,33' },
      { sourceRoleLabel: 'Крило прозорец', catalogueRole: 'SASH', code: '78,22' },
    ],
  )

  assert.ok(wp78RealSourceData.profiles.every(({ code }) => code.includes(',')))
  assert.ok(wp78RealSourceData.profiles.every(({ code }) => !code.includes('.')))
})

test('WP 78 does not fabricate door, threshold, glazing or hardware product codes', () => {
  assert.equal(wp78RealSourceData.undocumented.doorProfiles.length, 0)
  assert.equal(wp78RealSourceData.undocumented.thresholdProfiles.length, 0)
  assert.equal(wp78RealSourceData.glazing.mentioned, true)
  assert.equal(wp78RealSourceData.glazing.code, null)
  assert.equal(wp78RealSourceData.glazing.specification, null)
  assert.equal(wp78RealSourceData.hardware.sourceText, 'с PVC обков')
  assert.equal(wp78RealSourceData.hardware.productCode, null)
  assert.equal(wp78RealSourceData.hardware.productSpecification, null)
})

test('WP 78 remains isolated from the older Nadezhda group-78 evidence representation', () => {
  const wp78Codes = wp78RealSourceData.profiles.map(({ code }) => code)
  const nadezhdaCodes = nadezhdaProfileEvidence.map(({ code }) => code)

  assert.deepEqual(wp78Codes, ['78,01', '78,33', '78,22'])
  assert.equal(wp78Codes.some((code) => nadezhdaCodes.includes(code)), false)
  assert.equal(wp78Codes.includes('78.01'), false)
  assert.equal(wp78Codes.includes('78.33'), false)
})

test('WP 78 source registration keeps every downstream engineering/production gate locked', () => {
  assert.deepEqual(wp78RealSourceData.safety, {
    cataloguePromoted: false,
    rulesValidated: false,
    machineReady: false,
    productionApproved: false,
    humanAuditRequired: true,
  })
})
