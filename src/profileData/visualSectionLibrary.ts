import { NADEZHDA_HUMAN_PROFILE_MEASUREMENTS } from '../realData/nadezhdaHumanProfileMeasurements'

export const PROFILE_VISUAL_SECTION_LIBRARY_VERSION = 'PROFILE_DATA_03.1' as const

export type ProfileVisualSectionRole = 'FRAME' | 'SASH' | 'MULLION'
export type ProfileVisualSectionZoneKind = 'VISIBLE' | 'DEDUCTION'

export interface ProfileVisualSectionZone {
  id: string
  kind: ProfileVisualSectionZoneKind
  labelBg: string
  sizeMm: number
}

export interface ProfileVisualSectionModel {
  id: string
  system: 'PRELUDE 60'
  profileCode: string
  role: ProfileVisualSectionRole
  roleLabelBg: 'Каса' | 'Крило' | 'Делител'
  fullDimensionMm: number
  visibleWidthMm: number
  zones: readonly ProfileVisualSectionZone[]
  formulaBg: string
  sourceOrganisation: 'Надежда'
  sourcePerson: 'Бат Трифон'
  evidenceState: 'HUMAN_CONFIRMED'
  visualizationKind: 'MEASUREMENT_SCHEMA'
  exactProfileContourAvailable: false
  schematicOnly: true
  appliesToCatalogueTruthAutomatically: false
  appliesToProductionAutomatically: false
  machineReady: false
  productionApproved: false
}

const roleByCode: Readonly<Record<string, ProfileVisualSectionRole>> = Object.freeze({
  '482.30': 'FRAME',
  '482.05': 'SASH',
  '482.21': 'MULLION',
})

/**
 * PROFILE DATA 03.1 starts with a measurement schema, not an inferred CAD contour.
 * The zones are built only from the Nadezhda human-confirmed 22 mm interpretation.
 */
export const NADEZHDA_PRELUDE_VISUAL_SECTIONS: readonly ProfileVisualSectionModel[] = Object.freeze(
  NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.map((measurement) => {
    const deductionZones: ProfileVisualSectionZone[] = Array.from(
      { length: measurement.deductionZoneCount },
      (_, index) => Object.freeze({
        id: `${measurement.code}-deduction-${index + 1}`,
        kind: 'DEDUCTION' as const,
        labelBg: measurement.deductionZoneCount === 2
          ? `Странична зона ${index === 0 ? 'A' : 'B'}`
          : measurement.deductionMeaningBg,
        sizeMm: measurement.deductionZoneMm,
      }),
    )

    const zones: readonly ProfileVisualSectionZone[] = measurement.deductionZoneCount === 2
      ? Object.freeze([
          deductionZones[0],
          Object.freeze({ id: `${measurement.code}-visible`, kind: 'VISIBLE' as const, labelBg: 'Видима ширина', sizeMm: measurement.visibleWidthMm }),
          deductionZones[1],
        ])
      : Object.freeze([
          Object.freeze({ id: `${measurement.code}-visible`, kind: 'VISIBLE' as const, labelBg: 'Видима ширина', sizeMm: measurement.visibleWidthMm }),
          deductionZones[0],
        ])

    return Object.freeze({
      id: `visual-section-${measurement.code.replace('.', '-')}`,
      system: measurement.system,
      profileCode: measurement.code,
      role: roleByCode[measurement.code],
      roleLabelBg: measurement.roleLabelBg,
      fullDimensionMm: measurement.fullDimensionMm,
      visibleWidthMm: measurement.visibleWidthMm,
      zones,
      formulaBg: measurement.measurementFormulaBg,
      sourceOrganisation: measurement.sourceOrganisation,
      sourcePerson: measurement.sourcePerson,
      evidenceState: measurement.reviewState,
      visualizationKind: 'MEASUREMENT_SCHEMA' as const,
      exactProfileContourAvailable: false as const,
      schematicOnly: true as const,
      appliesToCatalogueTruthAutomatically: false as const,
      appliesToProductionAutomatically: false as const,
      machineReady: false as const,
      productionApproved: false as const,
    })
  }),
)

export const PROFILE_VISUAL_SECTION_LIBRARY_SAFETY = Object.freeze({
  exactCadContourClaimed: false,
  schematicOnly: true,
  automaticCatalogueMergeAllowed: false,
  automaticGeometryOverwriteAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})
