import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { contextualHelp } from '../contextHelpRegistry'

const VIEWPORT_MARGIN = 12
const POPOVER_GAP = 8
const MOBILE_BREAKPOINT = 720
const OPEN_EVENT = 'facadeflow-context-help-open'
type Position = { left: number; top: number; ready: boolean; placement: 'right' | 'below' | 'left' | 'above' | 'mobile' }
type DesktopPlacement = Exclude<Position['placement'], 'mobile'>

export function ContextHelp({ helpId }: { helpId: string }) {
  const entry = contextualHelp[helpId]
  const instanceId = useId().replaceAll(':', '')
  const popoverId = `context-help-${instanceId}`
  const titleId = `${popoverId}-title`
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const animationFrame = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ left: VIEWPORT_MARGIN, top: VIEWPORT_MARGIN, ready: false, placement: 'below' })
  const close = useCallback((returnFocus = true) => { setOpen(false); if (returnFocus) requestAnimationFrame(() => trigger.current?.focus()) }, [])
  const calculatePosition = useCallback(() => {
    const triggerElement = trigger.current, popoverElement = popover.current
    if (!triggerElement || !popoverElement) return
    if (import.meta.env.DEV && popoverElement.parentElement !== document.body) throw new Error('ContextHelp invariant: every popover must use the shared document.body portal engine.')
    const triggerRect = triggerElement.getBoundingClientRect(), popoverRect = popoverElement.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth, viewportHeight = document.documentElement.clientHeight
    const width = Math.min(popoverRect.width, viewportWidth - VIEWPORT_MARGIN * 2), height = Math.min(popoverRect.height, viewportHeight - VIEWPORT_MARGIN * 2)
    if (viewportWidth <= MOBILE_BREAKPOINT) { setPosition({ left: Math.max(VIEWPORT_MARGIN, (viewportWidth - width) / 2), top: Math.max(VIEWPORT_MARGIN, viewportHeight - VIEWPORT_MARGIN - height), ready: true, placement: 'mobile' }); return }
    const available = { right: viewportWidth - VIEWPORT_MARGIN - triggerRect.right - POPOVER_GAP, left: triggerRect.left - VIEWPORT_MARGIN - POPOVER_GAP, below: viewportHeight - VIEWPORT_MARGIN - triggerRect.bottom - POPOVER_GAP, above: triggerRect.top - VIEWPORT_MARGIN - POPOVER_GAP }
    const preferred: DesktopPlacement[] = ['right', 'below', 'left', 'above']
    const fits = { right: width <= available.right, below: height <= available.below, left: width <= available.left, above: height <= available.above }
    const placement = preferred.find((candidate) => fits[candidate]) ?? preferred.reduce((best, candidate) => available[candidate] > available[best] ? candidate : best)
    let left = triggerRect.left + triggerRect.width / 2 - width / 2, top = triggerRect.top + triggerRect.height / 2 - height / 2
    if (placement === 'right') left = triggerRect.right + POPOVER_GAP
    else if (placement === 'left') left = triggerRect.left - POPOVER_GAP - width
    else if (placement === 'below') top = triggerRect.bottom + POPOVER_GAP
    else top = triggerRect.top - POPOVER_GAP - height
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), viewportWidth - VIEWPORT_MARGIN - width)
    top = Math.min(Math.max(top, VIEWPORT_MARGIN), viewportHeight - VIEWPORT_MARGIN - height)
    setPosition({ left, top, ready: true, placement })
  }, [])
  const schedulePosition = useCallback(() => { if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current); animationFrame.current = requestAnimationFrame(() => { animationFrame.current = null; calculatePosition() }) }, [calculatePosition])
  useLayoutEffect(() => { if (open) schedulePosition() }, [open, schedulePosition])
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { const target = event.target as Node; if (!trigger.current?.contains(target) && !popover.current?.contains(target)) close(!(target instanceof Element && target.closest('[data-context-help-trigger]'))) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close() } }
    const anotherOpened = (event: Event) => { if ((event as CustomEvent<string>).detail !== popoverId) close(false) }
    const resizeObserver = new ResizeObserver(schedulePosition)
    if (trigger.current) resizeObserver.observe(trigger.current)
    if (popover.current) resizeObserver.observe(popover.current)
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', key)
    window.addEventListener(OPEN_EVENT, anotherOpened); window.addEventListener('resize', schedulePosition); window.addEventListener('scroll', schedulePosition, true)
    schedulePosition()
    return () => {
      resizeObserver.disconnect(); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key)
      window.removeEventListener(OPEN_EVENT, anotherOpened); window.removeEventListener('resize', schedulePosition); window.removeEventListener('scroll', schedulePosition, true)
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
    }
  }, [close, open, popoverId, schedulePosition])
  if (!entry) { if (import.meta.env.DEV) console.error(`ContextHelp registry invariant: missing shared entry "${helpId}".`); return null }
  const toggle = () => { if (open) { close(); return }; window.dispatchEvent(new CustomEvent<string>(OPEN_EVENT, { detail: popoverId })); setPosition((current) => ({ ...current, ready: false })); setOpen(true) }
  const portal = open ? createPortal(<div ref={popover} id={popoverId} className="context-help-popover context-help-portal" role="dialog" aria-modal="false" aria-labelledby={titleId} data-placement={position.placement} data-context-help-engine="viewport-portal-v1" style={{ left: position.left, top: position.top, visibility: position.ready ? 'visible' : 'hidden' }}><div className="context-help-content"><b id={titleId}>{entry.title}</b><p>{entry.explanation}</p></div><div className="context-help-footer"><button type="button" aria-label="Затвори контекстната помощ" onClick={() => close()}>Затвори</button></div></div>, document.body) : null
  return <span className="context-help"><button ref={trigger} className="ff-help-trigger" type="button" data-context-help-trigger="true" aria-label={`Помощ: ${entry.title}`} aria-expanded={open} aria-controls={popoverId} onClick={toggle}>?</button>{portal}</span>
}
