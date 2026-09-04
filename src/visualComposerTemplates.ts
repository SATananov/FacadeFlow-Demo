import type { ComposerFieldType, ComposerTemplate } from './visualComposerTypes'
const field = (id: string, x: number, y: number, width: number, height: number, fieldType: ComposerFieldType = 'FIXED') => ({ id, rect: { x, y, width, height }, fieldType, openingDirection: null })
export const VISUAL_COMPOSER_TEMPLATES: readonly ComposerTemplate[] = Object.freeze([
  { id: 'DEMO-WINDOW-FIXED', nameBg: 'Фиксиран прозорец', fields: [field('field-1', 0, 0, 1, 1)], dividers: [] },
  { id: 'DEMO-WINDOW-SINGLE', nameBg: 'Еднокрилен прозорец', fields: [field('field-1', 0, 0, 1, 1, 'OPENABLE')], dividers: [] },
  { id: 'DEMO-WINDOW-DOUBLE', nameBg: 'Двукрилен прозорец', fields: [field('field-1', 0, 0, .5, 1, 'OPENABLE'), field('field-2', .5, 0, .5, 1, 'OPENABLE')], dividers: [{ id: 'divider-v-1', type: 'VERTICAL_DIVIDER', placement: '50%' }] },
  { id: 'DEMO-WINDOW-TRIPLE', nameBg: 'Трикрилен прозорец', fields: [field('field-1', 0, 0, 1 / 3, 1, 'OPENABLE'), field('field-2', 1 / 3, 0, 1 / 3, 1, 'OPENABLE'), field('field-3', 2 / 3, 0, 1 / 3, 1, 'OPENABLE')], dividers: [{ id: 'divider-v-1', type: 'VERTICAL_DIVIDER', placement: '33.33%' }, { id: 'divider-v-2', type: 'VERTICAL_DIVIDER', placement: '66.67%' }] },
  { id: 'DEMO-WINDOW-QUADRUPLE', nameBg: 'Четирикрилен прозорец', fields: [field('field-1', 0, 0, .25, 1, 'OPENABLE'), field('field-2', .25, 0, .25, 1, 'OPENABLE'), field('field-3', .5, 0, .25, 1, 'OPENABLE'), field('field-4', .75, 0, .25, 1, 'OPENABLE')], dividers: [{ id: 'divider-v-1', type: 'VERTICAL_DIVIDER', placement: '25%' }, { id: 'divider-v-2', type: 'VERTICAL_DIVIDER', placement: '50%' }, { id: 'divider-v-3', type: 'VERTICAL_DIVIDER', placement: '75%' }] },
  { id: 'DEMO-WINDOW-TOP-FIXED', nameBg: 'Прозорец с горен фикс', fields: [field('field-1', 0, 0, 1, .3), field('field-2', 0, .3, 1, .7, 'OPENABLE')], dividers: [{ id: 'divider-h-1', type: 'HORIZONTAL_DIVIDER', placement: '30%' }] },
  { id: 'DEMO-WINDOW-BOTTOM-FIXED', nameBg: 'Прозорец с долен фикс', fields: [field('field-1', 0, 0, 1, .7, 'OPENABLE'), field('field-2', 0, .7, 1, .3)], dividers: [{ id: 'divider-h-1', type: 'HORIZONTAL_DIVIDER', placement: '70%' }] },
])
export const composerTemplateById = (id: string) => VISUAL_COMPOSER_TEMPLATES.find((template) => template.id === id)
