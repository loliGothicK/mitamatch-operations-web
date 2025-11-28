import { match, P } from "ts-pattern";
import { Option, none, some, fromNullable } from "fp-ts/Option";
import { option } from "fp-ts";
import { pipe } from "fp-ts/function";
import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import type { Attribute } from "@/parser/skill";
import { Lenz } from "@/domain/lenz";
import { SUPPORT_RATES } from "../constants";
import {
  getSkillLevelRate,
  getProbabilityRate,
  getLevelRate,
  calculateSupportExpectedValue,
  calculateAverageStatus,
} from "../calculators";
import { Amount, StatusKind } from "@/evaluate/types";

type SupportType = "UP" | "DOWN";
type SupportEffectType = "DamageUp" | "SupportUp" | "RecoveryUp" | "RangeUp";

export type SupportResult = Record<
  Exclude<StatusKind, "Light ATK" | "Dark ATK" | "Light DEF" | "Dark DEF" | "Life">,
  number
>;

/**
 * 補助スキル（AutoSkill）の効果を集計
 */
export function aggregateSupportSkills(
  type: SupportType,
  stats: [number, number, number, number],
  deck: MemoriaWithConcentration[],
  adxRates: Record<Attribute, number>,
): SupportResult {
  const [atk, spAtk, def, spDef] = stats;

  const result: SupportResult = {
    ATK: 0,
    "Sp.ATK": 0,
    DEF: 0,
    "Sp.DEF": 0,
    "Fire ATK": 0,
    "Water ATK": 0,
    "Wind ATK": 0,
    "Fire DEF": 0,
    "Water DEF": 0,
    "Wind DEF": 0,
  };

  const contributions = deck.flatMap((memoria) => {
    const autoSkill = Lenz.memoria.autoSkill.effects.get(memoria);

    return autoSkill
      .filter((effect) => effect.type === type)
      .map((effect) =>
        pipe(
          fromNullable(effect.status),
          option.chain((status) =>
            pipe(
              fromNullable(effect.amount),
              option.map((amount) => ({
                concentration: memoria.concentration,
                attribute: memoria.attribute,
                status,
                amount,
              })),
            ),
          ),
        ),
      )
      .filter(option.isSome)
      .map((opt) => opt.value);
  });

  for (const { concentration, attribute, status, amount } of contributions) {
    pipe(
      getSupportSkillRate(amount),
      option.map((skillRate) => {
        const probability = getProbabilityRate("certain", concentration);
        const adxBonus = adxRates[attribute];
        const finalProbability = probability + adxBonus;

        const memoriaRate = skillRate * getSkillLevelRate(concentration);
        const baseStatus = getBaseStatusForSupport(status, atk, spAtk, def, spDef);

        const contribution = Math.floor(baseStatus * memoriaRate * finalProbability);
        result[status] += contribution;
      }),
    );
  }

  return result;
}

/**
 * スキル効果UP系の補助スキルを集計（ダメージ、サポート、回復、範囲）
 */
export function aggregateSkillEffectBoosts(
  deck: MemoriaWithConcentration[],
  targetMemoria: MemoriaWithConcentration,
  effectType: SupportEffectType,
  adxRates: Record<Attribute, number>,
): number {
  const boosts = deck
    .map((memoria) => ({
      autoSkill: Lenz.memoria.general.autoSkill.get(memoria),
      concentration: memoria.concentration,
    }))
    .filter(({ autoSkill }) => autoSkill.effects.some((e) => e.type === effectType))
    .map(({ autoSkill, concentration }) => {
      return pipe(
        fromNullable(autoSkill.effects.find((e) => e.type === effectType)),
        option.chain((effect) => fromNullable(effect.amount)),
        option.chain((amount) => {
          const level = getLevelRate(amount);
          if (isNaN(level)) return none;

          const probability = getProbabilityRate(autoSkill.probability, concentration);
          const adxBonus = adxRates[targetMemoria.attribute];

          return some(calculateSupportExpectedValue(level, probability, adxBonus));
        }),
        option.getOrElse(() => 0),
      );
    });

  // 積算（掛け算）で効果を適用
  if (effectType === "RangeUp") {
    return boosts.reduce((acc, cur) => acc * (1.0 - cur), 1.0);
  }

  // 加算で効果を適用
  return boosts.reduce((acc, cur) => acc + cur, effectType === "DamageUp" ? 1.0 : 0);
}

// ヘルパー関数

function getSupportSkillRate(amount: Amount): Option<number> {
  if (amount === "small") return none;
  return fromNullable(SUPPORT_RATES[amount]);
}

function getBaseStatusForSupport(
  status: Exclude<StatusKind, "Life">,
  atk: number,
  spAtk: number,
  def: number,
  spDef: number,
): number {
  return match(status)
    .with("ATK", () => atk)
    .with("Sp.ATK", () => spAtk)
    .with("DEF", () => def)
    .with("Sp.DEF", () => spDef)
    .with(P.union("Fire ATK", "Water ATK", "Wind ATK", "Light ATK", "Dark ATK"), () =>
      calculateAverageStatus(atk, spAtk),
    )
    .with(P.union("Fire DEF", "Water DEF", "Wind DEF", "Light DEF", "Dark DEF"), () =>
      calculateAverageStatus(def, spDef),
    )
    .exhaustive();
}
