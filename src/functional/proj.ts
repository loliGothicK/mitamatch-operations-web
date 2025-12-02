export const comparator =
  <T extends object, K extends keyof T>(
    key: K,
    order: "asc" | "desc" = "asc", // デフォルトは昇順
  ) =>
  (a: T, b: T) => {
    const valA = a[key];
    const valB = b[key];

    if (valA === valB) return 0;

    // 値が異なる場合のみ比較
    const result = valA > valB ? 1 : -1;

    // 降順なら結果を反転させる
    return order === "asc" ? result : -result;
  };

type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ?
        | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
        | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;

type PathValue<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

export const projector =
  <T extends object, P extends Path<T>>(path: P) =>
  (obj: T): PathValue<T, P> => {
    const keys = (path as string).split(".");
    let result: any = obj;

    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) break;
    }

    return result as PathValue<T, P>;
  };
