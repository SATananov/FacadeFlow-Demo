export const AI_CONSTRUCTION_SEMANTICS_VERSION = 'AI05.1' as const

export type FacadeFlowConstructionSemanticRole =
  | 'FRAME'
  | 'FIELD'
  | 'FIXED_FIELD'
  | 'OPENABLE_FIELD'
  | 'SASH'
  | 'MULLION'
  | 'GLAZING'
  | 'GLAZING_BEAD'
  | 'HINGE'
  | 'HANDLE'
  | 'THRESHOLD'

export interface FacadeFlowConstructionSemanticDefinition {
  role: FacadeFlowConstructionSemanticRole
  labelBg: string
  meaningBg: string
  structuralRelations: readonly string[]
  profileRole?: 'FRAME' | 'SASH' | 'MULLION'
  productionFormulaAuthority: false
  machineReady: false
}

export const FACADEFLOW_CONSTRUCTION_SEMANTICS: Readonly<Record<FacadeFlowConstructionSemanticRole, FacadeFlowConstructionSemanticDefinition>> = Object.freeze({
  FRAME: Object.freeze({
    role: 'FRAME', labelBg: 'Каса',
    meaningBg: 'Външният конструктивен профилен контур на изделието.',
    structuralRelations: ['огражда полетата', 'може да граничи с фикс или отваряемо поле'],
    profileRole: 'FRAME', productionFormulaAuthority: false, machineReady: false,
  }),
  FIELD: Object.freeze({
    role: 'FIELD', labelBg: 'Поле',
    meaningBg: 'Логическа област вътре в касата, която може да бъде фиксирана, отваряема, плъзгаща или друг проверен тип.',
    structuralRelations: ['намира се вътре в касата', 'може да бъде разделено от делител'],
    productionFormulaAuthority: false, machineReady: false,
  }),
  FIXED_FIELD: Object.freeze({
    role: 'FIXED_FIELD', labelBg: 'Фиксирано поле',
    meaningBg: 'Поле без отваряемо крило в текущия конструктивен модел.',
    structuralRelations: ['принадлежи на изделие', 'може да граничи с каса и/или делител'],
    productionFormulaAuthority: false, machineReady: false,
  }),
  OPENABLE_FIELD: Object.freeze({
    role: 'OPENABLE_FIELD', labelBg: 'Отваряемо поле',
    meaningBg: 'Поле, в което конструктивният модел съдържа крило; точният тип и посока на отваряне са отделни атрибути.',
    structuralRelations: ['съдържа крило', 'граничи с каса и/или делител'],
    productionFormulaAuthority: false, machineReady: false,
  }),
  SASH: Object.freeze({
    role: 'SASH', labelBg: 'Крило',
    meaningBg: 'Профилният контур на подвижната част в отваряемо поле.',
    structuralRelations: ['принадлежи на отваряемо поле', 'може да носи дръжка и панти', 'взаимодейства с каса или делител'],
    profileRole: 'SASH', productionFormulaAuthority: false, machineReady: false,
  }),
  MULLION: Object.freeze({
    role: 'MULLION', labelBg: 'Делител',
    meaningBg: 'Вътрешен конструктивен профил, който разделя две съседни полета.',
    structuralRelations: ['намира се вътре в касата', 'има поле от двете страни в линейна конфигурация', 'може да граничи с фикс и/или крило'],
    profileRole: 'MULLION', productionFormulaAuthority: false, machineReady: false,
  }),
  GLAZING: Object.freeze({
    role: 'GLAZING', labelBg: 'Стъклопакет / пълнеж',
    meaningBg: 'Пълнежът на фиксирано поле или крило според конкретната конструкция.',
    structuralRelations: ['принадлежи на поле или крило според конфигурацията'],
    productionFormulaAuthority: false, machineReady: false,
  }),
  GLAZING_BEAD: Object.freeze({
    role: 'GLAZING_BEAD', labelBg: 'Стъклодържател',
    meaningBg: 'Профилен елемент за задържане на пълнежа; точният вариант зависи от системата и пълнежа.',
    structuralRelations: ['свързан е с конкретен профил и пълнеж'],
    productionFormulaAuthority: false, machineReady: false,
  }),
  HINGE: Object.freeze({
    role: 'HINGE', labelBg: 'Панта',
    meaningBg: 'Елемент от обкова на отваряемото крило.',
    structuralRelations: ['принадлежи на крило', 'позиция и брой изискват проверени правила'],
    productionFormulaAuthority: false, machineReady: false,
  }),
  HANDLE: Object.freeze({
    role: 'HANDLE', labelBg: 'Дръжка',
    meaningBg: 'Елемент от обкова, свързан с отваряемо крило или врата.',
    structuralRelations: ['принадлежи на крило/врата', 'позицията е отделен проверим атрибут'],
    productionFormulaAuthority: false, machineReady: false,
  }),
  THRESHOLD: Object.freeze({
    role: 'THRESHOLD', labelBg: 'Праг',
    meaningBg: 'Долен конструктивен елемент при приложима конфигурация на врата.',
    structuralRelations: ['прилага се само при подходящ тип изделие и проверена система'],
    productionFormulaAuthority: false, machineReady: false,
  }),
})

export function facadeFlowConstructionSemantic(role: FacadeFlowConstructionSemanticRole) {
  return FACADEFLOW_CONSTRUCTION_SEMANTICS[role]
}
