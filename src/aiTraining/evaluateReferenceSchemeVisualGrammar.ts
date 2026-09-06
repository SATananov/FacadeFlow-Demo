import type { FacadeFlowConstructionDrawingField } from '../aiConstructionDrawing'
import { facadeFlowAiDrawingVisualToken } from '../aiDrawingVisualGrammar'
import { productTemplates } from '../productTemplates'
import {
  FACADEFLOW_REFERENCE_SCHEME_VISUAL_GRAMMAR_CASES,
  FACADEFLOW_VISUAL_GRAMMAR_GENERALIZATION_CASES,
  type ReferenceSchemeVisualField,
} from './referenceSchemeVisualGrammarCorpus'

export interface ReferenceSchemeVisualGrammarEvaluation {
  version: 'AI-DRAWING-REF-01'
  passed: number
  total: number
  cases: Array<{ id: string; passed: boolean; failures: string[] }>
  runtimeTemplateDependency: false
  automaticDirectionInference: false
  machineReady: false
  productionApproved: false
}

const roleFromTemplate = (state: string) => state === 'fixed' ? 'FIXED' : state === 'sliding' ? 'SLIDING' : 'OPENABLE'

function normalizedTemplateDirections(templateId: string): Array<'LEFT' | 'RIGHT' | 'UNRESOLVED'> {
  const template = productTemplates.find((item) => item.id === templateId)
  if (!template) return []
  return template.fields.map((field) => field.directionConfirmed && field.confirmedOpeningNotation
    ? field.confirmedOpeningNotation === 'LEFT_OPENING' ? 'LEFT' : 'RIGHT'
    : 'UNRESOLVED')
}

function syntheticField(sourceFieldId: string, field: ReferenceSchemeVisualField): FacadeFlowConstructionDrawingField {
  if (field.role === 'FIXED') return {
    sourceFieldId,
    order: 0,
    semanticRole: 'FIXED_FIELD',
    rect: { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 1 },
  }
  if (field.role === 'SLIDING') return {
    sourceFieldId,
    order: 0,
    semanticRole: 'SLIDING_FIELD',
    rect: { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 1 },
    sash: { semanticRole: 'SASH', openingType: 'SLIDING', openingDirection: field.direction, conceptualInsetRatio: 0.06 },
  }
  return {
    sourceFieldId,
    order: 0,
    semanticRole: 'OPENABLE_FIELD',
    rect: { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 1 },
    sash: {
      semanticRole: 'SASH',
      openingType: 'TURN',
      openingDirection: field.direction === 'UNRESOLVED' ? undefined : field.direction,
      conceptualInsetRatio: 0.06,
    },
  }
}

export function evaluateFacadeFlowReferenceSchemeVisualGrammar(): ReferenceSchemeVisualGrammarEvaluation {
  const cases: Array<{ id: string; passed: boolean; failures: string[] }> = FACADEFLOW_REFERENCE_SCHEME_VISUAL_GRAMMAR_CASES.map((training) => {
    const failures: string[] = []
    const source = productTemplates.find((item) => item.id === training.sourceRef)
    if (!source) return { id: training.sourceRef, passed: false, failures: ['Липсва референтна схема в productTemplates.'] }

    const roles = source.fields.map((field) => roleFromTemplate(field.state))
    const expectedRoles = training.fields.map((field) => field.role)
    if (roles.join('|') !== expectedRoles.join('|')) failures.push(`roles: ${roles.join('|')} != ${expectedRoles.join('|')}`)
    if (source.productCategory !== training.category) failures.push(`category: ${source.productCategory} != ${training.category}`)

    const verticals = source.dividers.filter((divider) => divider.orientation === 'vertical').length
    const horizontals = source.dividers.filter((divider) => divider.orientation === 'horizontal').length
    const lowerPanels = source.dividers.filter((divider) => divider.orientation === 'horizontal' && divider.y1 >= 0.6 && divider.y2 >= 0.6).length
    if (verticals !== training.verticalDividerCount) failures.push(`vertical dividers: ${verticals} != ${training.verticalDividerCount}`)
    if (horizontals !== training.horizontalDividerCount) failures.push(`horizontal dividers: ${horizontals} != ${training.horizontalDividerCount}`)
    if (lowerPanels !== training.lowerPanelZones) failures.push(`lower panel zones: ${lowerPanels} != ${training.lowerPanelZones}`)

    const templateDirections = normalizedTemplateDirections(training.sourceRef)
    const expectedDirections = training.fields.map((field) => field.direction)
    if (templateDirections.join('|') !== expectedDirections.join('|')) failures.push(`confirmed directions: ${templateDirections.join('|')} != ${expectedDirections.join('|')}`)

    for (const [index, field] of training.fields.entries()) {
      const token = facadeFlowAiDrawingVisualToken(syntheticField(`${training.sourceRef}-${index + 1}`, field))
      if (field.role === 'FIXED' && token !== 'FIXED') failures.push(`field ${index + 1}: ${token} != FIXED`)
      if (field.role === 'SLIDING' && !token.startsWith('SLIDING:')) failures.push(`field ${index + 1}: expected sliding token, got ${token}`)
      if (field.role === 'OPENABLE' && !token.startsWith('TURN:')) failures.push(`field ${index + 1}: expected turn token, got ${token}`)
    }

    return { id: training.sourceRef, passed: failures.length === 0, failures }
  })

  const generalizationFailures: string[] = []
  const unseen: FacadeFlowConstructionDrawingField[] = [
    syntheticField('u1', { role: 'FIXED', direction: 'UNRESOLVED' }),
    syntheticField('u2', { role: 'OPENABLE', direction: 'LEFT' }),
    syntheticField('u3', { role: 'FIXED', direction: 'UNRESOLVED' }),
    syntheticField('u4', { role: 'OPENABLE', direction: 'RIGHT' }),
    syntheticField('u5', { role: 'FIXED', direction: 'UNRESOLVED' }),
  ].map((field, index) => ({ ...field, order: index }))
  const unseenTokens = unseen.map(facadeFlowAiDrawingVisualToken)
  if (unseenTokens.join('|') !== FACADEFLOW_VISUAL_GRAMMAR_GENERALIZATION_CASES[0].fieldTokens.join('|')) generalizationFailures.push(`five-field tokens: ${unseenTokens.join('|')}`)

  const unresolvedTiltTurn: FacadeFlowConstructionDrawingField = {
    sourceFieldId: 'u-tilt-turn', order: 0, semanticRole: 'OPENABLE_FIELD', rect: { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 1 },
    sash: { semanticRole: 'SASH', openingType: 'TILT_TURN', conceptualInsetRatio: 0.06 },
  }
  if (facadeFlowAiDrawingVisualToken(unresolvedTiltTurn) !== 'TILT_TURN:UNRESOLVED') generalizationFailures.push('tilt-turn missing direction was not preserved as unresolved')

  const unresolvedSliding = syntheticField('u-slide', { role: 'SLIDING', direction: 'UNRESOLVED' })
  if (facadeFlowAiDrawingVisualToken(unresolvedSliding) !== 'SLIDING:UNRESOLVED') generalizationFailures.push('sliding missing direction was not preserved as unresolved')

  cases.push({ id: 'GENERALIZATION', passed: generalizationFailures.length === 0, failures: generalizationFailures })

  return {
    version: 'AI-DRAWING-REF-01',
    passed: cases.filter((item) => item.passed).length,
    total: cases.length,
    cases,
    runtimeTemplateDependency: false,
    automaticDirectionInference: false,
    machineReady: false,
    productionApproved: false,
  }
}
