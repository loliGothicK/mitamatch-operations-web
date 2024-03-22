import { z } from 'zod';

import orderData from './order.json';

export const orderKind = [
  'Elemental/Fire',
  'Elemental/Water',
  'Elemental/Wind',
  'Elemental/Dark',
  'Elemental/Light',
  'Elemental/Special',
  'Buff',
  'DeBuff',
  'Mp',
  'TriggerRateFluctuation',
  'Shield',
  'Formation',
  'Stack',
  'Other',
] as const;
export type OrderKind = (typeof orderKind)[number];

export const orderSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.array(z.number()),
  effect: z.string(),
  description: z.string(),
  prepare_time: z.number(),
  active_time: z.number(),
  payed: z.boolean(),
  kind: z.enum(orderKind),
  usually: z.boolean(),
});

export type Order = z.infer<typeof orderSchema>;

export const orderList = orderData.data.map((order) =>
  orderSchema.parse(order),
);
