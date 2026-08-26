export type ImportRoute = 'IMAGE' | 'PDF' | 'SKYGLAZING' | 'CAD' | 'TABULAR' | 'SIMULATION'
export type DetectedImportFormat = 'PNG' | 'JPEG' | 'PDF' | 'SKYGLAZING_XML' | 'LTE' | 'DWG' | 'DXF' | 'CSV' | 'XLSX' | 'FACADEFLOW_SIMULATION_JSON' | 'UNKNOWN'
export type ImportSupportStatus = 'SUPPORTED' | 'SUPPORTED_FOR_VIEW_ONLY' | 'FUTURE_SUPPORT' | 'REJECTED' | 'FORMAT_MISMATCH'

export interface ImportFormatCardDefinition { route: ImportRoute; title: string; formats: string[]; description: string; status?: string; accept: string; badge: string }
export interface InspectedImportSource { fileName: string; extension: string; mimeType: string; sizeBytes: number; sha256: string; selectedRoute: ImportRoute; detectedFormat: DetectedImportFormat; supportStatus: ImportSupportStatus; warnings: string[]; importedAt: string; safeSummary?: string; formatVersion?: string; pageCount?: number }
export interface UnifiedSourceSession { sourceId: string; selectedRoute: ImportRoute; detectedFormat: DetectedImportFormat; metadata: InspectedImportSource; sha256: string; supportStatus: ImportSupportStatus; warnings: string[]; sourcePageCount?: number; linkedDraftIds: string[]; createdAt: string; simulationOnly: true; machineReady: false; requiresHumanApproval: true }
