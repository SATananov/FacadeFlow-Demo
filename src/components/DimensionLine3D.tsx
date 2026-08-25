import { useEffect, useMemo } from 'react'
import { BufferGeometry, CanvasTexture, Line, LineBasicMaterial, SpriteMaterial, Vector3 } from 'three'
import { formatDimensionLabel } from '../dimensionFormatting'
import type { DimensionAnnotation } from '../dimensionTypes'
interface Props { annotation: DimensionAnnotation; width: number; height: number; color?: string }
export function DimensionLine3D({ annotation, width, height, color = '#e87329' }: Props) {
  const resources = useMemo(() => {
    const world = (point: DimensionAnnotation['startPoint']) => new Vector3(point.x - width / 2, height / 2 - point.y, point.z)
    const geometry = new BufferGeometry().setFromPoints([world(annotation.startPoint), world(annotation.endPoint)]), lineMaterial = new LineBasicMaterial({ color, depthTest: false }), line = new Line(geometry, lineMaterial)
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 80
    const context = canvas.getContext('2d')
    if (context) { context.clearRect(0, 0, 512, 80); context.fillStyle = '#ffffffdd'; context.fillRect(0, 0, 512, 80); context.fillStyle = color; context.font = 'bold 28px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(formatDimensionLabel(annotation), 256, 40) }
    const texture = new CanvasTexture(canvas), spriteMaterial = new SpriteMaterial({ map: texture, transparent: true, depthTest: false })
    return { geometry, lineMaterial, line, texture, spriteMaterial, label: world(annotation.labelPosition) }
  }, [annotation, width, height, color])
  useEffect(() => () => { resources.geometry.dispose(); resources.lineMaterial.dispose(); resources.texture.dispose(); resources.spriteMaterial.dispose() }, [resources])
  const scale = Math.max(width, height) * .3
  return <group aria-label={formatDimensionLabel(annotation)}><primitive object={resources.line}/><sprite position={[resources.label.x, resources.label.y, resources.label.z]} scale={[scale, scale * .16, 1]} material={resources.spriteMaterial}/></group>
}
