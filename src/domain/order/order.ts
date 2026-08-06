import { z } from "zod";

import orderData from "./order.json";

const orderSchema = z.object({
  id: z.string().readonly(),
  name: z.string().readonly(),
  status: z.array(z.number()).readonly(),
  effect: z.string().readonly(),
  description: z.string().readonly(),
  prepare_time: z.number().readonly(),
  active_time: z.number().readonly(),
  payed: z.boolean().readonly(),
  usually: z.boolean().readonly(),
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

export const orderList = orderData.data.map((order) => orderSchema.parse(order));

export function isSameLineage(o1: Pick<Order, "effect">, o2: Pick<Order, "effect">): boolean {
  const normalize = (eff: string) => eff.replace(/^(.+)Lv.\d/g, "$1").replace(/(通常|特殊):/g, "");

  if (normalize(o1.effect) === normalize(o2.effect)) return true;

  const eff1 = o1.effect;
  const eff2 = o2.effect;

  if (
    eff1.includes("闇") &&
    !eff1.includes("光闇") &&
    eff2.includes("闇") &&
    !eff2.includes("光闇")
  )
    return true;
  if (
    eff1.includes("光") &&
    !eff1.includes("光闇") &&
    eff2.includes("光") &&
    !eff2.includes("光闇")
  )
    return true;

  return false;
}
