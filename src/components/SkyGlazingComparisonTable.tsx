import { useMemo, useState } from 'react'
import type { SkyGlazingComparison, SkyGlazingComparisonStatus } from '../skyGlazingTypes'

type StatusFilter = 'ALL' | SkyGlazingComparisonStatus
const labels: Record<StatusFilter, string> = { ALL: 'Всички', MATCHED: 'Съвпадащи', XML_ONLY: 'Само XML', LTE_ONLY: 'Само LTE', CONFLICT: 'Конфликт', UNRESOLVED: 'Неразрешени' }

export function SkyGlazingComparisonTable({ comparison }: { comparison: SkyGlazingComparison }) {
  const [status, setStatus] = useState<StatusFilter>('ALL'), [barcode, setBarcode] = useState(''), [profile, setProfile] = useState('')
  const records = useMemo(() => comparison.records.filter((item) => (status === 'ALL' || item.status === status) && item.normalizedBarcode.includes(barcode.trim()) && `${item.xmlRecord?.dxfProfileName ?? ''} ${item.lteRecord?.profileToken ?? ''}`.toLocaleLowerCase('bg-BG').includes(profile.trim().toLocaleLowerCase('bg-BG'))), [comparison.records, status, barcode, profile])
  return <section className="sky-section" aria-labelledby="sky-comparison-title">
    <h3 id="sky-comparison-title">XML ↔ LTE сравнение</h3>
    <p className="sky-boundary-note">Авторитетно е единствено точното съвпадение на trim-натия баркод. Дължини, ъгли и останали диапазони не се тълкуват и не създават автоматичен конфликт.</p>
    <div className="sky-counts"><span>XML записи: {comparison.xmlRecordCount}</span><span>LTE записи: {comparison.lteRecordCount}</span>{Object.entries(comparison.counts).map(([key, count]) => <span key={key}>{key}: {count}</span>)}</div>
    <div className="sky-filters"><label>Статус<select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Търси баркод<input value={barcode} onChange={(event) => setBarcode(event.target.value)} /></label><label>Търси профил<input value={profile} onChange={(event) => setProfile(event.target.value)} /></label></div>
    <div className="sky-table-wrap"><table><thead><tr><th>Статус</th><th>Баркод</th><th>XML профил</th><th>LTE профилен token</th><th>Обяснение</th></tr></thead><tbody>{records.map((item, index) => <tr key={`${item.status}-${item.normalizedBarcode}-${index}`}><td><span className={`sky-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td>{item.normalizedBarcode || '—'}</td><td>{item.xmlRecord?.dxfProfileName ?? '—'}</td><td>{item.lteRecord?.profileToken ?? '—'}</td><td>{item.explanation}</td></tr>)}</tbody></table></div>
    {!records.length && <p>Няма записи за избраните филтри.</p>}
  </section>
}
