import assert from 'node:assert/strict'
import test from 'node:test'
import { compareSkyGlazingSources } from '../src/skyGlazingComparison'
import { inspectSkyGlazingLte, LTE_RECORD_WIDTH } from '../src/skyGlazingLteInspection'
import type { SkyGlazingSourceEvidence } from '../src/skyGlazingTypes'
import { inspectSkyGlazingXml } from '../src/skyGlazingXmlInspection'

const source = (format: 'SKYGLAZING_XML' | 'LTE'): SkyGlazingSourceEvidence => ({ fileName: format === 'LTE' ? 'synthetic.lte' : 'synthetic.xml', extension: format === 'LTE' ? 'lte' : 'xml', detectedFormat: format, sizeBytes: 1, sha256: 'synthetic-sha256', supportStatus: 'SUPPORTED_FOR_VIEW_ONLY', importedAt: '2026-01-01T00:00:00.000Z', warnings: [], simulationOnly: true, machineReady: false })
const xml = (barcode = '000000000001', generator = 'SkyGlazing') => `<?xml version="1.0" encoding="utf-8"?><Order><Version>1.0</Version><Generator>${generator}</Generator><Unit>mm</Unit><Name>Тестов проект</Name><Bar><DXF_Name>TEST_PROFILE</DXF_Name><MaxY>10</MaxY><MaxZ>20</MaxZ><Piece><Cutting/><Machining><BarCode>${barcode}</BarCode><Cut><sxB>0</sxB><dxB>0</dxB><sxC>0</sxC><dxC>0</dxC><Length>1000</Length></Cut><Work><Name>TEST_OPERATION</Name></Work></Machining></Piece></Bar></Order>`
const lteLine = (barcode = '000000000001', profile = 'TEST_PROFILE', length = '1000') => { const chars = Array<string>(LTE_RECORD_WIDTH).fill(' '); profile.slice(0, 13).split('').forEach((char, index) => { chars[12 + index] = char }); length.padStart(8).split('').forEach((char, index) => { chars[33 + index] = char }); barcode.split('').forEach((char, index) => { chars[137 + index] = char }); return chars.join('') }

test('валиден минимален SkyGlazing XML се инспектира read-only', () => { const result = inspectSkyGlazingXml(xml(), source('SKYGLAZING_XML')); assert.equal(result.pieceCount, 1); assert.equal(result.workCount, 1); assert.equal(result.pieces[0]?.machineReady, false) })
test('DOCTYPE се отхвърля', () => assert.throws(() => inspectSkyGlazingXml(`<!DOCTYPE Order>${xml()}`, source('SKYGLAZING_XML')), /DOCTYPE|ENTITY/))
test('ENTITY се отхвърля', () => assert.throws(() => inspectSkyGlazingXml(`<!ENTITY unsafe "value">${xml()}`, source('SKYGLAZING_XML')), /DOCTYPE|ENTITY/))
test('malformed XML се отхвърля', () => assert.throws(() => inspectSkyGlazingXml('<Order><Bar></Order>', source('SKYGLAZING_XML')), /Невалидно|незавършена/))
test('неочакван Generator се показва с предупреждение', () => { const result = inspectSkyGlazingXml(xml('000000000001', 'UNKNOWN'), source('SKYGLAZING_XML')); assert.match(result.source.warnings.join(' '), /не е SkyGlazing/) })
test('валиден 149-знаков LTE ред се инспектира', () => { const result = inspectSkyGlazingLte(`${lteLine()}\r\n`, source('LTE')); assert.equal(result.fixedRecordWidth, 149); assert.equal(result.records[0]?.originalLine.length, 149); assert.equal(result.records[0]?.machineReady, false) })
test('невалидна LTE ширина се отчита', () => { const result = inspectSkyGlazingLte('short\r\n', source('LTE')); assert.equal(result.fixedRecordWidth, 5); assert.match(result.source.warnings.join(' '), /вместо очакваните 149/) })
test('duplicate LTE barcode остава предупреждение', () => { const result = inspectSkyGlazingLte(`${lteLine()}\r\n${lteLine()}\r\n`, source('LTE')); assert.match(result.source.warnings.join(' '), /повтарящи/) })
test('точният barcode дава MATCHED без автоматичен конфликт', () => { const result = compareSkyGlazingSources(inspectSkyGlazingXml(xml(), source('SKYGLAZING_XML')), inspectSkyGlazingLte(`${lteLine()}\r\n`, source('LTE'))); assert.equal(result.counts.MATCHED, 1); assert.equal(result.counts.CONFLICT, 0); assert.equal(result.machineReady, false) })
test('XML_ONLY и LTE_ONLY се определят само по barcode presence', () => { const result = compareSkyGlazingSources(inspectSkyGlazingXml(xml('000000000001'), source('SKYGLAZING_XML')), inspectSkyGlazingLte(`${lteLine('000000000002')}\r\n`, source('LTE'))); assert.equal(result.counts.XML_ONLY, 1); assert.equal(result.counts.LTE_ONLY, 1); assert.equal(result.counts.CONFLICT, 0) })
test('duplicate barcode comparison е UNRESOLVED', () => { const result = compareSkyGlazingSources(inspectSkyGlazingXml(xml(), source('SKYGLAZING_XML')), inspectSkyGlazingLte(`${lteLine()}\r\n${lteLine()}\r\n`, source('LTE'))); assert.equal(result.counts.UNRESOLVED, 1) })
