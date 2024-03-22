import { atom } from 'jotai';

import { Order, OrderKind, orderList } from '@/domain/order/order';

export const timelineAtom = atom<Order[]>([]);

export const filterAtom = atom<
  | Exclude<
      OrderKind,
      | 'Elemental/Fire'
      | 'Elemental/Water'
      | 'Elemental/Wind'
      | 'Elemental/Dark'
      | 'Elemental/Light'
      | 'Elemental/Special'
    >
  | 'Elemental'
  | 'Usually'
>('Usually');

export const filteredOrderAtom = atom((get) => {
  const filter = get(filterAtom);
  return orderList
    .filter((order) =>
      filter === 'Usually'
        ? order.usually
        : filter === 'Elemental'
          ? order.kind.startsWith('Elemental')
          : order.kind === filter,
    )
    .filter((order) => get(timelineAtom).every((o) => o.id != order.id));
});
