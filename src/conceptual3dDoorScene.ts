import type { DoorComposition } from './doorComposerTypes'
import { DEMO_DEPTHS, material, node, previewColor, scaleNodesToProductAspect, scene, shadeConceptualColor } from './conceptual3dScene'
import { calculateDoorHingeAnchor } from './doorComposerLayout'

export const DOOR_HINGE_3D = { width: .014, height: .036, depth: .012, clearance: .001 } as const

export function buildDoorConceptualScene(state: DoorComposition, productWidth = 1, productHeight = 1) {
  const front = previewColor(state.exteriorColor), back = previewColor(state.interiorColor), frame = material(front, back), glass = material('#b9e1e7', '#ccecf0', .55, '#3b7780'), panel = material(shadeConceptualColor(front,1.08), shadeConceptualColor(back,1.08)), nodes = [
    node('door-frame-top', 'door-frame', 'FRAME', { x: -.5, y: .45, z: -.055, width: 1, height: .05, depth: DEMO_DEPTHS.frameDepth }, frame, 'Горна каса'),
    node('door-frame-left', 'door-frame', 'FRAME', { x: -.5, y: -.5, z: -.055, width: .05, height: .95, depth: DEMO_DEPTHS.frameDepth }, frame, 'Лява каса'),
    node('door-frame-right', 'door-frame', 'FRAME', { x: .45, y: -.5, z: -.055, width: .05, height: .95, depth: DEMO_DEPTHS.frameDepth }, frame, 'Дясна каса'),
  ]
  for (const field of state.fields) { const x = -.45 + field.rect.x * .9, y = .45 - (field.rect.y + field.rect.height) * .95, width = field.rect.width * .9, height = field.rect.height * .95, open = field.hingeSide && field.swing ? `${field.hingeSide === 'LEFT' ? 'Ляво' : 'Дясно'}, ${field.swing === 'INWARD' ? 'навътре' : 'навън'}` : undefined
    if (field.role === 'DOOR_LEAF') nodes.push(node(`door-sash-${field.id}`, field.id, 'SASH', { x, y, z: -.035, width, height, depth: DEMO_DEPTHS.sashDepth }, frame, `Крило ${open ?? 'без отваряне'}`, true, open))
    const contentX = x + .025, contentY = y + .025, contentW = Math.max(.01, width - .05), contentH = Math.max(.01, height - .05)
    if (field.role === 'FIXED_GLAZING' || field.infill === 'GLAZED') nodes.push(node(`door-glass-${field.id}`, field.id, 'GLASS', { x: contentX, y: contentY, z: DEMO_DEPTHS.glassOffset, width: contentW, height: contentH, depth: .008 }, glass, 'Остъкляване', true))
    else if (field.infill === 'SOLID') nodes.push(node(`door-panel-${field.id}`, field.id, 'SOLID_PANEL', { x: contentX, y: contentY, z: DEMO_DEPTHS.panelOffset, width: contentW, height: contentH, depth: .02 }, panel, 'Плътен панел', true))
    else { const panelHeight = contentH * (1 - field.splitRatio); nodes.push(node(`door-glass-${field.id}`, field.id, 'GLASS', { x: contentX, y: contentY + panelHeight, z: DEMO_DEPTHS.glassOffset, width: contentW, height: contentH - panelHeight, depth: .008 }, glass, 'Горно стъкло', true)); nodes.push(node(`door-panel-${field.id}`, field.id, 'SOLID_PANEL', { x: contentX, y: contentY, z: DEMO_DEPTHS.panelOffset, width: contentW, height: panelHeight, depth: .02 }, panel, 'Долен панел', true)) }
  }
  for (const item of state.hardware) { const field = state.fields.find((value) => value.id === item.parentFieldId); if (!field) continue; const x0 = -.45 + field.rect.x * .9, y0 = .45 - (field.rect.y + field.rect.height) * .95, width = field.rect.width * .9, height = field.rect.height * .95, hinge = calculateDoorHingeAnchor({ x:x0,y:y0,width,height },item.side,item.positionRatio,DOOR_HINGE_3D.width,DOOR_HINGE_3D.height,'UP'), x = item.kind === 'HINGE' ? hinge.bounds.x : item.side === 'LEFT' ? x0 : x0 + width - .018, y = item.kind === 'HINGE' ? hinge.bounds.y : y0 + (1 - item.positionRatio) * height - .018, z = item.kind === 'HINGE' ? -.035 + DEMO_DEPTHS.sashDepth + DOOR_HINGE_3D.clearance : DEMO_DEPTHS.hardwareOffset; nodes.push(node(`door-${item.kind.toLowerCase()}-${item.id}`, item.id, item.kind === 'HANDLE' ? 'HANDLE_MARKER' : 'HINGE_MARKER', { x, y, z, width:item.kind==='HINGE'?DOOR_HINGE_3D.width:.018, height:item.kind==='HINGE'?DOOR_HINGE_3D.height:.036, depth:item.kind==='HINGE'?DOOR_HINGE_3D.depth:.018 }, material('#26383c', '#26383c'), item.kind === 'HANDLE' ? 'Демонстрационна дръжка' : 'Демонстрационна панта', true)) }
  nodes.push(node('door-threshold-warning', 'door-threshold', 'THRESHOLD_WARNING', { x: -.45, y: -.5, z: .02, width: .9, height: .008, depth: .01 }, material('#c76b22', '#c76b22'), 'Праг: НЕРАЗРЕШЕН'))
  const scaled=scaleNodesToProductAspect(nodes,productWidth,productHeight); return scene('DOOR', scaled.nodes, true, scaled.bounds, productWidth, productHeight)
}
