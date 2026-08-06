import { atom } from "jotai";

import { type Order, orderList, isSameLineage } from "@/domain/order/order";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { match, P } from "ts-pattern";
import { orderMigrationMap } from "./orderMigrationMap";

export type OrderWithPic = Order & {
  delay:
    | {
        source: "manual";
        value: number;
      }
    | {
        source: "auto";
        value?: number;
      };
  pic?: string;
  sub?: string;
};

const customStorage = createJSONStorage<OrderWithPic[]>(() =>
  typeof window !== "undefined"
    ? window.localStorage
    : ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as unknown as Storage),
);

const originalGetItem = customStorage.getItem;
customStorage.getItem = (key, initialValue) => {
  const value = originalGetItem(key, initialValue);
  const migrate = (val: any) => {
    if (Array.isArray(val)) {
      return val.map((item) => {
        if (typeof item.id === "number") {
          return {
            ...item,
            id: orderMigrationMap[item.id] || String(item.id),
          };
        }
        return item;
      });
    }
    return val;
  };

  if (value instanceof Promise) {
    return value.then(migrate);
  }
  return migrate(value);
};

export const timelineTitleAtom = atom("No Title");
export const timelineAtom = atomWithStorage<OrderWithPic[]>("timeline", [], customStorage, {
  getOnInit: true,
});

export const payedAtom = atom(true);

export const orderKinds = [
  "Usually",
  "Elemental",
  "Shield",
  "Formation",
  "Buff",
  "Debuff",
  "RateFluctuation",
  "Other",
] as const;

export type OrderKind = (typeof orderKinds)[number];

const kind = (order: Order) =>
  match(order.effect)
    .returnType<OrderKind>()
    .with(
      P.string.regex(
        /(火|水|風|光・火|光・水|光・風|闇・火|闇・水|闇・風|\[火水]|\[水風]|\[火風])属性効果増加/,
      ),
      () => "Elemental",
    )
    .with(P.string.regex(/([火水風])属性効果減少/), () => "Shield")
    .with(P.string.regex(/(全体|前衛|後衛)再編/), () => "Formation")
    .with(P.string.regex(/(攻撃力|防御力)増加/), () => "Buff")
    .with(P.string.regex(/(攻撃力|防御力)減少/), () => "Debuff")
    .otherwise(() => "Other");

export const filterAtom = atom<OrderKind>("Usually");

export const filteredOrderAtom = atom((get) => {
  const filter = get(filterAtom);
  const timeline = get(timelineAtom);
  return orderList
    .filter((order) => (filter === "Usually" ? order.usually : kind(order) === filter))
    .filter((order) => timeline.every((o) => !isSameLineage(o, order)))
    .filter((order) => (get(payedAtom) ? order.payed : !order.payed))
    .toReversed();
});
