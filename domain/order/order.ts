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

const orderSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.array(z.number()),
  effect: z.string(),
  description: z.string(),
  // biome-ignore lint/style/useNamingConvention: <explanation>
  prepare_time: z.number(),
  // biome-ignore lint/style/useNamingConvention: <explanation>
  active_time: z.number(),
  payed: z.boolean(),
  kind: z.enum(orderKind),
  usually: z.boolean(),
});

/**
 * This type alias `Order` represents an order object in the application.
 * It is inferred from the `orderSchema` which is a zod schema object.
 * The `orderSchema` defines the structure of an order object, which includes:
 * - id: a number representing the unique identifier of the order.
 * - name: a string representing the name of the order.
 * - status: an array of numbers representing the status of the order.
 * - effect: a string representing the effect of the order.
 * - description: a string representing the description of the order.
 * - prepare_time: a number representing the preparation time of the order.
 * - active_time: a number representing the active time of the order.
 * - paid: a boolean representing whether the order is paid or not.
 * - kind: an enum representing the kind of the order.
 * - usually: a boolean representing whether the order is usually used or not.
 */
export type Order = z.infer<typeof orderSchema>;

export const orderList = orderData.data.map(order => orderSchema.parse(order));
