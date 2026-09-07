import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

const regressionRunner = readFileSync('scripts/run-regression.mjs', 'utf8')
const internalRunner = readFileSync('scripts/run-internal-evidence.mjs', 'utf8')
const promptPanel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')
const readme = readFileSync('README.md', 'utf8')
const status = readFileSync('docs/CURRENT_ARCHITECTURE_STATUS.md', 'utf8')
const acceptance = readFileSync('docs/QA02_REGRESSION_WORKFLOW_DOCUMENTATION_HARDENING_ACCEPTANCE.md', 'utf8')
const shareableTextRoots = ['src', 'tests', 'docs', 'test-fixtures'] as const

const testNames = readdirSync('tests')
const shareableTsx = testNames.filter((name) => name.endsWith('.test.tsx') && !name.endsWith('.internal.test.tsx'))

test('QA02 canonical shareable regression discovers both .test.ts and .test.tsx while excluding internal evidence', () => {
  assert.ok(shareableTsx.length > 0, 'Expected existing shareable .test.tsx coverage')
  assert.match(regressionRunner, /\/\\\.test\\\.tsx\?\$\//)
  assert.match(regressionRunner, /\/\\\.internal\\\.test\\\.tsx\?\$\//)
  assert.match(regressionRunner, /name\.replace\(\/\\\.tsx\?\$\//)
  assert.match(regressionRunner, /tests\/\*\.test\.ts or tests\/\*\.test\.tsx/)
  assert.doesNotMatch(regressionRunner, /name\.endsWith\('\.test\.ts'\)/)
})

test('QA02 internal-evidence runner uses the same TypeScript/TSX extension contract', () => {
  assert.match(internalRunner, /\/\\\.internal\\\.test\\\.tsx\?\$\//)
  assert.match(internalRunner, /name\.replace\(\/\\\.tsx\?\$\//)
  assert.match(internalRunner, /\.internal\.test\.tsx/)
})

test('QA02 normal human-prompt route has one canonical V1-to-V6 review state machine', () => {
  assert.match(promptPanel, /<RealUserWorkflowV2ToV6Panel\b/)
  const legacyProposalRenderCount = promptPanel.match(/<ParametricConstructionProposalPanel\b/g)?.length ?? 0
  assert.equal(legacyProposalRenderCount, 1, 'Legacy AI03 panel may remain only in the direct structured quick route')
  assert.doesNotMatch(promptPanel, /ff-ai03-legacy-safety-note/)
})


test('QA02 shareable tracked evidence redacts the audited private identifiers and source fingerprints', () => {
  const sensitive = [
    `${String.fromCharCode(1042, 1072, 1076, 1080, 1084)}-2`,
    `${String.fromCharCode(86, 97, 100, 105, 109)}-2`,
    String.fromCharCode(86,97,100,105,109,32,88,97,115,107,111,118,50),
    ['1000292', '00082'].join(''),
    ['2000292', '00067'].join(''),
    ['1000292', '00069'].join(''),
    ['1FAFBDE7A13A28936EDC9FE9382DB5F', '50DA6B22D8168CF5959D95AE053E8DF08'].join(''),
    ['6D753E558A1EA330573F2555F34603CD', '406EC9C6842A4CAB4EE210D1450A272A'].join(''),
  ]
  const files: string[] = []
  const walk = (path: string) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = `${path}/${entry.name}`
      if (entry.isDirectory()) walk(child)
      else files.push(child)
    }
  }
  for (const root of shareableTextRoots) walk(root)
  for (const file of files) {
    let text = ''
    try { text = readFileSync(file, 'utf8') } catch { continue }
    for (const value of sensitive) assert.equal(text.includes(value), false, `${file} still contains redacted value ${value}`)
  }
  const evidenceSource = readFileSync('src/nadezhdaCatalogueEvidence.ts', 'utf8')
  assert.match(evidenceSource, /PROJECT_EVIDENCE_A/)
  assert.match(evidenceSource, /SHAREABLE_REDACTED_XML_SHA256/)
  assert.match(evidenceSource, /SHAREABLE_REDACTED_LTE_SHA256/)
})

test('QA02 current documentation names the real workflow, PROFILE DATA knowledge chain and locked production gates', () => {
  for (const source of [readme, status]) {
    assert.match(source, /9d185aa/)
    assert.match(source, /REAL USER WORKFLOW V1/)
    assert.match(source, /V2–V6/)
    assert.match(source, /PROFILE DATA 03/)
    assert.match(source, /MACHINE READY.*NO|machineReady.*false/i)
    assert.match(source, /\.test\.tsx/)
  }
  assert.match(acceptance, /maintenance/i)
  assert.match(acceptance, /single canonical/i)
  assert.match(acceptance, /production.*locked/i)
})
