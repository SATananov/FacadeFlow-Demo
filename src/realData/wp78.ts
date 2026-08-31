import type { ProfileRole } from '../profileCatalogueTypes'

export interface Wp78SourceProfileRecord {
  sourceRoleLabel: 'Каса' | 'Делител' | 'Крило прозорец'
  catalogueRole: ProfileRole
  code: string
  sourceBacked: true
}

export const WP78_REAL_DATA_BATCH_ID = 'REAL_DATA_BATCH_01'
export const WP78_SYSTEM_LABEL = 'WP 78'

export const wp78RealSourceData = {
  batchId: WP78_REAL_DATA_BATCH_ID,
  system: WP78_SYSTEM_LABEL,
  source: {
    fileName: 'Al systems 2(1).pdf',
    page: 1,
    sha256: '3A49FAE65D9EB98F1F1F27943ABCF8435A6EE5AE989B79EEC2F4061FC98C82DD',
  },
  profiles: [
    { sourceRoleLabel: 'Каса', catalogueRole: 'FRAME', code: '78,01', sourceBacked: true },
    { sourceRoleLabel: 'Делител', catalogueRole: 'MULLION', code: '78,33', sourceBacked: true },
    { sourceRoleLabel: 'Крило прозорец', catalogueRole: 'SASH', code: '78,22', sourceBacked: true },
  ] satisfies Wp78SourceProfileRecord[],
  hardware: {
    sourceText: 'с PVC обков',
    productCode: null,
    productSpecification: null,
  },
  glazing: {
    mentioned: true,
    sourceText: 'стъклопакети',
    code: null,
    specification: null,
  },
  undocumented: {
    doorProfiles: [] as const,
    thresholdProfiles: [] as const,
  },
  safety: {
    cataloguePromoted: false,
    rulesValidated: false,
    machineReady: false,
    productionApproved: false,
    humanAuditRequired: true,
  },
} as const
