import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeFacadeFlowDocumentSource, detectFacadeFlowProjectDocumentKind, type FacadeFlowProjectDocumentSource } from '../src/aiDocumentIntelligence'

function source(text: string, fileName = 'schedule.csv'): FacadeFlowProjectDocumentSource {
  return {
    id: 'source-1', fileName, kind: 'CSV', mimeType: 'text/csv', sizeBytes: text.length, sha256: 'a'.repeat(64), pageCount: 1,
    extractionStatus: 'EXTRACTED', textPages: [{ pageNumber: 1, text }], warnings: [], capturedAt: '2026-09-01T00:00:00.000Z',
    humanReviewRequired: true, readOnly: true, simulationOnly: true, machineReady: false,
  }
}

test('AI02.1 detects project document kinds without executing content', () => {
  assert.equal(detectFacadeFlowProjectDocumentKind('windows.pdf'), 'PDF')
  assert.equal(detectFacadeFlowProjectDocumentKind('schedule.csv'), 'CSV')
  assert.equal(detectFacadeFlowProjectDocumentKind('drawing.dwg'), 'DWG')
  assert.equal(detectFacadeFlowProjectDocumentKind('specification.docx'), 'DOCX')
})

test('AI02.1 extracts a product candidate from explicit schedule text and preserves document provenance', () => {
  const candidates = analyzeFacadeFlowDocumentSource(source('W-17; прозорец; 2400x1500 mm; количество 28; система SYS-90; RAL 7016; троен стъклопакет; 2 панти'))
  assert.equal(candidates.length, 1)
  const candidate = candidates[0]!
  assert.equal(candidate.intent.sourceKind, 'DOCUMENT')
  assert.equal(candidate.intent.mark, 'W-17')
  assert.equal(candidate.intent.category, 'WINDOW')
  assert.deepEqual(candidate.intent.dimensions, { widthMm: 2400, heightMm: 1500 })
  assert.equal(candidate.intent.quantity, 28)
  assert.equal(candidate.intent.profiles.system, 'SYS-90')
  assert.equal(candidate.intent.finish.exterior, 'RAL 7016')
  assert.equal(candidate.intent.hardwareDefaults.hingeQuantity, 2)
  assert.equal(candidate.intent.evidence[0]?.sourceName, 'schedule.csv')
  assert.match(candidate.intent.evidence[0]?.location ?? '', /стр\. 1/)
  assert.match(candidate.intent.evidence[0]?.location ?? '', /SHA-256/)
  assert.equal(candidate.automaticGeometryAllowed, false)
  assert.equal(candidate.machineReady, false)
})

test('AI02.1 separates multiple explicit marks from one flattened text page', () => {
  const candidates = analyzeFacadeFlowDocumentSource(source('W-01 window 1200x1400 mm system SYS-75 W-02 window 1800x1400 mm system SYS-75'))
  assert.equal(candidates.length, 2)
  assert.deepEqual(candidates.map((candidate) => candidate.intent.mark), ['W-01', 'W-02'])
  assert.deepEqual(candidates.map((candidate) => candidate.intent.dimensions.widthMm), [1200, 1800])
})

test('AI02.1 does not invent candidates from text that has no explicit product dimensions', () => {
  const candidates = analyzeFacadeFlowDocumentSource(source('Общи изисквания: всички профили да са антрацит. Дръжките са черни.'))
  assert.deepEqual(candidates, [])
})

test('AI02.1 keeps profile system codes out of product identity and prevents adjacent-line context bleed', () => {
  const candidates = analyzeFacadeFlowDocumentSource(source([
    'W-17: system SYS-90, RAL 7016, triple glazing, 2 hinges',
    'W-22: system SYS-75, RAL 7016, double glazing, 2 hinges',
    'D-04: system DOOR-75, RAL 7016, triple glazing, 3 hinges',
  ].join('\n'), 'technical-spec.txt'))
  assert.equal(candidates.length, 3)
  assert.deepEqual(candidates.map((candidate) => candidate.intent.mark), ['W-17', 'W-22', 'D-04'])
  assert.ok(candidates.every((candidate) => candidate.intent.category === 'UNRESOLVED'))
  assert.equal(candidates[2]?.intent.profiles.system, 'DOOR-75')
  assert.ok(!candidates.some((candidate) => candidate.intent.mark === 'DOOR-75'))
})
