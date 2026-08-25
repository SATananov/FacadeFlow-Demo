import type { ProductParameters } from './productTypes'
import { templateProductTo3DScene } from './templateProduct3DAdapter'
import type { Product3DScene } from './threeDTypes'

export interface VerifiedStructuredProduct3DSource { status: 'VERIFIED'; product: ProductParameters; profileCode: string }
export function verifiedImportTo3DScene(source: VerifiedStructuredProduct3DSource, conceptualDepthMm: number): Product3DScene {
  return templateProductTo3DScene(source.product, source.profileCode, conceptualDepthMm, true)
}
