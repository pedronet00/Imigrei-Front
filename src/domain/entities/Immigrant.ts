export type Gender = 'masculino' | 'feminino' | 'outro' | 'nao_informado';

export type MaritalStatus =
  | 'solteiro'
  | 'casado'
  | 'divorciado'
  | 'viuvo'
  | 'uniao_estavel'
  | 'separado';

export type EntryMeans =
  | 'aereo'
  | 'terrestre'
  | 'maritimo'
  | 'fluvial';

export type ReferralSource =
  | 'policia_federal'
  | 'semear'
  | 'tv'
  | 'internet'
  | 'amigos_familia'
  | 'igreja'
  | 'ong'
  | 'outro';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Immigrant {
  id: string;
  fullName: string;
  motherName: string;
  fatherName: string;
  nationality: string;
  birthCity: string;
  birthDate: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  email: string;
  occupation: string;
  cpf: string;
  entryDate: string;
  entryState: string;
  entryMeans: EntryMeans;
  entryCity: string;
  brazilAddress: Address;
  workAddress?: Address;
  phone: string;
  referralSource: ReferralSource;
  referralSourceDetail?: string;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string;
  mainLanguage?: string;
  cpfStatus?: number;
  rnmFeePaid?: boolean;
  travelDocumentType?: number;
  travelDocumentIssuerCountry?: string;
  travelDocumentNumber?: string;
}
