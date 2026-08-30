import { useEffect, useState, type ReactNode } from 'react'
import '../drawingWorkspaceShell.css'

interface Props {
  labelId: string
  header: ReactNode
  progress: ReactNode
  settings: ReactNode
  toolbar: ReactNode
  viewport: ReactNode
  properties?: ReactNode
  status: ReactNode
  className?: string
}

export function DrawingWorkspaceShell({ labelId, header, progress, settings, toolbar, viewport, properties, status, className = '' }: Props) {
  const [settingsVisible, setSettingsVisible] = useState(true)
  useEffect(() => {
    const shortDesktop = window.matchMedia('(min-width: 901px) and (max-height: 850px)')
    const workbenchDesktop = window.matchMedia('(min-width: 1180px)')
    if (shortDesktop.matches || workbenchDesktop.matches) setSettingsVisible(false)
  }, [])
  return <section className={`drawing-workspace-shell ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={labelId}>
    <div className="drawing-workspace-header">{header}</div>
    <div className="drawing-workspace-progress">{progress}</div>
    <section className="drawing-workspace-settings" aria-label="Настройки на текущата стъпка">
      <div className="drawing-workspace-settings-heading"><strong>Настройки на текущата стъпка</strong><button type="button" aria-expanded={settingsVisible} onClick={() => setSettingsVisible((visible) => !visible)}>{settingsVisible ? 'Скрий настройките' : 'Покажи настройките'}</button></div>
      <div className="drawing-workspace-settings-content" hidden={!settingsVisible}>{settings}</div>
    </section>
    <div className="drawing-workspace-toolbar" aria-label="Инструменти на работната зона">{toolbar}</div>
    <main className={`drawing-workspace-main ${properties ? '' : 'without-properties'}`.trim()}>
      <div className="drawing-workspace-viewport">{viewport}</div>
      {properties && <aside className="drawing-workspace-properties">{properties}</aside>}
    </main>
    <div className="drawing-workspace-status">{status}</div>
  </section>
}
