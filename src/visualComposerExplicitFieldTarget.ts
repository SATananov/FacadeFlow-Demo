import { applyComposerItem, selectComposerField } from './visualComposerState'
import type { ComposerItemType, VisualComposition } from './visualComposerTypes'

export const PROFILE_DATA_01_2A_V4_FIELD_TARGET_SAFETY = Object.freeze({
  explicitTargetRequired: true,
  automaticCrossFieldMutationAllowed: false,
  automaticProfileSelectionAllowed: false,
  machineReady: false,
  productionApproved: false,
})

export function applyComposerItemForExplicitTarget(
  state: VisualComposition,
  fieldId: string,
  item: ComposerItemType,
  idFactory: () => string,
  positionRatio = .5,
): VisualComposition {
  if (!state.fields.some((field) => field.id === fieldId)) return state

  const targetedState = selectComposerField(state, fieldId)
  const next = applyComposerItem(targetedState, item, idFactory, positionRatio)
  const originalFields = new Map(state.fields.map((field) => [field.id, field]))

  return {
    ...next,
    fields: next.fields.map((field) => (
      field.id === fieldId
        ? field
        : originalFields.get(field.id) ?? field
    )),
    selectedFieldId: fieldId,
  }
}
