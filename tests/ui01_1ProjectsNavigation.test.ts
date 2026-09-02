import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

const app = read('src/App.tsx')
const projects = read('src/components/ProjectsWorkspace.tsx')
const icons = read('src/components/FacadeFlowIcons.tsx')
const css = read('src/projectsWorkspace.css')

test('UI01.1 adds Projects to the unified main navigation in the intended order', () => {
  const labels = ['>AI<', '>Конструктор<', '>Импорт<', '>Проекти<', '>Каталог<', '>Помощ<']
  let previous = -1
  for (const label of labels) {
    const index = app.indexOf(label)
    assert.ok(index > previous, `${label} should appear after the previous navigation item`)
    previous = index
  }
  assert.match(app, /showProjects/)
  assert.match(app, /<ProjectsWorkspace[\s\S]*?onClose=/)
  assert.match(icons, /'projects'/)
})

test('UI01.1 Projects is a first-class unified workspace with four zero-state project groups', () => {
  assert.match(projects, /FacadeFlowWorkspaceHeader/)
  assert.match(projects, /icon="projects"/)
  for (const label of ['Активни', 'За преглед', 'Завършени', 'Шаблони']) assert.match(projects, new RegExp(label))
  assert.match(projects, /Подобен ≠ валиден/)
  assert.match(projects, /Завършен проект ≠ автоматичен шаблон/)
  assert.match(projects, /Няма създадени данни и нищо не се записва/)
})

test('UI01.1 keeps Projects as a visual foundation without persistence, network or production authority', () => {
  assert.doesNotMatch(projects, /localStorage|sessionStorage|indexedDB|fetch\(|WebSocket|EventSource/i)
  assert.doesNotMatch(projects, /machineReady\s*:\s*true|productionApproved\s*:\s*true/i)
  assert.match(projects, /Няма backend, записване, AI similarity, автоматично копиране или production unlock/)
})

test('UI01.1 Projects layout is responsive and follows the shared workspace shell', () => {
  assert.match(css, /projects-summary-grid/)
  assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/)
  assert.match(css, /@media\(max-width:900px\)/)
  assert.match(css, /@media\(max-width:560px\)/)
})
