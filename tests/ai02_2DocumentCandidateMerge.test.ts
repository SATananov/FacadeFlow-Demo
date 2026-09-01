import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeFacadeFlowDocumentSource, buildFacadeFlowDocumentCandidateGroups, type FacadeFlowProjectDocumentSource } from '../src/aiDocumentIntelligence'

function source(id: string, name: string, text: string, hashChar: string): FacadeFlowProjectDocumentSource {
  return { id, fileName: name, kind: 'TEXT', mimeType: 'text/plain', sizeBytes: text.length, sha256: hashChar.repeat(64), pageCount: 1, extractionStatus: 'EXTRACTED', textPages: [{ pageNumber: 1, text }], warnings: [], capturedAt: '2026-09-01T00:00:00.000Z', humanReviewRequired: true, readOnly: true, simulationOnly: true, machineReady: false }
}

test('AI02.2 corroborates the same marked product across independent sources', () => {
  const a = analyzeFacadeFlowDocumentSource(source('a', 'schedule.csv', 'W-21, window, 1800x1400 mm, system SYS-75, RAL 7016', 'a'))
  const b = analyzeFacadeFlowDocumentSource(source('b', 'spec.txt', 'W-21 window 1800x1400 mm, system SYS-75, RAL 7016', 'b'))
  const groups = buildFacadeFlowDocumentCandidateGroups([...a, ...b])
  assert.equal(groups.length, 1)
  assert.equal(groups[0]?.status, 'CORROBORATED')
  assert.equal(groups[0]?.sourceIds.length, 2)
  assert.equal(groups[0]?.conflicts.length, 0)
  assert.equal(groups[0]?.mergedIntent.dimensions.widthMm, 1800)
  assert.equal(groups[0]?.mergedIntent.profiles.system, 'SYS-75')
  assert.equal(groups[0]?.mergedIntent.evidence.length, 2)
})

test('AI02.2 combines complementary evidence fragments linked by the same mark', () => {
  const schedule = analyzeFacadeFlowDocumentSource(source('a', 'schedule.csv', 'W-30, window, 2100x1500 mm, quantity 12', 'a'))
  const specification = analyzeFacadeFlowDocumentSource(source('b', 'technical-spec.txt', 'W-30: system SYS-90, RAL 7016, triple glazing', 'b'))
  const group = buildFacadeFlowDocumentCandidateGroups([...schedule, ...specification])[0]!
  assert.equal(group.status, 'CORROBORATED')
  assert.equal(group.mergedIntent.mark, 'W-30')
  assert.equal(group.mergedIntent.dimensions.widthMm, 2100)
  assert.equal(group.mergedIntent.quantity, 12)
  assert.equal(group.mergedIntent.profiles.system, 'SYS-90')
  assert.equal(group.mergedIntent.finish.exterior, 'RAL 7016')
  assert.match(group.mergedIntent.glazing.description ?? '', /triple/i)
  assert.equal(group.mergedIntent.evidence.length, 2)
})

test('AI02.2 exposes dimension conflicts and refuses to choose a winner', () => {
  const a = analyzeFacadeFlowDocumentSource(source('a', 'schedule.csv', 'W-22, window, 1800x1400 mm, system SYS-75', 'a'))
  const b = analyzeFacadeFlowDocumentSource(source('b', 'elevation.txt', 'W-22 window 1850x1400 mm, system SYS-75', 'b'))
  const group = buildFacadeFlowDocumentCandidateGroups([...a, ...b])[0]!
  assert.equal(group.status, 'CONFLICT')
  assert.ok(group.conflicts.some((conflict) => conflict.field === 'WIDTH'))
  assert.equal(group.mergedIntent.dimensions.widthMm, undefined)
  assert.equal(group.mergedIntent.dimensions.heightMm, 1400)
  assert.ok(group.mergedIntent.unresolved.some((item) => /КОНФЛИКТ: Ширина/.test(item)))
  assert.equal(group.automaticGeometryAllowed, false)
  assert.equal(group.machineReady, false)
})

test('AI02.2 sample package merges into exactly three product groups and keeps only the intended W-22 width conflict', () => {
  const schedule = analyzeFacadeFlowDocumentSource(source('schedule', 'AI02_SAMPLE_SCHEDULE.csv', [
    'mark,type,dimensions,quantity',
    'W-17,window,2400x1500 mm,quantity 28',
    'W-22,window,1800x1400 mm,quantity 12',
    'D-04,door,1000x2200 mm,quantity 4',
  ].join('\n'), 'a'))
  const spec = analyzeFacadeFlowDocumentSource(source('spec', 'AI02_SAMPLE_TECHNICAL_SPEC.txt', [
    'W-17: system SYS-90, RAL 7016, triple glazing, 2 hinges',
    'W-22: system SYS-75, RAL 7016, double glazing, 2 hinges',
    'D-04: system DOOR-75, RAL 7016, triple glazing, 3 hinges',
  ].join('\n'), 'b'))
  const conflict = analyzeFacadeFlowDocumentSource(source('conflict', 'AI02_SAMPLE_CONFLICT.txt', 'W-22 window 1850x1400 mm, system SYS-75, RAL 7016', 'c'))
  const groups = buildFacadeFlowDocumentCandidateGroups([...schedule, ...spec, ...conflict])
  assert.equal(groups.length, 3)
  assert.deepEqual(groups.map((group) => group.mark).sort(), ['D-04', 'W-17', 'W-22'])
  const w17 = groups.find((group) => group.mark === 'W-17')!
  assert.equal(w17.status, 'CORROBORATED')
  assert.equal(w17.conflicts.length, 0)
  assert.equal(w17.mergedIntent.category, 'WINDOW')
  assert.equal(w17.mergedIntent.dimensions.widthMm, 2400)
  assert.equal(w17.mergedIntent.profiles.system, 'SYS-90')
  assert.equal(w17.mergedIntent.quantity, 28)
  const w22 = groups.find((group) => group.mark === 'W-22')!
  assert.equal(w22.status, 'CONFLICT')
  assert.deepEqual(w22.conflicts.map((item) => item.field), ['WIDTH'])
  assert.equal(w22.mergedIntent.dimensions.widthMm, undefined)
  assert.equal(w22.mergedIntent.dimensions.heightMm, 1400)
  const d04 = groups.find((group) => group.mark === 'D-04')!
  assert.equal(d04.status, 'CORROBORATED')
  assert.equal(d04.conflicts.length, 0)
  assert.equal(d04.mergedIntent.category, 'DOOR')
  assert.equal(d04.mergedIntent.profiles.system, 'DOOR-75')
})
