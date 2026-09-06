import type { FacadeFlowConstructionDrawingField } from './aiConstructionDrawing'
import type { ComposerOpeningDirection } from './visualComposerTypes'

export const AI_DRAWING_VISUAL_GRAMMAR_VERSION = 'AI-DRAWING-GRAMMAR-01' as const

export type FacadeFlowAiDrawingVisualKind =
  | 'FIXED'
  | 'TURN'
  | 'TILT'
  | 'TILT_TURN'
  | 'SLIDING'
  | 'PANEL'
  | 'UNRESOLVED'

export type FacadeFlowAiDrawingSideDirection = 'LEFT' | 'RIGHT' | 'UNRESOLVED'

export interface FacadeFlowAiDrawingVisualInstruction {
  version: typeof AI_DRAWING_VISUAL_GRAMMAR_VERSION
  kind: FacadeFlowAiDrawingVisualKind
  composerDirection: ComposerOpeningDirection | null
  sideDirection: FacadeFlowAiDrawingSideDirection | null
  sideDirectionRequired: boolean
  sideDirectionKnown: boolean
  showSashOutline: boolean
  showSlidingArrow: boolean
  labelBg: string
  safety: {
    sourceIsStructuredSemantics: true
    referenceTemplateUsedAtRuntime: false
    inferredMissingDirection: false
  }
}

function sideDirection(field: FacadeFlowConstructionDrawingField): FacadeFlowAiDrawingSideDirection {
  if (field.sash?.openingDirection === 'LEFT') return 'LEFT'
  if (field.sash?.openingDirection === 'RIGHT') return 'RIGHT'
  return 'UNRESOLVED'
}

export function resolveFacadeFlowAiDrawingVisualGrammar(
  field: FacadeFlowConstructionDrawingField,
): FacadeFlowAiDrawingVisualInstruction {
  const baseSafety = {
    sourceIsStructuredSemantics: true as const,
    referenceTemplateUsedAtRuntime: false as const,
    inferredMissingDirection: false as const,
  }

  if (field.semanticRole === 'FIXED_FIELD') {
    return {
      version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
      kind: 'FIXED',
      composerDirection: null,
      sideDirection: null,
      sideDirectionRequired: false,
      sideDirectionKnown: false,
      showSashOutline: false,
      showSlidingArrow: false,
      labelBg: 'Фиксирано',
      safety: baseSafety,
    }
  }

  if (field.semanticRole === 'PANEL_FIELD') {
    return {
      version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
      kind: 'PANEL',
      composerDirection: null,
      sideDirection: null,
      sideDirectionRequired: false,
      sideDirectionKnown: false,
      showSashOutline: false,
      showSlidingArrow: false,
      labelBg: 'Панел',
      safety: baseSafety,
    }
  }

  if (field.semanticRole === 'SLIDING_FIELD') {
    const direction = sideDirection(field)
    return {
      version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
      kind: 'SLIDING',
      composerDirection: null,
      sideDirection: direction,
      sideDirectionRequired: false,
      sideDirectionKnown: direction !== 'UNRESOLVED',
      showSashOutline: true,
      showSlidingArrow: true,
      labelBg: direction === 'LEFT'
        ? 'Плъзгане наляво'
        : direction === 'RIGHT'
          ? 'Плъзгане надясно'
          : 'Плъзгащо · посока неуточнена',
      safety: baseSafety,
    }
  }

  if (field.semanticRole !== 'OPENABLE_FIELD' || !field.sash) {
    return {
      version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
      kind: 'UNRESOLVED',
      composerDirection: null,
      sideDirection: null,
      sideDirectionRequired: false,
      sideDirectionKnown: false,
      showSashOutline: false,
      showSlidingArrow: false,
      labelBg: 'Неуточнено',
      safety: baseSafety,
    }
  }

  const direction = sideDirection(field)
  if (field.sash.openingType === 'TILT') {
    return {
      version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
      kind: 'TILT',
      composerDirection: 'TILT',
      sideDirection: null,
      sideDirectionRequired: false,
      sideDirectionKnown: false,
      showSashOutline: true,
      showSlidingArrow: false,
      labelBg: 'Откидно',
      safety: baseSafety,
    }
  }

  if (field.sash.openingType === 'TURN') {
    return {
      version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
      kind: 'TURN',
      composerDirection: direction === 'LEFT' ? 'LEFT' : direction === 'RIGHT' ? 'RIGHT' : null,
      sideDirection: direction,
      sideDirectionRequired: true,
      sideDirectionKnown: direction !== 'UNRESOLVED',
      showSashOutline: true,
      showSlidingArrow: false,
      labelBg: direction === 'LEFT'
        ? 'Ляво отваряне'
        : direction === 'RIGHT'
          ? 'Дясно отваряне'
          : 'Посока ляво / дясно не е уточнена',
      safety: baseSafety,
    }
  }

  if (field.sash.openingType === 'TILT_TURN') {
    return {
      version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
      kind: 'TILT_TURN',
      composerDirection: direction === 'LEFT' ? 'TILT_LEFT' : direction === 'RIGHT' ? 'TILT_RIGHT' : null,
      sideDirection: direction,
      sideDirectionRequired: true,
      sideDirectionKnown: direction !== 'UNRESOLVED',
      showSashOutline: true,
      showSlidingArrow: false,
      labelBg: direction === 'LEFT'
        ? 'Ос.-отк. · ляво'
        : direction === 'RIGHT'
          ? 'Ос.-отк. · дясно'
          : 'Ос.-отк. · посока неуточнена',
      safety: baseSafety,
    }
  }

  return {
    version: AI_DRAWING_VISUAL_GRAMMAR_VERSION,
    kind: 'UNRESOLVED',
    composerDirection: null,
    sideDirection: direction,
    sideDirectionRequired: false,
    sideDirectionKnown: direction !== 'UNRESOLVED',
    showSashOutline: true,
    showSlidingArrow: false,
    labelBg: 'Типът отваряне се нуждае от човешко уточнение',
    safety: baseSafety,
  }
}

export function facadeFlowAiDrawingVisualToken(field: FacadeFlowConstructionDrawingField): string {
  const visual = resolveFacadeFlowAiDrawingVisualGrammar(field)
  if (visual.kind === 'FIXED' || visual.kind === 'PANEL' || visual.kind === 'UNRESOLVED') return visual.kind
  if (visual.kind === 'TILT') return 'TILT'
  if (visual.kind === 'SLIDING') return visual.sideDirectionKnown ? `SLIDING:${visual.sideDirection}` : 'SLIDING:UNRESOLVED'
  return visual.sideDirectionKnown ? `${visual.kind}:${visual.sideDirection}` : `${visual.kind}:UNRESOLVED`
}
