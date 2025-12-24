import { Attribute } from "@/parser/skill";

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

export type ElementFilterType = Attribute;
export type RoleFilterType = (typeof roleFilter)[number];
export type FilterType = RoleFilterType | ElementFilterType;
export const labelFilter = ["Legendary", "Ultimate", "Normal"] as const;
export type LabelFilterType = (typeof labelFilter)[number];
