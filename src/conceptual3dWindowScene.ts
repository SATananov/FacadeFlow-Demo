import type { VisualComposition } from './visualComposerTypes'
import { DEMO_DEPTHS, material, node, previewColor, scaleNodesToProductAspect, scene } from './conceptual3dScene'

const opening = (value: VisualComposition['fields'][number]['openingDirection']) => ({ LEFT: 'Ляво', RIGHT: 'Дясно', TILT: 'Падащо', TILT_LEFT: 'Комбинирано ляво', TILT_RIGHT: 'Комбинирано дясно' } as Record<string, string>)[value ?? '']
export function buildWindowConceptualScene(state: VisualComposition, productWidth = 1, productHeight = 1) {
  const front = previewColor(state.exteriorColor), back = previewColor(state.interiorColor), frame = material(front, back), glass = material('#b9e1e7', '#ccecf0', .55, '#3b7780'), nodes = [
    node('window-frame-top', 'window-frame', 'FRAME', { x: -.5, y: .44, z: -.055, width: 1, height: .06, depth: DEMO_DEPTHS.frameDepth }, frame, 'Горна каса'),
    node('window-frame-bottom', 'window-frame', 'FRAME', { x: -.5, y: -.5, z: -.055, width: 1, height: .06, depth: DEMO_DEPTHS.frameDepth }, frame, 'Долна каса'),
    node('window-frame-left', 'window-frame', 'FRAME', { x: -.5, y: -.44, z: -.055, width: .06, height: .88, depth: DEMO_DEPTHS.frameDepth }, frame, 'Лява каса'),
    node('window-frame-right', 'window-frame', 'FRAME', { x: .44, y: -.44, z: -.055, width: .06, height: .88, depth: DEMO_DEPTHS.frameDepth }, frame, 'Дясна каса'),
  ]
  for (const field of state.fields) { const x = -.44 + field.rect.x * .88, y = .44 - (field.rect.y + field.rect.height) * .88, width = field.rect.width * .88, height = field.rect.height * .88, label = opening(field.openingDirection)
    if (field.fieldType === 'OPENABLE') nodes.push(node(`sash-${field.id}`, field.id, 'SASH', { x, y, z: -.035, width, height, depth: DEMO_DEPTHS.sashDepth }, frame, `Крило ${label ?? 'без посока'}`, true, label))
    nodes.push(node(`glass-${field.id}`, field.id, 'GLASS', { x: x + .025, y: y + .025, z: DEMO_DEPTHS.glassOffset, width: Math.max(.01, width - .05), height: Math.max(.01, height - .05), depth: .008 }, glass, field.fieldType === 'FIXED' ? 'Фиксирано стъкло' : 'Стъкло в крило', true))
  }
  for (const item of state.components) { if (item.role === 'DIVIDER') { const ratio=Math.max(0,Math.min(1,Number.parseFloat(item.placement)/100||.5)),vertical=item.type==='VERTICAL_DIVIDER'; nodes.push(node(`mullion-${item.id}`, item.id, 'MULLION', vertical?{ x: -.465+ratio*.93, y: -.44, z: -.045, width: .05, height: .88, depth: .09 }:{ x: -.44, y: .415-ratio*.88, z: -.045, width: .88, height: .05, depth: .09 }, frame, 'Концептуален делител', true)) } else { const field = state.fields.find((value) => value.id === item.parentFieldId); if (!field) continue; const x0 = -.44 + field.rect.x * .88, y0 = .44 - (field.rect.y + field.rect.height) * .88, x = item.side === 'LEFT' ? x0 : x0 + field.rect.width * .88 - .018, y = y0 + (1 - (item.positionRatio ?? .5)) * field.rect.height * .88; nodes.push(node(`${item.type.toLowerCase()}-${item.id}`, item.id, item.type === 'HANDLE' ? 'HANDLE_MARKER' : 'HINGE_MARKER', { x, y: y - .018, z: DEMO_DEPTHS.hardwareOffset, width: .018, height: .036, depth: .018 }, material('#26383c', '#26383c'), item.type === 'HANDLE' ? 'Демонстрационна дръжка' : 'Демонстрационна панта', true)) } }
  const scaled=scaleNodesToProductAspect(nodes,productWidth,productHeight); return scene('WINDOW', scaled.nodes, false, scaled.bounds, productWidth, productHeight)
}
