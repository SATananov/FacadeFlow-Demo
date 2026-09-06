import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('PROFILE DATA 03.2.1 uses the verified PRELUDE catalogue visual instead of a generic hardcoded profile drawing', () => {
  const viewer = readFileSync('src/components/ProfileSectionViewer.tsx', 'utf8')

  for (const marker of [
    'preludeTechnicalProfileByCode',
    'catalogueWithDimensionsAsset',
    'CATALOGUE VISUAL VERIFIED',
    'КАТАЛОЖНО СЕЧЕНИЕ · AI ПРЕРИСУВАНЕ: НЕ',
    'VERIFIED CATALOGUE VISUAL',
    'ISOLATED PRODUCTION CONTOUR: NO',
  ]) assert.equal(viewer.includes(marker), true, marker)

  assert.equal(viewer.includes('function ProfileBody'), false)
  assert.equal(viewer.includes('profile-section-profile-shell'), false)
  assert.equal(viewer.includes('M172 58 H271'), false)
})

test('PROFILE DATA 03.2.1 keeps catalogue visual and Nadezhda measurement semantics visibly separate', () => {
  const viewer = readFileSync('src/components/ProfileSectionViewer.tsx', 'utf8')
  const css = readFileSync('src/projectsWorkspace.css', 'utf8')

  for (const marker of [
    'PROFILE DATA 03.2 · КАТАЛОГ',
    'REFERENCE ONLY',
    'PROFILE DATA 03.2 · НАДЕЖДА',
    'HUMAN CONFIRMED WORKING SEMANTICS',
    'AUTO MERGE: NO · EXACT CONTOUR AUTHORITY: NO',
    'SOURCE PROVENANCE SEPARATED',
  ]) assert.equal(viewer.includes(marker), true, marker)

  assert.match(css, /\.profile-section-catalogue-asset/)
  assert.match(css, /\.profile-section-catalogue-asset img/)
})
