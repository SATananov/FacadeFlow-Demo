import type { SkyGlazingSourceEvidence } from '../skyGlazingTypes'

interface Props { source: SkyGlazingSourceEvidence; onClear: () => void }

export function SkyGlazingSourceSummary({ source, onClear }: Props) {
  return <article className="sky-source-card">
    <header><span className="route-badge">{source.detectedFormat}</span><b>{source.fileName}</b></header>
    <dl>
      <div><dt>Разширение</dt><dd>.{source.extension}</dd></div>
      <div><dt>Открит формат</dt><dd>{source.detectedFormat}</dd></div>
      <div><dt>Размер</dt><dd>{(source.sizeBytes / 1024).toFixed(2)} KB</dd></div>
      <div><dt>Статус</dt><dd>{source.supportStatus}</dd></div>
      <div><dt>Импортиран</dt><dd>{source.importedAt}</dd></div>
      <div><dt>Машинна готовност</dt><dd>НЕ</dd></div>
      <div className="full"><dt>SHA-256</dt><dd>{source.sha256}</dd></div>
    </dl>
    <p className="sky-simulation-warning">СИМУЛАЦИЯ · локално read-only evidence · без машинен export</p>
    {source.warnings.length > 0 && <ul className="sky-warning-list" role="alert">{source.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
    <button type="button" onClick={onClear}>Премахни файла</button>
  </article>
}
