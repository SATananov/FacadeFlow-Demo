import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  createNadezhdaProjectPatternDraft,
  conflictingNadezhdaProjectValue,
  findNadezhdaSameGeometryModuleGroups,
  sourceBackedNadezhdaProjectValue,
  unresolvedNadezhdaProjectValue,
  validateNadezhdaProjectPatternDraft,
  type NadezhdaProjectEvidenceRef,
  type NadezhdaProjectModule,
  type NadezhdaProjectOfferVariant,
  type NadezhdaProjectProductGroup,
} from '../src/realData/nadezhdaProjectPatternSchema'

const evidence = (id: string): NadezhdaProjectEvidenceRef => ({
  id,
  sourceKind: 'DOCX',
  sourceReference: 'PRIVATE_REFERENCE_SOURCE.docx',
  locator: `fixture:${id}`,
  note: 'Synthetic regression evidence; no customer data is stored in the repository.',
  privateSource: true,
})

const projectModule = (id: string, width: number, height: number, quantity = 1, placement = ''): NadezhdaProjectModule => ({
  id,
  externalReference: sourceBackedNadezhdaProjectValue(id.toUpperCase(), ['e-modules']),
  quantity: sourceBackedNadezhdaProjectValue(quantity, ['e-modules']),
  widthMm: sourceBackedNadezhdaProjectValue(width, ['e-modules']),
  heightMm: sourceBackedNadezhdaProjectValue(height, ['e-modules']),
  placement: placement
    ? [{ kind: 'FLOOR', label: sourceBackedNadezhdaProjectValue(placement, ['e-modules']) }]
    : [],
  notes: unresolvedNadezhdaProjectValue<string>(),
})

const group = (id: string, moduleIds: string[], material: 'PVC' | 'ALUMINIUM', system: string): NadezhdaProjectProductGroup => ({
  id,
  label: sourceBackedNadezhdaProjectValue(id, ['e-offer']),
  material: sourceBackedNadezhdaProjectValue(material, ['e-offer']),
  system: sourceBackedNadezhdaProjectValue(system, ['e-offer']),
  color: sourceBackedNadezhdaProjectValue('RAL / source value', ['e-offer']),
  glazing: sourceBackedNadezhdaProjectValue('source glazing specification', ['e-offer']),
  hardware: sourceBackedNadezhdaProjectValue('source hardware specification', ['e-offer']),
  reinforcement: unresolvedNadezhdaProjectValue<string>(),
  moduleIds,
  moduleOverrides: [],
})

const variant = (id: string, groups: NadezhdaProjectProductGroup[]): NadezhdaProjectOfferVariant => ({
  id,
  label: sourceBackedNadezhdaProjectValue(id, ['e-offer']),
  productGroups: groups,
  priceComponents: [],
  totalPrice: unresolvedNadezhdaProjectValue<number>(),
  currency: unresolvedNadezhdaProjectValue<string>(),
  vatIncluded: unresolvedNadezhdaProjectValue<boolean>(),
  includedItems: [],
  excludedItems: [],
})

test('REAL DATA 02.1 creates a private source-backed draft with production locks', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-001')
  assert.equal(draft.schemaVersion, 'REALDATA02.1')
  assert.equal(draft.status, 'SOURCE_DRAFT')
  assert.equal(draft.humanReviewStatus, 'NOT_REVIEWED')
  assert.equal(draft.safety.privateReferenceCorpus, true)
  assert.equal(draft.safety.templatePromotionAllowed, false)
  assert.equal(draft.safety.automaticReuseAllowed, false)
  assert.equal(draft.safety.automaticModuleMergeAllowed, false)
  assert.equal(draft.safety.automaticAttributeInferenceAllowed, false)
  assert.equal(draft.safety.machineReady, false)
  assert.equal(draft.safety.productionApproved, false)
})

test('REAL DATA 02.1 supports optional floor placement without requiring a building hierarchy', () => {
  const item = projectModule('m-1', 1420, 1420, 1, 'Етаж 1')
  assert.equal(item.placement.length, 1)
  assert.equal(item.placement[0]?.kind, 'FLOOR')
  assert.equal(item.placement[0]?.label.value, 'Етаж 1')
  assert.equal(projectModule('m-2', 900, 2100).placement.length, 0)
})

test('REAL DATA 02.1 keeps same-size modules as distinct positions', () => {
  const modules = [projectModule('m-1', 1900, 2520), projectModule('m-2', 1900, 2520), projectModule('m-3', 1670, 2520)]
  assert.deepEqual(findNadezhdaSameGeometryModuleGroups(modules), [['m-1', 'm-2']])
  assert.equal(modules.length, 3)
})

test('REAL DATA 02.1 separates project geometry from multiple offer variants', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-variants')
  draft.evidence = [evidence('e-modules'), evidence('e-offer')]
  draft.modules = [projectModule('m-1', 2000, 1700), projectModule('m-2', 900, 2600)]
  draft.offerVariants = [
    variant('variant-a', [group('group-a', ['m-1', 'm-2'], 'PVC', 'SYSTEM-A')]),
    variant('variant-b', [group('group-b', ['m-1', 'm-2'], 'ALUMINIUM', 'SYSTEM-B')]),
  ]
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.equal(result.errors.length, 0)
  assert.equal(draft.modules.length, 2)
  assert.equal(draft.offerVariants.length, 2)
  assert.ok(result.warnings.some((item) => item.includes('няколко офертни варианта')))
})

test('REAL DATA 02.1 supports mixed PVC and aluminium product groups in one offer variant', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-mixed')
  draft.evidence = [evidence('e-modules'), evidence('e-offer')]
  draft.modules = [projectModule('pvc-1', 2600, 2200), projectModule('al-1', 3150, 2400)]
  draft.offerVariants = [variant('offer-1', [
    group('pvc', ['pvc-1'], 'PVC', 'PVC-SYSTEM'),
    group('al', ['al-1'], 'ALUMINIUM', 'AL-SYSTEM'),
  ])]
  assert.equal(validateNadezhdaProjectPatternDraft(draft).errors.length, 0)
})

test('REAL DATA 02.1 supports module-level glazing overrides without changing sibling modules', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-override')
  draft.evidence = [evidence('e-modules'), evidence('e-offer'), evidence('e-special')]
  draft.modules = [projectModule('al-1', 5300, 480), projectModule('al-2', 3150, 1500)]
  const al = group('al', ['al-1', 'al-2'], 'ALUMINIUM', 'AL-SYSTEM')
  al.moduleOverrides = [{ moduleId: 'al-1', glazing: sourceBackedNadezhdaProjectValue('special glazing', ['e-special']) }]
  draft.offerVariants = [variant('offer', [al])]
  assert.equal(validateNadezhdaProjectPatternDraft(draft).errors.length, 0)
  assert.equal(al.moduleOverrides[0]?.glazing?.value, 'special glazing')
  assert.equal(al.glazing.value, 'source glazing specification')
})

test('REAL DATA 02.1 supports area, piece, linear-meter and fixed price components', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-pricing')
  draft.evidence = [evidence('e-modules'), evidence('e-offer')]
  draft.modules = [projectModule('m-1', 6100, 1250, 21)]
  const offer = variant('offer', [group('g', ['m-1'], 'PVC', 'PVC-SYSTEM')])
  offer.priceComponents = ['AREA_M2', 'PER_PIECE', 'LINEAR_METER', 'FIXED'].map((basis, index) => ({
    id: `price-${index}`,
    label: sourceBackedNadezhdaProjectValue(`component-${index}`, ['e-offer']),
    basis: basis as 'AREA_M2' | 'PER_PIECE' | 'LINEAR_METER' | 'FIXED',
    quantity: sourceBackedNadezhdaProjectValue(1, ['e-offer']),
    unit: sourceBackedNadezhdaProjectValue('source unit', ['e-offer']),
    unitPrice: sourceBackedNadezhdaProjectValue(1, ['e-offer']),
    totalPrice: sourceBackedNadezhdaProjectValue(1, ['e-offer']),
    currency: sourceBackedNadezhdaProjectValue('BGN', ['e-offer']),
  }))
  draft.offerVariants = [offer]
  assert.equal(validateNadezhdaProjectPatternDraft(draft).errors.length, 0)
  assert.deepEqual(offer.priceComponents.map((item) => item.basis), ['AREA_M2', 'PER_PIECE', 'LINEAR_METER', 'FIXED'])
})

test('REAL DATA 02.1 keeps included and excluded commercial items separate', () => {
  const offer = variant('offer', [])
  offer.includedItems = [sourceBackedNadezhdaProjectValue('included source item', ['e-offer'])]
  offer.excludedItems = [sourceBackedNadezhdaProjectValue('excluded source item', ['e-offer'])]
  assert.notEqual(offer.includedItems[0]?.value, offer.excludedItems[0]?.value)
})

test('REAL DATA 02.1 represents missing source data as unresolved rather than inferred', () => {
  const value = unresolvedNadezhdaProjectValue<string>()
  assert.equal(value.state, 'UNRESOLVED')
  assert.equal(value.value, null)
  assert.equal(value.humanConfirmed, false)
})

test('REAL DATA 02.1 represents contradictory source data as conflict', () => {
  const value = conflictingNadezhdaProjectValue<string>(['e-a', 'e-b'])
  assert.equal(value.state, 'CONFLICT')
  assert.equal(value.value, null)
  assert.deepEqual(value.evidenceRefs, ['e-a', 'e-b'])
})



test('REAL DATA 02.1 rejects resolved values without source evidence', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-resolved-without-evidence')
  draft.projectName = { state: 'RESOLVED', value: 'Synthetic', evidenceRefs: [], humanConfirmed: false }
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.equal(result.readyForHumanReview, false)
  assert.ok(result.errors.some((item) => item.includes('поне един evidence ref')))
})

test('REAL DATA 02.1 rejects non-resolved values that contain inferred values', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-unresolved-with-value')
  draft.projectName = { state: 'UNRESOLVED', value: 'Do not infer this', evidenceRefs: [], humanConfirmed: false }
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.equal(result.readyForHumanReview, false)
  assert.ok(result.errors.some((item) => item.includes('ненулева стойност')))
})

test('REAL DATA 02.1 rejects dangling evidence references', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-bad-evidence')
  draft.projectName = sourceBackedNadezhdaProjectValue('Synthetic', ['missing-evidence'])
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.equal(result.readyForHumanReview, false)
  assert.ok(result.errors.some((item) => item.includes('missing-evidence')))
})

test('REAL DATA 02.1 rejects product groups that reference missing modules', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-bad-module')
  draft.evidence = [evidence('e-offer')]
  draft.offerVariants = [variant('offer', [group('g', ['missing-module'], 'PVC', 'PVC-SYSTEM')])]
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.equal(result.readyForHumanReview, false)
  assert.ok(result.errors.some((item) => item.includes('липсващ модул')))
})

test('REAL DATA 02.1 rejects module overrides outside their product group', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-bad-override')
  draft.evidence = [evidence('e-modules'), evidence('e-offer')]
  draft.modules = [projectModule('m-1', 1000, 1000), projectModule('m-2', 1200, 1200)]
  const g = group('g', ['m-1'], 'PVC', 'PVC-SYSTEM')
  g.moduleOverrides = [{ moduleId: 'm-2', glazing: unresolvedNadezhdaProjectValue<string>() }]
  draft.offerVariants = [variant('offer', [g])]
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.ok(result.errors.some((item) => item.includes('не принадлежи')))
})

test('REAL DATA 02.1 warns about repeated geometry but never merges it', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-repeat')
  draft.evidence = [evidence('e-modules')]
  draft.modules = [projectModule('m-1', 2600, 2200), projectModule('m-2', 2600, 2200)]
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.deepEqual(result.sameGeometryGroups, [['m-1', 'm-2']])
  assert.ok(result.warnings.some((item) => item.includes('не се сливат автоматично')))
  assert.equal(draft.safety.automaticModuleMergeAllowed, false)
})

test('REAL DATA 02.1 validates positive resolved dimensions and quantities', () => {
  const draft = createNadezhdaProjectPatternDraft('fixture-invalid-dimension')
  draft.evidence = [evidence('e-modules')]
  draft.modules = [projectModule('m-1', 0, 1700, 0)]
  const result = validateNadezhdaProjectPatternDraft(draft)
  assert.ok(result.errors.some((item) => item.includes('Невалиден брой')))
  assert.ok(result.errors.some((item) => item.includes('Невалидна ширина')))
})


test('REAL DATA 02.0 private project corpus reuses the existing local-samples shareable boundary', () => {
  const gitignore = readFileSync('.gitignore', 'utf8')
  const checkpoint = readFileSync('scripts/New-FacadeFlowCheckpoint.ps1', 'utf8')
  assert.ok(gitignore.includes('local-samples/'))
  assert.ok(checkpoint.includes('$excludedDirs += "local-samples"'))
  assert.ok(checkpoint.includes('Shareable checkpoint guard failed: local-samples was copied.'))
})
