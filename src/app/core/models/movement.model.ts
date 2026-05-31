export type MovementType = 'in' | 'out' | 'adjust_neg' | 'adjust_pos';

export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  unitCost?: number;
  unitPrice?: number;
  reference?: string;
  createdAt: string;
}

export interface NewMovement {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  unitCost?: number;
  unitPrice?: number;
  reference?: string;
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjust_neg: 'Ajuste (-)',
  adjust_pos: 'Ajuste (+)',
};

export const isIncoming = (t: MovementType) => t === 'in' || t === 'adjust_pos';
