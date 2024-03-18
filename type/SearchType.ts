export const labelSearch = ["legendary", "ultimate"] as const;
export type LabelSearch = (typeof labelSearch)[number];
