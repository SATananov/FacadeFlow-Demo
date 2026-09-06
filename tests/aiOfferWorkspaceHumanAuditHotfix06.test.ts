import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  NADEZHDA_OFFER_ISSUER,
  createEmptyFacadeFlowOfferCustomer,
  facadeFlowOfferCustomerMissing,
  facadeFlowOfferCustomerReady,
} from '../src/aiOfferPartyDetails'

test('Offer issuer is prefilled only from the provided Nadezhda company header evidence', () => {
  assert.equal(NADEZHDA_OFFER_ISSUER.name, 'НАДЕЖДА')
  assert.equal(NADEZHDA_OFFER_ISSUER.city, 'Кърджали')
  assert.equal(NADEZHDA_OFFER_ISSUER.district, 'кв. „Студен кладенец“')
  assert.equal(NADEZHDA_OFFER_ISSUER.street, 'ул. „Дарец“ № 9')
  assert.equal(NADEZHDA_OFFER_ISSUER.email, 'nadejda94@mail.bg')
  assert.equal(Object.prototype.hasOwnProperty.call(NADEZHDA_OFFER_ISSUER, 'phone'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(NADEZHDA_OFFER_ISSUER, 'eik'), false)
})

test('Customer draft requires only type and name before beginner workflow can regard the identity step as ready', () => {
  const customer = createEmptyFacadeFlowOfferCustomer()
  assert.equal(facadeFlowOfferCustomerReady(customer), false)
  assert.deepEqual(facadeFlowOfferCustomerMissing(customer), ['тип възложител', 'име / фирма'])
  customer.kind = 'COMPANY'
  customer.name = 'Пример ООД'
  assert.equal(facadeFlowOfferCustomerReady(customer), true)
  assert.deepEqual(facadeFlowOfferCustomerMissing(customer), [])
})

test('Offer workspace shows issuer and customer as a first explicit offer step', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  const parties = readFileSync('src/components/OfferPartyDetailsPanel.tsx', 'utf8')
  assert.match(panel, /Страни по офертата/)
  assert.match(panel, /<OfferPartyDetailsPanel/)
  assert.match(panel, /Създай нова оферта/)
  assert.match(parties, /ИЗПЪЛНИТЕЛ/)
  assert.match(parties, /ВЪЗЛОЖИТЕЛ/)
  assert.match(parties, /Попълнено автоматично/)
  assert.match(parties, /Тип възложител/)
  assert.match(parties, /Име \/ фирма/)
  assert.match(parties, /Лице за контакт/)
  assert.match(parties, /Телефон/)
  assert.match(parties, /Адрес \/ наименование на обекта/)
})

test('Guided create-module flow starts with safe blank values instead of silently preselecting dimensions or quantity', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  assert.match(guided, /const \[widthMm, setWidthMm\] = useState\(''\)/)
  assert.match(guided, /const \[heightMm, setHeightMm\] = useState\(''\)/)
  assert.match(guided, /const \[quantity, setQuantity\] = useState\(''\)/)
  assert.match(guided, /<option value="">Избери<\/option>/)
  assert.match(guided, /Следващият свободен номер е Модул/)
})

test('Guided AI does not show unrelated cell recommendations while user is creating a module', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  assert.match(guided, /action === 'CREATE_MODULE' \|\| action === 'SET_OFFER_SETTING' \|\| action === 'SET_MODULE_SETTING'/)
  assert.match(guided, /ПРЕГЛЕД НА ИЗБОРА/)
  assert.doesNotMatch(guided, /КАКВО ЩЕ НАПРАВИ AI ПОМОЩНИКЪТ/)
})

test('Help controls and edit controls have dedicated compact styling instead of inheriting stretched global button styles', () => {
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(css, /button\.ff-guided-help-button/)
  assert.match(css, /width:22px!important/)
  assert.match(css, /height:22px!important/)
  assert.match(css, /aspect-ratio:1\/1!important/)
  assert.match(css, /\.ff-edit-setting-button/)
  assert.match(panel, /✎ Редактирай/)
})

test('Beginner offer identity panel has question-mark help and clear readiness feedback', () => {
  const parties = readFileSync('src/components/OfferPartyDetailsPanel.tsx', 'utf8')
  assert.match(parties, /className="ff-offer-help-button"/)
  assert.match(parties, /Покажи помощ/)
  assert.match(parties, /ГОТОВО ЗА РАБОТНА ЧЕРНОВА/)
  assert.match(parties, /НУЖНИ СА ОСНОВНИ ДАННИ/)
})

test('Hotfix 06 stays inside human-review boundaries and does not add machine or production actions', () => {
  const parties = readFileSync('src/aiOfferPartyDetails.ts', 'utf8')
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  for (const forbidden of ['SEND_TO_MACHINE', 'MACHINE_READY = true', 'PRODUCTION_APPROVED = true']) {
    assert.equal(parties.includes(forbidden), false)
    assert.equal(guided.includes(forbidden), false)
  }
})
