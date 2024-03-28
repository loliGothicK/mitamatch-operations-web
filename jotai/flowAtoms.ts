import { atom } from 'jotai';

import { Order } from '@/domain/order/order';

import { Edge, Node } from 'reactflow';

export const idAtom = atom<number>(0);

export type NodeData = {
  order?: Order;
};

export const nodeStorageAtom = atom<Node<NodeData>[]>([]);
export const edgeStorageAtom = atom<Edge[]>([]);
