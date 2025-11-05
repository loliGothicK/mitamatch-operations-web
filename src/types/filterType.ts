export const elementFilter = [
  "Fire",
  "Water",
  "Wind",
  "Light",
  "Dark",
] as const;

export const roleFilter = [
  "normal_single",
  "normal_range",
  "special_single",
  "special_range",
  "support",
  "interference",
  "recovery",
] as const;

// map role filter to japanese
export const roleFilterMap = {
  normal_single: "通常単体",

  normal_range: "通常範囲",

  special_single: "特殊単体",

  special_range: "特殊範囲",
  support: "支援",
  interference: "妨害",
  recovery: "回復",
} as const;

export type ElementFilterType = (typeof elementFilter)[number];
export type RoleFilterType = (typeof roleFilter)[number];
export type FilterType = RoleFilterType | ElementFilterType;
