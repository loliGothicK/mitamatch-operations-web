export const comparator = <T extends object, K extends keyof T>(
  key: K,
  order: 'asc' | 'desc' = 'asc' // デフォルトは昇順
) => (a: T, b: T) => {
  const valA = a[key];
  const valB = b[key];

  if (valA === valB) return 0;

  // 値が異なる場合のみ比較
  const result = valA > valB ? 1 : -1;

  // 降順なら結果を反転させる
  return order === 'asc' ? result : -result;
};
