import type { Charm } from "@/domain/charm/charm";
import type { Costume } from "@/domain/costume/costume";
import type { MemoriaId } from "@/domain/memoria/memoria";
import type { Concentration, MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import { type Amount, parseElement, parseIntSafe, type StatusKind } from "@/parser/common";
import type { Probability } from "@/parser/autoSkill";
import { P, match } from "ts-pattern";
import { Lenz } from "@/domain/lenz";
import { type Attribute, isDamageEffect, isNotStackOrElement } from "@/parser/skill";
import { fromNullable, Option } from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { getApplicativeValidation, isLeft, left, right } from "fp-ts/Either";
import { anyhow, MitamaError, ValidateResult } from "@/error/error";
import { either, option } from "fp-ts";
import { separator, transpose } from "@/fp-ts-ext/function";
import { sequenceS } from "fp-ts/Apply";
import { getSemigroup } from "fp-ts/Array";
import { toValidated } from "@/fp-ts-ext/Validated";

const NotApplicable = Number.NaN;
const ap = getApplicativeValidation(getSemigroup<MitamaError>());

function ToBeDefined(hint: string): never {
  throw new Error(`Not implemented: ${hint}`);
}

const ABILITY = /メモリア使用時、それが(.+)属性メモリアの場合、さらにメモリアスキル効果UP\+(\d+)%/;

function parseAbility(description?: string): Map<string, number> {
  const result = new Map<string, number>([
    ["Fire", 1.0],
    ["Water", 1.0],
    ["Wind", 1.0],
    ["Light", 1.0],
    ["Dark", 1.0],
  ]);
  if (!description) {
    return result;
  }
  const _match = description.match(ABILITY);
  if (!_match) {
    return result;
  }
  for (const attributes of _match[1].split("/")) {
    result.set(attributes, 1.0 + Number(_match[2]) / 100);
  }
  return result;
}

type BattleEffect = {
  type: "charm" | "skill" | "order" | "autoSkill";
  value: number;
};

const themeEffects: Map<Attribute, BattleEffect[]> = new Map([
  [
    "Water",
    [
      { type: "charm", value: 1.1 },
      { type: "skill", value: 1.1 },
      { type: "order", value: 1.1 },
    ],
  ],
  [
    "Wind",
    [
      { type: "charm", value: 1.1 },
      { type: "skill", value: 1.1 },
      { type: "order", value: 1.1 },
    ],
  ],
]);

const EFFECT_UP = /自身が使用する(.+)属性メモリアのスキル効果(\d+)%UP/;
const TRIGGER_RATE_UP = /自身が使用する(.+?)属性メモリアの補助スキル発動確率が(\d+)％UP/;

function parseEffectUp(
  description: string,
): ValidateResult<{ attribute: Attribute; effect: BattleEffect }> {
  return pipe(
    fromNullable(description.match(EFFECT_UP)),
    either.fromOption(() => [anyhow(description, `Does not match ${EFFECT_UP}`)]),
    either.flatMap(([, attribute, rate]) =>
      sequenceS(ap)({
        attribute: toValidated(parseElement(attribute)),
        effect: sequenceS(ap)({
          type: right("skill" as const),
          value: toValidated(parseIntSafe(rate)),
        }),
      }),
    ),
  );
}

function parseRateUp(
  description: string,
): ValidateResult<{ attribute: Attribute; effect: BattleEffect }> {
  return pipe(
    fromNullable(description.match(TRIGGER_RATE_UP)),
    either.fromOption(() => [anyhow(description, `Does not match ${TRIGGER_RATE_UP}`)]),
    either.flatMap(([, attribute, rate]) =>
      sequenceS(ap)({
        attribute: toValidated(parseElement(attribute)),
        effect: sequenceS(ap)({
          type: right("autoSkill" as const),
          value: toValidated(parseIntSafe(rate)),
        }),
      }),
    ),
  );
}

type SpSkikkEff = Map<Attribute, BattleEffect[]>;

function parseSpecialSkillEffect(
  special: Costume["specialSkill"],
  limitBreak: number,
  isAwakened: boolean,
): ValidateResult<Option<SpSkikkEff>> {
  return transpose(
    pipe(
      special,
      option.map((special) =>
        match(special)
          .with({ type: "ex" }, ({ skills }): ValidateResult<SpSkikkEff> => {
            return pipe(
              skills.map(({ description }) => parseEffectUp(description)),
              separator,
              either.map((effects) =>
                effects.reduce(
                  (acc, { attribute, effect }) =>
                    acc.set(attribute, [effect, ...(acc.get(attribute) ?? [])]),
                  new Map(),
                ),
              ),
            );
          })
          .with({ type: "adx" }, ({ get }): ValidateResult<SpSkikkEff> => {
            return pipe(
              get({ limitBreak, isAwakened }).map(({ description }) =>
                pipe(
                  parseEffectUp(description),
                  either.alt(() => parseRateUp(description)),
                ),
              ),
              separator,
              either.map((effects) =>
                effects.reduce(
                  (acc, { attribute, effect }) =>
                    acc.set(attribute, [effect, ...(acc.get(attribute) ?? [])]),
                  new Map(),
                ),
              ),
            );
          })
          .exhaustive(),
      ),
    ),
  );
}

export type StackOption = {
  rate: number;
  targets: MemoriaId[];
};

export type EvaluateOptions = {
  counter?: boolean;
  stack?: StackOption;
};

function _level(amount: Amount): number {
  return match(amount)
    .with("small", () => NotApplicable)
    .with("medium", () => 10 / 100)
    .with("large", () => 15 / 100)
    .with("extra-large", () => 18 / 100)
    .with("super-large", () => 21 / 100)
    .with("ultra-large", () => 24 / 100)
    .with("super-ultra-large", () => 27 / 100)
    .exhaustive();
}

function _probability(probability: Probability, concentration: Concentration): number {
  return match(probability)
    .with("certain", () =>
      match(concentration)
        .with(0, () => 0.12)
        .with(1, () => 0.125)
        .with(2, () => 0.13)
        .with(3, () => 0.135)
        .with(4, () => 0.15)
        .exhaustive(),
    )
    .with("medium", () =>
      match(concentration)
        .with(0, () => 0.18)
        .with(1, () => 0.1875)
        .with(2, () => 0.195)
        .with(3, () => 0.2025)
        .with(4, () => 0.225)
        .exhaustive(),
    )
    .with("high", () =>
      match(concentration)
        .with(0, () => 0.24) // ???
        .with(1, () => 0.25) // ???
        .with(2, () => 0.26) // ???
        .with(3, () => 0.27) // ???
        .with(4, () => 0.3)
        .exhaustive(),
    )
    .exhaustive();
}

type EvaluateResult = {
  readonly skill: {
    readonly memoria: MemoriaWithConcentration;
    readonly expected: {
      readonly damage?: number;
      readonly buff?: {
        readonly type: StatusKind;
        readonly amount: number;
      }[];
      readonly debuff?: {
        readonly type: StatusKind;
        readonly amount: number;
      }[];
      readonly recovery?: number;
    };
  }[];
  readonly supportBuff: Record<
    Exclude<StatusKind, "Light ATK" | "Dark ATK" | "Light DEF" | "Dark DEF" | "Life">,
    number
  >;
  readonly supportDebuff: Record<
    Exclude<StatusKind, "Light ATK" | "Dark ATK" | "Light DEF" | "Dark DEF" | "Life">,
    number
  >;
};

export function evaluate(
  deck: MemoriaWithConcentration[],
  [atk, spAtk, def, spDef]: [number, number, number, number],
  [opDef, opSpDef]: [number, number],
  charm: Charm,
  costume: Costume,
  { limitBraek, isAwakened }: { limitBraek: number; isAwakened: boolean },
  options: EvaluateOptions = {},
): ValidateResult<EvaluateResult> {
  const themeRate = {
    Fire: themeEffects.get("Fire")?.find(({ type }) => type === "skill")?.value || 1.0,
    Water: themeEffects.get("Water")?.find(({ type }) => type === "skill")?.value || 1.0,
    Wind: themeEffects.get("Wind")?.find(({ type }) => type === "skill")?.value || 1.0,
    Light: themeEffects.get("Light")?.find(({ type }) => type === "skill")?.value || 1.0,
    Dark: themeEffects.get("Dark")?.find(({ type }) => type === "skill")?.value || 1.0,
  };
  const graceRate = 1.1;
  const charmRate = 1.1;
  const charmEx = parseAbility(charm?.ability);
  const costumeRate = 1.15;
  const costumeSpecial = parseSpecialSkillEffect(costume.specialSkill, limitBraek, isAwakened);

  if (isLeft(costumeSpecial)) {
    return left(costumeSpecial.left);
  }

  const adx: Record<Attribute, number> = match(costumeSpecial.right)
    .with(option.none, () => ({
      Fire: 0.0,
      Water: 0.0,
      Wind: 0.0,
      Light: 0.0,
      Dark: 0.0,
    }))
    .otherwise(({ value }) => ({
      Fire: value.get("Fire")?.find(({ type }) => type === "autoSkill")?.value || 0.0,
      Water: value.get("Water")?.find(({ type }) => type === "autoSkill")?.value || 0.0,
      Wind: value.get("Wind")?.find(({ type }) => type === "autoSkill")?.value || 0.0,
      Light: value.get("Light")?.find(({ type }) => type === "autoSkill")?.value || 0.0,
      Dark: value.get("Dark")?.find(({ type }) => type === "autoSkill")?.value || 0.0,
    }));

  const costumeRateUp: Record<Attribute, number> = match(costumeSpecial.right)
    .with(option.none, () => ({
      Fire: 0.0,
      Water: 0.0,
      Wind: 0.0,
      Light: 0.0,
      Dark: 0.0,
    }))
    .otherwise(({ value }) => ({
      Fire: value.get("Fire")?.find(({ type }) => type === "skill")?.value || 0.0,
      Water: value.get("Water")?.find(({ type }) => type === "skill")?.value || 0.0,
      Wind: value.get("Wind")?.find(({ type }) => type === "skill")?.value || 0.0,
      Light: value.get("Light")?.find(({ type }) => type === "skill")?.value || 0.0,
      Dark: value.get("Dark")?.find(({ type }) => type === "skill")?.value || 0.0,
    }));

  const skill = deck.map((memoria) => {
    const skillLevel = match(memoria.concentration)
      .with(0, () => 1.35)
      .with(1, () => 1.375)
      .with(2, () => 1.4)
      .with(3, () => 1.425)
      .with(4, () => 1.5)
      .exhaustive();

    const ranged = Lenz.memoria.gvgSkill.effects.get(memoria).find(isNotStackOrElement);
    const range = match(ranged?.range)
      .with([P._, P._], ([a, b]) => (a + b) / 2)
      .run();

    const rangePlus =
      1.0 -
      deck
        .map((memoria) => Lenz.memoria.general.autoSkill.get(memoria))
        .filter((support) => support.effects.some((effect) => effect.type === "RangeUp"))
        .map((rangeUp) => {
          const up = rangeUp.effects.find((effect) => effect.type === "RangeUp");
          if (!up) {
            return 0;
          }
          return match(memoria.concentration)
            .with(0, () => 0.12)
            .with(1, () => 0.125)
            .with(2, () => 0.13)
            .with(3, () => 0.135)
            .with(4, () => 0.15)
            .exhaustive();
        })
        .reduce((acc: number, cur: number) => acc * (1.0 - cur - adx[memoria.attribute]), 1.0);

    const calibration =
      charmRate *
      charmEx.get(memoria.attribute)! *
      costumeRate *
      graceRate *
      themeRate[memoria.attribute] *
      costumeRateUp[memoria.attribute];

    const config = {
      calibration,
      skillLevel,
      range: range + rangePlus,
      memoria,
      deck,
      adx,
    };
    return {
      memoria,
      expected: {
        damage: damage([atk, spAtk], [opDef, opSpDef], config, options),
        buff: buff([atk, spAtk, def, spDef], config, options),
        debuff: debuff([atk, spAtk, def, spDef], config, options),
        recovery: recovery(def + spDef, config, options),
      },
    };
  });

  return right({
    skill,
    supportBuff: support("UP", [atk, spAtk, def, spDef], deck, adx),
    supportDebuff: support("DOWN", [atk, spAtk, def, spDef], deck, adx),
  });
}

type Config = {
  calibration: number;
  skillLevel: number;
  range: number;
  memoria: MemoriaWithConcentration;
  deck: MemoriaWithConcentration[];
  adx: { [key in Attribute]: number };
};

function damage(
  [atk, spAtk]: [number, number],
  [opDef, opSpDef]: [number, number],
  { calibration, skillLevel, range, memoria, deck, adx }: Config,
  { counter: enableCounter, stack }: EvaluateOptions,
): number | undefined {
  if (!Lenz.memoria.gvgSkill.effects.get(memoria).some((effect) => effect.type === "damage")) {
    return undefined;
  }

  const normalLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };
  const specialLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };

  for (const memoria of deck.filter((memoria) => memoria.skills.legendary !== undefined)) {
    match(memoria.skills.legendary)
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Fire += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Wind += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Fire +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Wind +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .otherwise(() => {});
  }

  const finalCalibration = match(memoria.cardType)
    .with(P.union("通常単体", "通常範囲"), () => calibration * normalLegendary[memoria.attribute])
    .with(P.union("特殊単体", "特殊範囲"), () => calibration * specialLegendary[memoria.attribute])
    .otherwise(() => calibration);

  const amount = Lenz.memoria.gvgSkill.effects.get(memoria).find(isDamageEffect)?.amount;

  if (!amount) {
    return undefined;
  }

  const skillRate = match(memoria.cardType)
    .when(
      (kind) => kind.includes("単体"),
      () =>
        match(amount)
          .with("ultra-large", () => 16.5 / 100)
          .with("super-large", () => 15.0 / 100)
          .with("extra-large", () => 13.5 / 100)
          .with("large", () => 11.5 / 100)
          .with("medium", () => 10.0 / 100)
          .otherwise(() => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))),
    )
    .when(
      (kind) => kind.includes("範囲"),
      () =>
        match(amount)
          .with("super-large", () => 12.0 / 100)
          .with("extra-large", () => 11.0 / 100)
          .with("large", () => 10.0 / 100)
          .with("medium", () => 8.5 / 100)
          .with("small", () => 7.0 / 100)
          .otherwise(() => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))),
    )
    .otherwise(() => {
      throw new Error("Invalid kind");
    });

  const support = deck
    .map((memoria) => [Lenz.memoria.general.autoSkill.get(memoria), memoria.concentration] as const)
    .map(([support, concentration]) => {
      const up = support.effects.find((effect) => effect.type === "DamageUp");
      if (!up) {
        return 0;
      }
      const level = _level(up.amount);
      const probability = _probability(support.probability, concentration);
      return level * (probability + adx[memoria.attribute]);
    })
    .reduce((acc, cur) => acc + cur, 1);

  const memoriaRate = skillRate * skillLevel;
  const counter =
    enableCounter && Lenz.memoria.gvgSkill.name.get(memoria).includes("カウンター") ? 1.5 : 1.0;
  const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;

  return Math.floor(
    (memoria.cardType.includes("通常") ? atk - (2 / 3) * opDef : spAtk - (2 / 3) * opSpDef) *
      memoriaRate *
      finalCalibration *
      support *
      range *
      counter *
      stackRate,
  );
}

function buff(
  [atk, spAtk, def, spDef]: [number, number, number, number],
  { calibration, skillLevel, range, memoria, deck, adx }: Config,
  { counter: enableCounter, stack }: EvaluateOptions,
):
  | {
      type: StatusKind;
      amount: number;
    }[]
  | undefined {
  if (!Lenz.memoria.gvgSkill.effects.get(memoria).some((effect) => effect.type === "buff")) {
    return undefined;
  }

  const supportLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };
  const normalLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };
  const specialLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };

  for (const memoria of deck.filter((memoria) => memoria.skills.legendary !== undefined)) {
    match(memoria.skills.legendary)
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") && legendary?.skill.trigger === "Assist",
        () => {
          supportLegendary.Fire +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") && legendary?.skill.trigger === "Assist",
        () => {
          supportLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") && legendary?.skill.trigger === "Assist",
        () => {
          supportLegendary.Wind +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Fire += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Wind += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Fire +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Wind +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .otherwise(() => {});
  }

  const finalCalibration = match(memoria.cardType)
    .with(P.union("通常単体", "通常範囲"), () => calibration * normalLegendary[memoria.attribute])
    .with(P.union("特殊単体", "特殊範囲"), () => calibration * specialLegendary[memoria.attribute])
    .with(P.union("支援", "妨害"), () => calibration * supportLegendary[memoria.attribute])
    .with("回復", () => calibration)
    .exhaustive();

  const support =
    memoria.cardType.includes("特殊") || memoria.cardType.includes("通常")
      ? 1.0
      : deck
          .map(
            (memoria) =>
              [Lenz.memoria.general.autoSkill.get(memoria), memoria.concentration] as const,
          )
          .map(([support, concentration]) => {
            const up = support.effects.find((effect) => effect.type === "SupportUp");
            if (!up) {
              return 0;
            }
            const level = _level(up.amount);
            const probability = _probability(support.probability, concentration);
            return level * (probability + adx[memoria.attribute]);
          })
          .reduce((acc, cur) => acc + cur, 1);

  return Lenz.memoria.gvgSkill.effects
    .get(memoria)
    .filter((effect) => effect.type === "buff")
    .map(({ amount, status }) => {
      const counter =
        enableCounter && Lenz.memoria.gvgSkill.name.get(memoria).includes("カウンター") ? 1.5 : 1.0;
      const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;
      return match(status!)
        .with("ATK", () => {
          const skillRate = match(amount!)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 2.28 / 100)
            .with("large", () => 3.04 / 100)
            .with("extra-large", () => 3.8 / 100)
            .with("super-large", () => 4.27 / 100)
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              atk * memoriaRate * finalCalibration * support * range * counter * stackRate,
            ),
          };
        })
        .with("Sp.ATK", () => {
          const skillRate = match(amount!)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 2.28 / 100)
            .with("large", () => 3.04 / 100)
            .with("extra-large", () => 3.8 / 100)
            .with("super-large", () => 4.27 / 100)
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spAtk * memoriaRate * finalCalibration * support * range * counter * stackRate,
            ),
          };
        })
        .with("DEF", () => {
          const skillRate = match(amount!)
            .with("small", () => 3.32 / 100)
            .with("medium", () => 4.27 / 100)
            .with("large", () => 4.75 / 100)
            .with("extra-large", () => 5.22 / 100)
            .with("super-large", () => 5.75) // TODO
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // TBD
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              def * memoriaRate * finalCalibration * support * range * counter * stackRate,
            ),
          };
        })
        .with("Sp.DEF", () => {
          const skillRate = match(amount!)
            .with("small", () => 3.32 / 100)
            .with("medium", () => 4.27 / 100)
            .with("large", () => 4.75 / 100)
            .with("extra-large", () => 5.22 / 100)
            .with("super-large", () => 5.75) // TODO
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spDef * memoriaRate * finalCalibration * support * range * counter * stackRate,
            ),
          };
        })
        .with(P.union("Fire ATK", "Water ATK", "Wind ATK", "Light ATK", "Dark ATK"), () => {
          const skillRate = match(amount!)
            .with("small", () => 3.25 / 100)
            .with("medium", () => 4.0 / 100)
            .with("large", () => 4.89 / 100)
            .with("extra-large", () => 5.51 / 100) // 戦場の一番星
            .with("super-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              Math.floor((atk + spAtk) / 2) *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with(P.union("Fire DEF", "Water DEF", "Wind DEF", "Light DEF", "Dark DEF"), () => {
          const skillRate = match(amount!)
            .with("small", () => 4.74 / 100)
            .with("medium", () => 5.65 / 100)
            .with("large", () => 6.11 / 100)
            .with("extra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              Math.floor((def + spDef) / 2) *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with("Life", () => {
          const skillRate = match(amount!)
            .with("medium", () => 0.45 / 100)
            .with("large", () => 0.7 / 100)
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              (def + spDef) *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .exhaustive();
    });
}

function debuff(
  [atk, spAtk, def, spDef]: [number, number, number, number],
  { calibration, skillLevel, range, memoria, deck, adx }: Config,
  { counter: enableCounter, stack }: EvaluateOptions,
):
  | {
      type: StatusKind;
      amount: number;
    }[]
  | undefined {
  if (!Lenz.memoria.gvgSkill.effects.get(memoria).some((effect) => effect.type === "debuff")) {
    return undefined;
  }

  const supportLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };
  const normalLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };
  const specialLegendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };
  for (const memoria of deck.filter((memoria) => memoria.skills.legendary !== undefined)) {
    match(memoria.skills.legendary)
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") && legendary?.skill.trigger === "Assist",
        () => {
          supportLegendary.Fire +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") && legendary?.skill.trigger === "Assist",
        () => {
          supportLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") && legendary?.skill.trigger === "Assist",
        () => {
          supportLegendary.Wind +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Fire += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") &&
          legendary?.skill.trigger === "Attack/Physical",
        () => {
          normalLegendary.Wind += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Fire +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Water +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") &&
          legendary?.skill.trigger === "Attack/Magical",
        () => {
          specialLegendary.Wind +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .otherwise(() => {});
  }

  const finalCalibration = match(memoria.cardType)
    .with(P.union("通常単体", "通常範囲"), () => calibration * normalLegendary[memoria.attribute])
    .with(P.union("特殊単体", "特殊範囲"), () => calibration * specialLegendary[memoria.attribute])
    .with(P.union("支援", "妨害"), () => calibration * supportLegendary[memoria.attribute])
    .with("回復", () => calibration)
    .exhaustive();

  const support =
    memoria.cardType.includes("特殊") || memoria.cardType.includes("通常")
      ? 1.0
      : deck
          .map(
            (memoria) =>
              [Lenz.memoria.general.autoSkill.get(memoria), memoria.concentration] as const,
          )
          .map(([support, concentration]) => {
            const up = support.effects.find((effect) => effect.type === "SupportUp");
            if (!up) {
              return 0;
            }
            const level = _level(up.amount);
            const probability = _probability(support.probability, concentration);
            return level * (probability + adx[memoria.attribute]);
          })
          .reduce((acc, cur) => acc + cur, 1);

  return Lenz.memoria.gvgSkill.effects
    .get(memoria)
    .filter((effect) => effect.type === "debuff")
    .map(({ amount, status }) => {
      const counter =
        enableCounter && Lenz.memoria.gvgSkill.name.get(memoria).includes("カウンター") ? 1.5 : 1.0;
      const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;
      return match(status!)
        .with("ATK", () => {
          const skillRate = match(amount!)
            .with("small", () => 2.5 / 100)
            .with("medium", () => 3.34 / 100)
            .with("large", () => 4.18 / 100)
            .with("extra-large", () => 4.71 / 100)
            .with("super-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              atk *
                memoriaRate *
                finalCalibration *
                support *
                range *
                (enableCounter && Lenz.memoria.gvgSkill.name.get(memoria).includes("カウンター")
                  ? 1.5
                  : 1.0),
            ),
          };
        })
        .with("Sp.ATK", () => {
          const skillRate = match(amount!)
            .with("small", () => 2.5 / 100)
            .with("medium", () => 3.34 / 100)
            .with("large", () => 4.18 / 100)
            .with("extra-large", () => 4.71 / 100)
            .with("super-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spAtk * memoriaRate * finalCalibration * support * range * counter * stackRate,
            ),
          };
        })
        .with("DEF", () => {
          const skillRate = match(amount!)
            .with("small", () => 3.65 / 100)
            .with("medium", () => 4.71 / 100)
            .with("large", () => 5.23 / 100)
            .with("extra-large", () => 5.75 / 100)
            .with("super-large", () => 6.2 / 100) // TODO
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              def * memoriaRate * finalCalibration * support * range * counter * stackRate,
            ),
          };
        })
        .with("Sp.DEF", () => {
          const skillRate = match(amount!)
            .with("small", () => 3.65 / 100)
            .with("medium", () => 4.71 / 100)
            .with("large", () => 5.23 / 100)
            .with("extra-large", () => 5.75 / 100)
            .with("super-large", () => 6.22 / 100)
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spDef * memoriaRate * finalCalibration * support * range * counter * stackRate,
            ),
          };
        })
        .with(P.union("Fire ATK", "Water ATK", "Wind ATK", "Light ATK", "Dark ATK"), () => {
          const skillRate = match(amount!)
            .with("small", () => 3.25 / 100)
            .with("medium", () => 4.0 / 100)
            .with("large", () => 4.89 / 100)
            .with("extra-large", () => 5.49 / 100)
            .with("super-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              Math.floor((atk + spAtk) / 2) *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with(P.union("Fire DEF", "Water DEF", "Wind DEF", "Light DEF", "Dark DEF"), () => {
          const skillRate = match(amount!)
            .with("small", () => 4.74 / 100)
            .with("medium", () => 5.65 / 100)
            .with("large", () => 6.11 / 100)
            .with("extra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("ultra-large", () => ToBeDefined(Lenz.memoria.general.shortName.get(memoria))) // 現状存在しない
            .with("super-ultra-large", () =>
              ToBeDefined(Lenz.memoria.general.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              Math.floor((def + spDef) / 2) *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with("Life", () => {
          throw new Error("Not implemented");
        })
        .exhaustive();
    });
}

// 回復量 = (DEF+Sp.DEF) × メモリア倍率 × 補正 × 乱数 × クリティカル
// 補正 = 補助スキル倍率 × 衣装倍率 × チャーム倍率 × (恩恵 + ノインヴェルト効果) × オーダー倍率
function recovery(
  dsd: number,
  { calibration, skillLevel, range, memoria, deck, adx }: Config,
  { counter: enableCounter, stack }: EvaluateOptions,
): number | undefined {
  if (memoria.cardType !== "回復") {
    return undefined;
  }
  const legendary = {
    Fire: 1,
    Water: 1,
    Wind: 1,
    Light: 1,
    Dark: 1,
  };
  for (const memoria of deck.filter(
    (memoria) => memoria.skills.legendary !== undefined && memoria.cardType === "回復",
  )) {
    match(memoria.skills.legendary)
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Fire") && legendary?.skill.trigger === "Recovery",
        () => {
          legendary.Fire += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Water") && legendary?.skill.trigger === "Recovery",
        () => {
          legendary.Water += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        (legendary) =>
          legendary?.skill.attributes.includes("Wind") && legendary?.skill.trigger === "Recovery",
        () => {
          legendary.Wind += memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .run();
  }

  const skillRate = match(Lenz.memoria.gvgSkill.description.get(memoria))
    .when(
      (sentence) => sentence.includes("特大回復"),
      () => 13.2 / 100,
    )
    .when(
      (sentence) => sentence.includes("大回復"),
      () => 9.35 / 100,
    )
    .when(
      (sentence) => sentence.includes("回復"),
      () => 7.7 / 100,
    )
    .run();

  const support = deck
    .map((memoria) => [Lenz.memoria.general.autoSkill.get(memoria), memoria.concentration] as const)
    .map(([support, concentration]) => {
      const up = support.effects.find((effect) => effect.type === "RecoveryUp");
      if (!up) {
        return 0;
      }
      const level = _level(up.amount);
      const probability = _probability(support.probability, concentration);
      return level * (probability + adx[memoria.attribute]);
    })
    .reduce((acc, cur) => acc + cur, 1);

  const memoriaRate = skillRate * skillLevel;
  const counter =
    enableCounter && Lenz.memoria.gvgSkill.name.get(memoria).includes("カウンター") ? 1.5 : 1.0;
  const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;

  return Math.floor(
    dsd *
      memoriaRate *
      calibration *
      legendary[memoria.attribute] *
      support *
      range *
      counter *
      stackRate,
  );
}

function support(
  type: "UP" | "DOWN",
  [atk, spAtk, def, spDef]: [number, number, number, number],
  deck: MemoriaWithConcentration[],
  adx: { [key in Attribute]: number },
): Record<
  Exclude<StatusKind, "Light ATK" | "Dark ATK" | "Light DEF" | "Dark DEF" | "Life">,
  number
> {
  const result: Record<
    Exclude<StatusKind, "Light ATK" | "Dark ATK" | "Light DEF" | "Dark DEF" | "Life">,
    number
  > = {
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
  const map = deck
    .flatMap((memoria) => {
      return Lenz.memoria.autoSkill.effects
        .get(memoria)
        .map((effect) => [memoria.concentration, memoria.attribute, effect] as const);
    })
    .filter(([, , effect]) => effect.type === type)
    .map(([concentration, attributes, { amount, status }]) => {
      const probability =
        match(concentration)
          .with(0, () => 0.12)
          .with(1, () => 0.125)
          .with(2, () => 0.13)
          .with(3, () => 0.135)
          .with(4, () => 0.15)
          .run() + adx[attributes];
      const skillLevel = match(concentration)
        .with(0, () => 1.35)
        .with(1, () => 1.375)
        .with(2, () => 1.4)
        .with(3, () => 1.425)
        .with(4, () => 1.5)
        .otherwise(() => 1.5);
      return match(status!)
        .with("ATK", () => {
          const skillRate = match(amount)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 1.0 / 100)
            .with("large", () => 1.5 / 100)
            .with("extra-large", () => 1.8 / 100)
            .with("super-large", () => 2.1 / 100)
            .with("ultra-large", () => 2.4 / 100)
            .with("super-ultra-large", () => 2.7 / 100)
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(atk * memoriaRate * probability),
          };
        })
        .with("Sp.ATK", () => {
          const skillRate = match(amount)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 1.0 / 100)
            .with("large", () => 1.5 / 100)
            .with("extra-large", () => 1.8 / 100)
            .with("super-large", () => 2.1 / 100)
            .with("ultra-large", () => 2.4 / 100)
            .with("super-ultra-large", () => 2.7 / 100)
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(spAtk * memoriaRate * probability),
          };
        })
        .with("DEF", () => {
          const skillRate = match(amount)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 1.0 / 100)
            .with("large", () => 1.5 / 100)
            .with("extra-large", () => 1.8 / 100)
            .with("super-large", () => 2.1 / 100)
            .with("ultra-large", () => 2.4 / 100)
            .with("super-ultra-large", () => 2.7 / 100)
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(def * memoriaRate * probability),
          };
        })
        .with("Sp.DEF", () => {
          const skillRate = match(amount)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 1.0 / 100)
            .with("large", () => 1.5 / 100)
            .with("extra-large", () => 1.8 / 100)
            .with("super-large", () => 2.1 / 100)
            .with("ultra-large", () => 2.4 / 100)
            .with("super-ultra-large", () => 2.7 / 100)
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(spDef * memoriaRate * probability),
          };
        })
        .with(P.union("Fire ATK", "Water ATK", "Wind ATK"), () => {
          const skillRate = match(amount)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 1.0 / 100)
            .with("large", () => 1.5 / 100)
            .with("extra-large", () => 1.8 / 100)
            .with("super-large", () => 2.1 / 100)
            .with("ultra-large", () => 2.4 / 100)
            .with("super-ultra-large", () => 2.7 / 100)
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(Math.floor((atk + spAtk) / 2) * memoriaRate * probability),
          };
        })
        .with(P.union("Fire DEF", "Water DEF", "Wind DEF"), () => {
          const skillRate = match(amount)
            .with("small", () => NotApplicable) // ない
            .with("medium", () => 1.0 / 100)
            .with("large", () => 1.5 / 100)
            .with("extra-large", () => 1.8 / 100)
            .with("super-large", () => 2.1 / 100)
            .with("ultra-large", () => 2.4 / 100)
            .with("super-ultra-large", () => 2.7 / 100)
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(Math.floor((def + spDef) / 2) * memoriaRate * probability),
          };
        })
        .exhaustive();
    });

  for (const { type, amount } of map) {
    result[type] += amount;
  }

  return result;
}
