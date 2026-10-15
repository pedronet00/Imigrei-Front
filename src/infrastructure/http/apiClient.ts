import { getAccessToken } from '../../application/services/AuthService';
import type { HistoryType } from '../../domain/entities/HistoryEntry';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'https://localhost:7230/api';

export class UnauthorizedError extends Error {
  constructor() {
    super('Sessão expirada. Faça login novamente.');
    this.name = 'UnauthorizedError';
  }
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAccessToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

// The API returns UTC timestamps without a zone suffix
export function parseApiUtcDate(value: string): string {
  if (!value) return value;
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
}

export async function readProblemDetail(response: Response): Promise<string | undefined> {
  try {
    return (await response.json())?.detail;
  } catch {
    return undefined;
  }
}

export function fileNameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) return decodeURIComponent(utf8[1].trim().replace(/"/g, ''));
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

// TipoAcaoImigranteEnum
const historyTypeMapToNumber: Record<HistoryType, number> = {
  novo_pedido: 1,
  atualizacao_dados: 2,
  cancelamento_pedido: 3,
  finalizacao_pedido: 4,
  outros: 5,
};

const numberToHistoryTypeMap: Record<number, HistoryType> = {
  1: 'novo_pedido',
  2: 'atualizacao_dados',
  3: 'cancelamento_pedido',
  4: 'finalizacao_pedido',
  5: 'outros',
};

export function historyTypeToNumber(type: HistoryType): number {
  return historyTypeMapToNumber[type];
}

export function numberToHistoryType(num: number): HistoryType {
  return numberToHistoryTypeMap[num] ?? 'outros';
}
