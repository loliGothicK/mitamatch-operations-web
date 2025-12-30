export const intoGroupMap =
  <T, K>(keyFn: (item: T) => K) =>
  (list: T[]): Map<K, [T, ...T[]]> => {
    return list.reduce((map, item) => {
      const key = keyFn(item);
      map.set(key, [...(map.get(key) ?? []), item]);
      return map;
    }, new Map<K, [T, ...T[]]>());
  };
