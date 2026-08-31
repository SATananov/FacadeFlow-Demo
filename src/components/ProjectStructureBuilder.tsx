import { useMemo, useState, type CSSProperties } from 'react'
import { addFacadeFlowProjectNode, removeFacadeFlowProjectNode, selectFacadeFlowProjectNode } from '../aiWorkspaceState'
import type { FacadeFlowAiSession, FacadeFlowProjectNodeKind } from '../aiWorkspaceTypes'
import { PROJECT_NODE_LABELS, projectNodeKindsForJob, projectStructureNodeDepth, projectStructurePathNodes } from '../projectStructure'

interface Props {
  session: FacadeFlowAiSession
  setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void
}

const exampleByKind: Record<FacadeFlowProjectNodeKind, string> = {
  BUILDING: 'Напр. Корпус А', FLOOR: 'Напр. Етаж 2', FACADE: 'Напр. Южна фасада', ROOM: 'Напр. Дневна', ZONE: 'Напр. Витрина А', POSITION: 'Напр. W-01', DETAIL: 'Напр. Възел D-03',
}

export function ProjectStructureBuilder({ session, setSession }: Props) {
  const structure = session.job.projectStructure
  const kinds = useMemo(() => projectNodeKindsForJob(session.job.jobType), [session.job.jobType])
  const [kind, setKind] = useState<FacadeFlowProjectNodeKind>(() => kinds[0] ?? 'POSITION')
  const [label, setLabel] = useState('')
  const [parentId, setParentId] = useState('')
  const activePath = projectStructurePathNodes(structure)

  const add = () => {
    const clean = label.trim()
    if (!clean) return
    setSession((current) => addFacadeFlowProjectNode(current, { id: crypto.randomUUID(), kind, label: clean, parentId: parentId || null }))
    setLabel('')
  }

  return <section className="ff-project-structure" aria-labelledby="ff-project-structure-title">
    <div className="ff-project-structure-head">
      <div><span>СТРУКТУРА · OPTIONAL</span><h4 id="ff-project-structure-title">Къде принадлежи изделието?</h4><p>Добавяй само нивата, които реално съществуват. Етаж, помещение, фасада и позиция не са задължителни. Единично изделие може да остане без йерархия.</p></div>
      <div className="ff-project-active-path"><span>АКТИВЕН ПЪТ</span><b>{activePath.length ? activePath.map((node) => node.label).join(' → ') : 'Без структура / директно изделие'}</b><small>Този път се записва в структурираното изделие при Human Review.</small></div>
    </div>

    <div className="ff-project-structure-add">
      <label>Ниво<select value={kind} onChange={(event) => setKind(event.target.value as FacadeFlowProjectNodeKind)}>{kinds.map((value) => <option key={value} value={value}>{PROJECT_NODE_LABELS[value]}</option>)}</select></label>
      <label>Име / марка<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={exampleByKind[kind]}/></label>
      <label>Под ниво<select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">Корен на работата</option>{structure.nodes.map((node) => <option key={node.id} value={node.id}>{'— '.repeat(projectStructureNodeDepth(structure, node.id))}{PROJECT_NODE_LABELS[node.kind]} · {node.label}</option>)}</select></label>
      <button type="button" disabled={!label.trim()} onClick={add}>+ Добави ниво</button>
    </div>

    {structure.nodes.length === 0 ? <div className="ff-project-structure-empty"><b>Няма добавена йерархия.</b><span>Това е валидно за единично изделие, малка поръчка или когато проектната структура още не е известна.</span></div> : <div className="ff-project-structure-list">{structure.nodes.map((node) => { const active = structure.activeNodeId === node.id; const depth = projectStructureNodeDepth(structure, node.id); return <article key={node.id} className={active ? 'active' : ''} style={{ '--ff-project-depth': depth } as CSSProperties}><div><span>{PROJECT_NODE_LABELS[node.kind]}</span><b>{node.label}</b><small>{node.source} · DRAFT · SESSION ONLY</small></div><div><button type="button" className={active ? 'selected' : ''} onClick={() => setSession((current) => selectFacadeFlowProjectNode(current, node.id))}>{active ? '✓ Използва се за изделието' : 'Използвай за изделието'}</button><button type="button" className="danger" onClick={() => setSession((current) => removeFacadeFlowProjectNode(current, node.id))}>Премахни</button></div></article> })}</div>}

    <div className="ff-project-structure-foot"><button type="button" className={!structure.activeNodeId ? 'selected' : ''} onClick={() => setSession((current) => selectFacadeFlowProjectNode(current, null))}>Без структура / директно изделие</button><span>PROJECT MODEL: SESSION ONLY · PERSISTENCE: NO · MACHINE READY: NO</span></div>
  </section>
}
