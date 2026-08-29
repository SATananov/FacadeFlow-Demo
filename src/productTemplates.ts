import type { OpeningDirection, ProductCategory, ProductTemplate, TemplateCategory, TemplateDivider, TemplateField, TemplateSlidingSymbol } from './productTypes'

const fixed = (id: string, componentKey: string, x: number, width: number, y = 0, height = 1): TemplateField => ({ id, componentKey, x, y, width, height, state: 'fixed', openingNotation: 'FIXED' })
const opening = (id: string, componentKey: string, x: number, width: number, notation: 'SIDE_TRIANGLE_LEFT' | 'SIDE_TRIANGLE_RIGHT', y = 0, height = 1, symbolHeight = height, openingDirection: OpeningDirection = notation === 'SIDE_TRIANGLE_LEFT' ? 'left' : 'right', directionConfirmed = false): TemplateField => ({ id, componentKey, x, y, width, height, state: 'opening', openingNotation: notation, openingDirection, directionConfirmed, confirmedOpeningNotation: directionConfirmed ? openingDirection === 'right' ? 'RIGHT_OPENING' : 'LEFT_OPENING' : undefined, symbolBounds: { x, y, width, height: symbolHeight } })
const slidingPanel = (id: string, componentKey: string, x: number, width: number): TemplateField => ({ id, componentKey, x, y: 0, width, height: 1, state: 'sliding', openingNotation: 'FIXED' })
const verticals = (count: number): TemplateDivider[] => Array.from({ length: count - 1 }, (_, index) => { const position = (index + 1) / count; return { id: `MULLION-V-${String(index + 1).padStart(2, '0')}`, orientation: 'vertical', x1: position, y1: 0, x2: position, y2: 1 } })
const lowerDivider = (id: string, x1 = 0, x2 = 1): TemplateDivider => ({ id, orientation: 'horizontal', x1, y1: .72, x2, y2: .72 })
const dimensions: Record<TemplateCategory, [number, number]> = { WINDOWS: [1400, 1200], BALCONY_DOORS: [900, 2100], SLIDING: [2400, 2100], SINGLE_DOORS: [900, 2100], DOUBLE_DOORS: [1600, 2100] }
type ReferenceTemplateId = `REF-${'01'|'02'|'03'|'04'|'05'|'06'|'07'|'08'|'09'|'10'|'11'|'12'|'13'|'14'|'15'|'16'|'17'}`
export const PRODUCT_CATEGORY_BY_TEMPLATE: Readonly<Record<ReferenceTemplateId, ProductCategory>> = Object.freeze({
  'REF-01':'WINDOW','REF-02':'WINDOW','REF-03':'WINDOW','REF-04':'WINDOW','REF-05':'WINDOW','REF-06':'WINDOW','REF-07':'WINDOW','REF-08':'WINDOW','REF-09':'WINDOW',
  'REF-10':'DOOR','REF-11':'DOOR','REF-12':'COMBINED','REF-13':'COMBINED','REF-14':'DOOR','REF-15':'DOOR','REF-16':'DOOR','REF-17':'DOOR',
})
const make = (id: ReferenceTemplateId, displayNumber: string, name: string, description: string, libraryCategory: TemplateCategory, category: ProductTemplate['category'], fields: TemplateField[], dividers: TemplateDivider[], slidingSymbols: TemplateSlidingSymbol[] = []): ProductTemplate => ({ id, displayNumber, name, description, libraryCategory, productCategory: PRODUCT_CATEGORY_BY_TEMPLATE[id], category, fields, dividers, slidingSymbols, recommendedWidth: dimensions[libraryCategory][0], recommendedHeight: dimensions[libraryCategory][1], referenceDerived: true, simulationOnly: true })

export const productTemplates: ProductTemplate[] = [
  make('REF-01', '01', 'Фиксиран прозорец', 'Едно фиксирано поле.', 'WINDOWS', 'fixed', [fixed('FIELD-01', 'FIXED', 0, 1)], []),
  make('REF-02', '02', 'Еднокрил прозорец — дясно отваряне', 'Еднокрило прозоречно крило с експертно потвърдено дясно отваряне.', 'WINDOWS', 'single', [opening('FIELD-01', 'SINGLE', 0, 1, 'SIDE_TRIANGLE_LEFT', 0, 1, 1, 'right', true)], []),
  make('REF-03', '03', 'Еднокрил прозорец — ляво отваряне', 'Ляво отваряемо крило с експертно потвърдено ляво отваряне и дясно фиксирано поле.', 'WINDOWS', 'mixed', [opening('FIELD-LEFT', 'LEFT', 0, .5, 'SIDE_TRIANGLE_LEFT', 0, 1, 1, 'left', true), fixed('FIELD-RIGHT', 'FIXED-RIGHT', .5, .5)], verticals(2)),
  make('REF-04', '04', 'Двукрил прозорец', 'Две полета с огледални символи към центъра.', 'WINDOWS', 'double', [opening('FIELD-LEFT', 'LEFT', 0, .5, 'SIDE_TRIANGLE_RIGHT'), opening('FIELD-RIGHT', 'RIGHT', .5, .5, 'SIDE_TRIANGLE_LEFT')], [{ ...verticals(2)[0]!, id: 'MULLION-CENTER-01' }]),
  make('REF-05', '05', 'Фиксирано + отваряемо + фиксирано', 'Три полета с отваряем център.', 'WINDOWS', 'triple', [fixed('FIELD-LEFT', 'FIXED-LEFT', 0, 1/3), opening('FIELD-CENTER', 'CENTER', 1/3, 1/3, 'SIDE_TRIANGLE_LEFT'), fixed('FIELD-RIGHT', 'FIXED-RIGHT', 2/3, 1/3)], verticals(3)),
  make('REF-06', '06', 'Отваряемо + фиксирано + отваряемо', 'Отваряеми крайни и фиксирано средно поле.', 'WINDOWS', 'triple', [opening('FIELD-LEFT', 'LEFT', 0, 1/3, 'SIDE_TRIANGLE_LEFT'), fixed('FIELD-CENTER', 'FIXED-CENTER', 1/3, 1/3), opening('FIELD-RIGHT', 'RIGHT', 2/3, 1/3, 'SIDE_TRIANGLE_RIGHT')], verticals(3)),
  make('REF-07', '07', 'Три отваряеми крила', 'Три отваряеми полета: дясно, ляво и ляво отваряне.', 'WINDOWS', 'triple', [opening('FIELD-LEFT', 'LEFT', 0, 1/3, 'SIDE_TRIANGLE_LEFT', 0, 1, 1, 'right', true), opening('FIELD-CENTER', 'CENTER', 1/3, 1/3, 'SIDE_TRIANGLE_RIGHT', 0, 1, 1, 'left', true), opening('FIELD-RIGHT', 'RIGHT', 2/3, 1/3, 'SIDE_TRIANGLE_RIGHT', 0, 1, 1, 'left', true)], verticals(3)),
  make('REF-08', '08', 'Фиксирано + две отваряеми + фиксирано', 'Четири полета с две отваряеми средни.', 'WINDOWS', 'four-field', [fixed('FIELD-01', 'FIXED-01', 0, .25), opening('FIELD-02', 'CENTER-LEFT', .25, .25, 'SIDE_TRIANGLE_RIGHT'), opening('FIELD-03', 'CENTER-RIGHT', .5, .25, 'SIDE_TRIANGLE_LEFT'), fixed('FIELD-04', 'FIXED-04', .75, .25)], verticals(4)),
  make('REF-09', '09', 'Четири отваряеми крила', 'Две изрично зададени двойки с върхове към центъра.', 'WINDOWS', 'four-field', [opening('FIELD-01', '01', 0, .25, 'SIDE_TRIANGLE_RIGHT'), opening('FIELD-02', '02', .25, .25, 'SIDE_TRIANGLE_LEFT'), opening('FIELD-03', '03', .5, .25, 'SIDE_TRIANGLE_RIGHT'), opening('FIELD-04', '04', .75, .25, 'SIDE_TRIANGLE_LEFT')], verticals(4)),
  make('REF-10', '10', 'Балконска врата', 'Едно високо отваряемо поле.', 'BALCONY_DOORS', 'single', [opening('FIELD-01', '01', 0, 1, 'SIDE_TRIANGLE_LEFT')], []),
  make('REF-11', '11', 'Балконска врата с долен делител', 'Едно листо с долен визуален панел и символ по цялата височина.', 'BALCONY_DOORS', 'single', [opening('FIELD-01', '01', 0, 1, 'SIDE_TRIANGLE_LEFT')], [lowerDivider('MULLION-H-LOWER-01')]),
  make('REF-12', '12', 'Четирисекционна плъзгаща конструкция', 'Четири панела и три двупосочни символа при срещите.', 'SLIDING', 'four-field', [slidingPanel('FIELD-01', '01', 0, .25), slidingPanel('FIELD-02', '02', .25, .25), slidingPanel('FIELD-03', '03', .5, .25), slidingPanel('FIELD-04', '04', .75, .25)], verticals(4), [{ id: 'SLIDE-JUNCTION-01', x: .25, y: .5, notation: 'JUNCTION_BIDIRECTIONAL' }, { id: 'SLIDE-JUNCTION-02', x: .5, y: .5, notation: 'JUNCTION_BIDIRECTIONAL' }, { id: 'SLIDE-JUNCTION-03', x: .75, y: .5, notation: 'JUNCTION_BIDIRECTIONAL' }]),
  make('REF-13', '13', 'Двусекционна плъзгаща конструкция', 'Два плъзгащи панела с противоположни стрелки при централната среща.', 'SLIDING', 'double', [slidingPanel('FIELD-LEFT', 'LEFT', 0, .5), slidingPanel('FIELD-RIGHT', 'RIGHT', .5, .5)], verticals(2), [{ id: 'SLIDE-JUNCTION-CENTER-01', x: .5, y: .5, notation: 'JUNCTION_OPPOSED_STACKED' }]),
  make('REF-14', '14', 'Еднокрила входна/вътрешна врата', 'Едно високо демонстрационно листо.', 'SINGLE_DOORS', 'single', [opening('FIELD-01', '01', 0, 1, 'SIDE_TRIANGLE_LEFT')], []),
  make('REF-15', '15', 'Еднокрила врата с долен делител', 'Едно листо с долен визуален панел и символ по цялата височина.', 'SINGLE_DOORS', 'single', [opening('FIELD-01', '01', 0, 1, 'SIDE_TRIANGLE_LEFT')], [lowerDivider('MULLION-H-LOWER-01')]),
  make('REF-16', '16', 'Двукрила входна/вътрешна врата', 'Две високи листа със символи към центъра.', 'DOUBLE_DOORS', 'double', [opening('FIELD-LEFT', 'LEFT', 0, .5, 'SIDE_TRIANGLE_RIGHT'), opening('FIELD-RIGHT', 'RIGHT', .5, .5, 'SIDE_TRIANGLE_LEFT')], verticals(2)),
  make('REF-17', '17', 'Двукрила врата с долни делители', 'Две листа с пълновисочинни символи към центъра и долни панели.', 'DOUBLE_DOORS', 'double', [opening('FIELD-LEFT', 'LEFT', 0, .5, 'SIDE_TRIANGLE_RIGHT'), opening('FIELD-RIGHT', 'RIGHT', .5, .5, 'SIDE_TRIANGLE_LEFT')], [...verticals(2), lowerDivider('MULLION-H-LEFT-01', 0, .5), lowerDivider('MULLION-H-RIGHT-01', .5, 1)]),
]

export const templateCategoryLabels: Record<TemplateCategory, string> = { WINDOWS: 'Прозорци', BALCONY_DOORS: 'Балконски врати', SLIDING: 'Плъзгащи конструкции', SINGLE_DOORS: 'Еднокрили входни/вътрешни врати', DOUBLE_DOORS: 'Двукрили входни/вътрешни врати' }

export function getProductTemplate(templateId: string): ProductTemplate {
  return productTemplates.find((template) => template.id === templateId) ?? productTemplates[0]!
}

export function getJunctionPanelFraction(template: ProductTemplate, junctionX: number): number {
  const adjacentWidths = template.fields.filter((field) => Math.abs(field.x + field.width - junctionX) < .0001 || Math.abs(field.x - junctionX) < .0001).map((field) => field.width)
  return adjacentWidths.length > 0 ? Math.min(...adjacentWidths) : 1
}
