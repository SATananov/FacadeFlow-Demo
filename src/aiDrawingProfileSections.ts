import type { FacadeFlowProductIntent } from './aiProductIntent'
import type { FacadeFlowConstructionDrawing } from './aiConstructionDrawing'
import {
  preludeTechnicalProfileByCode,
  type PreludeTechnicalProfileCode,
  type PreludeTechnicalProfileRole,
} from './profileData/preludeTechnicalInspector'

export const AI_DRAWING_PROFILE_SECTIONS_VERSION = 'AI_DRAWING_PROFILE_SECTIONS_01' as const

export type FacadeFlowAiDrawingProfileCallout = 'A-A' | 'B-B' | 'C-C'

export interface FacadeFlowAiDrawingProfileSection {
  callout: FacadeFlowAiDrawingProfileCallout
  code: PreludeTechnicalProfileCode
  role: PreludeTechnicalProfileRole
  roleLabelBg: 'Каса' | 'Крило' | 'Делител'
  catalogueAsset: string
  sourcePdf: 'PVC Prelude_bg.pdf'
  sourcePage: 2
  systemDepthMm: number
  catalogueOverallExtentMm?: number
  catalogueVisibleMm?: number
  humanFormulaBg: string
  humanNoteBg: string
  explicitlyAssignedToProduct: true
  verifiedCatalogueVisual: true
  aiRedrawn: false
  exactAssemblyClaimed: false
  isolatedProductionContour: false
  machineReady: false
  productionApproved: false
}

export interface FacadeFlowAiDrawingProfileSectionsModel {
  version: typeof AI_DRAWING_PROFILE_SECTIONS_VERSION
  systemSupported: boolean
  systemLabel?: string
  sections: FacadeFlowAiDrawingProfileSection[]
  missingRoles: PreludeTechnicalProfileRole[]
  explicitProfileCodesRequired: true
  automaticProfileAssignmentAllowed: false
  catalogueVisualIsSourceOfTruth: true
  humanMeasurementSemanticsSeparate: true
  exactAssemblyClaimed: false
  exactProductionContourClaimed: false
  machineReady: false
  productionApproved: false
}

const calloutByRole: Record<PreludeTechnicalProfileRole, FacadeFlowAiDrawingProfileCallout> = {
  FRAME: 'A-A',
  MULLION: 'B-B',
  SASH: 'C-C',
}

function normalizedSystem(value: string | undefined) {
  return (value ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()
}

export function isPrelude60System(value: string | undefined) {
  const normalized = normalizedSystem(value)
  return normalized.includes('PRELUDE') && normalized.includes('60')
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))]
}

function explicitCodesByRole(intent: FacadeFlowProductIntent, drawing: FacadeFlowConstructionDrawing) {
  return {
    FRAME: unique([drawing.frame?.profileRef, intent.profiles.frame]),
    MULLION: unique([...drawing.mullions.map((item) => item.profileRef), intent.profiles.mullion]),
    SASH: unique([...drawing.fields.map((item) => item.sash?.profileRef), intent.profiles.sash]),
  } satisfies Record<PreludeTechnicalProfileRole, string[]>
}

function roleIsPresent(role: PreludeTechnicalProfileRole, drawing: FacadeFlowConstructionDrawing) {
  if (role === 'FRAME') return Boolean(drawing.frame)
  if (role === 'MULLION') return drawing.mullions.length > 0
  return drawing.fields.some((field) => Boolean(field.sash))
}

export function buildFacadeFlowAiDrawingProfileSections(
  intent: FacadeFlowProductIntent,
  drawing: FacadeFlowConstructionDrawing,
): FacadeFlowAiDrawingProfileSectionsModel {
  const systemSupported = isPrelude60System(intent.profiles.system)
  const sections: FacadeFlowAiDrawingProfileSection[] = []
  const missingRoles: PreludeTechnicalProfileRole[] = []

  if (systemSupported) {
    const codesByRole = explicitCodesByRole(intent, drawing)
    const roles: PreludeTechnicalProfileRole[] = ['FRAME', 'MULLION', 'SASH']

    for (const role of roles) {
      if (!roleIsPresent(role, drawing)) continue
      const matchingProfiles = codesByRole[role]
        .map((code) => preludeTechnicalProfileByCode(code))
        .filter((profile) => profile?.role === role)

      if (!matchingProfiles.length) {
        missingRoles.push(role)
        continue
      }

      for (const profile of matchingProfiles) {
        if (!profile) continue
        sections.push({
          callout: calloutByRole[role],
          code: profile.code,
          role,
          roleLabelBg: profile.roleLabelBg,
          catalogueAsset: profile.catalogueWithDimensionsAsset,
          sourcePdf: profile.sourcePdf,
          sourcePage: profile.sourcePage,
          systemDepthMm: profile.catalogueDimensions.systemDepthMm,
          catalogueOverallExtentMm: profile.catalogueDimensions.overallExtentMm,
          catalogueVisibleMm: profile.catalogueDimensions.visibleMm,
          humanFormulaBg: profile.humanConfirmedWorkingSemantics.formulaBg,
          humanNoteBg: profile.humanConfirmedWorkingSemantics.noteBg,
          explicitlyAssignedToProduct: true,
          verifiedCatalogueVisual: true,
          aiRedrawn: false,
          exactAssemblyClaimed: false,
          isolatedProductionContour: false,
          machineReady: false,
          productionApproved: false,
        })
      }
    }
  }

  return {
    version: AI_DRAWING_PROFILE_SECTIONS_VERSION,
    systemSupported,
    systemLabel: intent.profiles.system,
    sections,
    missingRoles,
    explicitProfileCodesRequired: true,
    automaticProfileAssignmentAllowed: false,
    catalogueVisualIsSourceOfTruth: true,
    humanMeasurementSemanticsSeparate: true,
    exactAssemblyClaimed: false,
    exactProductionContourClaimed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function facadeFlowAiDrawingCalloutForProfile(code: string | undefined) {
  const profile = preludeTechnicalProfileByCode(code)
  return profile ? calloutByRole[profile.role] : null
}
