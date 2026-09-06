import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  PRELUDE_60_KNOWLEDGE_PROVENANCE,
  PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY,
  PRELUDE_60_KNOWLEDGE_PROVENANCE_VERSION,
  prelude60KnowledgeProvenanceByCode,
} from '../src/profileData/prelude60KnowledgeProvenance'

test('PROFILE DATA 03.2 keeps catalogue and Nadezhda knowledge as separate authorities', () => {
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE_VERSION, 'PROFILE_DATA_03.2')
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE.length, 3)
  for (const item of PRELUDE_60_KNOWLEDGE_PROVENANCE) {
    assert.equal(item.catalogue.authority, 'CATALOGUE_REFERENCE_ONLY')
    assert.equal(item.humanWorking.authority, 'HUMAN_CONFIRMED_WORKING_SEMANTICS')
    assert.equal(item.mergeState, 'SEPARATE_SOURCES_NO_AUTO_MERGE')
    assert.equal(item.exactContourAuthority, 'NOT_ESTABLISHED')
    assert.equal(item.machineReady, false)
    assert.equal(item.productionApproved, false)
  }
})

test('PROFILE DATA 03.2 records agreement only where catalogue visible-width semantics already exist', () => {
  const frame = prelude60KnowledgeProvenanceByCode('482.30')!
  const sash = prelude60KnowledgeProvenanceByCode('482.05')!
  const mullion = prelude60KnowledgeProvenanceByCode('482.21')!

  assert.equal(frame.catalogue.labelledVisibleMm, 42)
  assert.equal(frame.humanWorking.visibleWidthMm, 42)
  assert.equal(frame.visibleWidthAgreement, true)
  assert.equal(frame.comparisonState, 'VISIBLE_WIDTH_AGREES_ACROSS_SOURCES')

  assert.equal(sash.catalogue.labelledVisibleMm, null)
  assert.equal(sash.catalogue.labelledOverallExtentMm, 56)
  assert.equal(sash.humanWorking.fullWorkingMm, 78)
  assert.equal(sash.humanWorking.visibleWidthMm, 56)
  assert.equal(sash.visibleWidthAgreement, null)
  assert.equal(sash.comparisonState, 'NOT_DIRECTLY_COMPARABLE')

  assert.equal(mullion.catalogue.labelledVisibleMm, 40)
  assert.equal(mullion.humanWorking.visibleWidthMm, 40)
  assert.equal(mullion.visibleWidthAgreement, true)
})

test('PROFILE DATA 03.2 provenance is visible in the section viewer without unlocking production', () => {
  const viewer = readFileSync('src/components/ProfileSectionViewer.tsx', 'utf8')
  const css = readFileSync('src/projectsWorkspace.css', 'utf8')
  for (const marker of [
    'prelude60KnowledgeProvenanceByCode',
    'PROFILE DATA 03.2 · КАТАЛОГ',
    'REFERENCE ONLY',
    'PROFILE DATA 03.2 · НАДЕЖДА',
    'HUMAN CONFIRMED WORKING SEMANTICS',
    'AUTO MERGE: NO · EXACT CONTOUR AUTHORITY: NO',
    'SOURCE PROVENANCE SEPARATED',
  ]) assert.equal(viewer.includes(marker), true, marker)
  assert.match(css, /\.profile-section-provenance/)
})

test('PROFILE DATA 03.2 safety cannot auto-merge or promote data to production truth', () => {
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY.catalogueAndHumanSourcesRemainSeparate, true)
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY.automaticCatalogueMergeAllowed, false)
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY.automaticGeometryOverwriteAllowed, false)
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY.exactContourAuthorityEstablished, false)
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY.machineReady, false)
  assert.equal(PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY.productionApproved, false)
})
