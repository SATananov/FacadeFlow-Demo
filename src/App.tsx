import { useMemo, useState } from 'react'
import './App.css'
import { OperationsPanel } from './components/OperationsPanel'
import { ProfilePanel } from './components/ProfilePanel'
import { ProfileWorkspace } from './components/ProfileWorkspace'
import { exportSimulation } from './exportSimulation'
import { defaultOrientation, defaultProfile, defaultProject, emptyOperation } from './sampleData'
import type { MachiningOperation, OperationDraft, Orientation, Profile } from './types'
import { validateAll, validateOperation } from './validation'
function App() {
  const [project,setProject]=useState(defaultProject), [profile,setProfile]=useState<Profile>(defaultProfile), [orientation,setOrientation]=useState<Orientation>(defaultOrientation)
  const [operations,setOperations]=useState<MachiningOperation[]>([]), [draft,setDraft]=useState<OperationDraft>(emptyOperation), [editingId,setEditingId]=useState<string|null>(null), [formErrors,setFormErrors]=useState<string[]>([])
  const savedValidation=useMemo(()=>validateAll(project,profile,operations),[project,profile,operations])
  const validation=useMemo(()=>({valid:savedValidation.valid&&formErrors.length===0,errors:[...savedValidation.errors,...formErrors.map(error=>`Текуща операция: ${error}`)]}),[savedValidation,formErrors])
  const cancel=()=>{setEditingId(null);setDraft(emptyOperation);setFormErrors([])}
  const submit=()=>{const result=validateOperation(draft,profile);setFormErrors(result.errors);if(!result.valid)return;setOperations(items=>editingId?items.map(item=>item.id===editingId?{...draft,id:editingId}:item):[...items,{...draft,id:crypto.randomUUID()}]);cancel()}
  const move=(index:number,direction:-1|1)=>setOperations(items=>{const target=index+direction;if(target<0||target>=items.length)return items;const next=[...items],current=next[index],adjacent=next[target];if(!current||!adjacent)return items;next[index]=adjacent;next[target]=current;return next})
  return <div className="app-shell"><header><div className="brand-mark">FF</div><div className="brand"><h1>FacadeFlow Demo</h1><p>Визуална подготовка на операции за алуминиеви профили</p></div><div className="safety-badge"><span>●</span> СИМУЛАЦИЯ — БЕЗ ВРЪЗКА С МАШИНА</div></header><main><div className="layout"><ProfilePanel project={project} profile={profile} orientation={orientation} onProject={setProject} onProfile={next=>{setProfile(next);if(formErrors.length)setFormErrors(validateOperation(draft,next).errors)}} onOrientation={setOrientation}/><ProfileWorkspace profile={profile} operations={operations} orientation={orientation}/><OperationsPanel draft={draft} operations={operations} editingId={editingId} errors={formErrors} onDraft={next=>{setDraft(next);if(formErrors.length)setFormErrors(validateOperation(next,profile).errors)}} onSubmit={submit} onEdit={op=>{const{id,...values}=op;setEditingId(id);setDraft(values);setFormErrors([])}} onDelete={id=>{setOperations(items=>items.filter(item=>item.id!==id));if(editingId===id)cancel()}} onMove={move} onCancel={cancel}/></div><section className={`validation-bar ${validation.valid?'valid':'invalid'}`} aria-live="polite"><div><span className="state-icon">{validation.valid?'✓':'!'}</span><div><b>{validation.valid?'Готово за визуална проверка':'Има грешки'}</b><p id="readiness-explanation">{validation.valid?`${operations.length} операции · Данните са валидни за симулация.`:`Коригирайте видимите грешки преди тестовия export. ${validation.errors.join(' ')}`}</p></div></div><button type="button" className="export" disabled={!validation.valid} aria-describedby="readiness-explanation" title={!validation.valid?'Export-ът е недостъпен, докато има грешки.':undefined} onClick={()=>exportSimulation({project,profile,orientation,operations,validation})}>⇩ Експортирай тестов JSON</button></section></main><footer>FacadeFlow Demo · Phase 01 · Само визуална симулация</footer></div>
}
export default App
