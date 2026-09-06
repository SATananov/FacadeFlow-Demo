import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  subtitle?: string
  zoom: number
  onZoom: (zoom: number) => void
  onReset: () => void
  onClose: () => void
  children: ReactNode
}

const clampZoom = (value: number) => Math.max(0.6, Math.min(3, Math.round(value * 10) / 10))

export function TechnicalZoomModal({ open, title, subtitle, zoom, onZoom, onReset, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === '+' || event.key === '=') onZoom(clampZoom(zoom + 0.2))
      if (event.key === '-') onZoom(clampZoom(zoom - 0.2))
      if (event.key === '0') onReset()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, onReset, onZoom, zoom])

  if (!open) return null

  return <div className="ff-technical-zoom-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="ff-technical-zoom-modal" role="dialog" aria-modal="true" aria-label={title}>
      <header className="ff-technical-zoom-head">
        <div><span>ТЕХНИЧЕСКИ ПРЕГЛЕД</span><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
        <div className="ff-technical-zoom-controls" aria-label="Управление на увеличението">
          <button type="button" onClick={() => onZoom(clampZoom(zoom - 0.2))} aria-label="Намали">−</button>
          <b>{Math.round(zoom * 100)}%</b>
          <button type="button" onClick={() => onZoom(clampZoom(zoom + 0.2))} aria-label="Увеличи">+</button>
          <button type="button" onClick={onReset}>Побери</button>
          <button type="button" className="close" onClick={onClose}>Затвори</button>
        </div>
      </header>
      <div className="ff-technical-zoom-stage ff-technical-grid">
        <div className="ff-technical-zoom-content" style={{ transform: `scale(${zoom})` }}>{children}</div>
      </div>
      <footer>Колелцето на мишката/панорамата остава на браузъра. За увеличение използвай + / −. Esc затваря прегледа.</footer>
    </section>
  </div>
}
