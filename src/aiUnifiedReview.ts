import { guidedProductToSpecification } from './aiGuidedProduct'
import type { CatalogueProfile } from './profileCatalogueTypes'
import { projectStructurePathLabels } from './projectStructure'
import type { FacadeFlowAiDemoScenario, FacadeFlowAiSession, FacadeFlowUnifiedReviewPacket, FacadeFlowUnifiedReviewSection } from './aiWorkspaceTypes'

const section = (id: FacadeFlowUnifiedReviewSection['id'], label: string, state: FacadeFlowUnifiedReviewSection['state'], summary: string): FacadeFlowUnifiedReviewSection => ({ id, label, state, summary })

const scenarioKind: Record<FacadeFlowAiDemoScenario, FacadeFlowUnifiedReviewPacket['kind']> = {
  PROJECT_DOCUMENTS: 'PROJECT_SOURCE',
  GUIDED_WINDOW: 'PRODUCT',
  GUIDED_DOOR: 'PRODUCT',
  SKETCH: 'SKETCH_SOURCE',
  MANUAL: 'MANUAL_ROUTE',
  KNOWLEDGE_BASE: 'KNOWLEDGE_CONTEXT',
}


const jobTypeSummary = {
  BUILDING: 'Сграда / голям обект',
  HOUSE: 'Къща',
  SMALL_PROJECT: 'Малък обект / ремонт',
  SINGLE_PRODUCT: 'Единично изделие',
  CUSTOM_ORDER: 'Нестандартна поръчка',
  TECHNICAL_DETAIL: 'Технически детайл',
} as const

const scenarioTitles: Record<FacadeFlowAiDemoScenario, string> = {
  PROJECT_DOCUMENTS: 'DEMO проект → общ структурен пакет',
  GUIDED_WINDOW: 'DEMO прозорец → общ структурен пакет',
  GUIDED_DOOR: 'DEMO врата → общ структурен пакет',
  SKETCH: 'DEMO скица → общ структурен пакет',
  MANUAL: 'DEMO ръчен маршрут → общ структурен пакет',
  KNOWLEDGE_BASE: 'DEMO данни → общ структурен пакет',
}

export function buildFacadeFlowDemoReviewPacket(session: FacadeFlowAiSession, profiles: CatalogueProfile[]): FacadeFlowUnifiedReviewPacket | null {
  const scenario = session.job.demoScenario
  if (!scenario) return null

  const groupPath = projectStructurePathLabels(session.job.projectStructure)
  const inputMode = scenario === 'KNOWLEDGE_BASE' ? 'KNOWLEDGE_BASE' : session.job.inputMode || 'KNOWLEDGE_BASE'
  const sections: FacadeFlowUnifiedReviewSection[] = [
    section('CONTEXT', 'Контекст', scenario === 'KNOWLEDGE_BASE' || session.job.jobType ? 'CAPTURED' : 'UNRESOLVED', scenario === 'KNOWLEDGE_BASE' ? 'База знания / каталози' : session.job.jobType ? jobTypeSummary[session.job.jobType] : 'Липсва работен контекст'),
    section('STRUCTURE', 'Структура / позиция', groupPath.length ? 'CAPTURED' : 'NOT_APPLICABLE', groupPath.length ? groupPath.join(' → ') : 'Без задължителна йерархия'),
  ]

  let linkedProductSpecificationId: string | undefined
  let evidence: FacadeFlowUnifiedReviewPacket['evidence'] = []
  let unresolved: string[] = []

  if (scenario === 'GUIDED_WINDOW' || scenario === 'GUIDED_DOOR') {
    const specification = guidedProductToSpecification(session.job.guidedProduct, profiles, session.job.id, 'NEEDS_REVIEW', groupPath, session.job.projectStructure.activeNodeId ?? undefined)
    linkedProductSpecificationId = specification.id
    evidence = specification.evidence
    unresolved = [...specification.unresolved]
    sections.push(
      section('SOURCE', 'Източник / режим', 'CAPTURED', 'Структурирано DEMO човешко въвеждане · без AI автоматично извеждане'),
      section('PRODUCT', 'Изделие', specification.unresolved.length ? 'UNRESOLVED' : 'CAPTURED', specification.unresolved.length ? `${specification.name} · ${specification.unresolved.length} неуточнени` : `${specification.name} · структурирано`),
      section('EVIDENCE', 'Проследимост', 'CAPTURED', 'Формуляр „Стъпка по стъпка“ · ръчно въведена проследимост'),
    )
  } else if (scenario === 'PROJECT_DOCUMENTS') {
    unresolved = ['Няма реално качен проектен файл', 'Няма извлечени продуктови параметри']
    sections.push(
      section('SOURCE', 'Източник / режим', 'UNRESOLVED', 'DEMO маршрут към Import Center · няма симулиран качен файл'),
      section('PRODUCT', 'Изделие', 'UNRESOLVED', 'Ще се създаде само след реален източник и човешка проверка'),
      section('EVIDENCE', 'Проследимост', 'UNRESOLVED', 'Няма измислен запис за проследимост'),
    )
  } else if (scenario === 'SKETCH') {
    unresolved = ['Няма реално качена скица', 'Няма извлечена геометрия или продуктови параметри']
    sections.push(
      section('SOURCE', 'Източник / режим', 'UNRESOLVED', 'DEMO маршрут за скица · няма симулиран файл'),
      section('PRODUCT', 'Изделие', 'UNRESOLVED', 'Няма AI предложение или автоматично генерирана геометрия'),
      section('EVIDENCE', 'Проследимост', 'UNRESOLVED', 'Източникът ще се добави само при реално качване'),
    )
  } else if (scenario === 'MANUAL') {
    unresolved = ['Няма автоматично нормализирани CAD параметри']
    sections.push(
      section('SOURCE', 'Източник / режим', 'CAPTURED', 'Ръчен маршрут · AI не участва'),
      section('PRODUCT', 'Изделие / детайл', 'UNRESOLVED', 'Данните ще бъдат въведени от човек в конструктора или CAD'),
      section('EVIDENCE', 'Проследимост', 'NOT_APPLICABLE', 'Няма автоматично създаден запис за проследимост'),
    )
  } else {
    unresolved = ['Обков: нужни са реални данни', 'Стъкло: нужни са реални данни', 'Инженерни правила: нужни са източници и ревизии']
    sections.push(
      section('SOURCE', 'Източник / режим', 'CAPTURED', 'DEMO преглед на готовността на базата знания'),
      section('PRODUCT', 'Изделие', 'NOT_APPLICABLE', 'Тази станция не създава изделие'),
      section('EVIDENCE', 'Проследимост', 'UNRESOLVED', 'Реалните факти ще изискват източник, страница / ред и ревизия'),
    )
  }

  sections.push(section('RULES', 'Проверка по правила', 'UNRESOLVED', 'Не е изпълнена · задължителна преди преход към производство'))

  return {
    id: `${session.job.id}-unified-demo-review`,
    demoScenario: scenario,
    kind: scenarioKind[scenario],
    inputMode,
    jobType: session.job.jobType,
    title: scenarioTitles[scenario],
    jobName: session.job.name,
    reference: session.job.reference,
    groupPath,
    placementNodeId: session.job.projectStructure.activeNodeId ?? undefined,
    linkedProductSpecificationId,
    sections,
    evidence,
    unresolved,
    reviewAccepted: false,
    status: 'NEEDS_REVIEW',
    ruleGate: null,
    aiGenerated: false,
    rulesValidated: false,
    simulationOnly: true,
    machineReady: false,
  }
}
