export const PROFILE_CATALOGUE_SOURCE_LIBRARY_VERSION = 'PROFILE_DATA_02.2' as const

export type ExternalCatalogueReferenceState = 'REFERENCE_ONLY'
export type ExternalCatalogueSourceKind = 'TECHNICAL_PDF' | 'PRODUCT_PAGE'
export type ExternalCatalogueDocumentLanguage = 'BG' | 'EN' | 'UK' | 'MULTI'

export interface ExternalProfileCatalogueSource {
  id: string
  brand: string
  system: string
  title: string
  documentLanguage: ExternalCatalogueDocumentLanguage
  sourceKind: ExternalCatalogueSourceKind
  sourceUrl: string
  sourceHost: string
  systemDepthMm: number
  summaryBg: string
  focusProfileCodes: readonly string[]
  referenceState: ExternalCatalogueReferenceState
  technicalDataAutoImported: false
  automaticCataloguePromotionAllowed: false
  machineReady: false
  productionApproved: false
}

/**
 * External catalogue documents are reference evidence only.
 *
 * They intentionally do not overwrite current application profile geometry,
 * human-reviewed values, compatibility rules, or production gates. Extracted
 * dimensions must be modeled and reviewed in a separate step before any use.
 */
export const EXTERNAL_PROFILE_CATALOGUE_SOURCES: readonly ExternalProfileCatalogueSource[] = Object.freeze([
  Object.freeze({
    id: 'kmg-prelude60-bg-pdf',
    brand: 'KMG',
    system: 'PRELUDE 60',
    title: 'KMG PRELUDE 60 · PVC Windows & Doors Systems 60',
    documentLanguage: 'BG',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://altestgroup.com/pdf/system/39/bg.pdf',
    sourceHost: 'altestgroup.com',
    systemDepthMm: 60,
    summaryBg: 'Официален каталожен PDF за PRELUDE 60. Използва се като референтен източник; размерите не се прехвърлят автоматично към работната геометрия.',
    focusProfileCodes: Object.freeze(['482.30', '482.05', '482.21', '482.24', '482.26', '482.27']),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'kmg-prestige70-bg-pdf',
    brand: 'KMG',
    system: 'PRESTIGE 70',
    title: 'KMG PRESTIGE · PVC Windows & Doors Systems 70',
    documentLanguage: 'BG',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://altestgroup.com/pdf/system/40/bg.pdf',
    sourceHost: 'altestgroup.com',
    systemDepthMm: 70,
    summaryBg: 'Официален KMG технически PDF за серия Prestige 70. Профилните кодове и размери са само каталожна референция до отделно моделиране и човешки преглед.',
    focusProfileCodes: Object.freeze(['549.15', '549.16', '549.17', '549.05']),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'vivaplast-6400-bg-pdf',
    brand: 'VIVA PLAST',
    system: 'System 6400',
    title: 'VIVA PLAST · System 6400',
    documentLanguage: 'BG',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://visionplast.com/wp-content/uploads/2019/07/vias_catalog.pdf',
    sourceHost: 'visionplast.com',
    systemDepthMm: 60,
    summaryBg: 'Технически каталог за система 6400. Сеченията са референция за бъдещата Section Library; няма автоматично извличане или производствено използване.',
    focusProfileCodes: Object.freeze([]),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'vivaplast-7500-bg-pdf',
    brand: 'VIVA PLAST',
    system: 'System 7500',
    title: 'VIVA PLAST · System 7500',
    documentLanguage: 'BG',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://visionplast.com/wp-content/uploads/2019/07/vias_catalog.pdf',
    sourceHost: 'visionplast.com',
    systemDepthMm: 70,
    summaryBg: 'Същият официален технически каталог съдържа и System 7500 с 70 mm профилни сечения и сглобени възли. Данните остават REFERENCE ONLY.',
    focusProfileCodes: Object.freeze([]),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'weiss-smart-wp4000-multi-pdf',
    brand: 'WEISS PROFIL',
    system: 'SMART WP4000',
    title: 'WEISS PROFIL · SMART WP4000 Technical Catalogue',
    documentLanguage: 'MULTI',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://weissprofil.bg/uploads/productcertificate/files/originals/TechnicalCatalogue_WP4000.pdf',
    sourceHost: 'weissprofil.bg',
    systemDepthMm: 60,
    summaryBg: 'Технически каталог за 4-камерната 60 mm система SMART WP4000 със сечения, профилни кодове, усилители, монтажни възли, фрезоване и формули.',
    focusProfileCodes: Object.freeze(['WP4001', 'WP4002', 'WP3003']),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'profitem-q60-multi-pdf',
    brand: 'PROFITEM',
    system: 'Q60',
    title: 'PROFITEM · Q60 / Q72 PVC Technical Catalogue · Q60',
    documentLanguage: 'MULTI',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://profitem.bg/wp-content/uploads/2017/05/Q72_Q60TC_PVC.pdf',
    sourceHost: 'profitem.bg',
    systemDepthMm: 60,
    summaryBg: 'Q60 е представена в общия технически каталог Q60/Q72. Документът се пази като референция за профили, размери, монтажни схеми и бъдещи сечения.',
    focusProfileCodes: Object.freeze([]),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'profitem-q72-multi-pdf',
    brand: 'PROFITEM',
    system: 'Q72',
    title: 'PROFITEM · Q60 / Q72 PVC Technical Catalogue · Q72',
    documentLanguage: 'MULTI',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://profitem.bg/wp-content/uploads/2017/05/Q72_Q60TC_PVC.pdf',
    sourceHost: 'profitem.bg',
    systemDepthMm: 72,
    summaryBg: 'Q72 е отделен системен запис към общия технически каталог Q60/Q72. Няма автоматично създаване на профили или прехвърляне на размери.',
    focusProfileCodes: Object.freeze([]),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'framex-58-uk-pdf',
    brand: 'FRAMEX',
    system: 'Framex 58',
    title: 'Framex 58 · Technical Catalogue',
    documentLanguage: 'UK',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://framex.ua/wp-content/uploads/2023/03/framex-58-catalog.pdf',
    sourceHost: 'framex.ua',
    systemDepthMm: 58,
    summaryBg: 'Технически каталог на 4-камерна система Framex 58 с основни и допълнителни профили, усилители, възли, обработка и статични изчисления.',
    focusProfileCodes: Object.freeze(['801311', '802511', '803510']),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'framex-71-uk-pdf',
    brand: 'FRAMEX',
    system: 'Framex 71',
    title: 'Framex 71 · Technical Catalogue',
    documentLanguage: 'UK',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://framex.ua/wp-content/uploads/2023/05/framex-71-catalog.pdf',
    sourceHost: 'framex.ua',
    systemDepthMm: 71,
    summaryBg: 'Технически каталог на 6-камерна система Framex 71 с профили, компоненти, комбинации, входни врати, обработка и статични изчисления.',
    focusProfileCodes: Object.freeze([]),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'framex-80-uk-pdf',
    brand: 'FRAMEX',
    system: 'Framex 80',
    title: 'Framex 80 · Technical Catalogue',
    documentLanguage: 'UK',
    sourceKind: 'TECHNICAL_PDF',
    sourceUrl: 'https://framex.ua/wp-content/uploads/2023/02/framex-80-catalog.pdf',
    sourceHost: 'framex.ua',
    systemDepthMm: 80,
    summaryBg: 'Технически каталог на 7-камерна система Framex 80 с MD/AD профили, възли, прагове, усилители, обработка и детайлни технически решения.',
    focusProfileCodes: Object.freeze(['871010', '872010', '873010']),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'rehau-euro-design-70-bg-page',
    brand: 'REHAU',
    system: 'Euro-Design 70',
    title: 'REHAU · Euro-Design 70',
    documentLanguage: 'BG',
    sourceKind: 'PRODUCT_PAGE',
    sourceUrl: 'https://window.rehau.com/bg-bg/euro-design-70-prozorci',
    sourceHost: 'window.rehau.com',
    systemDepthMm: 70,
    summaryBg: 'Официална продуктова референция за Euro-Design 70: 70 mm монтажна дълбочина, 5 камери и публични технически характеристики. Не е профилен code-level import.',
    focusProfileCodes: Object.freeze([]),
    referenceState: 'REFERENCE_ONLY',
    technicalDataAutoImported: false,
    automaticCataloguePromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  }),
])

export interface ExternalProfileCatalogueBrandGroup {
  brand: string
  sources: readonly ExternalProfileCatalogueSource[]
}

const catalogueSourceGroups = new Map<string, ExternalProfileCatalogueSource[]>()
for (const source of EXTERNAL_PROFILE_CATALOGUE_SOURCES) {
  const existing = catalogueSourceGroups.get(source.brand)
  if (existing) existing.push(source)
  else catalogueSourceGroups.set(source.brand, [source])
}

/** Stable manufacturer groups for a compact, scalable catalogue-library UI. */
export const EXTERNAL_PROFILE_CATALOGUE_SOURCE_GROUPS: readonly ExternalProfileCatalogueBrandGroup[] = Object.freeze(
  Array.from(catalogueSourceGroups, ([brand, sources]) => Object.freeze({
    brand,
    sources: Object.freeze([...sources]),
  })),
)

export const PROFILE_CATALOGUE_SOURCE_LIBRARY_SAFETY = Object.freeze({
  externalDocumentsMayOverwriteHumanReviewedGeometry: false,
  externalDocumentsMayAutoCreateSelectableProfiles: false,
  externalDocumentsMayUnlockRules: false,
  externalDocumentsMayUnlockProduction: false,
  machineReady: false,
  productionApproved: false,
})
