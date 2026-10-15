import { FilePlus, RefreshCw, CircleX, CircleCheck, MessageSquare } from 'lucide-react';
import type { HistoryType } from '../../domain/entities/HistoryEntry';

export const HISTORY_TYPE_CONFIG: Record<
  HistoryType,
  { label: string; icon: typeof FilePlus; color: string; bg: string }
> = {
  novo_pedido: { label: 'Novo Pedido', icon: FilePlus, color: 'var(--tint-blue-fg)', bg: 'var(--tint-blue-bg)' },
  atualizacao_dados: { label: 'Atualização de Dados', icon: RefreshCw, color: 'var(--tint-amber-fg)', bg: 'var(--tint-amber-bg)' },
  cancelamento_pedido: { label: 'Cancelamento de Pedido', icon: CircleX, color: 'var(--tint-red-fg)', bg: 'var(--tint-red-bg)' },
  finalizacao_pedido: { label: 'Finalização de Pedido', icon: CircleCheck, color: 'var(--tint-green-fg)', bg: 'var(--tint-green-bg)' },
  outros: { label: 'Outros', icon: MessageSquare, color: 'var(--tint-slate-fg)', bg: 'var(--tint-slate-bg)' },
};
