import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { roleLabels, profileStatusLabels } from '../profileCatalogueState'
import { confirmCatalogueProfileHumanRole } from '../nadezhdaCatalogueEvidence'

interface Props { value: CatalogueProfile; errors: string[]; onChange: (value: CatalogueProfile) => void; onSave: (value?: CatalogueProfile) => void; onCancel: () => void }

const reviewSensitiveFields = new Set<keyof CatalogueProfile>(['role', 'system', 'nameBg'])

export function ProfileEditor({ value, errors, onChange, onSave, onCancel }: Props) {
  const pendingEvidenceReview = Boolean(value.sourceEvidenceId && value.humanRoleReviewStatus !== 'HUMAN_CONFIRMED')
  const field = <K extends keyof CatalogueProfile>(key: K, nextValue: CatalogueProfile[K]) => {
    const invalidateHumanRole = value.sourceEvidenceId && value.humanRoleReviewStatus === 'HUMAN_CONFIRMED' && reviewSensitiveFields.has(key)
    onChange({
      ...value,
      [key]: nextValue,
      updatedAt: new Date().toISOString(),
      ...(invalidateHumanRole ? { humanRoleReviewStatus: 'PENDING' as const, humanRoleConfirmedAt: undefined, humanRoleConfirmedBy: undefined, humanRoleConfirmationNote: undefined } : {}),
    })
  }
  const submit = () => {
    if (!pendingEvidenceReview) { onSave(value); return }
    const confirmedBy = value.humanRoleConfirmedBy?.trim() ?? ''
    if (!confirmedBy) return
    onSave(confirmCatalogueProfileHumanRole(value, confirmedBy, value.humanRoleConfirmationNote ?? '', new Date().toISOString()))
  }

  return <form className="catalogue-editor" onSubmit={(event) => { event.preventDefault(); submit() }} noValidate>
    <h3>{value.sourceEvidenceId ? 'Човешко потвърждение на реален профил' : value.createdAt === value.updatedAt ? 'Добавяне / редактиране на профил' : 'Редактиране на профил'}</h3>
    {value.sourceEvidenceId && <div className="catalogue-source-review" role="note">
      <b>РЕАЛЕН SOURCE EVIDENCE</b><span>{value.sourceEvidenceLabel}</span>
      <small>Провери ролята, системата и името преди запис. Кодът и сечението идват от заключения source evidence. Ролята, системата и името са човешко решение. HUMAN CONFIRMED не означава експертно или производствено одобрение.</small>
    </div>}
    {value.sourceEvidenceId && <div className={`catalogue-human-review-state ${pendingEvidenceReview ? 'pending' : 'confirmed'}`}>
      <b>{pendingEvidenceReview ? 'HUMAN REVIEW REQUIRED' : '✓ HUMAN CONFIRMED ROLE'}</b>
      <span>{pendingEvidenceReview ? 'Профилът още не участва в продуктовите dropdown-и.' : `${roleLabels[value.role]} · потвърдено от ${value.humanRoleConfirmedBy}`}</span>
      {!pendingEvidenceReview && value.humanRoleConfirmedAt && <small>{new Date(value.humanRoleConfirmedAt).toLocaleString('bg-BG')}</small>}
    </div>}
    <div className="catalogue-form-grid">
      <label>{value.sourceEvidenceId ? 'Предложена роля' : 'Роля'}<select value={value.role} onChange={(event) => field('role', event.target.value as ProfileRole)}>{Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>Производител / система<input required value={value.system} onChange={(event) => field('system', event.target.value)}/></label>
      <label>Код<input required readOnly={Boolean(value.sourceEvidenceId)} value={value.code} onChange={(event) => field('code', event.target.value)}/></label>
      <label>Българско име<input required value={value.nameBg} onChange={(event) => field('nameBg', event.target.value)}/></label>
      <label>Размер A (mm)<input type="number" min="0.01" readOnly={Boolean(value.sourceEvidenceId)} value={value.dimensionA} onChange={(event) => field('dimensionA', Number(event.target.value))}/></label>
      <label>Размер B (mm)<input type="number" min="0.01" readOnly={Boolean(value.sourceEvidenceId)} value={value.dimensionB} onChange={(event) => field('dimensionB', Number(event.target.value))}/></label>
      {pendingEvidenceReview ? <><label className="full">Потвърдено от човек / технолог *<input required value={value.humanRoleConfirmedBy ?? ''} onChange={(event) => field('humanRoleConfirmedBy', event.target.value)} placeholder="Напр. име на технолог / проверяващ"/></label><label className="full">Бележка към човешкото потвърждение<textarea value={value.humanRoleConfirmationNote ?? ''} onChange={(event) => field('humanRoleConfirmationNote', event.target.value)} placeholder="Как е потвърдена ролята / система / допълнителна бележка"/></label></> : <label>Статус<select value={value.status} onChange={(event) => field('status', event.target.value as CatalogueProfile['status'])}>{Object.entries(profileStatusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
      <label className="full">Описание<textarea value={value.description ?? ''} onChange={(event) => field('description', event.target.value)}/></label>
    </div>
    {errors.length > 0 && <div className="inline-errors" role="alert"><b>Профилът не може да бъде записан:</b><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <div className="form-actions"><button className="primary" type="submit" disabled={pendingEvidenceReview && !value.humanRoleConfirmedBy?.trim()}>{pendingEvidenceReview ? 'Потвърди и добави в каталога' : 'Запази профила'}</button><button type="button" onClick={onCancel}>Отказ</button></div>
    {pendingEvidenceReview && <p className="catalogue-human-review-warning">SOURCE EVIDENCE → HUMAN CONFIRMED ROLE → CATALOGUE. RULES VALIDATED: NO · MACHINE READY: NO</p>}
  </form>
}
