import { cameraPresetLabels } from '../threeDCameraPresets'
import { defaultThreeDVisibility, type CameraPreset, type ThreeDVisibility } from '../threeDTypes'
import { ContextHelp } from './ContextHelp'

interface Props { preset: CameraPreset; visibility: ThreeDVisibility; depth: number; exploded: number; opening: number; openingAvailable: boolean; onPreset: (value: CameraPreset) => void; onVisibility: (value: ThreeDVisibility) => void; onDepth: (value: number) => void; onExploded: (value: number) => void; onOpening: (value: number) => void }
export function Product3DControls(props: Props) {
  const toggle = (key: keyof ThreeDVisibility) => props.onVisibility({ ...props.visibility, [key]: !props.visibility[key] })
  return <aside className="three-d-controls" aria-label="Контроли за концептуалния 3D преглед">
    <fieldset><legend>Камера <ContextHelp helpId="3d-camera"/></legend><div className="camera-presets">{Object.entries(cameraPresetLabels).map(([id, label]) => <button key={id} type="button" aria-pressed={props.preset === id} onClick={() => props.onPreset(id as CameraPreset)}>{label}</button>)}</div><div className="camera-reset-actions"><button type="button" onClick={() => props.onPreset('ISOMETRIC')}>Нулирай камерата</button><button type="button" onClick={() => props.onPreset('FRONT')}>Побери изделието</button></div></fieldset>
    <fieldset><legend>Видимост <ContextHelp helpId="3d-visibility"/></legend>{([['frame', 'Каса'], ['dividers', 'Делители'], ['sashes', 'Крила'], ['glazing', 'Остъкляване'], ['labels', 'Етикети'], ['grid', 'Мрежа'], ['wireframe', 'Wireframe'], ['transparent', 'Прозрачна конструкция']] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={props.visibility[key]} onChange={() => toggle(key)}/>{label}</label>)}<button type="button" onClick={() => props.onVisibility(defaultThreeDVisibility)}>Нулирай видимостта</button></fieldset>
    <label>Концептуална дълбочина: {props.depth} mm <ContextHelp helpId="3d-depth"/><input type="range" min="30" max="160" step="5" value={props.depth} onChange={(event) => props.onDepth(Number(event.target.value))}/></label>
    <label>Разглобен изглед: {props.exploded}% <ContextHelp helpId="3d-exploded"/><input type="range" min="0" max="100" value={props.exploded} onChange={(event) => props.onExploded(Number(event.target.value))}/><small>Само визуален режим — не показва последователност на сглобяване.</small></label>
    <label>Покажи отваряне: {props.opening}°<input type="range" min="0" max="60" value={props.opening} disabled={!props.openingAvailable} title={!props.openingAvailable ? 'Няма крило с експертно потвърдена посока.' : undefined} onChange={(event) => props.onOpening(Number(event.target.value))}/><small>{props.openingAvailable ? 'Концептуално движение — не е модел на обков.' : 'Изисква експертно потвърдена LEFT/RIGHT посока.'}</small></label>
  </aside>
}
