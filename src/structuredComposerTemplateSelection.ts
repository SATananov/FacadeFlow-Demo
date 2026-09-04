import { DOOR_TEMPLATES } from './doorComposerTemplates'
import { VISUAL_COMPOSER_TEMPLATES } from './visualComposerTemplates'

export type StructuredComposerCategory = 'WINDOW' | 'DOOR'

export interface StructuredComposerTemplateSelection {
  id: string
  nameBg: string
  category: StructuredComposerCategory
}

const WINDOW_SELECTIONS: readonly StructuredComposerTemplateSelection[] = VISUAL_COMPOSER_TEMPLATES.map((template) => ({
  id: template.id,
  nameBg: template.nameBg,
  category: 'WINDOW' as const,
}))

const DOOR_SELECTIONS: readonly StructuredComposerTemplateSelection[] = DOOR_TEMPLATES.map((template) => ({
  id: template.id,
  nameBg: template.name,
  category: 'DOOR' as const,
}))

export const STRUCTURED_COMPOSER_TEMPLATE_SELECTIONS: readonly StructuredComposerTemplateSelection[] = Object.freeze([
  ...WINDOW_SELECTIONS,
  ...DOOR_SELECTIONS,
])

export function composerTemplateIdForProductPreset(category: StructuredComposerCategory, productName: string): string | null {
  return STRUCTURED_COMPOSER_TEMPLATE_SELECTIONS.find((item) => item.category === category && item.nameBg === productName)?.id ?? null
}

export function composerTemplateSelectionById(category: StructuredComposerCategory, templateId: string | null | undefined): StructuredComposerTemplateSelection | null {
  if (!templateId) return null
  return STRUCTURED_COMPOSER_TEMPLATE_SELECTIONS.find((item) => item.category === category && item.id === templateId) ?? null
}

export function composerTemplateLabel(category: StructuredComposerCategory, templateId: string | null | undefined): string | null {
  return composerTemplateSelectionById(category, templateId)?.nameBg ?? null
}

export function isComposerTemplateCompatible(category: StructuredComposerCategory, templateId: string | null | undefined): boolean {
  return !templateId || Boolean(composerTemplateSelectionById(category, templateId))
}
