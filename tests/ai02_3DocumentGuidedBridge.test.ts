import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeFacadeFlowDocumentSource, buildFacadeFlowDocumentCandidateGroups, type FacadeFlowProjectDocumentSource } from '../src/aiDocumentIntelligence'
import { facadeFlowDocumentIntentToGuidedPatch } from '../src/aiDocumentGuidedBridge'

const source: FacadeFlowProjectDocumentSource = {
  id: 'doc', fileName: 'window-schedule.txt', kind: 'TEXT', mimeType: 'text/plain', sizeBytes: 100, sha256: 'c'.repeat(64), pageCount: 1, extractionStatus: 'EXTRACTED',
  textPages: [{ pageNumber: 1, text: 'W-31 window 2400x1500 mm, 3 fields, middle tilt-turn, system SYS-90, RAL 7016, triple glazing, 2 hinges' }], warnings: [], capturedAt: '2026-09-01T00:00:00.000Z',
  humanReviewRequired: true, readOnly: true, simulationOnly: true, machineReady: false,
}

test('AI02.3 bridges only compatible document values to the guided human-review form', () => {
  const candidate = analyzeFacadeFlowDocumentSource(source)[0]!
  const group = buildFacadeFlowDocumentCandidateGroups([candidate])[0]!
  const bridge = facadeFlowDocumentIntentToGuidedPatch(group.mergedIntent, [])
  assert.equal(bridge.patch.productType, 'WINDOW')
  assert.equal(bridge.patch.width, '2400')
  assert.equal(bridge.patch.height, '1500')
  assert.equal(bridge.patch.manualProfileSystem, 'SYS-90')
  assert.equal(bridge.patch.exteriorColor, 'RAL 7016')
  assert.equal(bridge.patch.openingType, undefined)
  assert.ok(bridge.notTransferred.some((item) => /Топологията/.test(item)))
  assert.match(bridge.patch.notes ?? '', /ДОКУМЕНТЕН ИЗТОЧНИК/)
  assert.match(bridge.patch.notes ?? '', /window-schedule\.txt/)
  assert.equal(bridge.patch.reviewAccepted, false)
  assert.equal(bridge.patch.status, 'NEEDS_REVIEW')
  assert.equal(bridge.automaticGeometryAllowed, false)
  assert.equal(bridge.machineReady, false)
})
