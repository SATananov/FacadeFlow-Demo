import type { MachiningOperation } from './types'

export type ComponentOperations = Record<string, MachiningOperation[]>

export function hasComponentOperations(operations: ComponentOperations): boolean {
  return Object.values(operations).some((items) => items.length > 0)
}

export function operationsForComponent(operations: ComponentOperations, componentId: string): MachiningOperation[] {
  return operations[componentId] ?? []
}
