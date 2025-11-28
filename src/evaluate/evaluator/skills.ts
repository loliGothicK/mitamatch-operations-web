import { match, P } from "ts-pattern";
import { Option, none, some, fromNullable } from "fp-ts/Option";
import { option } from "fp-ts";
import { pipe } from "fp-ts/function";
import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import type { Attribute } from "@/parser/skill";
import { Lenz } from "@/domain/lenz";
import { isDamageEffect } from "@/parser/skill";
import {
  DAMAGE_RATES_SINGLE,
  DAMAGE_RATES_RANGE,
  BUFF_ATK_RATES,
  BUFF_DEF_RATES,
  BUFF_ELEMENT_ATK_RATES,
  BUFF_ELEMENT_DEF_RATES,
  BUFF_LIFE_RATES,
  DEBUFF_ATK_RATES,
  DEBUFF_DEF_RATES,
  DEBUFF_ELEMENT_ATK_RATES,
  RECOVERY_RATES,
} from "../constants";
import {
  getSkillLevelRate,
  calculateWithDefense,
  calculateFinalValue,
  calculateAverageStatus,
} from "../calculators";
import {
  getAttackLegendaryRates,
  getRecoveryLegendaryRates,
} from "@/evaluate/parser/legendarySkills";
import { StatusKind } from "@/evaluate/types";

export type EvaluationContext = {
  memoria: MemoriaWithConcentration;
  deck: MemoriaWithConcentration[];
  calibration: number;
  range: number;
  support: number;
  counterRate: number;
  stackRate: number;
  adxRates: Record<Attribute, number>;
};

/**
 * ダメージスキルの評価
 */
export function evaluateDamage(
  ctx: EvaluationContext,
  atk: number,
  spAtk: number,
  opDef: number,
  opSpDef: number,
): Option<number> {
  const { memoria, deck, calibration, range, support, counterRate, stackRate } = ctx;

  const effects = Lenz.memoria.gvgSkill.effects.get(memoria);
  if (!effects.some((e) => e.type === "damage")) return none;

  return pipe(
    fromNullable(effects.find(isDamageEffect)),
    option.chain((effect) => fromNullable(effect.amount)),
    option.chain((amount) => {
      // レジェンダリースキル倍率
      const isPhysical = memoria.cardType.includes("通常");
      const legendaryRates = getAttackLegendaryRates(deck, isPhysical);
      const finalCalibration = calibration * legendaryRates[memoria.attribute];

      // スキル倍率の取得
      const skillRateOpt = match(memoria.cardType)
        .when(
          (kind) => kind.includes("単体"),
          () => fromNullable(DAMAGE_RATES_SINGLE[amount]),
        )
        .when(
          (kind) => kind.includes("範囲"),
          () => fromNullable(DAMAGE_RATES_RANGE[amount]),
        )
        .otherwise(() => none);

      return pipe(
        skillRateOpt,
        option.map((skillRate) => {
          const memoriaRate = skillRate * getSkillLevelRate(memoria.concentration);
          const baseStatus = isPhysical
            ? calculateWithDefense(atk, opDef)
            : calculateWithDefense(spAtk, opSpDef);

          return calculateFinalValue(
            baseStatus,
            memoriaRate,
            finalCalibration,
            support,
            range,
            counterRate,
            stackRate,
          );
        }),
      );
    }),
  );
}

/**
 * バフスキルの評価
 */
export function evaluateBuff(
  ctx: EvaluationContext,
  atk: number,
  spAtk: number,
  def: number,
  spDef: number,
): Option<Array<{ type: StatusKind; amount: number }>> {
  const { memoria, calibration, range, support, counterRate, stackRate } = ctx;

  const effects = Lenz.memoria.gvgSkill.effects.get(memoria);
  const buffEffects = effects.filter((e) => e.type === "buff");

  if (buffEffects.length === 0) return none;

  const results = buffEffects.map(({ amount, status }) => {
    return pipe(
      fromNullable(status),
      option.chain((st) =>
        pipe(
          fromNullable(amount),
          option.map((amt) => ({ status: st, amount: amt })),
        ),
      ),
      option.chain(({ status: st, amount: amt }) => {
        return pipe(
          getBuffSkillRate(st, amt),
          option.map((skillRate) => {
            const memoriaRate = skillRate * getSkillLevelRate(memoria.concentration);
            const baseStatus = getBaseStatusForBuff(st, atk, spAtk, def, spDef);

            return {
              type: st,
              amount: calculateFinalValue(
                baseStatus,
                memoriaRate,
                calibration,
                support,
                range,
                counterRate,
                stackRate,
              ),
            };
          }),
        );
      }),
      option.getOrElse(() => ({ type: status, amount: 0 })),
    );
  });

  return some(results);
}

/**
 * デバフスキルの評価
 */
export function evaluateDebuff(
  ctx: EvaluationContext,
  atk: number,
  spAtk: number,
  def: number,
  spDef: number,
): Option<Array<{ type: StatusKind; amount: number }>> {
  const { memoria, calibration, range, support, counterRate, stackRate } = ctx;

  const effects = Lenz.memoria.gvgSkill.effects.get(memoria);
  const debuffEffects = effects.filter((e) => e.type === "debuff");

  if (debuffEffects.length === 0) return none;

  const results = debuffEffects.map(({ amount, status }) => {
    return pipe(
      fromNullable(status),
      option.chain((st) => {
        if (st === "Life") {
          throw new Error("Life debuff not implemented");
        }
        return pipe(
          fromNullable(amount),
          option.map((amt) => ({ status: st, amount: amt })),
        );
      }),
      option.chain(({ status: st, amount: amt }) => {
        return pipe(
          getDebuffSkillRate(st, amt),
          option.map((skillRate) => {
            const memoriaRate = skillRate * getSkillLevelRate(memoria.concentration);
            const baseStatus = getBaseStatusForDebuff(st, atk, spAtk, def, spDef);

            return {
              type: st,
              amount: calculateFinalValue(
                baseStatus,
                memoriaRate,
                calibration,
                support,
                range,
                counterRate,
                stackRate,
              ),
            };
          }),
        );
      }),
      option.getOrElse(() => ({ type: status!, amount: 0 })),
    );
  });

  return some(results);
}

/**
 * 回復スキルの評価
 */
export function evaluateRecovery(
  ctx: EvaluationContext,
  def: number,
  spDef: number,
): Option<number> {
  const { memoria, deck, calibration, range, support, counterRate, stackRate } = ctx;

  if (memoria.cardType !== "回復") return none;

  const description = Lenz.memoria.gvgSkill.description.get(memoria);

  return pipe(
    match(description)
      .when(
        (s) => s.includes("特大回復"),
        () => some(RECOVERY_RATES["特大回復"]),
      )
      .when(
        (s) => s.includes("大回復"),
        () => some(RECOVERY_RATES["大回復"]),
      )
      .when(
        (s) => s.includes("回復"),
        () => some(RECOVERY_RATES["回復"]),
      )
      .otherwise(() => none),
    option.map((skillRate) => {
      const legendaryRates = getRecoveryLegendaryRates(deck);
      const finalCalibration = calibration * legendaryRates[memoria.attribute];
      const memoriaRate = skillRate * getSkillLevelRate(memoria.concentration);

      return calculateFinalValue(
        def + spDef,
        memoriaRate,
        finalCalibration,
        support,
        range,
        counterRate,
        stackRate,
      );
    }),
  );
}

// ヘルパー関数

function getBuffSkillRate(status: StatusKind, amount: string): Option<number> {
  return fromNullable(
    match(status)
      .with("ATK", "Sp.ATK", () => BUFF_ATK_RATES[amount])
      .with("DEF", "Sp.DEF", () => BUFF_DEF_RATES[amount])
      .with(
        P.union("Fire ATK", "Water ATK", "Wind ATK", "Light ATK", "Dark ATK"),
        () => BUFF_ELEMENT_ATK_RATES[amount],
      )
      .with(
        P.union("Fire DEF", "Water DEF", "Wind DEF", "Light DEF", "Dark DEF"),
        () => BUFF_ELEMENT_DEF_RATES[amount],
      )
      .with("Life", () => BUFF_LIFE_RATES[amount])
      .otherwise(() => undefined),
  );
}

function getDebuffSkillRate(status: StatusKind, amount: string): Option<number> {
  return fromNullable(
    match(status)
      .with("ATK", "Sp.ATK", () => DEBUFF_ATK_RATES[amount])
      .with("DEF", "Sp.DEF", () => DEBUFF_DEF_RATES[amount])
      .with(
        P.union("Fire ATK", "Water ATK", "Wind ATK", "Light ATK", "Dark ATK"),
        () => DEBUFF_ELEMENT_ATK_RATES[amount],
      )
      .with(
        P.union("Fire DEF", "Water DEF", "Wind DEF", "Light DEF", "Dark DEF"),
        () => DEBUFF_ELEMENT_ATK_RATES[amount],
      )
      .otherwise(() => undefined),
  );
}

function getBaseStatusForBuff(
  status: StatusKind,
  atk: number,
  spAtk: number,
  def: number,
  spDef: number,
): number {
  return match(status)
    .with("ATK", () => atk)
    .with("Sp.ATK", () => spAtk)
    .with("DEF", "Life", () => def)
    .with("Sp.DEF", () => spDef)
    .with(P.union("Fire ATK", "Water ATK", "Wind ATK", "Light ATK", "Dark ATK"), () =>
      calculateAverageStatus(atk, spAtk),
    )
    .with(P.union("Fire DEF", "Water DEF", "Wind DEF", "Light DEF", "Dark DEF"), () =>
      calculateAverageStatus(def, spDef),
    )
    .exhaustive();
}

function getBaseStatusForDebuff(
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
