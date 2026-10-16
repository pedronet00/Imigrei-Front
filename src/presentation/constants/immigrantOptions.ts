// StatusEmissaoCPFEnum
export const CPF_STATUS_OPTIONS = [
  { value: '0', label: 'Não aplicável' },
  { value: '1', label: 'Pendente' },
  { value: '2', label: 'Formulário preenchido' },
  { value: '3', label: 'Aguardando documentação' },
  { value: '4', label: 'Concluído' },
];
export const CPF_STATUS_CONCLUIDO = 4;

// DocumentoViagemEnum
export const TRAVEL_DOCUMENT_OPTIONS = [
  { value: '0', label: 'Passaporte' },
  { value: '1', label: 'Laissez-passer' },
  { value: '2', label: 'Autorização de retorno ao Brasil' },
  { value: '3', label: 'Salvo-conduto' },
  { value: '4', label: 'Carteira de marítimo' },
  { value: '5', label: 'Carteira de matrícula consular' },
  { value: '6', label: 'Documento de identidade civil estrangeiro' },
  { value: '7', label: 'Certificado de membro de tripulação aérea' },
  { value: '8', label: 'Outros' },
];

export function optionLabel(
  options: { value: string; label: string }[],
  value: number | undefined
): string | undefined {
  return value === undefined ? undefined : options.find((o) => o.value === String(value))?.label;
}
