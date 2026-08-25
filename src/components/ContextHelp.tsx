import { useEffect, useRef, useState } from 'react'
import { contextualHelp } from '../contextHelpRegistry'

export function ContextHelp({ helpId }: { helpId: string }) {
  const entry = contextualHelp[helpId], [open, setOpen] = useState(false), root = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key) }
  }, [open])
  if (!entry) return null
  return <span className="context-help" ref={root}><button type="button" aria-label={`Помощ: ${entry.title}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>?</button>{open && <span className="context-help-popover" role="dialog" aria-label={entry.title}><b>{entry.title}</b><span>{entry.explanation}</span><button type="button" onClick={() => setOpen(false)}>Затвори</button></span>}</span>
}
