import type { OperationDraft, Orientation, Profile } from './types'
export const profileSystems = ['AL TEST 50', 'AL TEST 65', 'AL TEST 75'] as const
export const defaultProject = 'Тестов профил 001'
export const defaultOrientation: Orientation = 'left'
export const defaultProfile: Profile = { system: profileSystems[0], code: 'TP-001', length: 1200, width: 60, height: 40 }
export const emptyOperation: OperationDraft = { type: 'drill', x: 100, y: 30, z: 0, diameter: 8, slotLength: 30, slotWidth: 8, depth: 5 }
