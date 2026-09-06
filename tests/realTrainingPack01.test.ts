import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { NADEZHDA_GOLDEN_PATTERN_FIXTURES } from '../test-fixtures/real-data/nadezhdaGoldenPatternFixtures'
import {
  FACADEFLOW_REAL_TRAINING_PACK_01_SAFETY,
  FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES,
  FACADEFLOW_REAL_TRAINING_PACK_01_VERSION,
  canPromoteFacadeFlowRealTrainingSourceToGroundTruth,
  facadeFlowRealTrainingSourcesForStage,
} from '../src/realTraining/realTrainingPack01'
import { evaluateFacadeFlowRealTrainingOfferPattern } from '../src/realTraining/realTrainingPack01Evaluation'
import { routeFacadeFlowRealTrainingFailure } from '../src/realTraining/realTrainingFailureRouter'

test('REAL TRAINING PACK 01 contains seven offer families plus catalogue, DWG and pending human sketch evidence', () => {
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_VERSION, 'REAL_TRAINING_PACK_01')
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.length, 10)
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.filter((item) => item.sourceKind === 'ANONYMIZED_OFFER_PATTERN').length, 7)
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.filter((item) => item.sourceKind === 'PROFILE_CATALOGUE').length, 1)
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.filter((item) => item.sourceKind === 'DWG_EVIDENCE').length, 1)
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.filter((item) => item.sourceKind === 'HUMAN_SKETCH_REVIEW').length, 1)
})

test('REAL TRAINING PACK 01 covers exactly the seven existing anonymized Golden Pattern families', () => {
  const packFamilies = FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES
    .flatMap((item) => item.offerPatternFamily ? [item.offerPatternFamily] : [])
    .sort()
  const fixtureFamilies = NADEZHDA_GOLDEN_PATTERN_FIXTURES.map((item) => item.patternFamily).sort()
  assert.deepEqual(packFamilies, fixtureFamilies)
})

test('REAL TRAINING PACK 01 evaluates every Golden Pattern through the real extractor/bridge', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const result = evaluateFacadeFlowRealTrainingOfferPattern({
      id: fixture.id,
      patternFamily: fixture.patternFamily,
      sourceReference: fixture.sourceReference,
      sourceText: fixture.sourceText,
      expectation: {
        moduleCount: fixture.expectation.moduleCount,
        variantCount: fixture.expectation.variantCount,
        totalProductGroupCount: fixture.expectation.totalProductGroupCount,
        materials: fixture.expectation.materials,
        floorPlacementLabels: fixture.expectation.floorPlacementLabels,
      },
    })
    assert.equal(result.passed, true, `${fixture.id}: ${result.failures.join('; ')}`)
    assert.equal(result.sourceEvidenceOnly, true)
    assert.equal(result.automaticTrainingPromotionAllowed, false)
    assert.equal(result.machineReady, false)
    assert.equal(result.productionApproved, false)
  }
})

test('REAL TRAINING PACK 01 keeps REV-A sketch pending and every source outside automatic ground truth', () => {
  const sketch = FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.find((item) => item.id === 'RTP01-HUMAN-SKETCH-REV-A')!
  assert.equal(sketch.evidenceState, 'PENDING_HUMAN_CONFIRMATION')
  assert.equal(sketch.humanConfirmationRequiredForGroundTruth, true)
  for (const source of FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES) {
    assert.equal(canPromoteFacadeFlowRealTrainingSourceToGroundTruth(source), false)
    assert.equal(source.groundTruthAutomatically, false)
    assert.equal(source.machineReady, false)
    assert.equal(source.productionApproved, false)
  }
})

test('REAL TRAINING PACK 01 uses exact local evidence fingerprints only for PRELUDE and DWG references', () => {
  const hashed = FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.filter((item) => item.exactLocalSha256)
  assert.equal(hashed.length, 2)
  assert.deepEqual(hashed.map((item) => item.exactLocalSha256), [
    '1ba9174b1cf3974b4de171b57147dd4fad41d81958ea62d08b977223c5200f5f',
    'df6d1ecf0fde9cfb841fa6a4ae563979aa62be754f37197241e7005dfa8f44d8',
  ])
})

test('REAL TRAINING failure router creates a next prompt corpus only after a real prompt-language fail', () => {
  const language = routeFacadeFlowRealTrainingFailure({ documentStructurePassed: true, promptLanguagePassed: false, constructionSemanticsPassed: true, requiredProfileKnowledgeAvailable: true, humanConfirmationComplete: true })
  assert.equal(language.domain, 'PROMPT_LANGUAGE')
  assert.equal(language.nextLayer, 'NEXT_PROMPT_CORPUS')
  assert.equal(language.createNewPromptCorpusCase, true)

  const construction = routeFacadeFlowRealTrainingFailure({ documentStructurePassed: true, promptLanguagePassed: true, constructionSemanticsPassed: false, requiredProfileKnowledgeAvailable: true, humanConfirmationComplete: true })
  assert.equal(construction.nextLayer, 'AI05')
  assert.equal(construction.createNewPromptCorpusCase, false)

  const profile = routeFacadeFlowRealTrainingFailure({ documentStructurePassed: true, promptLanguagePassed: true, constructionSemanticsPassed: true, requiredProfileKnowledgeAvailable: false, humanConfirmationComplete: true })
  assert.equal(profile.nextLayer, 'PROFILE_DATA')

  const review = routeFacadeFlowRealTrainingFailure({ documentStructurePassed: true, promptLanguagePassed: true, constructionSemanticsPassed: true, requiredProfileKnowledgeAvailable: true, humanConfirmationComplete: false })
  assert.equal(review.nextLayer, 'HUMAN_REVIEW')
})

test('REAL TRAINING PACK 01 tracked implementation contains no original client/project identities', () => {
  const tracked = [
    readFileSync('src/realTraining/realTrainingPack01.ts', 'utf8'),
    readFileSync('src/realTraining/realTrainingPack01Evaluation.ts', 'utf8'),
    readFileSync('src/realTraining/realTrainingFailureRouter.ts', 'utf8'),
    readFileSync('tests/realTrainingPack01.test.ts', 'utf8'),
  ].join('\n')
  const privateMarkers = [
    'Крум' + 'овград', 'Де' + 'вин', 'Яго' + 'дово', 'Мо' + 'нек', 'Пламен' + ' Данев',
    'Момин' + 'ско', 'ВЕНИ' + ' 97', 'ГЕРТ' + ' ГРУП', 'ЕЛ ЛУКС' + ' ПРО',
  ]
  for (const marker of privateMarkers) assert.equal(tracked.includes(marker), false, marker)
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_SAFETY.privateOfferOriginalsTracked, false)
  assert.equal(FACADEFLOW_REAL_TRAINING_PACK_01_SAFETY.automaticModelWeightUpdateAllowed, false)
})

test('REAL TRAINING PACK 01 exposes stage-specific source subsets', () => {
  assert.equal(facadeFlowRealTrainingSourcesForStage('DOCUMENT_STRUCTURE').length, 7)
  assert.equal(facadeFlowRealTrainingSourcesForStage('PROFILE_KNOWLEDGE').length, 1)
  assert.equal(facadeFlowRealTrainingSourcesForStage('HUMAN_CONFIRMATION').length, 2)
})
