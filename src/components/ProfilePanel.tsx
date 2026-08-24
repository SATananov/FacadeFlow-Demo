import { profileSystems } from '../sampleData'
import type { Orientation, Profile } from '../types'
interface Props { project: string; profile: Profile; orientation: Orientation; onProject: (v: string) => void; onProfile: (v: Profile) => void; onOrientation: (v: Orientation) => void }
export function ProfilePanel({ project, profile, orientation, onProject, onProfile, onOrientation }: Props) {
  const field = (key: keyof Profile, value: string) => onProfile({ ...profile, [key]: key === 'system' || key === 'code' ? value : Number(value) })
  return <aside className="panel profile-panel" aria-labelledby="profile-title">
    <div className="panel-heading"><span className="step">01</span><div><h2 id="profile-title">Профил</h2><p>Основни параметри</p></div></div>
    <label>Име на проект<input required value={project} onChange={(e) => onProject(e.target.value)} /></label>
    <label>Профилна система<select value={profile.system} onChange={(e) => field('system', e.target.value)}>{profileSystems.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>Код на профил<input required value={profile.code} onChange={(e) => field('code', e.target.value)} /></label>
    <div className="field-grid"><label>Дължина <span>mm</span><input type="number" min="0.01" value={profile.length} onChange={(e) => field('length', e.target.value)} /></label><label>Ширина <span>mm</span><input type="number" min="0.01" value={profile.width} onChange={(e) => field('width', e.target.value)} /></label><label>Височина <span>mm</span><input type="number" min="0.01" value={profile.height} onChange={(e) => field('height', e.target.value)} /></label></div>
    <fieldset><legend>Ориентация</legend><label className="radio"><input type="radio" name="orientation" checked={orientation === 'left'} onChange={() => onOrientation('left')} /> Ляво начало</label><label className="radio"><input type="radio" name="orientation" checked={orientation === 'right'} onChange={() => onOrientation('right')} /> Дясно начало</label></fieldset>
  </aside>
}
