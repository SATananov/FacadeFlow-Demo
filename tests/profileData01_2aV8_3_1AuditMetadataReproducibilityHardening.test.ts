import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { PRELUDE_60_SYSTEM_LABEL } from '../src/profileData/prelude60BaseProfiles'
import { PRELUDE_60_VISIBLE_PROFILE_GEOMETRY } from '../src/profileData/visibleProfileGeometry'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const checkpoint = readFileSync('scripts/New-FacadeFlowCheckpoint.ps1', 'utf8')
const status = readFileSync('docs/CURRENT_ARCHITECTURE_STATUS.md', 'utf8')
const readme = readFileSync('README.md', 'utf8')

test('V8.3.1 normalizes PRELUDE system labels without changing confirmed geometry', () => {
  for (const code of ['482.30', '482.21', '482.05']) {
    assert.equal(PRELUDE_60_VISIBLE_PROFILE_GEOMETRY[code].systemLabel, PRELUDE_60_SYSTEM_LABEL)
  }
  assert.equal(PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.30'].visibleWidthMm, 42)
  assert.equal(PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.21'].visibleWidthMm, 40)
  assert.equal(PRELUDE_60_VISIBLE_PROFILE_GEOMETRY['482.05'].visibleWidthMm, 56)
})

test('V8.3.1 declares the supported Node/npm runtime contract', () => {
  assert.equal(readFileSync('.nvmrc', 'utf8').trim(), '22.12.0')
  assert.equal(readFileSync('.node-version', 'utf8').trim(), '22.12.0')
  assert.equal(packageJson.engines.node, '^20.19.0 || ^22.12.0 || ^24.0.0')
  assert.equal(packageJson.engines.npm, '>=10.0.0 <12')
})

test('V8.3.1 shareable checkpoint requires verified origin sync and canonical verify', () => {
  for (const marker of [
    'ShareableClean checkpoints cannot use -SkipVerify',
    'git remote get-url origin',
    'git fetch origin',
    'refs/remotes/origin/$branch',
    'origin/$branch...HEAD',
    '0`t0',
  ]) assert.equal(checkpoint.includes(marker), true)
})

test('V8.3.1 checkpoint writes deterministic content provenance', () => {
  for (const marker of [
    'Write-DeterministicPayloadManifest',
    'CHECKPOINT_CONTENT_SHA256.txt',
    'Payload manifest SHA-256',
    'StringComparer]::Ordinal',
    '1980, 1, 1',
    'Commit time:',
  ]) assert.equal(checkpoint.includes(marker), true)
  assert.equal(checkpoint.includes('Created: $(Get-Date'), false)
})

test('V8.3.1 source-of-truth docs describe V8-V8.3 as closed and keep production safety explicit', () => {
  assert.equal(status.includes('functionally CLOSED / independently audited at `7071c2b`'), true)
  assert.equal(status.includes('V8.3 | CLOSED / INDEPENDENT AUDIT PASS'), true)
  assert.equal(readme.includes('функционално затворен и независимо одитиран'), true)
  for (const marker of ['machineReady', 'productionApproved', 'production authority']) {
    assert.equal(status.includes(marker) || readme.includes(marker), true)
  }
})
