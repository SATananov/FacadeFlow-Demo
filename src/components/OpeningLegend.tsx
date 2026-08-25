import { OpeningSymbol } from './OpeningSymbol'

export function OpeningLegend() {
  return <div className="opening-legend" aria-label="Легенда на демонстрационните символи"><span><svg viewBox="0 0 32 24" aria-hidden="true"><rect x="2" y="2" width="28" height="20"/></svg>Фиксирано поле</span><span><svg viewBox="0 0 32 24" aria-hidden="true"><rect x="2" y="2" width="28" height="20"/><OpeningSymbol x={2} y={2} width={28} height={20} notation="SIDE_TRIANGLE_LEFT"/></svg>Отваряемо поле</span><span><svg viewBox="0 0 64 24" aria-hidden="true"><OpeningSymbol x={1} y={2} width={28} height={20} notation="SIDE_TRIANGLE_LEFT"/><OpeningSymbol x={35} y={2} width={28} height={20} notation="SIDE_TRIANGLE_RIGHT"/></svg>Символ наляво / Символ надясно — демонстрационна посока</span></div>
}
