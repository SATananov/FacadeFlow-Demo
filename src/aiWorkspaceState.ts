import type { FacadeFlowAiInputMode, FacadeFlowAiSession, FacadeFlowJobType, KnowledgeBaseSectionDefinition } from './aiWorkspaceTypes'

export const FACADEFLOW_JOB_TYPE_LABELS: Record<FacadeFlowJobType, { title: string; description: string; groupHint: string }> = {
  BUILDING: { title: 'Сграда / голям обект', description: 'Много изделия, етажи, фасади, позиции и повтарящи се марки.', groupHint: 'Корпус → етаж → фасада / помещение → позиция' },
  HOUSE: { title: 'Къща', description: 'Компактен обект с прозорци, врати, витрини и индивидуални позиции.', groupHint: 'Фасада / помещение → позиция' },
  SMALL_PROJECT: { title: 'Малък обект / ремонт', description: 'Магазин, офис, пристройка, подмяна или малка серия изделия.', groupHint: 'Зона / помещение → позиция' },
  SINGLE_PRODUCT: { title: 'Единично изделие', description: 'Един прозорец, врата, витрина или друго отделно изделие.', groupHint: 'Без задължителна йерархия' },
  CUSTOM_ORDER: { title: 'Нестандартна поръчка', description: 'Специфично изделие, което може да няма готова архитектурна скица.', groupHint: 'Свободна структура според задачата' },
  TECHNICAL_DETAIL: { title: 'Технически детайл', description: 'Самостоятелен възел, сечение, специфична връзка или CAD детайл.', groupHint: 'Детайл → вариант / ревизия' },
}

export const FACADEFLOW_AI_INPUT_LABELS: Record<FacadeFlowAiInputMode, { title: string; description: string }> = {
  DOCUMENTS: { title: 'Проект / документи', description: 'PDF, изображение, DWG/DXF, XML/LTE или бъдеща таблична спецификация.' },
  DESCRIPTION: { title: 'Описание с думи', description: 'Размери, профили, отваряне, дръжки, панти, стъклопакет, цвят и допълнителни инструкции.' },
  SKETCH: { title: 'Скица / чертеж', description: 'Качена или ръчно изградена скица, която остава доказателствен източник.' },
  MANUAL: { title: 'Ръчно без AI', description: 'Продължаване към сегашния конструктор или CAD работна зона без зависимост от AI.' },
}

export const KNOWLEDGE_BASE_SECTIONS: readonly KnowledgeBaseSectionDefinition[] = Object.freeze([
  { id: 'PROFILES', title: 'Профилни системи и профили', description: 'Системи, каси, крила, делители, напречници, прагове и точни кодове.', status: 'FOUNDATION' },
  { id: 'HARDWARE', title: 'Обков', description: 'Панти, дръжки, брави, механизми, ролки, насрещници и монтажни правила.', status: 'NEEDS_DATA' },
  { id: 'GLAZING', title: 'Стъкло и стъклопакети', description: 'Състав, дебелина, тегло, допустими диапазони и приложими стъклодържатели.', status: 'NEEDS_DATA' },
  { id: 'PANELS', title: 'Пълнежи и панели', description: 'Панели, сандвич елементи и други допустими пълнежи.', status: 'NEEDS_DATA' },
  { id: 'FINISHES', title: 'Цветове и покрития', description: 'RAL, вътрешен / външен цвят и ограничения по система.', status: 'NEEDS_DATA' },
  { id: 'COMPATIBILITY', title: 'Съвместимости', description: 'Кое с кое работи: профили, обков, стъкло, уплътнения и аксесоари.', status: 'NEEDS_DATA' },
  { id: 'ENGINEERING_RULES', title: 'Инженерни правила', description: 'Минимуми, максимуми, тегла, размери, фуги, монтажни и производствени ограничения.', status: 'NEEDS_DATA' },
  { id: 'SOURCES', title: 'Източници и ревизии', description: 'Каталог, страница, ревизия и произход на всяко инженерно правило.', status: 'NEEDS_DATA' },
])

const now = () => new Date().toISOString()

export function createFacadeFlowAiSession(id = 'facadeflow-ai-session'): FacadeFlowAiSession {
  const timestamp = now()
  return {
    id,
    view: 'INTAKE',
    job: {
      id: `${id}-job`, name: '', reference: '', jobType: null, inputMode: null, description: '', products: [], technicalDetails: [], groupLabels: [],
      intakeStatus: 'EMPTY', createdAt: timestamp, updatedAt: timestamp, sessionOnly: true, simulationOnly: true, machineReady: false,
    },
    aiModelStatus: 'NOT_CONNECTED', humanReviewRequired: true, rulesValidationRequired: true, automaticGeometryAllowed: false,
    sourceEvidenceRequired: true, productionApproved: false,
  }
}

export function selectFacadeFlowJobType(session: FacadeFlowAiSession, jobType: FacadeFlowJobType): FacadeFlowAiSession {
  const definition = FACADEFLOW_JOB_TYPE_LABELS[jobType]
  return { ...session, job: { ...session.job, jobType, inputMode: null, groupLabels: [definition.groupHint], intakeStatus: session.job.name.trim() || session.job.description.trim() ? 'SOURCE_CAPTURED' : 'EMPTY', updatedAt: now() } }
}

export function selectFacadeFlowAiInputMode(session: FacadeFlowAiSession, inputMode: FacadeFlowAiInputMode): FacadeFlowAiSession {
  if (!session.job.jobType) return session
  return { ...session, job: { ...session.job, inputMode, intakeStatus: session.job.description.trim() || session.job.name.trim() ? 'SOURCE_CAPTURED' : 'EMPTY', updatedAt: now() } }
}

export function updateFacadeFlowJobMetadata(session: FacadeFlowAiSession, patch: Partial<Pick<FacadeFlowAiSession['job'], 'name' | 'reference' | 'description'>>): FacadeFlowAiSession {
  const job = { ...session.job, ...patch, updatedAt: now() }
  const captured = Boolean(job.name.trim() || job.reference.trim() || job.description.trim())
  return { ...session, job: { ...job, intakeStatus: captured ? 'SOURCE_CAPTURED' : 'EMPTY' } }
}

export function setFacadeFlowAiView(session: FacadeFlowAiSession, view: FacadeFlowAiSession['view']): FacadeFlowAiSession { return { ...session, view } }
export function resetFacadeFlowAiIntake(session: FacadeFlowAiSession): FacadeFlowAiSession { const fresh = createFacadeFlowAiSession(session.id); return { ...fresh, view: session.view } }
