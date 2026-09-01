import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
const panel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')
const interpreter = readFileSync('src/aiPromptInterpreter.ts', 'utf8')

test('AI01.4 replaces the permanently disabled placeholder with the prompt interpretation panel', () => {
  assert.match(workspace, /PromptInterpretationPanel/)
  assert.doesNotMatch(workspace, /Разчети свободния текст с AI<\/button>/)
  assert.match(panel, /Разчети описанието/)
  assert.match(panel, /Прехвърли разпознатото към формуляра/)
})

test('AI01.4 visibly states local/no-network/human-review boundaries', () => {
  assert.match(panel, /без външен модел \/ без мрежа/)
  assert.match(panel, /AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · MACHINE READY: NO/)
  assert.match(workspace, /Външен AI модел още не е свързан/)
})

test('AI01.4 prompt interpreter contains no network, machine or dynamic-code execution path', () => {
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'eval(', 'new Function', 'child_process', 'machineReady: true', 'productionApproved: true']) {
    assert.equal(interpreter.includes(forbidden), false, `forbidden token: ${forbidden}`)
  }
})

test('AI01.4 stale prompt results cannot be applied after the source text changes', () => {
  assert.match(panel, /result\.sourceText !== sourceText/)
  assert.match(panel, /if \(!bridge \|\| !result\?\.validForHumanReview \|\| stale\) return/)
})
