import { useState, type ChangeEvent } from 'react'
import {
  NADEZHDA_OFFER_ISSUER,
  facadeFlowOfferCustomerMissing,
  facadeFlowOfferCustomerReady,
  type FacadeFlowOfferCustomerDetails,
} from '../aiOfferPartyDetails'

interface OfferPartyDetailsPanelProps {
  customer: FacadeFlowOfferCustomerDetails
  onCustomerChange: (customer: FacadeFlowOfferCustomerDetails) => void
}

function MiniHelp({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return <span className="ff-offer-help-wrap">
    <button type="button" className="ff-offer-help-button" aria-label="Покажи помощ" aria-expanded={open} onClick={() => setOpen((value) => !value)}>?</button>
    {open && <span className="ff-offer-help-popover" role="tooltip">{text}</span>}
  </span>
}

export function OfferPartyDetailsPanel({ customer, onCustomerChange }: OfferPartyDetailsPanelProps) {
  const missing = facadeFlowOfferCustomerMissing(customer)
  const ready = facadeFlowOfferCustomerReady(customer)
  const update = <K extends keyof FacadeFlowOfferCustomerDetails>(key: K, value: FacadeFlowOfferCustomerDetails[K]) => {
    onCustomerChange({ ...customer, [key]: value })
  }

  return <section className="ff-offer-parties" aria-label="Страни по офертата">
    <header className="ff-offer-parties-head">
      <div>
        <span>СТЪПКА 1 ОТ 4 · ДАННИ ЗА ОФЕРТАТА</span>
        <h5>Кой изготвя офертата и за кого е тя?</h5>
        <p>Данните на изпълнителя са попълнени автоматично. За възложителя попълни само известните ти данни.</p>
      </div>
      <MiniHelp text="Изпълнител е фирмата, която изготвя офертата. Възложител е клиентът, за когото се подготвя тя. За начало са задължителни само типът на възложителя и неговото име или фирма."/>
    </header>

    <div className="ff-offer-parties-grid">
      <article className="ff-offer-party-card issuer">
        <div className="ff-offer-party-card-title">
          <div><span>ИЗПЪЛНИТЕЛ</span><b>Попълнено автоматично</b></div>
          <MiniHelp text="Тези данни идват от предоставената фирмена бланка на „Надежда“. Не се дописват непотвърдени телефон, ЕИК или други реквизити."/>
        </div>
        <img src={NADEZHDA_OFFER_ISSUER.logoSrc} alt="Надежда - алуминиева и PVC дограма"/>
        <div className="ff-offer-issuer-data">
          <strong>{NADEZHDA_OFFER_ISSUER.name}</strong>
          <span>{NADEZHDA_OFFER_ISSUER.activity}</span>
          <span>{NADEZHDA_OFFER_ISSUER.postalCode} {NADEZHDA_OFFER_ISSUER.city}</span>
          <span>{NADEZHDA_OFFER_ISSUER.district}, {NADEZHDA_OFFER_ISSUER.street}</span>
          <span>Електронна поща: {NADEZHDA_OFFER_ISSUER.email}</span>
        </div>
      </article>

      <article className="ff-offer-party-card customer">
        <div className="ff-offer-party-card-title">
          <div><span>ВЪЗЛОЖИТЕЛ</span><b>{ready ? 'Основните данни са въведени' : 'Нужно е кратко попълване'}</b></div>
          <MiniHelp text="Ако клиентът е физическо лице, въведи неговото име. Ако е фирма, въведи фирменото име; лице за контакт, телефон, електронна поща и адрес могат да се добавят, когато ги имаш."/>
        </div>
        <div className="ff-offer-customer-grid">
          <label><span>Тип възложител <em>задължително</em></span><select value={customer.kind} onChange={(event: ChangeEvent<HTMLSelectElement>) => update('kind', event.target.value as FacadeFlowOfferCustomerDetails['kind'])}><option value="">Избери</option><option value="PERSON">Физическо лице</option><option value="COMPANY">Фирма / организация</option></select></label>
          <label><span>Име / фирма <em>задължително</em></span><input value={customer.name} onChange={(event: ChangeEvent<HTMLInputElement>) => update('name', event.target.value)} placeholder="Напр. Иван Иванов / Фирма ООД"/></label>
          <label><span>Лице за контакт {customer.kind === 'PERSON' ? '(само ако е различно)' : ''}</span><input value={customer.contactPerson} onChange={(event: ChangeEvent<HTMLInputElement>) => update('contactPerson', event.target.value)} placeholder={customer.kind === 'PERSON' ? 'По желание · само ако е различно от възложителя' : 'Лице за контакт във фирмата'}/></label>
          <label><span>Телефон</span><input inputMode="tel" value={customer.phone} onChange={(event: ChangeEvent<HTMLInputElement>) => update('phone', event.target.value)} placeholder="Телефон на възложителя"/></label>
          <label><span>Електронна поща</span><input inputMode="email" value={customer.email} onChange={(event: ChangeEvent<HTMLInputElement>) => update('email', event.target.value)} placeholder="Електронна поща на възложителя"/></label>
          <label><span>Адрес на възложителя</span><input value={customer.address} onChange={(event: ChangeEvent<HTMLInputElement>) => update('address', event.target.value)} placeholder="По желание"/></label>
          <label className="wide"><span>Адрес / наименование на обекта</span><input value={customer.projectAddress} onChange={(event: ChangeEvent<HTMLInputElement>) => update('projectAddress', event.target.value)} placeholder="Напр. Къща в Кърджали / Жилищна сграда / адрес на обекта"/></label>
        </div>
        <div className={`ff-offer-customer-status ${ready ? 'ready' : 'review'}`}>
          <b>{ready ? 'ГОТОВО ЗА РАБОТНА ЧЕРНОВА' : 'НУЖНИ СА ОСНОВНИ ДАННИ'}</b>
          <span>{ready ? 'Можеш да продължиш към настройките и модулите.' : `Липсва: ${missing.join(', ')}.`}</span>
        </div>
      </article>
    </div>
  </section>
}
