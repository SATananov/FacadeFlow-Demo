import type { FacadeFlowJobType, FacadeFlowProjectNodeKind, FacadeFlowProjectStructure, FacadeFlowProjectStructureNode } from './aiWorkspaceTypes'

export const PROJECT_NODE_LABELS: Record<FacadeFlowProjectNodeKind, string> = {
  BUILDING: 'Сграда / корпус',
  FLOOR: 'Етаж',
  FACADE: 'Фасада',
  ROOM: 'Помещение',
  ZONE: 'Зона',
  POSITION: 'Позиция / марка',
  DETAIL: 'Технически детайл',
}

const ALL_KINDS = Object.keys(PROJECT_NODE_LABELS) as FacadeFlowProjectNodeKind[]

export const RECOMMENDED_PROJECT_NODE_KINDS: Record<FacadeFlowJobType, readonly FacadeFlowProjectNodeKind[]> = {
  BUILDING: ['BUILDING', 'FLOOR', 'FACADE', 'ROOM', 'POSITION'],
  HOUSE: ['FACADE', 'ROOM', 'POSITION'],
  SMALL_PROJECT: ['ZONE', 'ROOM', 'POSITION'],
  SINGLE_PRODUCT: ['POSITION'],
  CUSTOM_ORDER: ['ZONE', 'POSITION'],
  TECHNICAL_DETAIL: ['DETAIL'],
}

export function createEmptyProjectStructure(): FacadeFlowProjectStructure {
  return { mode: 'FLEXIBLE', nodes: [], activeNodeId: null, sessionOnly: true, simulationOnly: true }
}

export function projectNodeKindsForJob(jobType: FacadeFlowJobType | null): FacadeFlowProjectNodeKind[] {
  if (!jobType) return [...ALL_KINDS]
  const preferred = RECOMMENDED_PROJECT_NODE_KINDS[jobType]
  return [...preferred, ...ALL_KINDS.filter((kind) => !preferred.includes(kind))]
}

export function addProjectStructureNode(
  structure: FacadeFlowProjectStructure,
  input: { id: string; kind: FacadeFlowProjectNodeKind; label: string; parentId?: string | null },
): FacadeFlowProjectStructure {
  const label = input.label.trim()
  if (!label || structure.nodes.some((node) => node.id === input.id)) return structure
  const parentId = input.parentId && structure.nodes.some((node) => node.id === input.parentId) ? input.parentId : null
  const siblingCount = structure.nodes.filter((node) => node.parentId === parentId).length
  const node: FacadeFlowProjectStructureNode = {
    id: input.id,
    kind: input.kind,
    label,
    parentId,
    order: siblingCount,
    source: 'MANUAL',
    evidence: [],
    status: 'DRAFT',
  }
  return { ...structure, nodes: [...structure.nodes, node], activeNodeId: node.id }
}

export function renameProjectStructureNode(structure: FacadeFlowProjectStructure, nodeId: string, label: string): FacadeFlowProjectStructure {
  const clean = label.trim()
  if (!clean) return structure
  return { ...structure, nodes: structure.nodes.map((node) => node.id === nodeId ? { ...node, label: clean } : node) }
}

export function selectProjectStructureNode(structure: FacadeFlowProjectStructure, nodeId: string | null): FacadeFlowProjectStructure {
  if (nodeId !== null && !structure.nodes.some((node) => node.id === nodeId)) return structure
  return { ...structure, activeNodeId: nodeId }
}

export function removeProjectStructureNode(structure: FacadeFlowProjectStructure, nodeId: string): FacadeFlowProjectStructure {
  const removeIds = new Set<string>([nodeId])
  let changed = true
  while (changed) {
    changed = false
    for (const node of structure.nodes) {
      if (node.parentId && removeIds.has(node.parentId) && !removeIds.has(node.id)) {
        removeIds.add(node.id)
        changed = true
      }
    }
  }
  const nodes = structure.nodes.filter((node) => !removeIds.has(node.id))
  return { ...structure, nodes, activeNodeId: structure.activeNodeId && removeIds.has(structure.activeNodeId) ? null : structure.activeNodeId }
}

export function projectStructurePathNodes(structure: FacadeFlowProjectStructure, nodeId = structure.activeNodeId): FacadeFlowProjectStructureNode[] {
  if (!nodeId) return []
  const byId = new Map(structure.nodes.map((node) => [node.id, node]))
  const path: FacadeFlowProjectStructureNode[] = []
  const visited = new Set<string>()
  let current = byId.get(nodeId)
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    path.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return path
}

export function projectStructurePathLabels(structure: FacadeFlowProjectStructure): string[] {
  return projectStructurePathNodes(structure).map((node) => node.label)
}

export function projectStructureNodeDepth(structure: FacadeFlowProjectStructure, nodeId: string): number {
  return Math.max(0, projectStructurePathNodes(structure, nodeId).length - 1)
}
