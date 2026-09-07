import assert from 'node:assert/strict'
import test from 'node:test'
import {
  correlateSkyGlazingObservations,
  extractSkyGlazingLteObservations,
  extractSkyGlazingXmlObservations,
  summarizeSkyGlazingObservations,
  projectEvidenceARp01EvidenceMatchesExistingCatalogueAggregate,
  projectEvidenceARp01ExpectedEvidence,
} from '../src/realProduction/skyGlazingObservationExtraction'

const xmlFixture = `<?xml version='1.0' encoding='utf-8'?>
<Order>
  <Version>1.0</Version>
  <Generator>SkyGlazing</Generator>
  <Unit>mm</Unit>
  <Name>PROJECT_EVIDENCE_A</Name>
  <Bar>
    <DXF_Name>78.51.dxf</DXF_Name>
    <MaxY>74</MaxY>
    <MaxZ>61</MaxZ>
    <Piece>
      <Cutting></Cutting>
      <Machining>
        <BarCode>900000000001</BarCode>
        <Cut>
          <sxB>90.00</sxB><dxB>90.00</dxB><sxC>90.00</sxC><dxC>90.00</dxC>
          <Length>2131.0</Length>
        </Cut>
      </Machining>
    </Piece>
  </Bar>
  <Bar>
    <DXF_Name>78.27.dxf</DXF_Name>
    <MaxY>78</MaxY>
    <MaxZ>96</MaxZ>
    <Piece>
      <Cutting></Cutting>
      <Machining>
        <BarCode>900000000002</BarCode>
        <Cut>
          <sxB>135.00</sxB><dxB>90.00</dxB><sxC>135.00</sxC><dxC>90.00</dxC>
          <Length>2166.0</Length>
        </Cut>
        <Work>
          <Name>STD_HOLE</Name>
          <PositionX>0</PositionX><PositionY>0</PositionY><PositionZ>3</PositionZ>
          <Face>
            <Points><X>1166</X><Y>0</Y><Z>45</Z></Points>
            <AngleA>270</AngleA><AngleC>0</AngleC>
          </Face>
          <Tool><T>13</T></Tool>
          <Parameters><Name>PAR1</Name><Value>0</Value></Parameters>
          <Parameters><Name>PAR2</Name><Value>16</Value></Parameters>
        </Work>
      </Machining>
    </Piece>
  </Bar>
</Order>`

const lteFixture = [
  '78.51       Synthetic Project A           02131.000000.0AL V 67     00011/1     2/26    78.51   090.0090.0090.0090.01  02131.002131.0  0       900000000001',
  '78.27       Synthetic Project A DR Left   02166.000917.0AL V 67     00121/2     2/29    78.27   135.0090.0135.0090.01  02166.002166.0  1       900000000002',
  '78.27       Synthetic Project A  Right    02166.000917.0AL V 67     00131/2     2/29    78.27   135.0090.0135.0090.01  02166.002166.0  5       900000000003',
].join('\n')

test('RP01.1 extracts XML piece observations without promoting observations to production rules', () => {
  const observations = extractSkyGlazingXmlObservations(xmlFixture)
  assert.equal(observations.length, 2)
  assert.equal(observations[0].project, 'PROJECT_EVIDENCE_A')
  assert.equal(observations[0].generator, 'SkyGlazing')
  assert.equal(observations[0].profileCode, '78.51')
  assert.equal(observations[0].cut.length, 2131)
  assert.equal(observations[0].productionRuleCreated, false)
  assert.equal(observations[0].machineReady, false)
  assert.equal(observations[0].productionApproved, false)
})

test('RP01.1 keeps XML MaxY/MaxZ as raw XML evidence, not confirmed catalogue dimensions', () => {
  const observation = extractSkyGlazingXmlObservations(xmlFixture)[1]
  assert.equal(observation.xmlMaxY, 78)
  assert.equal(observation.xmlMaxZ, 96)
  assert.equal(observation.xmlMaxYMaxZMeaningConfirmedAsCatalogueDimensions, false)
})

test('RP01.1 preserves explicit cutting values from XML', () => {
  const observation = extractSkyGlazingXmlObservations(xmlFixture)[1]
  assert.deepEqual(observation.cut, {
    sxB: 135,
    dxB: 90,
    sxC: 135,
    dxC: 90,
    length: 2166,
  })
})

test('RP01.1 extracts observed machining name, face point, angles, tool, and parameters without interpreting their engineering meaning', () => {
  const operation = extractSkyGlazingXmlObservations(xmlFixture)[1].operations[0]
  assert.equal(operation.name, 'STD_HOLE')
  assert.equal(operation.positionZ, 3)
  assert.deepEqual(operation.facePoint, { x: 1166, y: 0, z: 45 })
  assert.equal(operation.angleA, 270)
  assert.equal(operation.angleC, 0)
  assert.equal(operation.toolT, 13)
  assert.equal(operation.parameters.PAR2, '16')
})

test('RP01.1 extracts all LTE records and only derives positions explicitly present in the description text', () => {
  const observations = extractSkyGlazingLteObservations(lteFixture)
  assert.equal(observations.length, 3)
  assert.equal(observations[0].observedPosition, null)
  assert.equal(observations[1].description, 'Synthetic Project A DR Left')
  assert.equal(observations[1].observedPosition, 'Left')
  assert.equal(observations[2].observedPosition, 'Right')
})

test('RP01.1 correlates XML and LTE only by exact barcode evidence', () => {
  const xml = extractSkyGlazingXmlObservations(xmlFixture)
  const lte = extractSkyGlazingLteObservations(lteFixture)
  const correlations = correlateSkyGlazingObservations(xml, lte)

  assert.equal(correlations.length, 2)
  assert.equal(correlations[0].correlationState, 'XML_LTE_BARCODE_MATCH')
  assert.equal(correlations[1].correlationState, 'XML_LTE_BARCODE_MATCH')
  assert.equal(correlations[1].lte?.description, 'Synthetic Project A DR Left')
})

test('RP01.1 summary distinguishes correlated XML records from LTE-only records', () => {
  const xml = extractSkyGlazingXmlObservations(xmlFixture)
  const lte = extractSkyGlazingLteObservations(lteFixture)
  const summary = summarizeSkyGlazingObservations(xml, lte)

  assert.equal(summary.xmlObservationCount, 2)
  assert.equal(summary.lteObservationCount, 3)
  assert.equal(summary.correlatedBarcodeCount, 2)
  assert.equal(summary.xmlWithoutLteCount, 0)
  assert.equal(summary.lteOnlyCount, 1)
  assert.equal(summary.machiningOperationCount, 1)
  assert.deepEqual(summary.operationNameCounts, { STD_HOLE: 1 })
})

test('RP01.1 ProjectEvidenceA evidence snapshot matches the existing FacadeFlow aggregate and remains observation-only', () => {
  assert.equal(projectEvidenceARp01ExpectedEvidence.xmlObservationCount, 46)
  assert.equal(projectEvidenceARp01ExpectedEvidence.lteObservationCount, 84)
  assert.equal(projectEvidenceARp01ExpectedEvidence.correlatedBarcodeCount, 46)
  assert.equal(projectEvidenceARp01ExpectedEvidence.lteOnlyCount, 38)
  assert.equal(projectEvidenceARp01ExpectedEvidence.machiningOperationCount, 220)
  assert.deepEqual(projectEvidenceARp01ExpectedEvidence.operationNameCounts, {
    STD_NOTCH: 112,
    STD_HOLE: 76,
    STD_SLOT: 17,
    STD_DRILL: 6,
    STD_KEYHOLE: 6,
    STD_POCKET: 3,
  })
  assert.equal(projectEvidenceARp01EvidenceMatchesExistingCatalogueAggregate(), true)
  assert.equal(projectEvidenceARp01ExpectedEvidence.productionRuleCreated, false)
  assert.equal(projectEvidenceARp01ExpectedEvidence.machineReady, false)
  assert.equal(projectEvidenceARp01ExpectedEvidence.productionApproved, false)
})
