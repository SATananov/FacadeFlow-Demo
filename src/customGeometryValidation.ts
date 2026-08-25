import { PROVISIONAL_MIN_FIELD_MM, projectGeometry } from './customGeometryTree'
import type { CustomProduct } from './customGeometryTypes'
import type { CatalogueProfile } from './profileCatalogueTypes'

export interface CustomValidation { valid: boolean; errors: string[]; fieldErrors: Record<string, string[]> }

export function validateCustomProduct(product: CustomProduct, profiles: CatalogueProfile[]): CustomValidation {
  const errors: string[] = [], fieldErrors: Record<string, string[]> = {}
  if (!Number.isFinite(product.width) || product.width <= 0) errors.push('Общата ширина трябва да е положително крайно число.')
  if (!Number.isFinite(product.height) || product.height <= 0) errors.push('Общата височина трябва да е положително крайно число.')
  if (!product.frameCreated) errors.push('Създайте външната каса след валидиране на общите размери.')
  const available = (id: string, role: string) => profiles.some((item) => item.id === id && item.role === role && item.status !== 'ARCHIVED')
  if (!available(product.frameProfileId, 'FRAME')) errors.push('Изберете активен профил за каса.')
  const projected = product.width > 0 && product.height > 0 ? projectGeometry(product.geometry, { x: 0, y: 0, width: product.width, height: product.height }) : []
  const hasDivider = projected.some(({ node }) => node.kind === 'SPLIT')
  if (hasDivider && (!product.mullionProfileId || !available(product.mullionProfileId, 'MULLION'))) errors.push('При делители е необходим активен профил за делител.')
  for (const { node, rect } of projected) {
    const own: string[] = []
    if (rect.width < PROVISIONAL_MIN_FIELD_MM || rect.height < PROVISIONAL_MIN_FIELD_MM) own.push(`Полето е под временния демонстрационен минимум ${PROVISIONAL_MIN_FIELD_MM} mm.`)
    if (node.kind === 'SPLIT' && (!Number.isFinite(node.position) || node.position <= 0 || (node.orientation === 'VERTICAL' ? node.position >= rect.width : node.position >= rect.height))) own.push('Позицията на делителя трябва да остава вътре в полето.')
    if (node.kind === 'LEAF' && node.fieldType === 'PLACEHOLDER') own.push('Типът на полето не е потвърден.')
    if (node.kind === 'LEAF' && node.fieldType !== 'OPENING_SASH' && (node.sashProfileId || node.openingDirection)) own.push('Фиксирано поле не може да съдържа крило или посока на отваряне.')
    if (node.kind === 'LEAF' && node.fieldType === 'OPENING_SASH') {
      if (!node.sashProfileId || !available(node.sashProfileId, 'SASH')) own.push('Отваряемото поле изисква активен профил за крило.')
      if (!node.openingDirection) own.push('Изберете експертно потвърдена посока LEFT/RIGHT.')
    }
    if (own.length) { fieldErrors[node.id] = own; errors.push(...own.map((error) => `${node.id}: ${error}`)) }
  }
  return { valid: errors.length === 0, errors, fieldErrors }
}
