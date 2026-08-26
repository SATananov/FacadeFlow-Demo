import type { ImportRoute, InspectedImportSource } from './importFormatTypes'
export type ImportDispatchTarget = 'DRAWING_WORKSPACE' | 'SKYGLAZING_WORKSPACE' | 'SAFE_INSPECTION' | 'REJECT'
export function dispatchInspectedSource(route: ImportRoute, inspection: InspectedImportSource): ImportDispatchTarget { if (inspection.supportStatus === 'REJECTED' || inspection.supportStatus === 'FORMAT_MISMATCH') return 'REJECT'; if (route === 'SKYGLAZING') return 'SKYGLAZING_WORKSPACE'; return route === 'IMAGE' || route === 'PDF' ? 'DRAWING_WORKSPACE' : 'SAFE_INSPECTION' }
