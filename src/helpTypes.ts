export type HelpSectionId = 'quick-start' | 'import' | 'recognition' | 'product' | 'components' | 'operations' | 'statuses' | 'export' | 'glossary' | 'troubleshooting' | 'safety'
export interface HelpSection { id: HelpSectionId; title: string; paragraphs: string[]; items?: string[] }
export interface GlossaryTerm { term: string; definition: string }
export interface ContextHelpEntry { id: string; title: string; explanation: string }
export interface TourStep { id: string; targetId: string; title: string; description: string }
