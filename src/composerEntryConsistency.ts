import { applyDoorTemplate, emptyDoorComposition } from './doorComposerState'
import type { DoorComposition } from './doorComposerTypes'
import { applyComposerTemplate, createEmptyComposition } from './visualComposerState'
import type { VisualComposition } from './visualComposerTypes'

export interface WindowComposerEntryResolution {
  composition: VisualComposition
  seededTemplateId: string | null
}

export function resolveWindowComposerEntry(
  current: VisualComposition,
  requestedTemplateId: string | null,
  previouslySeededTemplateId: string | null,
): WindowComposerEntryResolution {
  if (requestedTemplateId && requestedTemplateId !== previouslySeededTemplateId) {
    return {
      composition: applyComposerTemplate(createEmptyComposition(), requestedTemplateId),
      seededTemplateId: requestedTemplateId,
    }
  }
  if (!requestedTemplateId && previouslySeededTemplateId) {
    return { composition: createEmptyComposition(), seededTemplateId: null }
  }
  return { composition: current, seededTemplateId: previouslySeededTemplateId }
}

export function createDoorComposerEntryComposition(initialTemplateId: string | null): DoorComposition {
  return initialTemplateId ? applyDoorTemplate(emptyDoorComposition(), initialTemplateId) : emptyDoorComposition()
}
