import type { Probability } from "@/parser/autoSkill";
import type { Concentration } from "@/jotai/memoriaAtoms";
import type { Attribute } from "@/parser/skill";
import { Amount } from "@/evaluate/types";

// ステータス種別
export const statusKind = [
  "ATK",
  "DEF",
  "Sp.ATK",
  "Sp.DEF",
  "Life",
  "Fire ATK",
  "Fire DEF",
  "Water ATK",
  "Water DEF",
  "Wind ATK",
  "Wind DEF",
  "Light ATK",
  "Light DEF",
  "Dark ATK",
  "Dark DEF",
] as const;

// 正規表現パターン
export const PATTERNS = {
  ABILITY: /メモリア使用時、それが(.+)属性メモリアの場合、さらにメモリアスキル効果UP\+(\d+)%/,
  EFFECT_UP: /自身が使用する(.+)属性メモリアのスキル効果(\d+)[%％]UP/,
  TRIGGER_RATE_UP: /自身が使用する(.+?)属性メモリアの補助スキル発動確率が(\d+)[%％]UP/,
  DAMAGE_REDUCTION: /自身に対する[火水風光闇]属性メモリアのダメージ\/妨害スキル効果\d+[%％]DOWN/,
} as const;

// スキルレベル補正
export const SKILL_LEVEL: Record<Concentration, number> = {
  0: 1.35,
  1: 1.375,
  2: 1.4,
  3: 1.425,
  4: 1.5,
} as const;

// 確率補正
export const PROBABILITY_RATES: Record<Probability, Record<Concentration, number>> = {
  certain: { 0: 0.12, 1: 0.125, 2: 0.13, 3: 0.135, 4: 0.15 },
  medium: { 0: 0.18, 1: 0.1875, 2: 0.195, 3: 0.2025, 4: 0.225 },
  high: { 0: 0.24, 1: 0.25, 2: 0.26, 3: 0.27, 4: 0.3 },
} as const;

// レベル補正
export const LEVEL_RATES: Record<Exclude<Amount, "small">, number> = {
  medium: 0.1,
  large: 0.15,
  extraLarge: 0.18,
  superLarge: 0.21,
  ultraLarge: 0.24,
  superUltraLarge: 0.27,
} as const;

// ダメージスキル倍率（単体）
export const DAMAGE_RATES_SINGLE: Record<string, number> = {
  ultraLarge: 0.165,
  superLarge: 0.15,
  extraLarge: 0.135,
  large: 0.115,
  medium: 0.1,
} as const;

// ダメージスキル倍率（範囲）
export const DAMAGE_RATES_RANGE: Record<string, number> = {
  superLarge: 0.12,
  extraLarge: 0.11,
  large: 0.1,
  medium: 0.085,
  small: 0.07,
} as const;

// バフスキル倍率（ATK系）
export const BUFF_ATK_RATES: Record<string, number> = {
  medium: 0.0228,
  large: 0.0304,
  extraLarge: 0.038,
  superLarge: 0.0427,
} as const;

// バフスキル倍率（DEF系）
export const BUFF_DEF_RATES: Record<string, number> = {
  small: 0.0332,
  medium: 0.0427,
  large: 0.0475,
  extraLarge: 0.0522,
  superLarge: 0.0575,
} as const;

// バフスキル倍率（属性ATK系）
export const BUFF_ELEMENT_ATK_RATES: Record<string, number> = {
  small: 0.0325,
  medium: 0.04,
  large: 0.0489,
  extraLarge: 0.0551,
} as const;

// バフスキル倍率（属性DEF系）
export const BUFF_ELEMENT_DEF_RATES: Record<string, number> = {
  small: 0.0474,
  medium: 0.0565,
  large: 0.0611,
} as const;

// バフスキル倍率（Life）
export const BUFF_LIFE_RATES: Record<string, number> = {
  medium: 0.0045,
  large: 0.007,
} as const;

// デバフスキル倍率（ATK系）
export const DEBUFF_ATK_RATES: Record<string, number> = {
  small: 0.025,
  medium: 0.0334,
  large: 0.0418,
  extraLarge: 0.0471,
} as const;

// デバフスキル倍率（DEF系）
export const DEBUFF_DEF_RATES: Record<string, number> = {
  small: 0.0365,
  medium: 0.0471,
  large: 0.0523,
  extraLarge: 0.0575,
  superLarge: 0.062,
} as const;

// デバフスキル倍率（属性ATK系）
export const DEBUFF_ELEMENT_ATK_RATES: Record<string, number> = {
  small: 0.0325,
  medium: 0.04,
  large: 0.0489,
  extraLarge: 0.0549,
} as const;

// 回復スキル倍率
export const RECOVERY_RATES: Record<string, number> = {
  特大回復: 0.132,
  大回復: 0.0935,
  回復: 0.077,
} as const;

// サポートスキル倍率
export const SUPPORT_RATES: Record<Exclude<Amount, "small">, number> = {
  medium: 0.01,
  large: 0.015,
  extraLarge: 0.018,
  superLarge: 0.021,
  ultraLarge: 0.024,
  superUltraLarge: 0.027,
} as const;

// 基本補正値
export const BASE_RATES = {
  THEME: 1.1,
  GRACE: 1.1,
  CHARM: 1.1,
  COSTUME: 1.15,
  COUNTER: 1.5,
  DEFENSE_MULTIPLIER: 2 / 3,
} as const;

// 初期属性倍率
export const INITIAL_ATTRIBUTE_RATES: Record<Attribute, number> = {
  Fire: 1.0,
  Water: 1.0,
  Wind: 1.0,
  Light: 1.0,
  Dark: 1.0,
} as const;
