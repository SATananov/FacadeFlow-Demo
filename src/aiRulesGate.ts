import type { FacadeFlowRuleGate, FacadeFlowRuleGateRequirement, FacadeFlowRuleGateRequirementId, FacadeFlowUnifiedReviewPacket } from './aiWorkspaceTypes'

const labels: Record<FacadeFlowRuleGateRequirementId, string> = {
  GEOMETRY_LIMITS: 'Размери и геометрични ограничения',
  PROFILE_COMPATIBILITY: 'Профилна система и съвместимост',
  OPENING_HARDWARE: 'Отваряемост и обков',
  GLAZING_FILL: 'Стъкло / пълнеж',
  FINISH_COLOR: 'Цвят / покритие',
  THRESHOLD: 'Праг / долен възел',
  PROJECT_CONTEXT: 'Проектен контекст / позиция',
  SOURCE_TRACEABILITY: 'Източник / проследимост',
}

const sourceRequirements: Record<FacadeFlowRuleGateRequirementId, string> = {
  GEOMETRY_LIMITS: 'Производител / инженерно правило с ревизия',
  PROFILE_COMPATIBILITY: 'Каталог на системата или потвърдена технологична матрица',
  OPENING_HARDWARE: 'Каталог / таблица за отваряемост и обков',
  GLAZING_FILL: 'Проектна спецификация или потвърден каталог',
  FINISH_COLOR: 'Проектна спецификация / каталог за покрития',
  THRESHOLD: 'Потвърден системен детайл / технологична инструкция',
  PROJECT_CONTEXT: 'Проектен източник или човешки потвърдена позиция',
  SOURCE_TRACEABILITY: 'Проследим източник + място + ревизия + човешка проверка',
}

function requirement(id: FacadeFlowRuleGateRequirementId, applicability: FacadeFlowRuleGateRequirement['applicability'], summary: string): FacadeFlowRuleGateRequirement {
  return {
    id,
    label: labels[id],
    applicability,
    state: applicability === 'REQUIRED' ? 'SOURCE_REQUIRED' : applicability === 'DEFERRED' ? 'DEFERRED' : 'NOT_APPLICABLE',
    summary,
    sourceRequirement: sourceRequirements[id],
    evidence: [],
  }
}

function deferredProductRequirements(): FacadeFlowRuleGateRequirement[] {
  return [
    requirement('GEOMETRY_LIMITS', 'DEFERRED', 'Ще стане задължително след наличие на реално изделие / извлечени размери.'),
    requirement('PROFILE_COMPATIBILITY', 'DEFERRED', 'Ще стане задължително след наличие на реална профилна система и роли.'),
    requirement('OPENING_HARDWARE', 'DEFERRED', 'Ще стане задължително след наличие на реална функция / отваряемост.'),
    requirement('GLAZING_FILL', 'DEFERRED', 'Ще стане задължително след наличие на реално стъкло или пълнеж.'),
    requirement('FINISH_COLOR', 'DEFERRED', 'Ще стане задължително след наличие на реална спецификация за покритие.'),
    requirement('THRESHOLD', 'DEFERRED', 'Ще се определи като приложимо или неприложимо след наличие на реално изделие.'),
  ]
}

export function buildFacadeFlowDemoRulesGate(packet: FacadeFlowUnifiedReviewPacket): FacadeFlowRuleGate {
  let requirements: FacadeFlowRuleGateRequirement[]

  if (packet.kind === 'PRODUCT') {
    requirements = [
      requirement('GEOMETRY_LIMITS', 'REQUIRED', 'Няма въведено реално правило за допустими размери / геометрия.'),
      requirement('PROFILE_COMPATIBILITY', 'REQUIRED', 'Няма въведена реална матрица за съвместимост на профилите.'),
      requirement('OPENING_HARDWARE', 'REQUIRED', 'Няма въведено реално правило за функция, отваряемост и обков.'),
      requirement('GLAZING_FILL', 'REQUIRED', 'Няма въведено реално правило за стъкло / пълнеж.'),
      requirement('FINISH_COLOR', 'REQUIRED', 'Няма въведено реално правило за цвят / покритие.'),
      packet.demoScenario === 'GUIDED_DOOR'
        ? requirement('THRESHOLD', 'REQUIRED', 'За врата прагът / долният възел изисква реален системен източник.')
        : requirement('THRESHOLD', 'NOT_APPLICABLE', 'Не се приема автоматично като изискване за DEMO прозореца.'),
    ]
  } else {
    requirements = deferredProductRequirements()
  }

  requirements.push(
    packet.groupPath.length
      ? requirement('PROJECT_CONTEXT', 'REQUIRED', 'Активният път съществува, но бъдещите правила трябва да потвърдят приложимостта към тази позиция.')
      : requirement('PROJECT_CONTEXT', 'NOT_APPLICABLE', 'Пакетът няма задължителна проектна йерархия.'),
    requirement('SOURCE_TRACEABILITY', 'REQUIRED', 'Нито едно бъдещо инженерно правило не може да се приеме без проследим източник и ревизия.'),
  )

  return {
    status: 'FRAMEWORK_READY',
    sourcePolicy: 'TRACEABLE_SOURCE_REQUIRED',
    ruleSetRevision: null,
    requirements,
    realRuleCount: 0,
    validated: false,
    simulationOnly: true,
    machineReady: false,
  }
}
