export type HistoryType =
  | 'novo_pedido'
  | 'atualizacao_dados'
  | 'cancelamento_pedido'
  | 'finalizacao_pedido'
  | 'outros';

export interface HistoryEntry {
  id: string;
  immigrantId: string;
  type: HistoryType;
  description: string;
  date: string;
}

export interface NewHistoryEntry {
  type: HistoryType;
  description: string;
}
