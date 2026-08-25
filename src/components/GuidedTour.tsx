import { useEffect, useRef, useState } from 'react'
import { tourSteps } from '../tourSteps'

export function GuidedTour({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0), panel = useRef<HTMLElement>(null), step = tourSteps[index]!
  useEffect(() => {
    const target = document.querySelector<HTMLElement>(`[data-help-id="${step.targetId}"]`)
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); target?.classList.add('tour-highlight')
    panel.current?.focus()
    return () => target?.classList.remove('tour-highlight')
  }, [step])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled])'); if (!items?.length) return
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key)
  }, [onClose])
  const targetExists = Boolean(document.querySelector(`[data-help-id="${step.targetId}"]`))
  return <div className="tour-layer" role="presentation"><section ref={panel} className="tour-panel" role="dialog" aria-modal="true" aria-labelledby="tour-title" tabIndex={-1}><span aria-live="polite">Стъпка {index + 1} от {tourSteps.length}: {step.title}</span><h2 id="tour-title">{step.title}</h2><p>{step.description}</p>{!targetExists && <p className="tour-unavailable">Тази цел е в друг екран. Отворете съответния workflow и рестартирайте обиколката, за да я видите; действието няма да бъде стартирано автоматично.</p>}<div><button type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Назад</button><button type="button" onClick={onClose}>Пропусни</button>{index < tourSteps.length - 1 ? <button type="button" className="primary-button" onClick={() => setIndex((value) => value + 1)}>Напред</button> : <button type="button" className="primary-button" onClick={onClose}>Затвори</button>}</div></section></div>
}
