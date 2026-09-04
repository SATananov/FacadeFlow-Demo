import { addDoorHardware, selectDoorField, setDoorInfill, setDoorOpening } from './doorComposerState'
import type { DoorComposition, DoorHingeSide, DoorInfill, DoorSwing } from './doorComposerTypes'

export const N_FIELD_DOOR_TARGET_SAFETY = Object.freeze({
  explicitTargetRequired: true,
  automaticCrossFieldMutationAllowed: false,
  automaticLeafSelectionAllowed: false,
  machineReady: false,
  productionApproved: false,
})

function preserveUntargetedDoorFields(
  state: DoorComposition,
  fieldId: string,
  next: DoorComposition,
): DoorComposition {
  const originalFields = new Map(state.fields.map((field) => [field.id, field]))
  return {
    ...next,
    fields: next.fields.map((field) => field.id === fieldId ? field : originalFields.get(field.id) ?? field),
    selectedFieldId: fieldId,
  }
}

export function setDoorOpeningForExplicitTarget(
  state: DoorComposition,
  fieldId: string,
  hingeSide: DoorHingeSide,
  swing: DoorSwing,
): DoorComposition {
  if (!state.fields.some((field) => field.id === fieldId)) return state
  const targeted = selectDoorField(state, fieldId)
  return preserveUntargetedDoorFields(state, fieldId, setDoorOpening(targeted, fieldId, hingeSide, swing))
}

export function setDoorInfillForExplicitTarget(
  state: DoorComposition,
  fieldId: string,
  infill: DoorInfill,
  splitRatio = .55,
): DoorComposition {
  if (!state.fields.some((field) => field.id === fieldId)) return state
  const targeted = selectDoorField(state, fieldId)
  return preserveUntargetedDoorFields(state, fieldId, setDoorInfill(targeted, fieldId, infill, splitRatio))
}

export function addDoorHardwareForExplicitTarget(
  state: DoorComposition,
  fieldId: string,
  kind: 'HINGE' | 'HANDLE',
  idFactory: () => string,
  positionRatio?: number,
): DoorComposition {
  if (!state.fields.some((field) => field.id === fieldId)) return state
  const targeted = selectDoorField(state, fieldId)
  return preserveUntargetedDoorFields(state, fieldId, addDoorHardware(targeted, fieldId, kind, idFactory, positionRatio))
}
