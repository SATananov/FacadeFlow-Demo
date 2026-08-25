import type { OcrRectangle, OcrTextItem } from './ocrTypes'
import type { ProductType } from './productTypes'

export type CombinedCandidateType = 'OVERALL_WIDTH' | 'OVERALL_HEIGHT' | 'SECTION_WIDTH' | 'SECTION_HEIGHT' | 'DIAMETER' | 'RADIUS' | 'GENERIC_DIMENSION' | 'QUANTITY' | 'PRODUCT_REFERENCE' | 'TEXT_ONLY'
export type CombinedDecision = 'SUGGESTED' | 'ACCEPTED' | 'REJECTED'
export interface GeometryFeatures { aspectRatio: number; verticalSections: number; horizontalDividers: number; edgeDensity: number; verticalEdgeShare: number; horizontalEdgeShare: number; openingFields: number }
export interface SchemeFeatureScores { aspectRatio: number; verticalSections: number; horizontalDividers: number; edgeDistribution: number; structure: number; openingSymbols: number }
export interface SchemeRanking { templateId: string; referenceNumber: string; title: string; category: ProductType; similarity: number; scores: SchemeFeatureScores; warnings: string[] }
export interface CombinedCandidate { id: string; rawSourceText: string; normalizedValue: string; type: CombinedCandidateType; unit: string; ocrConfidence: number; parserConfidence: number; sourceBox?: OcrRectangle; sourcePage: number; status: CombinedDecision; warning?: string; createdAt: string }
export interface CombinedAnalysisJob { id: string; sourceSha256: string; sourcePage: number; crop: OcrRectangle; evidenceImageDataUrl: string; evidenceWidth: number; evidenceHeight: number; createdAt: string; completedAt: string; geometryFeatures: GeometryFeatures; schemeRankings: SchemeRanking[]; rawOcrText: string; normalizedOcrText: string; ocrConfidence: number; ocrItems: OcrTextItem[]; candidates: CombinedCandidate[]; warnings: string[]; state: 'COMPLETED' | 'FAILED' }
export interface CombinedAuditEntry { id: string; jobId: string; action: 'SELECT_SCHEME' | 'ACCEPT' | 'REJECT' | 'EDIT' | 'APPLY'; target: string; previousValue?: string; newValue?: string; humanConfirmed: boolean; timestamp: string }
