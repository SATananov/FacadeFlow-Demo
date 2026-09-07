import { useMemo, useState } from 'react'
import type { FacadeFlowAi03ParametricProposal } from '../aiParametricConstructionProposal'
import type { FacadeFlowConstructionDrawing } from '../aiConstructionDrawing'
import type { FacadeFlowCanonicalProfileAssignmentBridge } from '../aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileAssignmentHumanReview } from '../aiCanonicalProfileAssignmentHumanReview'
import { buildCanonicalProfileRealConceptual3D } from '../aiCanonicalProfileRealConceptual3DScene'
import { buildCanonicalProfile3DInspectionEvidence } from '../aiCanonicalProfile3DInspectionEvidence'
import { DEFAULT_CONCEPTUAL_DEPTH_MM } from '../threeDSceneBuilder'
import { defaultDimensionVisibility, type DimensionAnnotation } from '../dimensionTypes'
import { Product3DPreview } from './Product3DPreview'
import { CanonicalProfileAssignmentReviewPanel } from './CanonicalProfileAssignmentReviewPanel'
import { CanonicalProfile3DInspectionPanel } from './CanonicalProfile3DInspectionPanel'
import { CanonicalProfile3DHumanReviewGatePanel } from './CanonicalProfile3DHumanReviewGatePanel'
import { CanonicalProfileTechnicalSemanticsPanel } from './CanonicalProfileTechnicalSemanticsPanel'

export interface CanonicalProfileRealConceptual3DPanelProps {
  proposal: FacadeFlowAi03ParametricProposal
  drawing: FacadeFlowConstructionDrawing
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
}

function point(x: number, y: number, z = 0) {
  return { x, y, z }
}

function annotationBase(id: string, sourceGeometryId: string) {
  return {
    id,
    unit: 'MM' as const,
    sourceGeometryId,
    visible: true,
    productionApproved: false as const,
    machineReady: false as const,
    measurementMode: 'PROJECT_GEOMETRY' as const,
    productionDeductionsApplied: false as const,
    manufacturingToleranceApplied: false as const,
    exactProfileSectionApplied: false as const,
  }
}

function conceptualAnnotations(width: number, height: number, depth: number): DimensionAnnotation[] {
  return [
    {
      ...annotationBase('AI0537-DIM-OVERALL-WIDTH', 'product-root'),
      type: 'OVERALL_WIDTH',
      value: width,
      startPoint: point(0, -70),
      endPoint: point(width, -70),
      labelPosition: point(width / 2, -82),
      axis: 'X',
      confidenceStatus: 'CONFIRMED',
      origin: 'PROJECT_ENTERED',
    },
    {
      ...annotationBase('AI0537-DIM-OVERALL-HEIGHT', 'product-root'),
      type: 'OVERALL_HEIGHT',
      value: height,
      startPoint: point(-70, 0),
      endPoint: point(-70, height),
      labelPosition: point(-88, height / 2),
      axis: 'Y',
      confidenceStatus: 'CONFIRMED',
      origin: 'PROJECT_ENTERED',
    },
    {
      ...annotationBase('AI0537-DIM-CONCEPTUAL-DEPTH', 'conceptual-depth'),
      type: 'CONCEPTUAL_DEPTH',
      value: depth,
      startPoint: point(width + 45, 0, 0),
      endPoint: point(width + 45, 0, depth),
      labelPosition: point(width + 60, 0, depth / 2),
      axis: 'Z',
      confidenceStatus: 'CONCEPTUAL',
      origin: 'CONCEPTUAL',
      conceptualOnly: true,
    },
  ]
}

export function CanonicalProfileRealConceptual3DPanel({
  proposal,
  drawing,
  bridge,
}: CanonicalProfileRealConceptual3DPanelProps) {
  const [depth, setDepth] = useState(DEFAULT_CONCEPTUAL_DEPTH_MM)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const result = useMemo(
    () => buildCanonicalProfileRealConceptual3D({ proposal, drawing, bridge, conceptualDepthMm: depth }),
    [proposal, drawing, bridge, depth],
  )
  const review = useMemo(
    () => result.scene ? buildCanonicalProfileAssignmentHumanReview({ bridge, scene: result.scene }) : null,
    [bridge, result.scene],
  )
  const inspection = useMemo(
    () => result.scene ? buildCanonicalProfile3DInspectionEvidence({ bridge, scene: result.scene }) : null,
    [bridge, result.scene],
  )
  const annotations = useMemo(
    () => conceptualAnnotations(proposal.dimensions.widthMm, proposal.dimensions.heightMm, depth),
    [proposal.dimensions.widthMm, proposal.dimensions.heightMm, depth],
  )

  if (result.status === 'WAITING_FOR_HUMAN_REVIEW') return null

  if (result.status === 'BLOCKED_CONFLICT' || !result.scene || !review) {
    return (
      <section className="ff-ai03-facts" aria-label="AI05.3.7 real conceptual 3D binding" data-ai-step="AI05.3.7" data-review-status="BLOCKED_CONFLICT">
        <div className="ff-ai03-card-heading"><span>REAL CONCEPTUAL 3D · CANONICAL PROFILE BINDING</span><b>Блокирано</b></div>
        <p>Реалната 3D сцена не се показва, защото canonical profile trace не може да бъде запазен безопасно до scene nodes.</p>
        <ul>{result.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        <footer data-safety="REAL 3D SCENE: BLOCKED · AUTOMATIC GEOMETRY: NO · EXACT PROFILE CONTOUR: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
          REAL 3D SCENE: BLOCKED · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ТОЧЕН ПРОФИЛЕН КОНТУР: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
        </footer>
      </section>
    )
  }

  const buildScene = (requestedDepth: number) => {
    const next = buildCanonicalProfileRealConceptual3D({ proposal, drawing, bridge, conceptualDepthMm: requestedDepth })
    if (!next.scene || next.status !== 'READY_FOR_HUMAN_REVIEW') throw new Error('AI05.3.7 real conceptual 3D scene is not safely available.')
    return next.scene
  }

  return (
    <section className="ff-ai03-facts" aria-label="AI05.3.7 real conceptual 3D binding" data-ai-step="AI05.3.7" data-review-status={review.status}>
      <div className="ff-ai03-card-heading">
        <span>REAL CONCEPTUAL 3D · CANONICAL PROFILE BINDING</span>
        <b>{review.status === 'READY_FOR_HUMAN_REVIEW' ? 'Готово за човешки преглед' : 'Блокирано'}</b>
      </div>
      <p>
        Това е реалната WebGL conceptual сцена от вече прегледаната 2D топология. Профилните кодове са вързани към scene nodes само по изрично запазения canonical trace; те не променят геометрията и не прилагат точен профилен контур.
      </p>

      <Product3DPreview
        buildScene={buildScene}
        selectedId={selectedId}
        annotations={annotations}
        dimensionVisibility={defaultDimensionVisibility}
        depth={depth}
        onDepth={setDepth}
        onSelect={setSelectedId}
      />

      {inspection && (
        <>
          <CanonicalProfile3DInspectionPanel
            evidence={inspection}
            selectedNodeId={selectedId}
            onSelectNode={setSelectedId}
          />
          <CanonicalProfile3DHumanReviewGatePanel evidence={inspection} />
          <CanonicalProfileTechnicalSemanticsPanel bridge={bridge} />
        </>
      )}

      <div aria-label="Canonical assignments към real conceptual 3D nodes">
        {result.bindings.map((binding) => (
          <article key={`${binding.targetKind}:${binding.targetRef}`} data-profile-code={binding.profileCode} data-scene-profile-preserved={binding.sceneProfilePreserved}>
            <h4>{binding.targetKind} · {binding.profileCode}</h4>
            <p>{binding.targetRef} → {binding.nodeIds.join(', ')}</p>
          </article>
        ))}
      </div>

      <CanonicalProfileAssignmentReviewPanel review={review}/>

      <footer data-safety="REAL WEBGL SCENE: YES · HUMAN-REVIEWED TOPOLOGY ONLY: YES · AUTOMATIC PROFILE SELECTION: NO · AUTOMATIC GEOMETRY: NO · EXACT PROFILE CONTOUR: NO · RULES VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        REAL WEBGL SCENE: ДА · САМО HUMAN-REVIEWED TOPOLOGY: ДА · АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ТОЧЕН ПРОФИЛЕН КОНТУР: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
