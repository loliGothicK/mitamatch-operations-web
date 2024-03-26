import { Order } from '@/domain/order/order';

export type Node = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { order: Order };
};
