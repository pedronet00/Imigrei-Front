export type DocumentType =
  | 'passaporte'
  | 'rne'
  | 'crnm'
  | 'ctps'
  | 'cpf'
  | 'comprovante_residencia'
  | 'certidao_nascimento'
  | 'certidao_casamento'
  | 'diploma'
  | 'protocolo_refugio'
  | 'outro';

export interface ImmigrantDocument {
  id: string;
  immigrantId: string;
  type: DocumentType;
  name: string;
  fileName: string;
  fileUrl?: string;
  uploadDate: string;
  expirationDate?: string;
  notes?: string;
  contentType?: string;
  sizeBytes?: number;
  typeCode?: number;
}

export interface DocumentFile {
  blob: Blob;
  fileName: string;
}
