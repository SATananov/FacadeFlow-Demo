import type { ReactNode } from 'react'
import { FacadeFlowIcon, type FacadeFlowIconName } from './FacadeFlowIcons'

interface Props {
  titleId: string
  icon: FacadeFlowIconName
  eyebrow: string
  title: string
  subtitle: string
  onBack: () => void
  backLabel?: string
  actions?: ReactNode
  className?: string
}

export function FacadeFlowWorkspaceHeader({ titleId, icon, eyebrow, title, subtitle, onBack, backLabel = 'Назад към FacadeFlow', actions, className = '' }: Props) {
  return <header className={`ff-workspace-header ${className}`.trim()}>
    <div className="ff-workspace-title-wrap">
      <span className="ff-workspace-symbol" aria-hidden="true"><FacadeFlowIcon name={icon}/></span>
      <div>
        <span className="ff-workspace-eyebrow">{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
    <div className="ff-workspace-header-right">
      {actions && <div className="ff-workspace-actions">{actions}</div>}
      <button type="button" className="ff-workspace-back" onClick={onBack}><FacadeFlowIcon name="back"/><span>{backLabel}</span></button>
      <img className="ff-workspace-company-logo" src="/branding/nadezhda-header.png" alt="Надежда - алуминиева и PVC дограма"/>
    </div>
  </header>
}
