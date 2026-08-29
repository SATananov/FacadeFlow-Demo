import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const shell = readFileSync('src/components/DrawingWorkspaceShell.tsx', 'utf8')
const css = readFileSync('src/drawingWorkspaceShell.css', 'utf8')
const designer = readFileSync('src/components/CustomProductDesigner.tsx', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

test('Phase 06A.9 shell exposes the seven layout-only workspace slots', () => {
  for (const slot of ['header', 'progress', 'settings', 'toolbar', 'viewport', 'properties', 'status']) assert.match(shell, new RegExp(`${slot}: ReactNode|${slot}\\?: ReactNode`))
  for (const region of ['drawing-workspace-header', 'drawing-workspace-progress', 'drawing-workspace-settings', 'drawing-workspace-toolbar', 'drawing-workspace-viewport', 'drawing-workspace-properties', 'drawing-workspace-status']) assert.ok(shell.includes(region), region)
  assert.equal(pkg.scripts['test:phase06a9'].includes('tests/phase06a9.test.ts'), true)
})

test('shell owns only collapsible layout state and no product or drawing behavior', () => {
  assert.match(shell, /useState\(true\)/)
  assert.match(shell, /aria-expanded=\{settingsVisible\}/)
  assert.match(shell, /hidden=\{!settingsVisible\}/)
  assert.match(shell, /Скрий настройките/)
  assert.match(shell, /Покажи настройките/)
  for (const forbidden of ['geometry', 'validation', 'exportCustomProduct', 'download', 'Blob(', 'fetch(', 'localStorage', 'Line', 'Polyline', 'Rectangle', 'Circle', 'Arc', 'snap', 'pointer']) assert.equal(shell.includes(forbidden), false, forbidden)
})

test('desktop shell consumes the viewport and isolates properties and status overflow', () => {
  assert.match(css, /grid-template-rows: max-content max-content max-content max-content minmax\(180px,1fr\) max-content/)
  assert.match(css, /height: calc\(100dvh - 24px\)/)
  assert.match(css, /\.drawing-workspace-main \{[^}]*grid-template-columns: minmax\(0,1fr\) clamp\(270px,23vw,330px\)/)
  assert.match(css, /\.drawing-workspace-properties \{[^}]*overflow: auto/)
  assert.match(css, /\.drawing-workspace-status \{ max-height: min\(132px,18dvh\); overflow: auto/)
  assert.match(css, /\.drawing-workspace-viewport \.custom-drawing-scroll \{[^}]*height: 100%;[^}]*min-height: 0;/)
  assert.match(css, /\.drawing-workspace-viewport \.custom-product-drawing \{[^}]*height: 100%;[^}]*max-height: 100%;/)
  assert.doesNotMatch(css, /transform:\s*scale|zoom:/)
})

test('narrow shell returns to one-column normal vertical flow', () => {
  assert.match(css, /@media \(max-width: 900px\)/)
  assert.match(css, /\.drawing-workspace-main \{ grid-template-columns: minmax\(0,1fr\); overflow: visible; \}/)
  assert.match(css, /\.drawing-workspace-viewport,\.drawing-workspace-properties \{ overflow: visible; \}/)
})

test('annotation toolbar wraps without desktop horizontal scrolling', () => {
  assert.match(css, /\.drawing-workspace-toolbar \.dimension-controls \{[^}]*min-width: 0;[^}]*flex-wrap: wrap;[^}]*overflow: visible;/)
  assert.match(css, /\.drawing-workspace-toolbar \.dimension-controls label \{[^}]*white-space: nowrap;/)
  assert.doesNotMatch(css, /\.drawing-workspace-toolbar \.dimension-controls \{[^}]*overflow-x:\s*auto/)
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.drawing-workspace-toolbar \.dimension-controls label \{[^}]*min-height: 42px;[^}]*white-space: normal;/)
})

test('component list is an accessible view-only disclosure with independent scrolling', () => {
  assert.match(designer, /\[componentsVisible, setComponentsVisible\] = useState\(false\)/)
  assert.match(designer, /aria-expanded=\{componentsVisible\}/)
  assert.match(designer, /aria-controls="custom-component-list-content"/)
  assert.match(designer, /hidden=\{!componentsVisible\}/)
  assert.match(designer, /setComponentsVisible\(\(visible\) => !visible\)/)
  assert.match(css, /\.custom-component-list-content \{[^}]*max-height:[^;]+;[^}]*overflow-y: auto;[^}]*overflow-x: hidden;/)
  assert.match(css, /\.custom-component-list-heading button:focus-visible/)
  for (const forbidden of ['localStorage', 'sessionStorage']) assert.equal(designer.includes(forbidden), false, forbidden)
})

test('component disclosure preserves selection, history, footer and viewport containment', () => {
  assert.match(designer, /<CustomProductSummary components=\{components\} selectedId=\{selectedSummaryId\} onSelect=\{setSelectedSummaryId\}/)
  const disclosureEnd = designer.indexOf('</section><footer className="custom-designer-footer">')
  assert.ok(disclosureEnd > designer.indexOf('custom-component-list-region'))
  assert.doesNotMatch(designer, /setComponentsVisible[\s\S]{0,100}(pushHistory|apply\(|undo|redo)/)
  assert.match(css, /\.drawing-workspace-status:has\(\.custom-component-list-content:not\(\[hidden\]\)\) \{ max-height:/)
  assert.match(css, /\.drawing-workspace-viewport \.custom-product-drawing \{[^}]*height: 100%;[^}]*max-height: 100%;/)
})

test('CustomProductDesigner supplies existing handlers and regions to the shared shell', () => {
  assert.match(designer, /<DrawingWorkspaceShell[^>]*header=\{header\}[^>]*progress=\{progress\}[^>]*settings=\{settings\}[^>]*toolbar=\{toolbar\}[^>]*viewport=\{viewport\}[^>]*properties=\{properties\}[^>]*status=\{status\}/)
  for (const behavior of ['onClick={undo}', 'onClick={redo}', 'onSelectField={setSelectedFieldId}', 'onSplit={changeSplit}', 'onClick={verify}', 'exportCustomProduct(product, profiles, components, validation)']) assert.ok(designer.includes(behavior), behavior)
  assert.match(designer, /Detail|free CAD|свободен CAD/i)
})
