import { useEffect, useMemo } from 'react'
import { BufferGeometry, CanvasTexture, Line, LineBasicMaterial, SpriteMaterial, SRGBColorSpace, Vector3 } from 'three'
import { DIMENSION_3D_STYLE, dimensionExternalLabelPoint, dimensionLabelWorldScale, dimensionTextureRatio, dimensionWorldPoint } from '../dimensionAnnotation3D'
import { formatDimensionLabel, formatDimensionValue } from '../dimensionFormatting'
import type { DimensionAnnotation } from '../dimensionTypes'
interface Props { annotation: DimensionAnnotation; width: number; height: number; color?: string }
export function DimensionLine3D({ annotation, width, height, color = DIMENSION_3D_STYLE.line }: Props) {
  const resources = useMemo(() => {
    const world = (point: DimensionAnnotation['startPoint']) => { const value = dimensionWorldPoint(point, width, height); return new Vector3(value.x, value.y, value.z) }
    const geometry = new BufferGeometry().setFromPoints([world(annotation.startPoint), world(annotation.endPoint)]), lineMaterial = new LineBasicMaterial({ color, transparent: true, opacity: .96, depthTest: false, depthWrite: false }), line = new Line(geometry, lineMaterial)
    line.renderOrder = DIMENSION_3D_STYLE.renderOrder
    const label = formatDimensionValue(annotation.value), ratio = dimensionTextureRatio(typeof window === 'undefined' ? 1 : window.devicePixelRatio)
    const canvas = document.createElement('canvas'), measurement = document.createElement('canvas').getContext('2d')
    if (measurement) measurement.font = DIMENSION_3D_STYLE.font
    const logicalWidth = Math.ceil((measurement?.measureText(label).width ?? label.length * 10) + DIMENSION_3D_STYLE.horizontalPadding * 2), logicalHeight = 18 + DIMENSION_3D_STYLE.verticalPadding * 2
    canvas.width = Math.ceil(logicalWidth * ratio); canvas.height = Math.ceil(logicalHeight * ratio)
    const context = canvas.getContext('2d')
    if (context) { context.scale(ratio, ratio); context.clearRect(0, 0, logicalWidth, logicalHeight); context.fillStyle = DIMENSION_3D_STYLE.background; context.fillRect(0, 0, logicalWidth, logicalHeight); context.strokeStyle = DIMENSION_3D_STYLE.border; context.lineWidth = DIMENSION_3D_STYLE.borderWidth; context.strokeRect(1, 1, logicalWidth - 2, logicalHeight - 2); context.fillStyle = DIMENSION_3D_STYLE.text; context.font = DIMENSION_3D_STYLE.font; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(label, logicalWidth / 2, logicalHeight / 2) }
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.needsUpdate = true
    const spriteMaterial = new SpriteMaterial({ map: texture, color: '#ffffff', transparent: true, opacity: 1, alphaTest: .02, depthTest: false, depthWrite: false, sizeAttenuation: false }), spriteScale = dimensionLabelWorldScale(width, height, logicalWidth / logicalHeight)
    const externalLabel = dimensionExternalLabelPoint(annotation, width, height)
    return { geometry, lineMaterial, line, texture, spriteMaterial, label: new Vector3(externalLabel.x, externalLabel.y, externalLabel.z), spriteScale }
  }, [annotation, width, height, color])
  useEffect(() => () => { resources.geometry.dispose(); resources.lineMaterial.dispose(); resources.texture.dispose(); resources.spriteMaterial.dispose() }, [resources])
  return <group aria-label={formatDimensionLabel(annotation)}><primitive object={resources.line}/><sprite renderOrder={DIMENSION_3D_STYLE.renderOrder + 1} position={[resources.label.x, resources.label.y, resources.label.z]} scale={[resources.spriteScale.width, resources.spriteScale.height, 1]} material={resources.spriteMaterial}/></group>
}
