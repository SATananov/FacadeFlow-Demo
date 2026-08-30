import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

test('06B.2.3 main workspaces share the unified FacadeFlow header', () => {
  const header = read('src/components/FacadeFlowWorkspaceHeader.tsx')
  assert.match(header, /ff-workspace-company-logo/)
  assert.match(header, /nadezhda-header\.png/)
  assert.match(header, /Назад към FacadeFlow/)

  for (const file of [
    'src/components/FacadeFlowAIWorkspace.tsx',
    'src/components/DetailDraftingPlaceholder.tsx',
    'src/components/DrawingImportWorkspace.tsx',
    'src/components/ProfileCatalogue.tsx',
    'src/components/HelpCenter.tsx',
    'src/components/CustomProductDesigner.tsx',
  ]) assert.match(read(file), /FacadeFlowWorkspaceHeader/, file)
})

test('06B.2.3 import catalogue help and custom CAD are first-class full workspaces', () => {
  const css = read('src/workspaceShell.css')
  assert.match(css, /drawing-import-overlay/)
  assert.match(css, /catalogue-overlay/)
  assert.match(css, /help-overlay/)
  assert.match(css, /custom-designer-overlay/)
  assert.match(css, /height:100dvh!important/)
  assert.match(css, /html:has\(\.ff-section-workspace\)/)
})

test('06B.2.3 keeps AI and production safety boundaries explicit', () => {
  const ai = read('src/components/FacadeFlowAIWorkspace.tsx')
  assert.match(ai, /AI моделът още не е свързан/)
  assert.match(ai, /Готово за машина/)
  const types = read('src/aiWorkspaceTypes.ts')
  assert.match(types, /machineReady: false/)
})
