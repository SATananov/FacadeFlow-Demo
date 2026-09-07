import type { CanonicalProfileAssignmentHumanReview } from '../aiCanonicalProfileAssignmentHumanReview'

export interface CanonicalProfileAssignmentReviewPanelProps {
  review: CanonicalProfileAssignmentHumanReview
}

const STATUS_LABELS: Record<CanonicalProfileAssignmentHumanReview['status'], string> = {
  READY_FOR_HUMAN_REVIEW: 'Готово за човешки преглед',
  NEEDS_EXPLICIT_PROFILE_ASSIGNMENT: 'Липсва изрично профилно назначение',
  BLOCKED_CONFLICT: 'Блокирано поради конфликт',
}

const END_TO_END_LABELS: Record<CanonicalProfileAssignmentHumanReview['rows'][number]['endToEndState'], string> = {
  PRESERVED_END_TO_END: 'Запазено без промяна',
  SOURCE_TRACE_MISSING_OR_MISMATCH: 'Липсва или е променен upstream trace',
  CONCEPTUAL_3D_ASSIGNMENT_MISSING: 'Липсва в conceptual 3D metadata',
  CONCEPTUAL_3D_ASSIGNMENT_MISMATCH: 'Несъответствие в conceptual 3D metadata',
}

export function CanonicalProfileAssignmentReviewPanel({
  review,
}: CanonicalProfileAssignmentReviewPanelProps) {
  return (
    <section
      aria-label="Човешки преглед на профилните назначения"
      data-ai-step="AI05.3.5"
      data-review-status={review.status}
    >
      <header>
        <h3>Профилни назначения — човешки преглед</h3>
        <p>{STATUS_LABELS[review.status]}</p>
        <p>
          Само за преглед. Без автоматичен избор на профили, без промяна на геометрията и без production unlock.
        </p>
      </header>

      {review.rows.length > 0 ? (
        <div aria-label="Запазени профилни назначения">
          {review.rows.map((row) => (
            <article
              key={`${row.targetKind}:${row.targetRef}`}
              data-profile-role={row.role}
              data-profile-code={row.profileCode}
              data-end-to-end-state={row.endToEndState}
            >
              <h4>{row.role} — {row.profileCode}</h4>
              <dl>
                <dt>Система</dt>
                <dd>{row.systemLabel}</dd>
                <dt>Цел</dt>
                <dd>{row.targetRef}</dd>
                <dt>Product Intent</dt>
                <dd>{row.productIntentCode ?? 'Липсва'}</dd>
                <dt>Construction Graph</dt>
                <dd>{row.constructionGraphCode ?? 'Липсва'}</dd>
                <dt>Drawing</dt>
                <dd>{row.drawingCode ?? 'Липсва'}</dd>
                <dt>Conceptual 3D</dt>
                <dd>{row.conceptual3DCode ?? 'Липсва'}</dd>
                <dt>Проверка</dt>
                <dd>{END_TO_END_LABELS[row.endToEndState]}</dd>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p>Няма потвърдени canonical профилни назначения за показване.</p>
      )}

      {review.missingExplicitAssignments.length > 0 && (
        <section aria-label="Липсващи изрични назначения">
          <h4>Липсващи изрични назначения</h4>
          <ul>
            {review.missingExplicitAssignments.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      {review.conflicts.length > 0 && (
        <section aria-label="Конфликти в профилните назначения">
          <h4>Конфликти — блокирано</h4>
          <ul>
            {review.conflicts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      {review.warnings.length > 0 && (
        <section aria-label="Предупреждения за профилните назначения">
          <h4>Предупреждения</h4>
          <ul>
            {review.warnings.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      <footer>
        <strong>Human review required: YES</strong>
        <span> · Machine ready: NO · Production approved: NO</span>
      </footer>
    </section>
  )
}
