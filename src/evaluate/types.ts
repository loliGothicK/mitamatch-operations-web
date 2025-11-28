import { statusKind } from "@/evaluate/constants";
import type { Attribute } from "@/parser/skill";

export type Amount =
  | "small" // 小アップ
  | "medium" // アップ
  | "large" // 大アップ
  | "extraLarge" // 特大アップ
  | "superLarge" // 超特大アップ
  | "ultraLarge" // 極大アップ
  | "superUltraLarge"; // 超極大アップ

export type StatusKind = (typeof statusKind)[number];

export type BattleEffect = {
  type: "charm" | "skill" | "order" | "autoSkill";
  value: number;
};

export type AttributeRates = Record<Attribute, number>;
export type SkillEffectMap = Map<Attribute, BattleEffect[]>;
