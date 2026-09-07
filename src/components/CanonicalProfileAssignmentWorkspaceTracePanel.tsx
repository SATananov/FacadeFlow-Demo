import type { CanonicalProfileAssignmentWorkspaceReview } from '../aiCanonicalProfileAssignmentWorkspaceReview'

export interface CanonicalProfileAssignmentWorkspaceTracePanelProps {
  review: CanonicalProfileAssignmentWorkspaceReview
}

const STATUS_LABELS: Record<CanonicalProfileAssignmentWorkspaceReview['status'], string> = {
  READY_FOR_HUMAN_REVIEW: 'Изричните профилни назначения са запазени до Drawing',
  NEEDS_EXPLICIT_PROFILE_ASSIGNMENT: 'Липсват изрични профилни назначения',
  BLOCKED_CONFLICT: 'Профилният trace е блокиран поради конфликт',
}

const TRACE_LABELS: Record<CanonicalProfileAssignmentWorkspaceReview['rows'][number]['traceState'], string> = {
  PRESERVED_TO_DRAWING: 'Запазено: Product Intent → Graph → Drawing',
  SOURCE_TRACE_MISSING_OR_MISMATCH: 'Липсва или е променено преди Drawing',
}

export function CanonicalProfileAssignmentWorkspaceTracePanel({
  review,
}: CanonicalProfileAssignmentWorkspaceTracePanelProps) {
  return (
    <section
      className="ff-ai03-facts"
      aria-label="Read-only преглед на canonical профилните назначения"
      data-ai-step="AI05.3.6"
      data-review-status={review.status}
      data-conceptual-3d-review="PENDING_REAL_CONCEPTUAL_3D_SCENE"
    >
      <div className="ff-ai03-card-heading">
        <span>CANONICAL PROFILE TRACE · READ-ONLY</span>
        <b>{STATUS_LABELS[review.status]}</b>
      </div>

      <p>
        Показва само изрично зададените профили и дали кодът е запазен без промяна до 2D Drawing.
        Няма избор, редакция, автоматично назначаване или production действие.
      </p>

      {review.rows.length > 0 ? (
        <div aria-label="Canonical профилни назначения до Drawing">
          {review.rows.map((row) => (
            <article
              key={`${row.targetKind}:${row.targetRef}`}
              data-profile-role={row.role}
              data-profile-code={row.profileCode}
              data-trace-state={row.traceState}
            >
              <h4>{row.role} — {row.profileCode}</h4>
              <dl>
                <div><dt>Система</dt><dd>{row.systemLabel}</dd></div>
                <div><dt>Цел</dt><dd>{row.targetRef}</dd></div>
                <div><dt>Product Intent</dt><dd>{row.productIntentCode ?? 'Липсва'}</dd></div>
                <div><dt>Construction Graph</dt><dd>{row.constructionGraphCode ?? 'Липсва'}</dd></div>
                <div><dt>Drawing</dt><dd>{row.drawingCode ?? 'Липсва'}</dd></div>
                <div><dt>Trace</dt><dd>{TRACE_LABELS[row.traceState]}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p>Няма resolved canonical профилни назначения за показване.</p>
      )}

      {review.missingExplicitAssignments.length > 0 && (
        <div className="ff-ai03-unresolved">
          <b>ЛИПСВА ИЗРИЧНО НАЗНАЧЕНИЕ</b>
          <div>{review.missingExplicitAssignments.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
      )}

      {review.conflicts.length > 0 && (
        <details open className="ff-ai03-warnings">
          <summary>Профилни конфликти — блокирано ({review.conflicts.length})</summary>
          <ul>{review.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      )}

      {review.warnings.length > 0 && (
        <details className="ff-ai03-warnings">
          <summary>Предупреждения ({review.warnings.length})</summary>
          <ul>{review.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      )}

      <p>
        <strong>Conceptual 3D end-to-end review: ЧАКА РЕАЛНА 3D SCENE.</strong>{' '}
        AI05.3.6 не създава synthetic 3D scene и не обявява профилите за проверени в 3D.
      </p>

      <footer data-safety="READ ONLY: YES · SYNTHETIC 3D SCENE: NO · AUTOMATIC PROFILE SELECTION: NO · AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        READ-ONLY: ДА · SYNTHETIC 3D SCENE: НЕ · АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ ·
        АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · PRODUCTION UNLOCK: НЕ ·
        ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
