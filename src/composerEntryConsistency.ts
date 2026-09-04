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

export interface DoorComposerEntryResolution {
  composition: DoorComposition
  seededTemplateId: string | null
}

export function resolveDoorComposerEntry(
  current: DoorComposition,
  requestedTemplateId: string | null,
  previouslySeededTemplateId: string | null,
): DoorComposerEntryResolution {
  if (requestedTemplateId && requestedTemplateId !== previouslySeededTemplateId) {
    return {
      composition: applyDoorTemplate(emptyDoorComposition(), requestedTemplateId),
      seededTemplateId: requestedTemplateId,
    }
  }
  if (!requestedTemplateId && previouslySeededTemplateId) {
    return { composition: emptyDoorComposition(), seededTemplateId: null }
  }
  return { composition: current, seededTemplateId: previouslySeededTemplateId }
}

/** Compatibility helper for callers that need a one-shot fresh door composition. */
export function createDoorComposerEntryComposition(initialTemplateId: string | null): DoorComposition {
  return resolveDoorComposerEntry(emptyDoorComposition(), initialTemplateId, null).composition
}
