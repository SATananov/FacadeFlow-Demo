import { useEffect, useMemo, useRef, useState } from 'react'
import { helpSections } from '../helpContentBg'
import type { HelpSectionId } from '../helpTypes'

interface Props { onClose: () => void; onStartTour: () => void }
export function HelpCenter({ onClose, onStartTour }: Props) {
  const dialog = useRef<HTMLElement>(null), [query, setQuery] = useState(''), [active, setActive] = useState<HelpSectionId>('quick-start')
  const visible = useMemo(() => { const term = query.trim().toLocaleLowerCase('bg'); return term ? helpSections.filter((section) => [section.title, ...section.paragraphs, ...(section.items ?? [])].join(' ').toLocaleLowerCase('bg').includes(term)) : helpSections }, [query])
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.current?.querySelector<HTMLElement>('input')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href]'); if (!items?.length) return
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown', key); previous?.focus() }
  }, [onClose])
  const navigate = (id: HelpSectionId) => { setActive(id); document.getElementById(`help-${id}`)?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }
  return <div className="preview-overlay help-overlay" role="presentation"><section ref={dialog} className="help-center" role="dialog" aria-modal="true" aria-labelledby="help-title"><header><div><span className="preview-badge">СИМУЛАЦИОННА ПОМОЩ</span><h2 id="help-title">Помощ за FacadeFlow Demo</h2><p>Ръководството не променя текущите данни или workflow.</p></div><button type="button" className="preview-close" aria-label="Затвори помощта" onClick={onClose}>×</button></header><div className="help-toolbar"><label>Търсене в помощта<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Напр. OCR, VERIFIED, X координата"/></label><button type="button" className="primary-button" onClick={onStartTour}>Започни обиколка</button></div><div className="help-layout"><nav aria-label="Раздели на помощта">{helpSections.map((section) => <button key={section.id} type="button" aria-current={active === section.id ? 'page' : undefined} onClick={() => navigate(section.id)}>{section.title}</button>)}</nav><div className="help-content" tabIndex={-1}>{visible.length ? visible.map((section) => <section key={section.id} id={`help-${section.id}`} onFocus={() => setActive(section.id)}><h3>{section.title}</h3>{section.paragraphs.map((text) => <p key={text}>{text}</p>)}{section.items && (section.id === 'quick-start' ? <ol>{section.items.map((item) => <li key={item}>{item}</li>)}</ol> : <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>)}</section>) : <p role="status">Няма намерени резултати. Опитайте с друга дума.</p>}</div></div></section></div>
}
