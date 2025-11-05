import { atom } from "jotai";

import { type Order, type OrderKind, orderList } from "@/domain/order/order";

export type OrderWithPic = Order & {
  delay?: number;
  pic?: string;
  sub?: string;
};

export const timelineTitleAtom = atom("No Title");
const timelineAtom = atom<OrderWithPic[]>([]);
export const accelerationIndexAtom = atom(-1);
export const rwTimelineAtom = atom(
  (get) => get(timelineAtom),
  (
    get,
    set,
    update: OrderWithPic[] | ((prev: OrderWithPic[]) => OrderWithPic[]),
  ) => {
    const newValue =
      typeof update === "function" ? update(get(timelineAtom)) : update;
    // We should update the acceleration index if the new timeline includes an acceleration order.
    const accelerationIndex = newValue.findIndex((order) =>
      order.name.includes("戦術加速"),
    );
    set(accelerationIndexAtom, accelerationIndex);
    set(timelineAtom, newValue);
  },
);

export const payedAtom = atom(true);
export const filterAtom = atom<
  | Exclude<
      OrderKind,
      | "Elemental/Fire"
      | "Elemental/Water"
      | "Elemental/Wind"
      | "Elemental/Dark"
      | "Elemental/Light"
      | "Elemental/Special"
    >
  | "Elemental"
  | "Usually"
>("Usually");

export const filteredOrderAtom = atom((get) => {
  const filter = get(filterAtom);
  return orderList
    .filter((order) =>
      filter === "Usually"
        ? order.usually
        : filter === "Elemental"
          ? order.kind.startsWith("Elemental")
          : order.kind === filter,
    )
    .filter((order) => get(rwTimelineAtom).every((o) => o.id !== order.id))
    .filter((order) => (get(payedAtom) ? order.payed : !order.payed));
});
