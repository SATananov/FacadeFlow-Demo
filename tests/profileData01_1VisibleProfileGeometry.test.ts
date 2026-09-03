import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY,
  PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY,
  PRELUDE_60_VISIBLE_PROFILE_GEOMETRY,
  PROFILE_DATA_01_1_VERSION,
  PROFILE_GEOMETRY_SAFETY,
  buildMullionVisibleBand,
  buildRectangularFrameVisibleBands,
  buildRectangularSashVisibleBands,
  canRenderStructuralProfile,
  resolveStructuralVisibleBand,
  visibleWidthMmToCanvasPx,
} from '../src/profileData/visibleProfileGeometry'

const frame = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.30']
const mullion = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.21']
const sash = PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.05']

test('PROFILE DATA 01.1 V2 contract is versioned', () => assert.equal(PROFILE_DATA_01_1_VERSION, 'PROFILE_DATA_01.1_V2'))
test('482.30 frame is confirmed 64/42', () => { assert.equal(frame.role, 'FRAME'); assert.equal(frame.profileHeightMm, 64); assert.equal(frame.visibleWidthMm, 42) })
test('482.21 mullion is confirmed 84/40', () => { assert.equal(mullion.role, 'MULLION'); assert.equal(mullion.profileHeightMm, 84); assert.equal(mullion.visibleWidthMm, 40) })
test('482.05 is explicitly a SASH visible-profile role', () => { assert.equal(sash.role, 'SASH'); assert.equal(sash.visibleBandRequired, true) })
test('482.05 remains pending numeric confirmation', () => { assert.equal(sash.visibleWidthMm, null); assert.equal(sash.profileHeightMm, null); assert.equal(sash.measurementState, 'PENDING_HUMAN_CONFIRMATION') })
test('482.05 never stores a placeholder width', () => assert.equal(sash.placeholderVisibleWidthAllowed, false))
test('default structural sash resolution remains blocked without a confirmed number', () => { assert.equal(resolveStructuralVisibleBand('482.05').state, 'REQUIRES_HUMAN_CONFIRMATION'); assert.equal(canRenderStructuralProfile('482.05'), false) })
test('sash policy requires a real visible band after confirmation', () => assert.equal(PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY.visibleBandRequired, true))
test('sash policy forbids legacy single-stroke rendering', () => assert.equal(PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY.legacySingleStrokeAllowed, false))
test('sash policy forbids placeholder visible width', () => assert.equal(PRELUDE_60_SASH_VISIBLE_GEOMETRY_POLICY.placeholderVisibleWidthAllowed, false))
test('explicit human-confirmed sash width builds four real bands', () => { const bands = buildRectangularSashVisibleBands(900, 1200, 50); assert.equal(bands.left.width, 50); assert.equal(bands.right.width, 50); assert.equal(bands.top.height, 50); assert.equal(bands.bottom.height, 50) })
test('explicit sash band records confirmation source', () => assert.equal(buildRectangularSashVisibleBands(900, 1200, 50).confirmationSource, 'EXPLICIT_HUMAN_CONFIRMED_VISIBLE_WIDTH'))
test('explicit sash band rejects zero width', () => assert.throws(() => buildRectangularSashVisibleBands(900, 1200, 0)))
test('explicit sash band rejects oversized visible width', () => assert.throws(() => buildRectangularSashVisibleBands(80, 1200, 50)))
test('explicit sash band rejects a non-sash profile code', () => assert.throws(() => buildRectangularSashVisibleBands(900, 1200, 50, '482.30')))
test('frame uses 42 mm visible bands', () => { const bands=buildRectangularFrameVisibleBands(1000,800); assert.equal(bands.left.width,42); assert.deepEqual(bands.inner,{x:42,y:42,width:916,height:716}) })
test('mullion uses 40 mm rectangle', () => assert.deepEqual(buildMullionVisibleBand('VERTICAL',500,800).rect,{x:480,y:0,width:40,height:800}))
test('visible width scales proportionally', () => assert.equal(visibleWidthMmToCanvasPx(42,.25),10.5))
test('all three structural profiles reject single-stroke semantics', () => { assert.equal(frame.structuralProfileIsDrawingStroke,false); assert.equal(mullion.structuralProfileIsDrawingStroke,false); assert.equal(sash.structuralProfileIsDrawingStroke,false) })
test('all three structural profiles require visible bands', () => { assert.equal(frame.visibleBandRequired,true); assert.equal(mullion.visibleBandRequired,true); assert.equal(sash.visibleBandRequired,true) })
test('assembly requires sash visible band after confirmation', () => assert.equal(PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY.sashMustRenderAsVisibleBandAfterConfirmation,true))
test('assembly forbids legacy sash single stroke', () => assert.equal(PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY.legacySashSingleStrokeAllowed,false))
test('assembly forbids placeholder sash width', () => assert.equal(PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY.placeholderSashVisibleWidthAllowed,false))
test('assembly still blocks automatic overlap inference', () => assert.equal(PRELUDE_60_FRAME_SASH_ASSEMBLY_POLICY.automaticOverlapInferenceAllowed,false))
test('automatic sash measurement inference remains disabled', () => assert.equal(PROFILE_GEOMETRY_SAFETY.automaticSashMeasurementInferenceAllowed,false))
test('production remains locked', () => { assert.equal(PROFILE_GEOMETRY_SAFETY.machineReady,false); assert.equal(PROFILE_GEOMETRY_SAFETY.productionApproved,false) })
test('renderer integrates explicit sash visible-band builder', () => { const source=readFileSync('src/components/CustomProductDrawing.tsx','utf8'); assert.match(source,/buildRectangularSashVisibleBands/); assert.match(source,/sashVisibleWidthByFieldId/) })
test('renderer has visible sash profile band class', () => assert.match(readFileSync('src/components/CustomProductDrawing.tsx','utf8'),/custom-sash-profile-band/))
test('renderer exposes pending sash visible-width state', () => { const source=readFileSync('src/components/CustomProductDrawing.tsx','utf8'); assert.match(source,/PENDING_HUMAN_CONFIRMATION/); assert.match(source,/видима ширина чака потвърждение/) })
test('renderer no longer draws legacy custom-sash-outline', () => assert.doesNotMatch(readFileSync('src/components/CustomProductDrawing.tsx','utf8'),/className="custom-sash-outline"/))
test('frame and mullion visible-profile integration remains present', () => { const source=readFileSync('src/components/CustomProductDrawing.tsx','utf8'); assert.match(source,/buildRectangularFrameVisibleBands/); assert.match(source,/buildMullionVisibleBand/) })
test('CSS styles explicit sash profile bands', () => assert.match(readFileSync('src/customDesigner.css','utf8'),/\.custom-sash-profile-band/))
test('CSS styles pending sash confirmation note', () => assert.match(readFileSync('src/customDesigner.css','utf8'),/\.custom-sash-visible-width-pending/))
test('line tool remains semantically separate from structural profiles', () => assert.equal(PROFILE_GEOMETRY_SAFETY.structuralProfilesMayRenderAsSingleStrokes,false))
test('automatic profile selection remains disabled', () => assert.equal(PROFILE_GEOMETRY_SAFETY.automaticProfileSelectionAllowed,false))
test('renderer does not introduce production unlock', () => { const source=readFileSync('src/components/CustomProductDrawing.tsx','utf8'); assert.doesNotMatch(source,/productionApproved\s*=\s*true/); assert.doesNotMatch(source,/machineReady\s*=\s*true/) })
