import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const runner = readFileSync('scripts/run-regression.mjs', 'utf8')
const checkpointScript = readFileSync('scripts/New-FacadeFlowCheckpoint.ps1', 'utf8')
const internalRunner = readFileSync('scripts/run-internal-evidence.mjs', 'utf8')
const status = readFileSync('docs/CURRENT_ARCHITECTURE_STATUS.md', 'utf8')
const acceptance = readFileSync('docs/QA01_CHECKPOINT_HARDENING_ACCEPTANCE.md', 'utf8')

// QA01 established the canonical verification/checkpoint primitives.
// QA02 later widens the discovered TypeScript test extensions from .ts only to .ts + .tsx.

test('QA01 canonical full regression and verify commands remain intact', () => {
  assert.equal(packageJson.scripts['test:regression'], 'node scripts/run-regression.mjs')
  assert.equal(packageJson.scripts.verify, 'npm run test:regression && npm run lint && npm run build')
  assert.equal(packageJson.scripts['test:internal-evidence'], 'node scripts/run-internal-evidence.mjs')
  assert.equal(packageJson.scripts['verify:internal'], 'npm run test:regression && npm run test:internal-evidence && npm run lint && npm run build')
})

test('QA01 dynamic discovery/checkpoint separation remains intact after QA02 extension hardening', () => {
  assert.match(runner, /readdirSync\(testsDir\)/)
  assert.match(runner, /isTypeScriptTest/)
  assert.match(runner, /isInternalEvidenceTest/)
  assert.match(internalRunner, /isInternalEvidenceTest/)
  assert.match(internalRunner, /local-samples/)
  assert.match(runner, /vite\.js/)
  assert.match(runner, /--test/)
  assert.doesNotMatch(runner, /realProductionRp01_21FinalClosure\.test\.ts/)
})

test('QA01 checkpoint packaging has explicit shareable/internal modes and strict provenance guards', () => {
  assert.match(checkpointScript, /ShareableClean/)
  assert.match(checkpointScript, /InternalAudit/)
  assert.match(checkpointScript, /local-samples/)
  assert.match(checkpointScript, /\*\.dwg/)
  assert.match(checkpointScript, /\*\.lte/)
  assert.match(checkpointScript, /verify:internal/)
  assert.match(checkpointScript, /New-PortableZip/)
  assert.match(checkpointScript, /Assert-PortableZip/)
  assert.match(checkpointScript, /Get-PortableEntryMap/)
  assert.match(checkpointScript, /Write-DeterministicPayloadManifest/)
  assert.match(checkpointScript, /CHECKPOINT_CONTENT_SHA256\.txt/)
  assert.match(checkpointScript, /StringComparer]::Ordinal/)
  assert.match(checkpointScript, /1980, 1, 1/)
  assert.match(checkpointScript, /git remote get-url origin/)
  assert.match(checkpointScript, /git fetch origin/)
  assert.match(checkpointScript, /refs\/remotes\/origin\/\$branch/)
  assert.match(checkpointScript, /ShareableClean checkpoints cannot use -SkipVerify/)
  assert.match(checkpointScript, /src\/\*/)
})

test('QA01 checkpoint ZIP writer loads both compression assemblies for Windows PowerShell 5.1', () => {
  assert.match(checkpointScript, /Add-Type -AssemblyName System\.IO\.Compression\r?\n/)
  assert.match(checkpointScript, /Add-Type -AssemblyName System\.IO\.Compression\.FileSystem/)
})

test('QA01 status source of truth preserves core safety/checkpoint boundaries while current checkpoint advances', () => {
  for (const token of [
    'AI04',
    'RP01.1–RP01.21',
    'machineReady',
    'productionApproved',
    'SHAREABLE_CLEAN',
    '9d185aa',
    'QA02',
  ]) {
    assert.match(status, new RegExp(token))
  }
  assert.match(acceptance, /non-feature maintenance phase/i)
  assert.match(acceptance, /must not change UI behavior/i)
})
