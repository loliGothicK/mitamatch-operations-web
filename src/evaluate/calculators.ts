import { Option } from "fp-ts/Option";
import type { Amount } from "@/evaluate/types";
import type { Probability } from "@/parser/autoSkill";
import type { Concentration } from "@/jotai/memoriaAtoms";
import { SKILL_LEVEL, PROBABILITY_RATES, LEVEL_RATES, BASE_RATES } from "./constants";
import { pipe } from "fp-ts/function";
import { option } from "fp-ts";
import { MemoriaId } from "@/domain/memoria/memoria";

/**
 * スキルレベル補正を取得
 */
export function getSkillLevelRate(concentration: Concentration): number {
  return SKILL_LEVEL[concentration];
}

/**
 * 確率補正を取得
 */
export function getProbabilityRate(probability: Probability, concentration: Concentration): number {
  return PROBABILITY_RATES[probability][concentration];
}

/**
 * レベル補正を取得（amount基準）
 */
export function getLevelRate(amount: Amount): number {
  if (amount === "small") return Number.NaN;
  return LEVEL_RATES[amount];
}

/**
 * 範囲補正の計算
 * @param baseRange 基本範囲値
 * @param rangeUpProbability 範囲UP確率の合計
 * @returns 最終的な範囲補正値
 */
export function calculateRangeModifier(baseRange: number, rangeUpProbability: number): number {
  return baseRange + (1.0 - rangeUpProbability);
}

/**
 * カウンター補正の取得
 */
export function getCounterRate(isCounter: boolean, enabled: boolean): number {
  return enabled && isCounter ? BASE_RATES.COUNTER : 1.0;
}

/**
 * スタック補正の取得
 */
export function getStackRate(
  memoriaId: MemoriaId,
  stackTargets: Option<MemoriaId[]>,
  stackRate: Option<number>,
): number {
  return pipe(
    stackTargets,
    option.flatMap((targets) =>
      pipe(
        stackRate,
        option.map((rate) => (targets.includes(memoriaId) ? rate : 1.0)),
      ),
    ),
    option.getOrElse(() => 1.0),
  );
}

/**
 * 基本ステータスから平均値を計算
 */
export function calculateAverageStatus(stat1: number, stat2: number): number {
  return Math.floor((stat1 + stat2) / 2);
}

/**
 * 防御力を考慮したステータス計算
 */
export function calculateWithDefense(attack: number, defense: number): number {
  return attack - BASE_RATES.DEFENSE_MULTIPLIER * defense;
}

/**
 * 最終ダメージ/バフ/デバフ値の計算
 */
export function calculateFinalValue(
  baseStatus: number,
  memoriaRate: number,
  calibration: number,
  support: number,
  range: number,
  counter: number,
  stack: number,
): number {
  return Math.floor(baseStatus * memoriaRate * calibration * support * range * counter * stack);
}

/**
 * サポートスキルの期待値計算
 */
export function calculateSupportExpectedValue(
  level: number,
  probability: number,
  adxBonus: number,
): number {
  return level * (probability + adxBonus);
}
