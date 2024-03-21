type KeyOfUnion<T> = T extends T ? keyof T : never;
export type DistributivePick<T, K extends KeyOfUnion<T>> = T extends T
  ? Pick<T, Exclude<K, keyof T>>
  : never;
export type DistributiveOmit<T, K extends KeyOfUnion<T>> = T extends T
  ? Omit<T, K>
  : never;
