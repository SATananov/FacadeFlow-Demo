export type HybridCreationRoute = 'STANDARD' | 'SKETCH_ASSISTED' | 'NON_STANDARD'
export type HybridProductCategory = 'WINDOW' | 'DOOR' | 'SLIDING' | 'SHOPFRONT' | 'FACADE_MODULE'
export type HybridWorkflowStep = 'DESIGNER_START' | 'STANDARD_CATEGORY' | 'STANDARD_DRAFT' | 'SKETCH_ROUTE' | 'NON_STANDARD_VIEWPORT'
export type HybridReviewStatus = 'DRAFT'
export type HybridSourceReferenceStatus = 'NONE' | 'ROUTE_SELECTED'

export interface HybridFutureCapabilities {
  structuredConfigurationAvailable: false
  sketchUnderlayAvailable: false
  semanticGeometryAvailable: false
  synchronized2D3DAvailable: false
  parametricCorrectionAvailable: false
  freeDrawingAvailable: false
}

export interface HybridProductDesignerSession {
  id: string
  creationRoute: HybridCreationRoute | null
  productCategory: HybridProductCategory | null
  workflowStep: HybridWorkflowStep
  humanReviewStatus: HybridReviewStatus
  sourceReferenceStatus: HybridSourceReferenceStatus
  geometryEntityCount: 0
  futureCapabilities: HybridFutureCapabilities
  sessionOnly: true
  simulationOnly: true
  machineReady: false
  internalEvaluationOnly: true
  productionApproved: false
  sourceImmutable: true
  geometryCreated: false
  exportAvailable: false
  dwgWriteAvailable: false
  machineConnectivityAvailable: false
}

export const HYBRID_SELECTABLE_CATEGORIES: readonly HybridProductCategory[] = Object.freeze(['WINDOW', 'DOOR'])
export const HYBRID_FUTURE_CAPABILITIES: HybridFutureCapabilities = Object.freeze({ structuredConfigurationAvailable: false, sketchUnderlayAvailable: false, semanticGeometryAvailable: false, synchronized2D3DAvailable: false, parametricCorrectionAvailable: false, freeDrawingAvailable: false })

export function createHybridProductDesignerSession(id = 'hybrid-product-session'): HybridProductDesignerSession {
  return Object.freeze({ id, creationRoute: null, productCategory: null, workflowStep: 'DESIGNER_START', humanReviewStatus: 'DRAFT', sourceReferenceStatus: 'NONE', geometryEntityCount: 0, futureCapabilities: HYBRID_FUTURE_CAPABILITIES, sessionOnly: true, simulationOnly: true, machineReady: false, internalEvaluationOnly: true, productionApproved: false, sourceImmutable: true, geometryCreated: false, exportAvailable: false, dwgWriteAvailable: false, machineConnectivityAvailable: false })
}

export function selectHybridCreationRoute(session: HybridProductDesignerSession, route: HybridCreationRoute): HybridProductDesignerSession {
  const workflowStep: HybridWorkflowStep = route === 'STANDARD' ? 'STANDARD_CATEGORY' : route === 'SKETCH_ASSISTED' ? 'SKETCH_ROUTE' : 'NON_STANDARD_VIEWPORT'
  return { ...session, creationRoute: route, productCategory: null, workflowStep, sourceReferenceStatus: route === 'SKETCH_ASSISTED' ? 'ROUTE_SELECTED' : 'NONE', geometryEntityCount: 0 }
}

export function selectHybridStandardCategory(session: HybridProductDesignerSession, category: HybridProductCategory): HybridProductDesignerSession {
  if (session.creationRoute !== 'STANDARD' || !HYBRID_SELECTABLE_CATEGORIES.includes(category)) return session
  return { ...session, productCategory: category, workflowStep: 'STANDARD_DRAFT', geometryEntityCount: 0 }
}

export function returnToHybridDesignerStart(session: HybridProductDesignerSession): HybridProductDesignerSession {
  return createHybridProductDesignerSession(session.id)
}
