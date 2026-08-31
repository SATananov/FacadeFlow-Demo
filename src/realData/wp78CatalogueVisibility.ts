import { wp78CatalogueBlockers, wp78RoleApplicability } from './wp78Applicability'
import { wp78RealSourceData } from './wp78'

export const wp78CatalogueVisibility = Object.freeze({
  system: wp78RealSourceData.system,
  mode: 'READ_ONLY_SOURCE_EVIDENCE' as const,
  productCategory: 'WINDOW' as const,
  entries: Object.freeze(
    wp78RoleApplicability.map(({ sourceRoleLabel, catalogueRole, code }) => Object.freeze({
      sourceRoleLabel,
      catalogueRole,
      code,
      dimensionsKnown: false as const,
      selectable: false as const,
    })),
  ),
  blockers: wp78CatalogueBlockers,
  hardwareSourceText: wp78RealSourceData.hardware.sourceText,
  glazingMentioned: wp78RealSourceData.glazing.mentioned,
  catalogueSelectable: false as const,
  rulesValidated: false as const,
  machineReady: false as const,
  productionApproved: false as const,
})
