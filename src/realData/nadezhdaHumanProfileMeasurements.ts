export const NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_VERSION = 'PROFILE_DATA_02.2.1' as const

export type NadezhdaHumanMeasurementReviewState = 'HUMAN_CONFIRMED'

export interface NadezhdaHumanProfileMeasurement {
  id: string
  sourceOrganisation: 'Надежда'
  sourcePerson: 'Бат Трифон'
  system: 'PRELUDE 60'
  code: string
  roleLabelBg: 'Каса' | 'Крило' | 'Делител'
  value1Mm: number
  value2Mm: number
  fullDimensionMm: number
  visibleWidthMm: number
  deductionZoneMm: 22
  deductionZoneCount: 1 | 2
  deductionMeaningBg: string
  measurementFormulaBg: string
  reviewState: NadezhdaHumanMeasurementReviewState
  noteBg: string
  appliesToCatalogueTruthAutomatically: false
  appliesToProductionAutomatically: false
  machineReady: false
  productionApproved: false
}

/**
 * Human-confirmed working geometry from the Nadezhda context.
 *
 * Bat Trifon confirmed the measurement interpretation: the visible width is
 * the full profile dimension minus a 22 mm side zone; the mullion has that
 * zone on both sides. These records remain a separate Nadezhda knowledge
 * source and do not overwrite catalogue truth or production geometry.
 */
export const NADEZHDA_HUMAN_PROFILE_MEASUREMENTS: readonly NadezhdaHumanProfileMeasurement[] = Object.freeze([
  Object.freeze({
    id: 'nadezhda-trifon-prelude60-48230',
    sourceOrganisation: 'Надежда',
    sourcePerson: 'Бат Трифон',
    system: 'PRELUDE 60',
    code: '482.30',
    roleLabelBg: 'Каса',
    value1Mm: 64,
    value2Mm: 42,
    fullDimensionMm: 64,
    visibleWidthMm: 42,
    deductionZoneMm: 22,
    deductionZoneCount: 1,
    deductionMeaningBg: 'Странична зона',
    measurementFormulaBg: '64 − 22 = 42 mm',
    reviewState: 'HUMAN_CONFIRMED',
    noteBg: 'Пълен размер 64 mm. След една потвърдена зона 22 mm остава видима ширина 42 mm.',
    appliesToCatalogueTruthAutomatically: false,
    appliesToProductionAutomatically: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'nadezhda-trifon-prelude60-48221',
    sourceOrganisation: 'Надежда',
    sourcePerson: 'Бат Трифон',
    system: 'PRELUDE 60',
    code: '482.21',
    roleLabelBg: 'Делител',
    value1Mm: 84,
    value2Mm: 40,
    fullDimensionMm: 84,
    visibleWidthMm: 40,
    deductionZoneMm: 22,
    deductionZoneCount: 2,
    deductionMeaningBg: 'Странична зона от двете страни',
    measurementFormulaBg: '84 − 22 − 22 = 40 mm',
    reviewState: 'HUMAN_CONFIRMED',
    noteBg: 'Пълен размер 84 mm. Двете потвърдени странични зони по 22 mm оставят видима ширина 40 mm.',
    appliesToCatalogueTruthAutomatically: false,
    appliesToProductionAutomatically: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    id: 'nadezhda-trifon-prelude60-48205',
    sourceOrganisation: 'Надежда',
    sourcePerson: 'Бат Трифон',
    system: 'PRELUDE 60',
    code: '482.05',
    roleLabelBg: 'Крило',
    value1Mm: 78,
    value2Mm: 56,
    fullDimensionMm: 78,
    visibleWidthMm: 56,
    deductionZoneMm: 22,
    deductionZoneCount: 1,
    deductionMeaningBg: 'Зона към държателя',
    measurementFormulaBg: '78 − 22 = 56 mm',
    reviewState: 'HUMAN_CONFIRMED',
    noteBg: 'Пълен размер на крилото 78 mm. Зоната към държателя е 22 mm и остава видима ширина 56 mm.',
    appliesToCatalogueTruthAutomatically: false,
    appliesToProductionAutomatically: false,
    machineReady: false,
    productionApproved: false,
  }),
])

export const NADEZHDA_HUMAN_PROFILE_MEASUREMENTS_SAFETY = Object.freeze({
  separateFromExternalCatalogueSources: true,
  automaticCatalogueMergeAllowed: false,
  automaticGeometryOverwriteAllowed: false,
  automaticRuleValidationAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})
