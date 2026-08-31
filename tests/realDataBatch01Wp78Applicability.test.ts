import assert from 'node:assert/strict'
import test from 'node:test'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import {
  wp78ApplicabilitySummary,
  wp78CanEnterSelectableCatalogue,
  wp78CatalogueBlockers,
  wp78IsProductCategorySourceSupported,
  wp78ProfilesForRole,
  wp78RoleApplicability,
} from '../src/realData/wp78Applicability'

test('WP78.2 maps the three source-backed roles without changing exact codes', () => {
  assert.deepEqual(
    wp78RoleApplicability.map(({ sourceRoleLabel, catalogueRole, code }) => ({ sourceRoleLabel, catalogueRole, code })),
    [
      { sourceRoleLabel: 'Каса', catalogueRole: 'FRAME', code: '78,01' },
      { sourceRoleLabel: 'Делител', catalogueRole: 'MULLION', code: '78,33' },
      { sourceRoleLabel: 'Крило прозорец', catalogueRole: 'SASH', code: '78,22' },
    ],
  )
  assert.deepEqual(wp78ProfilesForRole('FRAME').map(({ code }) => code), ['78,01'])
  assert.deepEqual(wp78ProfilesForRole('MULLION').map(({ code }) => code), ['78,33'])
  assert.deepEqual(wp78ProfilesForRole('SASH').map(({ code }) => code), ['78,22'])
})

test('WP78.2 source applicability is WINDOW only and does not fabricate door support', () => {
  assert.equal(wp78IsProductCategorySourceSupported('WINDOW'), true)
  assert.equal(wp78IsProductCategorySourceSupported('DOOR'), false)
  assert.deepEqual(wp78ApplicabilitySummary.supportedProductCategories, ['WINDOW'])
  assert.deepEqual(wp78ApplicabilitySummary.unsupportedProductCategories, ['DOOR'])
})

test('WP78.2 remains blocked from selectable catalogue because dimensions and rules are unknown', () => {
  assert.equal(wp78CanEnterSelectableCatalogue(), false)
  assert.deepEqual(wp78CatalogueBlockers, ['PROFILE_DIMENSIONS_UNKNOWN', 'RULES_NOT_VALIDATED', 'CATALOGUE_PROMOTION_PENDING'])
  assert.equal(wp78ApplicabilitySummary.dimensionsKnown, false)
  assert.equal(wp78ApplicabilitySummary.catalogueSelectable, false)
  assert.equal(wp78ApplicabilitySummary.rulesValidated, false)
  assert.equal(wp78ApplicabilitySummary.machineReady, false)
  assert.equal(wp78ApplicabilitySummary.productionApproved, false)
})

test('WP78.2 does not inject WP 78 into the normal CatalogueProfile seed', () => {
  assert.equal(sampleCatalogueProfiles.some(({ system }) => system === 'WP 78'), false)
  assert.equal(sampleCatalogueProfiles.some(({ code }) => ['78,01', '78,33', '78,22'].includes(code)), false)
})
