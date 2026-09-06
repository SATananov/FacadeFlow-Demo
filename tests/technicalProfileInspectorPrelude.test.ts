import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  PRELUDE_TECHNICAL_INSPECTOR_SAFETY,
  PRELUDE_TECHNICAL_PROFILES,
  preludeTechnicalProfileByCode,
} from '../src/profileData/preludeTechnicalInspector'
import {
  PRELUDE_MEASUREMENT_ANCHOR_CANDIDATES,
  PRELUDE_MEASUREMENT_ANCHOR_SAFETY,
} from '../src/profileData/preludeMeasurementAnchors'

const component = readFileSync('src/components/TechnicalProfileInspector.tsx', 'utf8')
const proposal = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
const workspaceCss = readFileSync('src/aiWorkspace.css', 'utf8')

const publicPath = (asset: string) => `public${asset}`

test('Technical Profile Inspector exposes only the three verified PRELUDE catalogue views used by the working checkpoint', () => {
  assert.deepEqual(PRELUDE_TECHNICAL_PROFILES.map((item) => item.code).sort(), ['482.05', '482.21', '482.30'])
  for (const profile of PRELUDE_TECHNICAL_PROFILES) {
    assert.equal(profile.verifiedCatalogueVisual, true)
    assert.equal(profile.aiRedrawn, false)
    assert.equal(profile.isolatedProductionContour, false)
    assert.equal(profile.geometricAnchorPointsValidated, false)
    assert.equal(profile.machineReady, false)
    assert.equal(profile.productionApproved, false)
    assert.equal(existsSync(publicPath(profile.catalogueSectionOnlyAsset)), true)
    assert.equal(existsSync(publicPath(profile.catalogueWithDimensionsAsset)), true)
  }
})

test('verified PRELUDE working semantics preserve the confirmed 64/42, 78/56 and 84/40 interpretations', () => {
  assert.deepEqual(preludeTechnicalProfileByCode('482.30')?.humanConfirmedWorkingSemantics, {
    fullWorkingMm: 64, visibleMm: 42, zoneMm: 22, zoneSides: 1,
    formulaBg: '64 − 22 = 42 mm',
    noteBg: 'Пълен размер 64 mm. След една потвърдена зона 22 mm остава видима ширина 42 mm.',
  })
  assert.equal(preludeTechnicalProfileByCode('482.05')?.humanConfirmedWorkingSemantics.fullWorkingMm, 78)
  assert.equal(preludeTechnicalProfileByCode('482.05')?.humanConfirmedWorkingSemantics.visibleMm, 56)
  assert.equal(preludeTechnicalProfileByCode('482.21')?.humanConfirmedWorkingSemantics.fullWorkingMm, 84)
  assert.equal(preludeTechnicalProfileByCode('482.21')?.humanConfirmedWorkingSemantics.visibleMm, 40)
})

test('measurement anchors are semantic candidates with no invented contour coordinates', () => {
  for (const profile of PRELUDE_TECHNICAL_PROFILES) {
    const anchors = PRELUDE_MEASUREMENT_ANCHOR_CANDIDATES[profile.code]
    assert.ok(anchors.length >= 3)
    for (const anchor of anchors) {
      assert.equal(anchor.evidence, 'HUMAN_CONFIRMED_MEASUREMENT_SEMANTICS')
      assert.equal(anchor.bindingState, 'SEMANTIC_ONLY_NOT_BOUND_TO_CONTOUR')
      assert.equal(anchor.startPoint, null)
      assert.equal(anchor.endPoint, null)
      assert.equal(anchor.machineReady, false)
      assert.equal(anchor.productionApproved, false)
    }
  }
  assert.equal(PRELUDE_MEASUREMENT_ANCHOR_SAFETY.geometricAnchorPointsValidated, false)
  assert.equal(PRELUDE_MEASUREMENT_ANCHOR_SAFETY.anchorCoordinatesPresent, false)
  assert.equal(PRELUDE_MEASUREMENT_ANCHOR_SAFETY.machineReady, false)
})

test('inspector renders catalogue SVGs, not the legacy hand-drawn ProfileBody', () => {
  assert.match(component, /<img src=\{imageSrc\}/)
  assert.match(component, /ИСТИНСКА PRELUDE СКИЦА/)
  assert.match(component, /AI ПРЕРИСУВАНЕ: НЕ · ИЗОЛИРАН ПРОИЗВОДСТВЕН КОНТУР: НЕ/)
  assert.match(component, /НАЧАЛО: НЕСВЪРЗАНО · КРАЙ: НЕСВЪРЗАНО/)
  assert.doesNotMatch(component, /function ProfileBody/)
  assert.match(proposal, /TechnicalProfileInspector/)
})

test('inspector safety never promotes catalogue visuals or measurement semantics to production authority', () => {
  assert.equal(PRELUDE_TECHNICAL_INSPECTOR_SAFETY.catalogueVisualIsSourceOfTruth, true)
  assert.equal(PRELUDE_TECHNICAL_INSPECTOR_SAFETY.exactProductionContourClaimed, false)
  assert.equal(PRELUDE_TECHNICAL_INSPECTOR_SAFETY.geometricAnchorPointsValidated, false)
  assert.equal(PRELUDE_TECHNICAL_INSPECTOR_SAFETY.assemblyAnchorsValidated, false)
  assert.equal(PRELUDE_TECHNICAL_INSPECTOR_SAFETY.machineReady, false)
  assert.equal(PRELUDE_TECHNICAL_INSPECTOR_SAFETY.productionApproved, false)
})


test('inspector selected profile and catalogue-view controls beat the global high-specificity light selected state', () => {
  assert.match(workspaceCss, /ff-profile-inspector \.ff-profile-inspector-tabs button\.selected/)
  assert.match(workspaceCss, /ff-profile-inspector \.ff-profile-inspector-tabs button\.selected\[aria-selected="true"\]/)
  assert.match(workspaceCss, /background-color:#173842!important/)
  assert.match(workspaceCss, /ff-profile-inspector \.ff-profile-catalogue-toolbar button\.selected[\s\S]*background-color:#153b44!important/)
})

test('inspector user-facing status labels are Bulgarian while machine safety metadata stays unchanged', () => {
  assert.match(component, /ТЕХНИЧЕСКИ ИНСПЕКТОР НА ПРОФИЛ/)
  assert.match(component, /КАТАЛОЖНА СКИЦА: ПРОВЕРЕНА/)
  assert.match(component, /ИЗМЕРВАТЕЛНИ ОПОРИ/)
  assert.match(component, /ГЕОМЕТРИЧНИ ОПОРИ ПОТВЪРДЕНИ: НЕ/)
  assert.doesNotMatch(component, />GEOMETRIC ANCHORS VALIDATED:/)
  assert.match(component, /data-safety="GEOMETRIC ANCHORS VALIDATED: NO · ASSEMBLY ANCHORS VALIDATED: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO"/)
})
