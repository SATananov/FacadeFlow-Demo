import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  RP01_FINAL_CLOSURE_MANIFEST,
} from '../src/realProduction/rp01FinalClosure'

test('RP01.21 closes exactly RP01.1 through RP01.20', () => {
  const manifest = RP01_FINAL_CLOSURE_MANIFEST

  assert.equal(manifest.phaseCount, 20)
  assert.equal(manifest.phases.length, 20)
  assert.equal(manifest.phaseRange, 'RP01.1-RP01.20')

  const expected = Array.from(
    { length: 20 },
    (_, index) => `RP01.${index + 1}`,
  )
  assert.deepEqual(
    manifest.phases.map((phase) => phase.phaseId),
    expected,
  )

  assert.equal(
    new Set(manifest.phases.map((phase) => phase.phaseId)).size,
    20,
  )
  assert.ok(
    manifest.phases.every((phase) => phase.status === 'CLOSED'),
  )
})

test('RP01.21 dependency chain is contiguous and deterministic', () => {
  const phases = RP01_FINAL_CLOSURE_MANIFEST.phases

  assert.equal(phases[0].dependsOn, null)

  for (let index = 1; index < phases.length; index += 1) {
    assert.equal(
      phases[index].dependsOn,
      phases[index - 1].phaseId,
    )
  }
})

test('RP01.21 architecture preserves evidence, simulation, and read-only boundaries', () => {
  const phases = RP01_FINAL_CLOSURE_MANIFEST.phases

  assert.deepEqual(
    phases.slice(0, 9).map((phase) => phase.authorityBoundary),
    Array(9).fill('EVIDENCE_ONLY'),
  )

  assert.deepEqual(
    phases.slice(9, 15).map((phase) => phase.authorityBoundary),
    Array(6).fill('SIMULATION_ONLY'),
  )

  assert.deepEqual(
    phases.slice(15).map((phase) => phase.authorityBoundary),
    Array(5).fill('READ_ONLY'),
  )
})

test('RP01.21 records the current real-corpus truth without inventing cross-project corroboration', () => {
  const manifest = RP01_FINAL_CLOSURE_MANIFEST

  assert.equal(manifest.realCorpusProjectCount, 1)
  assert.deepEqual(manifest.realCorpusProjects, ['Вадим-2'])
  assert.equal(
    manifest.realCrossProjectCorroborationAvailable,
    false,
  )
})

test('RP01.21 final closure requires an explicit human plan before a future phase', () => {
  const manifest = RP01_FINAL_CLOSURE_MANIFEST

  assert.equal(manifest.foundationClosed, true)
  assert.equal(manifest.architectureConsolidated, true)
  assert.equal(manifest.regressionClosureRequired, true)
  assert.equal(manifest.nextPhaseRequiresExplicitHumanPlan, true)
  assert.equal(manifest.reOpenRequiresNewAcceptanceChange, true)
})

test('RP01.21 final closure never asserts engineering truth, production readiness, or machine integration', () => {
  const manifest = RP01_FINAL_CLOSURE_MANIFEST
  const safety = manifest.safety

  assert.equal(safety.automaticRulePromotionAllowed, false)
  assert.equal(safety.automaticOutcomeInferenceAllowed, false)
  assert.equal(
    safety.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
  assert.equal(safety.scenarioGeneralizationAllowed, false)
  assert.equal(safety.engineeringAuthorityGranted, false)
  assert.equal(safety.productionExecutable, false)
  assert.equal(safety.productionAuthorityGranted, false)
  assert.equal(safety.machineInstructionGenerated, false)
  assert.equal(safety.productionUnlockAllowed, false)
  assert.equal(safety.machineReady, false)
  assert.equal(safety.productionApproved, false)

  assert.equal(
    manifest.closureDoesNotAssertEngineeringTruth,
    true,
  )
  assert.equal(
    manifest.closureDoesNotAssertProductionReadiness,
    true,
  )
  assert.equal(
    manifest.closureDoesNotCreateMachineIntegration,
    true,
  )

  const source = readFileSync(
    'src/realProduction/rp01FinalClosure.ts',
    'utf8',
  )

  assert.doesNotMatch(
    source,
    /automaticRulePromotionAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /automaticOutcomeInferenceAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /inferenceBeyondReviewedScenariosAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /scenarioGeneralizationAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /engineeringAuthorityGranted:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /productionExecutable:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /productionAuthorityGranted:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /machineInstructionGenerated:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /productionUnlockAllowed:\s*true/,
  )
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
