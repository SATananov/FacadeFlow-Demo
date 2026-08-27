import assert from 'node:assert/strict'
import test from 'node:test'
import { createDetailDraftDocument, DETAIL_DRAFT_INITIAL_VIEWPORT, DETAIL_DRAFT_SAFETY, fitDetailDraftViewport, panDetailDraftViewport, zoomDetailDraftViewport } from '../src/detailDraftViewport'
test('detail document започва празен и safety flags са заключени', () => { const document = createDetailDraftDocument('test-session'); assert.deepEqual(document, { id: 'test-session', entities: [], simulationOnly: true, machineReady: false, internalEvaluationOnly: true, productionApproved: false }); assert.equal(Object.isFrozen(document), true); assert.equal(Object.isFrozen(document.entities), true) })
test('pan променя само viewport offset', () => assert.deepEqual(panDetailDraftViewport(DETAIL_DRAFT_INITIAL_VIEWPORT, 12, -8), { scale: 1, offsetX: 12, offsetY: -8 }))
test('невалиден pan не променя viewport', () => assert.equal(panDetailDraftViewport(DETAIL_DRAFT_INITIAL_VIEWPORT, Number.NaN, 1), DETAIL_DRAFT_INITIAL_VIEWPORT))
test('zoom остава anchored около pointer', () => assert.deepEqual(zoomDetailDraftViewport({ scale: 1, offsetX: 10, offsetY: 20 }, 2, 110, 120), { scale: 2, offsetX: -90, offsetY: -80 }))
test('zoom е ограничен до безопасния диапазон', () => { assert.equal(zoomDetailDraftViewport(DETAIL_DRAFT_INITIAL_VIEWPORT, 100, 0, 0).scale, 8); assert.equal(zoomDetailDraftViewport(DETAIL_DRAFT_INITIAL_VIEWPORT, 0.001, 0, 0).scale, 0.25) })
test('fit центрира origin без да създава geometry', () => assert.deepEqual(fitDetailDraftViewport(800, 600), { scale: 1, offsetX: 400, offsetY: 300 }))
test('невалидният fit се връща към reset viewport', () => assert.equal(fitDetailDraftViewport(0, 600), DETAIL_DRAFT_INITIAL_VIEWPORT))
test('Phase 06A.1 capability остава viewport-only', () => assert.deepEqual(DETAIL_DRAFT_SAFETY, { sessionOnly: true, viewportOnly: true, mutatesDwg: false, createsGeometry: false, exportsData: false, machineReady: false, internalEvaluationOnly: true }))
