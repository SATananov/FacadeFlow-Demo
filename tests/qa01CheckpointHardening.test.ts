import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const runner = readFileSync('scripts/run-regression.mjs', 'utf8')
const checkpointScript = readFileSync('scripts/New-FacadeFlowCheckpoint.ps1', 'utf8')
const internalRunner = readFileSync('scripts/run-internal-evidence.mjs', 'utf8')
const status = readFileSync('docs/CURRENT_ARCHITECTURE_STATUS.md', 'utf8')
const acceptance = readFileSync('docs/QA01_CHECKPOINT_HARDENING_ACCEPTANCE.md', 'utf8')

test('QA01 exposes canonical full regression and verify commands', () => {
  assert.equal(packageJson.scripts['test:regression'], 'node scripts/run-regression.mjs')
  assert.equal(packageJson.scripts.verify, 'npm run test:regression && npm run lint && npm run build')
  assert.equal(packageJson.scripts['test:internal-evidence'], 'node scripts/run-internal-evidence.mjs')
  assert.equal(packageJson.scripts['verify:internal'], 'npm run test:regression && npm run test:internal-evidence && npm run lint && npm run build')
})

test('QA01 regression runner discovers all tests instead of maintaining a manual phase list', () => {
  assert.match(runner, /readdirSync\(testsDir\)/)
  assert.match(runner, /\.endsWith\('\.test\.ts'\)/)
  assert.match(runner, /!name\.endsWith\('\.internal\.test\.ts'\)/)
  assert.match(internalRunner, /\.endsWith\('\.internal\.test\.ts'\)/)
  assert.match(internalRunner, /local-samples/)
  assert.match(runner, /vite\.js/)
  assert.match(runner, /--test/)
  assert.doesNotMatch(runner, /realProductionRp01_21FinalClosure\.test\.ts/)
})

test('QA01 checkpoint packaging has explicit shareable and internal modes', () => {
  assert.match(checkpointScript, /ShareableClean/)
  assert.match(checkpointScript, /InternalAudit/)
  assert.match(checkpointScript, /local-samples/)
  assert.match(checkpointScript, /\*\.dwg/)
  assert.match(checkpointScript, /\*\.lte/)
  assert.match(checkpointScript, /verify:internal/)
  assert.match(checkpointScript, /New-PortableZip/)
  assert.match(checkpointScript, /Assert-PortableZip/)
  assert.match(checkpointScript, /entryName/)
  assert.match(checkpointScript, /Contains/)
  assert.match(checkpointScript, /src\/\*/)
})

test('QA01 status source of truth preserves closed safety boundaries and identifies PROJECT01.1 next', () => {
  for (const token of [
    'UI01.2B',
    'AI04',
    'RP01.1–RP01.21',
    'machineReady',
    'productionApproved',
    'SHAREABLE_CLEAN',
    'PROJECT01.1',
  ]) {
    assert.match(status, new RegExp(token))
  }
  assert.match(acceptance, /non-feature maintenance phase/i)
  assert.match(acceptance, /must not change UI behavior/i)
})
