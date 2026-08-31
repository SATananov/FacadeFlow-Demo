import assert from 'node:assert/strict'
import test from 'node:test'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import { wp78CatalogueVisibility } from '../src/realData/wp78CatalogueVisibility'

test('WP78.3 exposes the real source roles as read-only catalogue evidence', () => {
  assert.equal(wp78CatalogueVisibility.system, 'WP 78')
  assert.equal(wp78CatalogueVisibility.mode, 'READ_ONLY_SOURCE_EVIDENCE')
  assert.equal(wp78CatalogueVisibility.productCategory, 'WINDOW')
  assert.deepEqual(
    wp78CatalogueVisibility.entries.map(({ sourceRoleLabel, catalogueRole, code }) => ({ sourceRoleLabel, catalogueRole, code })),
    [
      { sourceRoleLabel: 'Каса', catalogueRole: 'FRAME', code: '78,01' },
      { sourceRoleLabel: 'Делител', catalogueRole: 'MULLION', code: '78,33' },
      { sourceRoleLabel: 'Крило прозорец', catalogueRole: 'SASH', code: '78,22' },
    ],
  )
})

test('WP78.3 keeps unknown dimensions explicit and every source row non-selectable', () => {
  assert.ok(wp78CatalogueVisibility.entries.every(({ dimensionsKnown }) => dimensionsKnown === false))
  assert.ok(wp78CatalogueVisibility.entries.every(({ selectable }) => selectable === false))
  assert.equal(wp78CatalogueVisibility.catalogueSelectable, false)
  assert.deepEqual(wp78CatalogueVisibility.blockers, [
    'PROFILE_DIMENSIONS_UNKNOWN',
    'RULES_NOT_VALIDATED',
    'CATALOGUE_PROMOTION_PENDING',
  ])
})

test('WP78.3 does not unlock rules, machine output or production approval', () => {
  assert.equal(wp78CatalogueVisibility.rulesValidated, false)
  assert.equal(wp78CatalogueVisibility.machineReady, false)
  assert.equal(wp78CatalogueVisibility.productionApproved, false)
  assert.equal(wp78CatalogueVisibility.hardwareSourceText, 'с PVC обков')
  assert.equal(wp78CatalogueVisibility.glazingMentioned, true)
})

test('WP78.3 still does not inject WP 78 into normal selectable catalogue seeds', () => {
  assert.equal(sampleCatalogueProfiles.some(({ system }) => system === 'WP 78'), false)
  assert.equal(sampleCatalogueProfiles.some(({ code }) => ['78,01', '78,33', '78,22'].includes(code)), false)
})
