import type { Component3DNode, Component3DRole, Product3DScene } from './threeDTypes'

export const DEFAULT_CONCEPTUAL_DEPTH_MM = 70
export const CONCEPTUAL_GLASS_DEPTH_MM = 6

export function barNode(id: string, role: Component3DRole, sourcePath: string, profileCode: string | undefined, width: number, height: number, depth: number, x: number, y: number, z = 0): Component3DNode {
  return { id, role, sourcePath, profileCode, dimensions: { x: Math.max(width, .1), y: Math.max(height, .1), z: Math.max(depth, .1) }, position: { x, y, z }, rotation: { x: 0, y: 0, z: 0 }, selectable: role !== 'GLAZING' && role !== 'PANEL' }
}

export function createScene(id: string, sourceType: Product3DScene['sourceType'], reference: string, width: number, height: number, depth: number, nodes: Component3DNode[]): Product3DScene {
  return { id, sourceType, sourceReference: reference, bounds: { width, height, depth }, nodes, conceptualDepthMm: depth, conceptualOnly: true, productionGeometryApproved: false, machineReady: false }
}
