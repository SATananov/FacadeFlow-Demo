import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = process.cwd()

function source(path: string) {
  return readFileSync(`${root}/${path}`, 'utf8')
}

test('AI workspace exposes a persistent contextual helper for users who do not know the next step', () => {
  const workspace = source('src/components/FacadeFlowAIWorkspace.tsx')
  const coach = source('src/components/AiWorkflowCoach.tsx')

  assert.match(workspace, /AiWorkflowCoach/)
  assert.match(coach, /НЕ ЗНАЕШ КАКВО ДА ПРАВИШ/)
  assert.match(coach, /Помощник · Какво да направя сега/)
  assert.match(coach, /ако не знаеш нещо, не гадай/i)
  assert.match(coach, /НЕУТОЧНЕНО/)
  assert.match(coach, /A-A е касата, B-B е делителят, C-C е крилото/)
})

test('Quick Select explains the four actions and makes technical settings explicitly optional when unknown', () => {
  const quick = source('src/components/AiProductQuickStart.tsx')

  assert.match(quick, /Какво е\?/)
  assert.match(quick, /Как изглежда\?/)
  assert.match(quick, /Знаеш ли профилите\?/)
  assert.match(quick, /3 · Технически настройки · ако ги знаеш/)
  assert.match(quick, /Не знаеш точния код\?/)
  assert.match(quick, /FacadeFlow няма да си измисли профил вместо теб/)
})

test('Profile sections explain A-A B-B C-C and open the detailed inspector only on demand', () => {
  const sections = source('src/components/AiDrawingProfileSections.tsx')
  const proposal = source('src/components/ParametricConstructionProposalPanel.tsx')
  const inspector = source('src/components/TechnicalProfileInspector.tsx')

  assert.match(sections, /Как да четеш тази част от скицата/)
  assert.match(sections, /A-A.*каса/)
  assert.match(sections, /B-B.*делител/)
  assert.match(sections, /C-C.*крило/)
  assert.match(sections, /Разгледай подробно · \{section\.code\}/)
  assert.match(proposal, /onInspectProfile=\{openProfileInspector\}/)
  assert.match(proposal, /requestedCode=\{profileInspectorCode\}/)
  assert.match(inspector, /useState\(false\)/)
  assert.match(inspector, /Подробният инспектор е свит/)
})

test('orientation polish does not introduce production authority', () => {
  const files = [
    'src/components/AiWorkflowCoach.tsx',
    'src/components/AiProductQuickStart.tsx',
    'src/components/AiDrawingProfileSections.tsx',
    'src/components/ParametricConstructionProposalPanel.tsx',
    'src/components/TechnicalProfileInspector.tsx',
  ].map(source).join('\n')

  for (const forbidden of ['MACHINE_READY = true', 'PRODUCTION_APPROVED = true', 'automaticProfileAssignmentAllowed: true']) {
    assert.equal(files.includes(forbidden), false)
  }
})
