import {
  canonicalProfile3DInspectionRowForNode,
  type CanonicalProfile3DInspectionEvidence,
} from '../aiCanonicalProfile3DInspectionEvidence'

interface CanonicalProfile3DInspectionPanelProps {
  evidence: CanonicalProfile3DInspectionEvidence
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
}

export function CanonicalProfile3DInspectionPanel({
  evidence,
  selectedNodeId,
  onSelectNode,
}: CanonicalProfile3DInspectionPanelProps) {
  const selectedRow = canonicalProfile3DInspectionRowForNode(evidence, selectedNodeId)

  return (
    <section
      className="ff-ai03-facts"
      aria-label="AI05.3.8 canonical profile real 3D inspection evidence"
      data-ai-step="AI05.3.8"
      data-inspection-status={evidence.status}
    >
      <div className="ff-ai03-card-heading">
        <span>REAL 3D PROFILE EVIDENCE · HUMAN INSPECTION</span>
        <b>{evidence.status === 'READY_FOR_HUMAN_INSPECTION' ? 'Готово за човешка инспекция' : 'Блокирано'}</b>
      </div>

      <p>
        Този слой е само за проследяване и визуална инспекция. Показаните размери на 3D nodes са conceptual visual bounds,
        а не производствени размери, точни профилни сечения, отнемания или допуски.
      </p>

      {evidence.status === 'BLOCKED_CONFLICT' ? (
        <div role="alert">
          <strong>3D profile evidence е блокирано.</strong>
          <ul>{evidence.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : (
        <>
          <div aria-label="Canonical profile assignments към inspectable real 3D nodes">
            {evidence.rows.map((row) => {
              const selected = Boolean(selectedNodeId && row.nodeIds.includes(selectedNodeId))
              const firstNodeId = row.nodeIds[0]
              return (
                <article
                  key={`${row.targetKind}:${row.targetRef}`}
                  data-profile-code={row.profileCode}
                  data-preservation-state={row.preservationState}
                  aria-current={selected ? 'true' : undefined}
                >
                  <h4>{row.targetKind} · {row.profileCode}</h4>
                  <p>{row.systemLabel} · {row.targetRef}</p>
                  <p>Real scene nodes: {row.nodeIds.join(', ')}</p>
                  <p>Trace: {row.preservationState === 'PRESERVED_ON_REAL_SCENE_NODES' ? 'запазен' : 'конфликт'}</p>
                  {firstNodeId && (
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelectNode(firstNodeId)}
                    >
                      Покажи в 3D
                    </button>
                  )}
                </article>
              )
            })}
          </div>

          <aside aria-label="Избран 3D canonical profile trace">
            <h4>Избран 3D node</h4>
            {selectedRow && selectedNodeId ? (
              <>
                <p><strong>{selectedNodeId}</strong> → {selectedRow.targetKind}:{selectedRow.targetRef}</p>
                <p>Canonical profile: {selectedRow.profileCode} · {selectedRow.systemLabel}</p>
                <p>Authority: explicit Product Intent propagation → AI05.3.7 real conceptual scene.</p>
              </>
            ) : (
              <p>Избери frame, mullion или sash node от 3D сцената или от evidence списъка.</p>
            )}
          </aside>
        </>
      )}

      <footer data-safety="READ ONLY: YES · VISUAL BOUNDS ONLY: YES · AUTOMATIC PROFILE SELECTION: NO · AUTOMATIC GEOMETRY: NO · EXACT PROFILE CONTOUR: NO · RULES VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        READ ONLY: ДА · САМО VISUAL BOUNDS: ДА · АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ТОЧЕН ПРОФИЛЕН КОНТУР: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
