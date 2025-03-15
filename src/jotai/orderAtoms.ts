import { atom } from 'jotai';

import { type Order, type OrderKind, orderList } from '@/domain/order/order';

export type OrderWithPic = Order & {
  delay?: number;
  pic?: string;
  sub?: string;
};

export const timelineTitleAtom = atom('No Title');
export const timelineAtom = atom<OrderWithPic[]>([]);

export const payedAtom = atom(true);
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

export const filteredOrderAtom = atom(get => {
  const filter = get(filterAtom);
  return orderList
    .filter(order =>
      filter === 'Usually'
        ? order.usually
        : filter === 'Elemental'
          ? order.kind.startsWith('Elemental')
          : order.kind === filter,
    )
    .filter(order => get(timelineAtom).every(o => o.id !== order.id))
    .filter(order => (get(payedAtom) ? order.payed : !order.payed));
});
