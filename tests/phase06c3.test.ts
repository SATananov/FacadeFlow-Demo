import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { addFacadeFlowProjectNode, confirmFacadeFlowGuidedProduct, createFacadeFlowAiSession, prepareFacadeFlowGuidedProduct, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, selectFacadeFlowProjectNode, setFacadeFlowGuidedReviewAccepted, updateFacadeFlowGuidedProduct } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import { addProjectStructureNode, createEmptyProjectStructure, projectStructurePathLabels, removeProjectStructureNode } from '../src/projectStructure'

const fullWindowPatch = {
  productType: 'WINDOW' as const, name: 'W-01', quantity: '1', width: '1400', height: '1200', profileSystem: 'DEMO SYSTEM', frameProfileId: 'profile-demo-frame-01', sashProfileId: 'profile-demo-sash-01', openingType: 'TILT_TURN' as const, openingDirection: 'LEFT' as const, inwardOutward: 'INWARD' as const, fillType: 'GLAZING_UNIT' as const, fillDescription: 'Demo glazing', colorMode: 'SAME_BOTH_SIDES' as const, exteriorColor: 'Demo color', hardwareType: 'WINDOW' as const, hardwareDescription: 'Demo hardware', handleType: 'STANDARD' as const, handleDescription: 'Demo handle',
}

void test('06C.3 starts with a flexible empty project structure and does not force hierarchy for a single product', () => {
  const structure = createEmptyProjectStructure()
  assert.equal(structure.mode, 'FLEXIBLE')
  assert.deepEqual(structure.nodes, [])
  assert.equal(structure.activeNodeId, null)
  assert.equal(structure.sessionOnly, true)
  assert.equal(structure.simulationOnly, true)
})

void test('06C.3 supports an optional building → floor → room → position path without inventing labels', () => {
  let structure = createEmptyProjectStructure()
  structure = addProjectStructureNode(structure, { id: 'building', kind: 'BUILDING', label: 'Корпус А' })
  structure = addProjectStructureNode(structure, { id: 'floor', kind: 'FLOOR', label: 'Етаж 2', parentId: 'building' })
  structure = addProjectStructureNode(structure, { id: 'room', kind: 'ROOM', label: 'Дневна', parentId: 'floor' })
  structure = addProjectStructureNode(structure, { id: 'position', kind: 'POSITION', label: 'W-07', parentId: 'room' })
  assert.deepEqual(projectStructurePathLabels(structure), ['Корпус А', 'Етаж 2', 'Дневна', 'W-07'])
})

void test('06C.3 recursively removes child nodes and clears an active path that no longer exists', () => {
  let structure = createEmptyProjectStructure()
  structure = addProjectStructureNode(structure, { id: 'floor', kind: 'FLOOR', label: 'Етаж 1' })
  structure = addProjectStructureNode(structure, { id: 'position', kind: 'POSITION', label: 'W-01', parentId: 'floor' })
  structure = removeProjectStructureNode(structure, 'floor')
  assert.deepEqual(structure.nodes, [])
  assert.equal(structure.activeNodeId, null)
})

void test('06C.3 stores the selected project path in the structured product specification', () => {
  let session = selectFacadeFlowAiInputMode(selectFacadeFlowJobType(createFacadeFlowAiSession('06c3-path'), 'BUILDING'), 'DESCRIPTION')
  session = addFacadeFlowProjectNode(session, { id: 'floor', kind: 'FLOOR', label: 'Етаж 3' })
  session = addFacadeFlowProjectNode(session, { id: 'room', kind: 'ROOM', label: 'Офис 302', parentId: 'floor' })
  session = addFacadeFlowProjectNode(session, { id: 'position', kind: 'POSITION', label: 'W-12', parentId: 'room' })
  session = updateFacadeFlowGuidedProduct(session, fullWindowPatch, sampleCatalogueProfiles)
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  assert.deepEqual(session.job.products[0]?.groupPath, ['Етаж 3', 'Офис 302', 'W-12'])
  assert.equal(session.job.products[0]?.placementNodeId, 'position')
})

void test('06C.3 changing product placement invalidates an already confirmed guided proposal instead of silently moving approved data', () => {
  let session = selectFacadeFlowAiInputMode(selectFacadeFlowJobType(createFacadeFlowAiSession('06c3-invalidate'), 'HOUSE'), 'DESCRIPTION')
  session = addFacadeFlowProjectNode(session, { id: 'room-a', kind: 'ROOM', label: 'Дневна' })
  session = updateFacadeFlowGuidedProduct(session, fullWindowPatch, sampleCatalogueProfiles)
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  session = setFacadeFlowGuidedReviewAccepted(session, true)
  session = confirmFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  assert.equal(session.job.guidedProduct.status, 'HUMAN_CONFIRMED')
  assert.equal(session.job.products.length, 1)
  session = addFacadeFlowProjectNode(session, { id: 'room-b', kind: 'ROOM', label: 'Спалня' })
  session = selectFacadeFlowProjectNode(session, 'room-b')
  assert.equal(session.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(session.job.guidedProduct.reviewAccepted, false)
  assert.equal(session.job.products.length, 0)
  assert.equal(session.productionApproved, false)
})

void test('06C.3 UI exposes optional manual hierarchy and direct-product fallback before product input', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const builder = readFileSync('src/components/ProjectStructureBuilder.tsx', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  const model = readFileSync('src/projectStructure.ts', 'utf8')
  assert.match(workspace, /ProjectStructureBuilder/)
  assert.match(builder, /СТРУКТУРА · OPTIONAL/)
  assert.match(builder, /Без структура \/ директно изделие/)
  assert.match(model, /Сграда \/ корпус/)
  assert.match(model, /Етаж/)
  assert.match(model, /Помещение/)
  assert.match(model, /Позиция \/ марка/)
  assert.match(css, /ff-project-structure/)
})

void test('06C.3 introduces no persistence, network, machine export, production approval or automatic geometry behavior', () => {
  const combined = ['src/projectStructure.ts', 'src/components/ProjectStructureBuilder.tsx', 'src/aiWorkspaceState.ts'].map((path) => readFileSync(path, 'utf8')).join('\n')
  assert.doesNotMatch(combined, /fetch\s*\(/)
  assert.doesNotMatch(combined, /WebSocket\s*\(/)
  assert.doesNotMatch(combined, /localStorage|sessionStorage/)
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|automaticGeometryAllowed\s*:\s*true|productionApproved\s*:\s*true/)
})
