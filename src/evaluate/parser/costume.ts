import { pipe } from "fp-ts/function";
import { getApplicativeValidation, right } from "fp-ts/Either";
import { fromNullable, Option } from "fp-ts/Option";
import { either, option } from "fp-ts";
import { sequenceS } from "fp-ts/Apply";
import { getSemigroup } from "fp-ts/Array";
import type { Costume } from "@/domain/costume/costume";
import type { Attribute } from "@/parser/skill";
import { parseAttribute, parseIntSafe } from "@/parser/common";
import { anyhow, MitamaError, ValidateResult } from "@/error/error";
import { toValidated } from "@/fp-ts-ext/Validated";
import { PATTERNS, INITIAL_ATTRIBUTE_RATES } from "../constants";
import { match } from "ts-pattern";
import { transpose } from "@/fp-ts-ext/function";
import { AttributeRates, BattleEffect, SkillEffectMap } from "@/evaluate/types";

const ap = getApplicativeValidation(getSemigroup<MitamaError>());

/**
 * チャームアビリティから属性倍率を解析
 */
export function parseAbility(description: Option<string>): AttributeRates {
  return pipe(
    description,
    option.chain((desc) => fromNullable(desc.match(PATTERNS.ABILITY))),
    option.fold(
      () => ({ ...INITIAL_ATTRIBUTE_RATES }),
      ([, attributes, rate]) => {
        const result = { ...INITIAL_ATTRIBUTE_RATES };
        const multiplier = 1.0 + Number(rate) / 100;

        for (const attr of attributes.split("/")) {
          result[attr as Attribute] = multiplier;
        }

        return result;
      },
    ),
  );
}

/**
 * スキル効果UPを解析
 */
export function parseEffectUp(
  description: string,
): ValidateResult<{ attribute: Attribute; effect: BattleEffect }> {
  return pipe(
    fromNullable(description.match(PATTERNS.EFFECT_UP)),
    either.fromOption(() => [anyhow(description, `Does not match ${PATTERNS.EFFECT_UP}`)]),
    either.flatMap(([, attribute, rate]) =>
      sequenceS(ap)({
        attribute: toValidated(parseAttribute(attribute)),
        effect: sequenceS(ap)({
          type: right("skill" as const),
          value: pipe(
            parseIntSafe(rate),
            toValidated,
            either.map((v) => 1.0 + v / 100),
          ),
        }),
      }),
    ),
  );
}

/**
 * 発動確率UPを解析
 */
export function parseRateUp(
  description: string,
): ValidateResult<{ attribute: Attribute; effect: BattleEffect }> {
  return pipe(
    fromNullable(description.match(PATTERNS.TRIGGER_RATE_UP)),
    either.fromOption(() => [anyhow(description, `Does not match ${PATTERNS.TRIGGER_RATE_UP}`)]),
    either.flatMap(([, attribute, rate]) =>
      sequenceS(ap)({
        attribute: toValidated(parseAttribute(attribute)),
        effect: sequenceS(ap)({
          type: right("autoSkill" as const),
          value: pipe(
            parseIntSafe(rate),
            toValidated,
            either.map((v) => v / 100),
          ),
        }),
      }),
    ),
  );
}

/**
 * ダメージ軽減効果をフィルタリング
 */
function isDamageReductionEffect(description: string): boolean {
  return PATTERNS.DAMAGE_REDUCTION.test(description);
}

/**
 * スキルリストから効果を抽出してマップに変換
 */
function effectsToMap(
  effects: ReadonlyArray<{ attribute: Attribute; effect: BattleEffect }>,
): SkillEffectMap {
  return effects.reduce((acc, { attribute, effect }) => {
    const existing = acc.get(attribute) ?? [];
    acc.set(attribute, [...existing, effect]);
    return acc;
  }, new Map<Attribute, BattleEffect[]>());
}

/**
 * 衣装の特殊スキル効果を解析
 */
export function parseSpecialSkillEffect(
  special: Costume["specialSkill"],
  limitBreak: number,
  isAwakened: boolean,
): ValidateResult<Option<SkillEffectMap>> {
  return transpose(
    pipe(
      special,
      option.map((sp) =>
        match(sp)
          .with({ type: "ex" }, ({ skills }) => {
            const validDescriptions = skills
              .map(({ description }) => description)
              .filter((desc) => !isDamageReductionEffect(desc));

            return pipe(
              validDescriptions.map(parseEffectUp),
              either.sequenceArray,
              either.map(effectsToMap),
            );
          })
          .with({ type: "adx" }, ({ get }) => {
            const validDescriptions = get({ limitBreak, isAwakened })
              .map(({ description }) => description)
              .filter((desc) => !isDamageReductionEffect(desc));

            return pipe(
              validDescriptions.map((desc) =>
                pipe(
                  parseEffectUp(desc),
                  either.alt(() => parseRateUp(desc)),
                ),
              ),
              either.sequenceArray,
              either.map(effectsToMap),
            );
          })
          .exhaustive(),
      ),
    ),
  );
}

/**
 * 特殊スキル効果マップから属性別の効果値を抽出
 */
export function extractEffectByType(
  effectMap: Option<SkillEffectMap>,
  type: BattleEffect["type"],
): AttributeRates {
  return pipe(
    effectMap,
    option.fold(
      () => ({ ...INITIAL_ATTRIBUTE_RATES }),
      (map) => {
        const result = { ...INITIAL_ATTRIBUTE_RATES };

        for (const [attribute, effects] of map.entries()) {
          const effect = effects.find((e) => e.type === type);
          if (effect) {
            result[attribute] = type === "skill" ? effect.value : 1.0 + effect.value;
          }
        }

        return result;
      },
    ),
  );
}
