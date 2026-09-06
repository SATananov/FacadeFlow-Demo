import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const viewer = fs.readFileSync('src/components/ProfileSectionViewer.tsx', 'utf8')
const css = fs.readFileSync('src/projectsWorkspace.css', 'utf8')

test('03.1.1 legacy visual regression is superseded by verified PRELUDE catalogue visual truth', () => {
  assert.match(viewer, /preludeTechnicalProfileByCode/)
  assert.match(viewer, /catalogueWithDimensionsAsset/)
  assert.match(viewer, /CATALOGUE VISUAL VERIFIED/)
  assert.match(viewer, /КАТАЛОЖНО СЕЧЕНИЕ · AI ПРЕРИСУВАНЕ: НЕ/)

  assert.doesNotMatch(viewer, /function ProfileBody/)
  assert.doesNotMatch(viewer, /profile-section-profile-shell/)
  assert.doesNotMatch(viewer, /<rect className="profile-section-outline"/)
})

test('03.1.1 catalogue visual keeps source evidence separate from Nadezhda working measurement semantics', () => {
  assert.match(viewer, /PROFILE DATA 03\.2 · КАТАЛОГ/)
  assert.match(viewer, /REFERENCE ONLY/)
  assert.match(viewer, /PROFILE DATA 03\.2 · НАДЕЖДА/)
  assert.match(viewer, /HUMAN CONFIRMED WORKING SEMANTICS/)
  assert.match(viewer, /AUTO MERGE: NO · EXACT CONTOUR AUTHORITY: NO/)
  assert.match(viewer, /SOURCE PROVENANCE SEPARATED/)
})

test('03.1.1 preserves explicit non-CAD and non-production boundary after catalogue visual truth hotfix', () => {
  assert.match(viewer, /VERIFIED CATALOGUE VISUAL/)
  assert.match(viewer, /ISOLATED PRODUCTION CONTOUR: NO/)
  assert.match(viewer, /MACHINE READY: NO/)
  assert.match(viewer, /PRODUCTION APPROVED: NO/)
  assert.match(viewer, /не се обявява за изолиран производствен CAD контур/)
})

test('03.1.1 styles the verified catalogue asset rather than the retired hand-authored shell', () => {
  assert.match(css, /\.profile-section-catalogue-asset/)
  assert.match(css, /\.profile-section-catalogue-asset img/)
  assert.match(css, /\.profile-section-canvas\.catalogue-source/)
})
