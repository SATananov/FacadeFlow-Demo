import type { MachiningOperation, OperationDraft, Profile, ValidationResult } from './types'
const positive = (value: number) => Number.isFinite(value) && value > 0
const nonNegative = (value: number) => Number.isFinite(value) && value >= 0
export function validateProfile(project: string, profile: Profile): ValidationResult {
  const errors: string[] = []
  if (!project.trim()) errors.push('Името на проекта е задължително.')
  if (!profile.code.trim()) errors.push('Кодът на профила е задължителен.')
  if (!profile.system) errors.push('Изберете профилна система.')
  if (!positive(profile.length)) errors.push('Дължината трябва да е положително крайно число.')
  if (!positive(profile.width)) errors.push('Ширината трябва да е положително крайно число.')
  if (!positive(profile.height)) errors.push('Височината трябва да е положително крайно число.')
  return { valid: errors.length === 0, errors }
}
export function validateOperation(operation: OperationDraft, profile: Profile): ValidationResult {
  const errors: string[] = []
  if (!nonNegative(operation.x) || operation.x > profile.length) errors.push(`X трябва да е между 0 и ${profile.length} mm.`)
  if (!nonNegative(operation.y) || operation.y > profile.width) errors.push(`Y трябва да е между 0 и ${profile.width} mm.`)
  if (!nonNegative(operation.z)) errors.push('Z трябва да е крайно число, по-голямо или равно на 0.')
  if (!positive(operation.depth)) errors.push('Дълбочината трябва да е положително крайно число.')
  if (operation.type === 'drill' && !positive(operation.diameter)) errors.push('Диаметърът трябва да е положително крайно число.')
  if (operation.type === 'mill' && !positive(operation.slotLength)) errors.push('Дължината на канала трябва да е положително крайно число.')
  if (operation.type === 'mill' && !positive(operation.slotWidth)) errors.push('Ширината на канала трябва да е положително крайно число.')
  return { valid: errors.length === 0, errors }
}
export function validateAll(project: string, profile: Profile, operations: MachiningOperation[]): ValidationResult {
  const errors = [...validateProfile(project, profile).errors]
  operations.forEach((operation, index) => validateOperation(operation, profile).errors.forEach((error) => errors.push(`Операция ${index + 1}: ${error}`)))
  return { valid: errors.length === 0, errors }
}
