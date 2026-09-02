import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')
const app = read('src/App.tsx')
const css = read('src/workspaceVisualAlignment.css')

test('UI01.2 loads a dedicated visual-alignment layer after Projects styles', () => {
  const projects = app.indexOf("import './projectsWorkspace.css'")
  const alignment = app.indexOf("import './workspaceVisualAlignment.css'")
  assert.ok(projects >= 0)
  assert.ok(alignment > projects)
})

test('UI01.2 gives the light workspaces one shared technical grid background', () => {
  for (const selector of [
    '.detail-drafting>.hybrid-screen',
    '.drawing-import-content',
    '.catalogue-workspace-content',
    '.help-workspace-content',
    '.projects-workspace-body',
  ]) assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(css, /--ff-light-workspace-grid-size:32px/)
  assert.match(css, /--ff-light-content-max:1280px/)
})

test('UI01.2 aligns Constructor Import Projects and Help without introducing application logic', () => {
  assert.match(css, /hybrid-route-grid/)
  assert.match(css, /import-format-chooser/)
  assert.match(css, /projects-tabs button\[aria-selected="true"\]/)
  assert.match(css, /help-toolbar/)
  assert.doesNotMatch(css, /localStorage|sessionStorage|indexedDB|fetch\(|WebSocket|machineReady|productionApproved/i)
})

test('UI01.2 keeps responsive widths for desktop tablet and mobile', () => {
  assert.match(css, /@media\(max-width:900px\)/)
  assert.match(css, /@media\(max-width:560px\)/)
  assert.match(css, /calc\(100% - 40px\)/)
})
