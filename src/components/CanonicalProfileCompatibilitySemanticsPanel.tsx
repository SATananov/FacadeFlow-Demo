import type { FacadeFlowCanonicalProfileAssignmentBridge } from '../aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileTechnicalSemanticsBridge } from '../aiCanonicalProfileTechnicalSemanticsBridge'
import { buildCanonicalProfileCompatibilitySemanticsBridge } from '../aiCanonicalProfileCompatibilitySemanticsBridge'

interface CanonicalProfileCompatibilitySemanticsPanelProps {
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
}

const roleBg = {
  FRAME: 'Каса',
  MULLION: 'Делител',
  SASH: 'Крило',
} as const

export function CanonicalProfileCompatibilitySemanticsPanel({
  bridge,
}: CanonicalProfileCompatibilitySemanticsPanelProps) {
  const technical = buildCanonicalProfileTechnicalSemanticsBridge(bridge)
  const compatibility = buildCanonicalProfileCompatibilitySemanticsBridge(technical)

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.5 canonical profile compatibility semantics"
      data-profile-data-step="PROFILE DATA 03.5"
      data-compatibility-semantics-status={compatibility.status}
    >
      <div className="ff-ai03-card-heading">
        <span>PROFILE COMPATIBILITY SEMANTICS · SYSTEM / ROLE COHERENCE</span>
        <b>{compatibility.status === 'READY_FOR_HUMAN_REVIEW' ? 'Conceptual only' : 'Блокирано'}</b>
      </div>

      <p>
        Този слой проверява само дали вече изрично зададените canonical профили принадлежат на една canonical система и
        образуват смислена FRAME / MULLION / SASH роля. Това не е производствено потвърждение, че два профила могат да се
        сглобят по конкретен възел.
      </p>

      {compatibility.status !== 'READY_FOR_HUMAN_REVIEW' ? (
        <div role="alert">
          <strong>Compatibility semantics са блокирани.</strong>
          <ul>{compatibility.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : (
        <div aria-label="Canonical PRELUDE 60 system-role relations">
          {compatibility.rows.map((row) => (
            <article key={row.relation} data-profile-relation={row.relation} data-manufacturer-compatibility="NOT_VALIDATED">
              <h4>{roleBg[row.leftRole]} {row.leftProfileCode} ↔ {roleBg[row.rightRole]} {row.rightProfileCode}</h4>
              <p><strong>Система:</strong> {row.systemLabel}</p>
              <p><strong>Authority:</strong> {row.compatibilityAuthority}</p>
              <p><strong>Conceptual system/role relation:</strong> установена</p>
              <p><strong>Instance adjacency:</strong> НЕ СЕ ТВЪРДИ</p>
              <p><strong>Manufacturer assembly compatibility:</strong> NOT VALIDATED</p>
              <p><strong>Exact joint geometry:</strong> {row.exactJointGeometryAuthority}</p>
              <p>
                Trace: {row.leftTargets.map((target) => `${target.targetKind}:${target.targetRef}`).join(', ')} ↔ {' '}
                {row.rightTargets.map((target) => `${target.targetKind}:${target.targetRef}`).join(', ')}
              </p>
            </article>
          ))}
          {compatibility.rows.length === 0 && <p>Няма налична двойка роли; липсваща compatibility relation не се измисля автоматично.</p>}
        </div>
      )}

      <footer data-safety="SYSTEM/ROLE COHERENCE: YES · MANUFACTURER ASSEMBLY COMPATIBILITY: NOT VALIDATED · INSTANCE ADJACENCY INFERENCE: NO · EXACT JOINT GEOMETRY: NO · AUTOMATIC PROFILE SELECTION: NO · AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        SYSTEM/ROLE COHERENCE: ДА · MANUFACTURER ASSEMBLY COMPATIBILITY: НЕ Е ВАЛИДИРАНА · INSTANCE ADJACENCY INFERENCE: НЕ · ТОЧЕН СГЛОБЯЕМ ВЪЗЕЛ: НЕ · АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
