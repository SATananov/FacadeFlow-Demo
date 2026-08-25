import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { roleLabels, profileStatusLabels } from '../profileCatalogueState'

interface Props { value: CatalogueProfile; errors: string[]; onChange: (value: CatalogueProfile) => void; onSave: () => void; onCancel: () => void }

export function ProfileEditor({ value, errors, onChange, onSave, onCancel }: Props) {
  const field = <K extends keyof CatalogueProfile>(key: K, next: CatalogueProfile[K]) => onChange({ ...value, [key]: next, updatedAt: new Date().toISOString() })
  return <form className="catalogue-editor" onSubmit={(event) => { event.preventDefault(); onSave() }} noValidate>
    <h3>{value.createdAt === value.updatedAt ? 'Добавяне / редактиране на профил' : 'Редактиране на профил'}</h3>
    <div className="catalogue-form-grid">
      <label>Роля<select value={value.role} onChange={(event) => field('role', event.target.value as ProfileRole)}>{Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>Производител / система<input required value={value.system} onChange={(event) => field('system', event.target.value)}/></label>
      <label>Код<input required value={value.code} onChange={(event) => field('code', event.target.value)}/></label>
      <label>Българско име<input required value={value.nameBg} onChange={(event) => field('nameBg', event.target.value)}/></label>
      <label>Размер A (mm)<input type="number" min="0.01" value={value.dimensionA} onChange={(event) => field('dimensionA', Number(event.target.value))}/></label>
      <label>Размер B (mm)<input type="number" min="0.01" value={value.dimensionB} onChange={(event) => field('dimensionB', Number(event.target.value))}/></label>
      <label>Статус<select value={value.status} onChange={(event) => field('status', event.target.value as CatalogueProfile['status'])}>{Object.entries(profileStatusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="full">Описание<textarea value={value.description ?? ''} onChange={(event) => field('description', event.target.value)}/></label>
    </div>
    {errors.length > 0 && <div className="inline-errors" role="alert"><b>Профилът не може да бъде записан:</b><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <div className="form-actions"><button className="primary" type="submit">Запази профила</button><button type="button" onClick={onCancel}>Отказ</button></div>
  </form>
}

