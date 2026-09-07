import type { FacadeFlowCanonicalProfileAssignmentBridge } from '../aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileTechnicalSemanticsBridge } from '../aiCanonicalProfileTechnicalSemanticsBridge'

interface CanonicalProfileTechnicalSemanticsPanelProps {
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
}

const roleBg = {
  FRAME: 'Каса',
  MULLION: 'Делител',
  SASH: 'Крило',
} as const

export function CanonicalProfileTechnicalSemanticsPanel({
  bridge,
}: CanonicalProfileTechnicalSemanticsPanelProps) {
  const technical = buildCanonicalProfileTechnicalSemanticsBridge(bridge)

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.4 canonical profile technical semantics"
      data-profile-data-step="PROFILE DATA 03.4"
      data-technical-semantics-status={technical.status}
    >
      <div className="ff-ai03-card-heading">
        <span>PROFILE TECHNICAL SEMANTICS · CANONICAL TRACE</span>
        <b>{technical.status === 'READY_FOR_HUMAN_REVIEW' ? 'Human-confirmed knowledge' : 'Блокирано'}</b>
      </div>

      <p>
        Този слой обяснява техническото значение на вече изрично зададения canonical профил. Числата са human-confirmed
        working semantics и catalogue reference evidence. Те не са точен профилен контур, координати на сечение,
        производствени отнемания или машинни размери.
      </p>

      {technical.status !== 'READY_FOR_HUMAN_REVIEW' ? (
        <div role="alert">
          <strong>Technical semantics са блокирани.</strong>
          <ul>{technical.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : (
        <div aria-label="Canonical assignments към human-confirmed technical semantics">
          {technical.rows.map((row) => {
            const semantics = row.semantics
            const working = semantics.workingDimensions
            const catalogue = semantics.catalogueReference
            return (
              <article
                key={`${row.targetKind}:${row.targetRef}`}
                data-profile-code={row.profileCode}
                data-technical-authority={row.semanticAuthority}
                data-exact-contour-authority={semantics.exactSectionContourAuthority}
              >
                <h4>{roleBg[row.role]} · {row.profileCode}</h4>
                <p>{row.targetKind}:{row.targetRef} · {semantics.systemLabel}</p>
                <p><strong>Пълен работен размер:</strong> {working.fullWorkingDimensionMm} mm</p>
                <p><strong>Видима ширина:</strong> {working.visibleWidthMm} mm</p>
                <p><strong>Human-confirmed reference:</strong> {working.formulaBg}</p>
                <p>Source: {semantics.sourceOrganisation} · {semantics.sourcePerson}</p>
                <p>
                  Catalogue reference: depth {catalogue.systemDepthMm} mm · visible {catalogue.labelledVisibleMm ?? 'не е означена като visible'}
                </p>
                <p>
                  Provenance: {semantics.sourceMergeState} · exact contour authority: {semantics.exactSectionContourAuthority}
                </p>
              </article>
            )
          })}
        </div>
      )}

      <footer data-safety="TECHNICAL SEMANTICS: READ ONLY · HUMAN WORKING VALUES: YES · EXACT PROFILE CONTOUR: NO · GEOMETRY MUTATION: NO · PRODUCTION DEDUCTIONS: NO · TOLERANCES: NO · RULES VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        TECHNICAL SEMANTICS: READ ONLY · HUMAN WORKING VALUES: ДА · ТОЧЕН ПРОФИЛЕН КОНТУР: НЕ · ПРОМЯНА НА ГЕОМЕТРИЯ: НЕ · PRODUCTION DEDUCTIONS: НЕ · TOLERANCES: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
