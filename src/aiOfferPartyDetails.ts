export type FacadeFlowCustomerKind = 'PERSON' | 'COMPANY' | ''

export interface FacadeFlowOfferIssuerDetails {
  name: string
  activity: string
  postalCode: string
  city: string
  district: string
  street: string
  email: string
  logoSrc: string
}

export interface FacadeFlowOfferCustomerDetails {
  kind: FacadeFlowCustomerKind
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  projectAddress: string
}

export const NADEZHDA_OFFER_ISSUER: Readonly<FacadeFlowOfferIssuerDetails> = Object.freeze({
  name: 'НАДЕЖДА',
  activity: 'Алуминиева и PVC дограма',
  postalCode: '6600',
  city: 'Кърджали',
  district: 'кв. „Студен кладенец“',
  street: 'ул. „Дарец“ № 9',
  email: 'nadejda94@mail.bg',
  logoSrc: '/branding/nadezhda-header.png',
})

export function createEmptyFacadeFlowOfferCustomer(name = ''): FacadeFlowOfferCustomerDetails {
  return {
    kind: '',
    name,
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    projectAddress: '',
  }
}

export function facadeFlowOfferCustomerReady(customer: FacadeFlowOfferCustomerDetails) {
  return customer.kind !== '' && customer.name.trim().length > 0
}

export function facadeFlowOfferCustomerMissing(customer: FacadeFlowOfferCustomerDetails) {
  const missing: string[] = []
  if (!customer.kind) missing.push('тип възложител')
  if (!customer.name.trim()) missing.push('име / фирма')
  return missing
}
