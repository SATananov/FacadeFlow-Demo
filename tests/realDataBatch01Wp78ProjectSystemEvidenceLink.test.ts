import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeWp78EvidenceCode,
  wp78ProjectOnlyEvidenceLinks,
  wp78ProjectSystemEvidenceLink,
  wp78RoleProjectEvidenceLinks,
} from '../src/realData/wp78ProjectSystemEvidenceLink'

test('WP78.3.1 bridge compares comma and dot source literals without overwriting either literal', () => {
  assert.equal(normalizeWp78EvidenceCode('78,01'), '78.01')
  assert.equal(normalizeWp78EvidenceCode('78.01'), '78.01')

  const frame = wp78RoleProjectEvidenceLinks.find((link) => link.sourceCodeLiteral === '78,01')
  assert.ok(frame)
  assert.equal(frame.state, 'ROLE_AND_PROJECT_CODE_MATCH')
  assert.equal(frame.projectCodeLiteral, '78.01')
  assert.equal(frame.sourceRoleLabel, 'Каса')
  assert.equal(frame.catalogueRole, 'FRAME')
})

test('WP78.3.1 bridge links the verified divider role to existing Vadim-2 evidence', () => {
  const mullion = wp78RoleProjectEvidenceLinks.find((link) => link.sourceCodeLiteral === '78,33')
  assert.ok(mullion)
  assert.equal(mullion.state, 'ROLE_AND_PROJECT_CODE_MATCH')
  assert.equal(mullion.projectCodeLiteral, '78.33')
  assert.equal(mullion.sourceRoleLabel, 'Делител')
  assert.equal(mullion.catalogueRole, 'MULLION')
  assert.equal(mullion.projectXmlMaxY, 79)
  assert.equal(mullion.projectXmlMaxZ, 70)
})

test('WP78.3.1 keeps 78,22 as source-only because Vadim-2 does not contain a matching project code', () => {
  const sash = wp78RoleProjectEvidenceLinks.find((link) => link.sourceCodeLiteral === '78,22')
  assert.ok(sash)
  assert.equal(sash.state, 'SOURCE_ONLY_NO_PROJECT_CODE_MATCH')
  assert.equal(sash.projectCodeLiteral, null)
  assert.equal(sash.sourceRoleLabel, 'Крило прозорец')
  assert.equal(sash.catalogueRole, 'SASH')
})

test('WP78.3.1 keeps Vadim-2 78.27 and 78.51 real but role-unconfirmed', () => {
  assert.deepEqual(
    wp78ProjectOnlyEvidenceLinks.map((link) => ({ code: link.projectCodeLiteral, roleStatus: link.roleStatus })),
    [
      { code: '78.27', roleStatus: 'UNCONFIRMED' },
      { code: '78.51', roleStatus: 'UNCONFIRMED' },
    ],
  )
  assert.ok(wp78ProjectOnlyEvidenceLinks.every((link) => link.catalogueRole === null))
})

test('WP78.3.1 records a candidate project-system match but never auto-confirms the system or roles', () => {
  assert.equal(wp78ProjectSystemEvidenceLink.project, 'Вадим-2')
  assert.equal(wp78ProjectSystemEvidenceLink.candidateSystem, 'WP 78')
  assert.equal(wp78ProjectSystemEvidenceLink.candidateStatus, 'CANDIDATE_REQUIRES_HUMAN_CONFIRMATION')
  assert.equal(wp78ProjectSystemEvidenceLink.matchedRoleProjectCodeCount, 2)
  assert.equal(wp78ProjectSystemEvidenceLink.sourceOnlyCodeCount, 1)
  assert.equal(wp78ProjectSystemEvidenceLink.projectOnlyCodeCount, 2)
  assert.equal(wp78ProjectSystemEvidenceLink.autoSystemConfirmationAllowed, false)
  assert.equal(wp78ProjectSystemEvidenceLink.autoRoleInferenceAllowed, false)
})

test('WP78.3.1 does not reinterpret XML MaxY/MaxZ as confirmed catalogue dimensions or unlock production', () => {
  assert.equal(wp78ProjectSystemEvidenceLink.xmlMaxYMaxZMeaningConfirmedAsCatalogueDimensions, false)
  assert.equal(wp78ProjectSystemEvidenceLink.catalogueSelectable, false)
  assert.equal(wp78ProjectSystemEvidenceLink.rulesValidated, false)
  assert.equal(wp78ProjectSystemEvidenceLink.machineReady, false)
  assert.equal(wp78ProjectSystemEvidenceLink.productionApproved, false)
})
