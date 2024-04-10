export const elementFilter = [
  'fire',
  'water',
  'wind',
  'light',
  'dark',
] as const;

export const elementFilterMap = {
  fire: '火',
  water: '水',
  wind: '風',
  light: '光',
  dark: '闇',
} as const;

export const roleFilter = [
  'normal_single',
  'normal_range',
  'special_single',
  'special_range',
  'support',
  'interference',
  'recovery',
] as const;

// map role filter to japanese
export const roleFilterMap = {
  // biome-ignore lint/style/useNamingConvention: <explanation>
  normal_single: '通常単体',
  // biome-ignore lint/style/useNamingConvention: <explanation>
  normal_range: '通常範囲',
  // biome-ignore lint/style/useNamingConvention: <explanation>
  special_single: '特殊単体',
  // biome-ignore lint/style/useNamingConvention: <explanation>
  special_range: '特殊範囲',
  support: '支援',
  interference: '妨害',
  recovery: '回復',
} as const;

export type ElementFilterType = (typeof elementFilter)[number];
export type RoleFilterType = (typeof roleFilter)[number];
export type FilterType = RoleFilterType | ElementFilterType;
