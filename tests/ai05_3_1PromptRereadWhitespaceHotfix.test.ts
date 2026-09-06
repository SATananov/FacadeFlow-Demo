import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'

const panel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')

test('AI05.3.1 normalizes textarea whitespace before stale comparison', () => {
  const multiline = 'window 1800 x 1400 mm,\nthree fields,\ncenter openable'
  const normalizedUiSource = multiline.replace(/\s+/g, ' ').trim()
  const result = interpretFacadeFlowPrompt(multiline, 'ai05-3-1-whitespace')
  assert.equal(result.sourceText, normalizedUiSource)
  assert.match(panel, /session\.job\.description\.replace\(\/\\s\+\/g, ' '\)\.trim\(\)/)
  assert.match(panel, /result\.sourceText !== sourceText/)
})

test('AI05.3.1 makes the stale state actionable without presenting the status badge as a button', () => {
  assert.match(panel, /stale \? 'Разчети отново' : 'Разчети описанието'/)
  assert.match(panel, /stale \? 'ТЕКСТЪТ Е ПРОМЕНЕН'/)
  assert.doesNotMatch(panel, /ТЕКСТЪТ Е ПРОМЕНЕН · РАЗЧЕТИ ОТНОВО/)
})
