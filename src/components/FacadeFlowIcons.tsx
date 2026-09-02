import type { SVGProps } from 'react'

export type FacadeFlowIconName =
  | 'ai'
  | 'help'
  | 'import'
  | 'catalogue'
  | 'designer'
  | 'projects'
  | 'building'
  | 'house'
  | 'small-project'
  | 'single-product'
  | 'custom-order'
  | 'technical-detail'
  | 'documents'
  | 'description'
  | 'sketch'
  | 'manual'
  | 'back'
  | 'data'

interface Props extends SVGProps<SVGSVGElement> {
  name: FacadeFlowIconName
}

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function FacadeFlowIcon({ name, ...props }: Props) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props} {...common}>
    {name === 'ai' && <><path d="M12 2.5l1.35 4.15L17.5 8l-4.15 1.35L12 13.5l-1.35-4.15L6.5 8l4.15-1.35L12 2.5Z"/><path d="M18.3 13.5l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z"/><path d="M5.1 13.2l.65 1.95 1.95.65-1.95.65-.65 1.95-.65-1.95-1.95-.65 1.95-.65.65-1.95Z"/></>}
    {name === 'help' && <><circle cx="12" cy="12" r="9"/><path d="M9.8 9.1a2.45 2.45 0 0 1 4.7.9c0 1.85-2.5 2.05-2.5 3.7"/><path d="M12 17.2h.01"/></>}
    {name === 'import' && <><path d="M4 15.5V19h16v-3.5"/><path d="M12 4v10"/><path d="m8.5 10.5 3.5 3.5 3.5-3.5"/><path d="M6 4h12"/></>}
    {name === 'catalogue' && <><path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z"/><path d="M8 4.5V20"/><path d="M11 8h5M11 11h5M11 14h3"/></>}
    {name === 'designer' && <><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 4v16M16 4v16M4 12h16"/><path d="m10.5 16.5 1.5-1.5 1.5 1.5"/></>}
    {name === 'projects' && <><path d="M3.5 6.5h6l1.5 2h9.5v10.5H3.5V6.5Z"/><path d="M3.5 9h17"/><path d="M7 12h4M7 15h7M16.5 12h.01M16.5 15h.01"/></>}
    {name === 'building' && <><path d="M5 21V4h10v17M15 8h4v13"/><path d="M8 7h2M8 10h2M8 13h2M8 16h2M12 7h1M12 10h1M12 13h1M12 16h1M17 11h1M17 14h1M17 17h1"/><path d="M3 21h18"/></>}
    {name === 'house' && <><path d="m3 11 9-7 9 7"/><path d="M5.5 10v10h13V10"/><path d="M9 20v-6h6v6"/><path d="M8 10h2M14 10h2"/></>}
    {name === 'small-project' && <><path d="M4 20V8l5-4 5 4v12"/><path d="M14 12h6v8M7 11h4M7 14h4M7 17h4M16.5 15h1M16.5 18h1"/><path d="M2.5 20h19"/></>}
    {name === 'single-product' && <><rect x="5" y="4" width="14" height="16" rx="1"/><path d="M8 7h8v10H8zM12 7v10"/><path d="M3 22h18M3 20v2M21 20v2"/></>}
    {name === 'custom-order' && <><path d="M4 18V7l5-3 4 3 3-2 4 3v10l-5 2-4-2-3 2-4-2Z"/><path d="M9 4v12M13 7v11M16 5v13"/><circle cx="9" cy="16" r="1"/></>}
    {name === 'technical-detail' && <><path d="M4 18V6h16v12H4Z"/><path d="M7 15 11 9l3 4 3-5"/><path d="M3 21h18M3 19v2M21 19v2M2 5h2M2 19h2"/><circle cx="11" cy="9" r="1"/></>}
    {name === 'documents' && <><path d="M7 3h8l4 4v14H7V3Z"/><path d="M15 3v5h4M10 11h6M10 14h6M10 17h4"/><path d="M4 6v14h2"/></>}
    {name === 'description' && <><path d="M5 4h14v13H9l-4 3V4Z"/><path d="M8 8h8M8 11h6M8 14h4"/><path d="M18 18.5l.6 1.5 1.4.6-1.4.6-.6 1.5-.6-1.5-1.4-.6 1.4-.6.6-1.5Z"/></>}
    {name === 'sketch' && <><path d="M4 19.5 8.5 15l3 3L20 9.5"/><path d="m15.8 5.2 3 3M14.7 6.3l3-3 3 3-3 3"/><path d="M4 5v15h16"/></>}
    {name === 'manual' && <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 9h2M10 9h2M14 9h2M18 9h.1M6 12h2M10 12h2M14 12h2M18 12h.1M7 15h10"/></>}
    {name === 'back' && <><path d="m14.5 6-6 6 6 6"/><path d="M9 12h10"/></>}
    {name === 'data' && <><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.65 3.13 3 7 3s7-1.35 7-3V5"/><path d="M5 11v6c0 1.65 3.13 3 7 3s7-1.35 7-3v-6"/></>}
  </svg>
}
