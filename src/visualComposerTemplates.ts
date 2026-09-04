import type { ComposerFieldType, ComposerTemplate } from './visualComposerTypes'

const field = (id: string, x: number, y: number, width: number, height: number, fieldType: ComposerFieldType = 'FIXED') => ({ id, rect: { x, y, width, height }, fieldType, openingDirection: null })
const divider = (id: string, type: 'VERTICAL_DIVIDER' | 'HORIZONTAL_DIVIDER', positionRatio: number, placement: string) => ({ id, type, positionRatio, placement })

export const VISUAL_COMPOSER_TEMPLATES: readonly ComposerTemplate[] = Object.freeze([
  { id: 'DEMO-WINDOW-FIXED', nameBg: 'Фиксиран прозорец', fields: [field('field-1', 0, 0, 1, 1)], dividers: [] },
  { id: 'DEMO-WINDOW-SINGLE', nameBg: 'Еднокрилен прозорец', fields: [field('field-1', 0, 0, 1, 1, 'OPENABLE')], dividers: [] },
  { id: 'DEMO-WINDOW-DOUBLE', nameBg: 'Двукрилен прозорец', fields: [field('field-1', 0, 0, .5, 1, 'OPENABLE'), field('field-2', .5, 0, .5, 1, 'OPENABLE')], dividers: [divider('divider-v-1', 'VERTICAL_DIVIDER', .5, '50%')] },
  { id: 'DEMO-WINDOW-TRIPLE', nameBg: 'Трикрилен прозорец', fields: [field('field-1', 0, 0, 1 / 3, 1, 'OPENABLE'), field('field-2', 1 / 3, 0, 1 / 3, 1, 'OPENABLE'), field('field-3', 2 / 3, 0, 1 / 3, 1, 'OPENABLE')], dividers: [divider('divider-v-1', 'VERTICAL_DIVIDER', 1 / 3, '33.33%'), divider('divider-v-2', 'VERTICAL_DIVIDER', 2 / 3, '66.67%')] },
  { id: 'DEMO-WINDOW-QUADRUPLE', nameBg: 'Четирикрилен прозорец', fields: [field('field-1', 0, 0, .25, 1, 'OPENABLE'), field('field-2', .25, 0, .25, 1, 'OPENABLE'), field('field-3', .5, 0, .25, 1, 'OPENABLE'), field('field-4', .75, 0, .25, 1, 'OPENABLE')], dividers: [divider('divider-v-1', 'VERTICAL_DIVIDER', .25, '25%'), divider('divider-v-2', 'VERTICAL_DIVIDER', .5, '50%'), divider('divider-v-3', 'VERTICAL_DIVIDER', .75, '75%')] },
  { id: 'DEMO-WINDOW-TOP-FIXED', nameBg: 'Прозорец с горен фикс', fields: [field('field-1', 0, 0, 1, .3), field('field-2', 0, .3, 1, .7, 'OPENABLE')], dividers: [divider('divider-h-1', 'HORIZONTAL_DIVIDER', .3, '30%')] },
  { id: 'DEMO-WINDOW-BOTTOM-FIXED', nameBg: 'Прозорец с долен фикс', fields: [field('field-1', 0, 0, 1, .7, 'OPENABLE'), field('field-2', 0, .7, 1, .3)], dividers: [divider('divider-h-1', 'HORIZONTAL_DIVIDER', .7, '70%')] },
])
export const composerTemplateById = (id: string) => VISUAL_COMPOSER_TEMPLATES.find((template) => template.id === id)
