import { authFetch } from '../../application/services/AuthService';
import type { HistoryType } from '../../domain/entities/HistoryEntry';

export { API_BASE_URL } from './apiBaseUrl';

export class UnauthorizedError extends Error {
  constructor() {
    super('Sessão expirada. Faça login novamente.');
    this.name = 'UnauthorizedError';
  }
}

export { authFetch };

// The API returns UTC timestamps without a zone suffix
export function parseApiUtcDate(value: string): string {
  if (!value) return value;
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
}

// Extrai a mensagem de erro do corpo da resposta. A API pode devolver
// { erro }, ProblemDetails ({ detail, title }) ou ValidationProblemDetails ({ errors }).
export async function readProblemDetail(response: Response): Promise<string | undefined> {
  let body: unknown;
  try {
    const text = await response.text();
    if (!text) return undefined;
    try {
      body = JSON.parse(text);
    } catch {
      return text.length <= 300 ? text : undefined;
    }
  } catch {
    return undefined;
  }

  if (typeof body === 'string') return body;
  if (!body || typeof body !== 'object') return undefined;

  const data = body as Record<string, unknown>;
  for (const key of ['erro', 'error', 'mensagem', 'message', 'detail']) {
    if (typeof data[key] === 'string' && data[key]) return data[key] as string;
  }

  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors as Record<string, unknown>)
      .flat()
      .filter((m): m is string => typeof m === 'string');
    if (messages.length) return messages.join(' ');
  }

  return typeof data.title === 'string' ? data.title : undefined;
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
