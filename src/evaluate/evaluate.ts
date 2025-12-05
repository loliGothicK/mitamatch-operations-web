import { pipe } from "fp-ts/function";
import { option } from "fp-ts";
import { Option, none, some, fromNullable } from "fp-ts/Option";
import { isLeft, left, right } from "fp-ts/Either";
import { P, match } from "ts-pattern";
import type { Charm } from "@/domain/charm/charm";
import type { Costume } from "@/domain/costume/costume";
import type { MemoriaId } from "@/domain/memoria/memoria";
import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import { Lenz } from "@/domain/lenz";
import { isNotStackOrElement } from "@/parser/skill";
import { ValidateResult } from "@/error/error";
import { BASE_RATES } from "./constants";
import { calculateRangeModifier, getCounterRate, getStackRate } from "./calculators";
import {
  aggregateSkillEffectBoosts,
  aggregateSupportSkills,
  SupportResult,
} from "@/evaluate/aggregator/supportSkills";
import {
  extractEffectByType,
  parseAbility,
  parseSpecialSkillEffect,
} from "@/evaluate/parser/costume";
import { AttributeRates, StatusKind } from "@/evaluate/types";
import {
  getAttackLegendaryRates,
  getLegendaryRateByCardType,
  getSupportLegendaryRates,
} from "@/evaluate/parser/legendarySkills";
import {
  evaluateBuff,
  evaluateDamage,
  evaluateDebuff,
  evaluateRecovery,
  EvaluationContext,
} from "@/evaluate/evaluator/skills";
import { projector } from "@/functional/proj";

export type StackOption = {
  rate: number;
  targets: MemoriaId[];
};

export type EvaluateOptions = {
  counter: boolean;
  stack: Option<StackOption>;
};

type SkillExpected = {
  readonly damage: Option<number>;
  readonly buff: Option<Array<{ type: StatusKind; amount: number }>>;
  readonly debuff: Option<Array<{ type: StatusKind; amount: number }>>;
  readonly recovery: Option<number>;
};

export type EvaluateResult = {
  readonly skill: Array<{
    readonly memoria: MemoriaWithConcentration;
    readonly expected: SkillExpected;
  }>;
  readonly supportBuff: SupportResult;
  readonly supportDebuff: SupportResult;
};

/**
 * デッキ全体のスキル効果を評価
 */
export function evaluate(
  deck: MemoriaWithConcentration[],
  [atk, spAtk, def, spDef]: [number, number, number, number],
  [opDef, opSpDef]: [number, number],
  charm: Charm,
  costume: Costume,
  { limitBraek, isAwakened }: { limitBraek: number; isAwakened: boolean },
  options: EvaluateOptions,
): ValidateResult<EvaluateResult> {
  // 基本補正値の計算
  const themeRate = createThemeRates();
  const charmAbilityRates = parseAbility(fromNullable(charm?.ability));

  // 衣装特殊スキルの解析
  const costumeSpecialResult = parseSpecialSkillEffect(
    costume.specialSkill,
    limitBraek,
    isAwakened,
  );

  if (isLeft(costumeSpecialResult)) {
    return left(costumeSpecialResult.left);
  }

  const costumeSpecialMap = costumeSpecialResult.right;
  const adxRates = extractEffectByType(costumeSpecialMap, "autoSkill");
  const costumeSkillRates = extractEffectByType(costumeSpecialMap, "skill");

  // 各メモリアの評価
  const skillEvaluations = deck.map((memoria) =>
    evaluateMemoria(
      memoria,
      deck,
      [atk, spAtk, def, spDef],
      [opDef, opSpDef],
      {
        themeRate,
        charmAbilityRates,
        costumeSkillRates,
        adxRates,
      },
      options,
    ),
  );

  // サポートスキルの集計
  const supportBuff = aggregateSupportSkills("UP", [atk, spAtk, def, spDef], deck, adxRates);
  const supportDebuff = aggregateSupportSkills("DOWN", [atk, spAtk, def, spDef], deck, adxRates);

  return right({
    skill: skillEvaluations,
    supportBuff,
    supportDebuff,
  });
}

/**
 * 個別メモリアの評価
 */
function evaluateMemoria(
  memoria: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
  [atk, spAtk, def, spDef]: [number, number, number, number],
  [opDef, opSpDef]: [number, number],
  rates: {
    themeRate: AttributeRates;
    charmAbilityRates: AttributeRates;
    costumeSkillRates: AttributeRates;
    adxRates: AttributeRates;
  },
  options: EvaluateOptions,
): { memoria: MemoriaWithConcentration; expected: SkillExpected } {
  const { themeRate, charmAbilityRates, costumeSkillRates, adxRates } = rates;

  // 基本補正の計算
  const calibration =
    BASE_RATES.CHARM *
    charmAbilityRates[memoria.attribute] *
    BASE_RATES.COSTUME *
    BASE_RATES.GRACE *
    themeRate[memoria.attribute] *
    costumeSkillRates[memoria.attribute];

  // 範囲補正の計算
  const baseRange = calculateBaseRange(memoria);
  const rangeUpProbability = aggregateSkillEffectBoosts(deck, memoria, "RangeUp", adxRates);
  const range = calculateRangeModifier(baseRange, rangeUpProbability);

  // サポート補正の計算
  const support = calculateSupportModifier(memoria, deck, adxRates);

  // カウンター/スタック補正
  const counterRate = getCounterRate(
    Lenz.memoria.gvgSkill.name.get(memoria).includes("カウンター"),
    options.counter,
  );
  const stackRate = getStackRate(
    memoria.id,
    pipe(options.stack, option.map(projector("targets"))),
    pipe(options.stack, option.map(projector("rate"))),
  );

  // レジェンダリースキル倍率の取得
  const normalLegendary = getAttackLegendaryRates(deck, true);
  const specialLegendary = getAttackLegendaryRates(deck, false);
  const supportLegendary = getSupportLegendaryRates(deck);

  const legendaryRate = getLegendaryRateByCardType(
    memoria.cardType,
    memoria.attribute,
    normalLegendary,
    specialLegendary,
    supportLegendary,
  );

  const finalCalibration = calibration * legendaryRate;

  // 評価コンテキストの作成
  const ctx: EvaluationContext = {
    memoria,
    deck,
    calibration: finalCalibration,
    range,
    support,
    counterRate,
    stackRate,
    adxRates,
  };

  return {
    memoria,
    expected: {
      damage: evaluateDamage(ctx, atk, spAtk, opDef, opSpDef),
      buff: evaluateBuff(ctx, atk, spAtk, def, spDef),
      debuff: evaluateDebuff(ctx, atk, spAtk, def, spDef),
      recovery: evaluateRecovery(ctx, def, spDef),
    },
  };
}

/**
 * 基本範囲値の計算
 */
function calculateBaseRange(memoria: MemoriaWithConcentration): number {
  return pipe(
    fromNullable(Lenz.memoria.gvgSkill.effects.get(memoria).find(isNotStackOrElement)),
    option.chain((ranged) => fromNullable(ranged.range)),
    option.chain((range) =>
      match(range)
        .with([P._, P._], ([a, b]) => some((a + b) / 2))
        .otherwise(() => none),
    ),
    option.getOrElse(() => 1.0),
  );
}

/**
 * サポート補正の計算
 */
function calculateSupportModifier(
  memoria: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
  adxRates: AttributeRates,
): number {
  // 攻撃系スキルはサポート補正を受けない
  if (memoria.cardType < 5) {
    return 1.0;
  }

  return aggregateSkillEffectBoosts(
    deck,
    memoria,
    memoria.cardType === 7 ? "RecoveryUp" : "SupportUp",
    adxRates,
  );
}

/**
 * テーマ倍率の作成
 */
function createThemeRates(): AttributeRates {
  return {
    Fire: 1.0,
    Water: BASE_RATES.THEME,
    Wind: BASE_RATES.THEME,
    Light: 1.0,
    Dark: 1.0,
  };
}
