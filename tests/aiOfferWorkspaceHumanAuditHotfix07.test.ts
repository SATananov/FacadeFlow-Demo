import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('Guided setting edit no longer forces a free-text value when verified catalogue alternatives are unavailable', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  assert.match(guided, /Няма заредени други проверени варианти/)
  assert.match(guided, /Остави неуточнено/)
  assert.match(guided, /Остави без промяна/)
  assert.match(guided, /Въведи стойност, която знам/)
  assert.match(guided, /Отвори Данни и каталози/)
  assert.doesNotMatch(guided, /placeholder="Въведи стойност за човешка проверка"/)
})

test('Manual fallback clearly says that a user-known value remains under human review', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  assert.match(guided, /Въведи само стойност, която имаш от клиент, документ или каталог/)
  assert.match(guided, /не става автоматично производствен факт/)
  assert.match(guided, /БЕЗОПАСЕН ИЗБОР/)
})

test('Catalogue fallback is wired to the real profile catalogue action instead of a dead visual button', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  const offer = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  assert.match(guided, /onOpenCatalogues\?: \(\) => void/)
  assert.match(offer, /onOpenProfileCatalogue\?: \(\) => void/)
  assert.match(offer, /onOpenCatalogues=\{onOpenProfileCatalogue\}/)
  assert.match(workspace, /onOpenProfileCatalogue=\{onOpenProfileCatalogue\}/)
})

test('Setting edit suppresses unrelated recommended next actions while the user is resolving one field', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  assert.match(guided, /action === 'CREATE_MODULE' \|\| action === 'SET_OFFER_SETTING' \|\| action === 'SET_MODULE_SETTING'/)
})

test('Advanced command preview is moved under additional options while primary apply remains visible', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  assert.match(guided, /Допълнителни опции/)
  assert.match(guided, /Прегледай като текст/)
  assert.match(guided, /Приложи избора/)
  assert.match(guided, /ff-guided-preview-actions/)
})

test('Offer workflow labels all four beginner steps explicitly', () => {
  const offer = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  const parties = readFileSync('src/components/OfferPartyDetailsPanel.tsx', 'utf8')
  assert.match(parties, /СТЪПКА 1 ОТ 4 · ДАННИ ЗА ОФЕРТАТА/)
  assert.match(offer, /СТЪПКА 2 ОТ 4 · ОБЩИ НАСТРОЙКИ/)
  assert.match(offer, /СТЪПКА 3 ОТ 4/)
  assert.match(offer, /СТЪПКА 4 ОТ 4 · ЧОВЕШКИ ПРЕГЛЕД/)
})

test('Offer party wording is beginner-friendly Bulgarian and clarifies physical-person contact data', () => {
  const parties = readFileSync('src/components/OfferPartyDetailsPanel.tsx', 'utf8')
  assert.match(parties, /Електронна поща/)
  assert.match(parties, /само ако е различно/)
  assert.match(parties, /Жилищна сграда/)
  assert.doesNotMatch(parties, /<span>e-mail<\/span>/)
})

test('Hotfix 07 remains human-review-only and introduces no production authority', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  const offer = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  for (const forbidden of ['MACHINE_READY = true', 'PRODUCTION_APPROVED = true', 'SEND_TO_MACHINE']) {
    assert.equal(guided.includes(forbidden), false)
    assert.equal(offer.includes(forbidden), false)
  }
})
