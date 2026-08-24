export type Orientation = 'left' | 'right'
export type OperationType = 'drill' | 'mill'
export interface Profile { system: string; code: string; length: number; width: number; height: number }
export interface MachiningOperation { id: string; type: OperationType; x: number; y: number; z: number; diameter: number; slotLength: number; slotWidth: number; depth: number }
export type OperationDraft = Omit<MachiningOperation, 'id'>
export interface ValidationResult { valid: boolean; errors: string[] }
