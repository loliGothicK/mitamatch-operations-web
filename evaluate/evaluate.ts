import type { Charm } from '@/domain/charm/charm';
import type { Costume } from '@/domain/costume/costume';
import type { MemoriaId } from '@/domain/memoria/memoria';
import type { MemoriaWithConcentration } from '@/jotai/memoriaAtoms';
import type { Amount, StatusKind } from '@/parser/common';
import type { Probability } from '@/parser/support';
import { P, match } from 'ts-pattern';
import { Lenz } from '@/domain/memoria/lens';
import { isNotStackEffect } from '@/parser/skill';

const NotApplicable = Number.NaN;

function ToBeDefined(hint: string): never {
  throw new Error(`Not implemented: ${hint}`);
}

const ABILITY =
  /メモリア使用時、それが(.+)属性メモリアの場合、さらにメモリアスキル効果UP\+(\d+)%/;

function parseAbility(description?: string): Map<string, number> {
  const result = new Map<string, number>([
    ['火', 1.0],
    ['水', 1.0],
    ['風', 1.0],
    ['光', 1.0],
    ['闇', 1.0],
  ]);
  if (!description) {
    return result;
  }
  const _match = description.match(ABILITY);
  if (!_match) {
    return result;
  }
  for (const element of _match[1].split('/')) {
    result.set(element, 1.0 + Number(_match[2]) / 100);
  }
  return result;
}

const EFFECT_UP = /自身が使用する(.+)属性メモリアのスキル効果(\d+)%UP/;
const TRIGGER_RATE_UP =
  /自身が使用する(.+?)属性メモリアの補助スキル発動確率が(\d+)％UP/;

function parseEx(description?: string): Map<string, number> {
  const result = new Map<string, number>([
    ['火', 1.0],
    ['水', 1.0],
    ['風', 1.0],
    ['光', 1.0],
    ['闇', 1.0],
  ]);
  if (!description) {
    return result;
  }
  const _match = description.match(EFFECT_UP);
  if (!_match) {
    return result;
  }
  result.set(_match[1], 1.0 + Number(_match[2]) / 100);
  return result;
}

function parseAdx(
  adx: Costume['adx'],
  adxLevel: number,
): readonly [Map<string, number>, Map<string, number>] {
  const effUp = new Map<string, number>([
    ['火', 1.0],
    ['水', 1.0],
    ['風', 1.0],
    ['光', 1.0],
    ['闇', 1.0],
  ]);
  const rateUp = new Map<string, number>([
    ['火', 0.0],
    ['水', 0.0],
    ['風', 0.0],
    ['光', 0.0],
    ['闇', 0.0],
  ]);
  if (!adx) {
    return [effUp, rateUp];
  }

  for (const skill of adx[adxLevel]) {
    const _match = skill.description?.match(EFFECT_UP);
    if (!_match) {
      continue;
    }
    effUp.set(_match[1], 1.0 + Number(_match[2]) / 100);
  }

  for (const skill of adx[adxLevel]) {
    const _match = skill.description?.match(TRIGGER_RATE_UP);
    if (!_match) {
      continue;
    }
    rateUp.set(_match[1], Number(_match[2]) / 100);
  }

  return [effUp, rateUp] as const;
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
    .with('small', () => NotApplicable)
    .with('medium', () => 10 / 100)
    .with('large', () => 15 / 100)
    .with('extra-large', () => 18 / 100)
    .with('super-large', () => 21 / 100)
    .with('ultra-large', () => 24 / 100)
    .exhaustive();
}

function _probability(probability: Probability, concentration: number): number {
  return match(probability)
    .with('certain', () => {
      if (concentration === 0) {
        return 0.12;
      }
      if (concentration === 1) {
        return 0.125;
      }
      if (concentration === 2) {
        return 0.13;
      }
      if (concentration === 3) {
        return 0.135;
      }
      if (concentration === 4) {
        return 0.15;
      }
      throw new Error('Invalid concentration');
    })
    .with('medium', () => {
      if (concentration === 0) {
        return 0.18;
      }
      if (concentration === 1) {
        return 0.1875;
      }
      if (concentration === 2) {
        return 0.195;
      }
      if (concentration === 3) {
        return 0.2025;
      }
      if (concentration === 4) {
        return 0.225;
      }
      throw new Error('Invalid concentration');
    })
    .with('high', () => {
      if (concentration === 0) {
        return 0.24; // ???
      }
      if (concentration === 1) {
        return 0.25; // ???
      }
      if (concentration === 2) {
        return 0.26; // ???
      }
      if (concentration === 3) {
        return 0.27; // ???
      }
      if (concentration === 4) {
        return 0.3;
      }
      throw new Error('Invalid concentration');
    })
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
    Exclude<
      StatusKind,
      'Light ATK' | 'Dark ATK' | 'Light DEF' | 'Dark DEF' | 'Life'
    >,
    number
  >;
  readonly supportDebuff: Record<
    Exclude<
      StatusKind,
      'Light ATK' | 'Dark ATK' | 'Light DEF' | 'Dark DEF' | 'Life'
    >,
    number
  >;
};

export function evaluate(
  deck: MemoriaWithConcentration[],
  [atk, spAtk, def, spDef]: [number, number, number, number],
  [opDef, opSpDef]: [number, number],
  charm: Charm,
  costume: Costume,
  adxLevel: number,
  options: EvaluateOptions = {},
): EvaluateResult {
  const themeRate = new Map<string, number>([
    ['火', 1.1],
    ['水', 1.1],
    ['風', 1.1],
    ['光', 1.0],
    ['闇', 1.0],
  ]);
  const graceRate = 1.1;
  const charmRate = 1.1;
  const charmEx = parseAbility(charm?.ability);
  const costumeRate = 1.15;
  const costumeEx = parseEx(costume?.ex?.description);
  const [costumeAdx, rateAdx] = parseAdx(costume?.adx, adxLevel);

  const skill = deck.map(memoria => {
    const skillLevel = match(memoria.concentration)
      .with(0, () => 1.35)
      .with(1, () => 1.375)
      .with(2, () => 1.4)
      .with(3, () => 1.425)
      .with(4, () => 1.5)
      .otherwise(() => 1.5);

    const range = match(
      Lenz.skill.effects.get(memoria).find(isNotStackEffect)?.range,
    )
      .with([1, 1], () => 1)
      .with([1, 2], () => 1.5)
      .with([1, 3], () => 2)
      .with([2, 2], () => 2)
      .with([2, 3], () => 2.5)
      .run();

    const rangePlus =
      1.0 -
      deck
        .map(memoria => Lenz.memoria.support.get(memoria))
        .filter(support =>
          support.effects.some(effect => effect.type === 'RangeUp'),
        )
        .map(rangeUp => {
          const up = rangeUp.effects.find(effect => effect.type === 'RangeUp');
          if (!up) {
            return 0;
          }
          return match(memoria.concentration)
            .with(0, () => 0.12)
            .with(1, () => 0.125)
            .with(2, () => 0.13)
            .with(3, () => 0.135)
            .with(4, () => 0.15)
            .otherwise(() => 0.15);
        })
        .reduce(
          (acc: number, cur: number) =>
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            acc * (1.0 - cur - rateAdx.get(memoria.element)!),
          1.0,
        );

    const calibration =
      charmRate *
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      charmEx.get(memoria.element)! *
      costumeRate *
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      costumeEx.get(memoria.element)! *
      graceRate *
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      themeRate.get(memoria.element)! *
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      costumeAdx.get(memoria.element)!;

    return {
      memoria,
      expected: {
        damage: damage(
          [atk, spAtk],
          [opDef, opSpDef],
          calibration,
          skillLevel,
          range + rangePlus,
          memoria,
          deck,
          rateAdx,
          options,
        ),
        buff: buff(
          [atk, spAtk, def, spDef],
          calibration,
          skillLevel,
          range + rangePlus,
          memoria,
          deck,
          rateAdx,
          options,
        ),
        debuff: debuff(
          [atk, spAtk, def, spDef],
          calibration,
          skillLevel,
          range + rangePlus,
          memoria,
          deck,
          rateAdx,
          options,
        ),
        recovery: recovery(
          def + spDef,
          calibration,
          skillLevel,
          range + rangePlus,
          memoria,
          deck,
          rateAdx,
          options,
        ),
      },
    };
  });

  return {
    skill,
    supportBuff: support('UP', [atk, spAtk, def, spDef], deck, rateAdx),
    supportDebuff: support('DOWN', [atk, spAtk, def, spDef], deck, rateAdx),
  };
}

function damage(
  [atk, spAtk]: [number, number],
  [opDef, opSpDef]: [number, number],
  calibration: number,
  skillLevel: number,
  range: number,
  memoria: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
  adx: Map<string, number>,
  { counter: enableCounter, stack }: EvaluateOptions,
): number | undefined {
  if (
    !Lenz.skill.effects.get(memoria).some(effect => effect.type === 'damage')
  ) {
    return undefined;
  }

  const normalLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };
  const specialLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };

  for (const memoria of deck.filter(
    memoria => memoria.skills.legendary !== undefined,
  )) {
    match(memoria.skills.legendary)
      .when(
        legendary => legendary?.raw.name.includes('火通'),
        () => {
          normalLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水通'),
        () => {
          normalLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風通'),
        () => {
          normalLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('火特'),
        () => {
          specialLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水特'),
        () => {
          specialLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風特'),
        () => {
          specialLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
      .otherwise(() => {});
  }

  const finalCalibration = match(memoria.kind)
    .with(
      P.union('通常単体', '通常範囲'),
      () => calibration * normalLegendary[memoria.element],
    )
    .with(
      P.union('特殊単体', '特殊範囲'),
      () => calibration * specialLegendary[memoria.element],
    )
    .otherwise(() => calibration);

  const skillRate = match(memoria.kind)
    .when(
      kind => kind.includes('単体'),
      () =>
        match(Lenz.skill.description.get(memoria))
          .when(
            sentence => sentence.includes('超特大ダメージ'),
            () => 15.0 / 100,
          )
          .when(
            sentence => sentence.includes('特大ダメージ'),
            () => 13.5 / 100,
          )
          .when(
            sentence => sentence.includes('大ダメージ'),
            () => 11.5 / 100,
          )
          .when(
            sentence => sentence.includes('ダメージ'),
            () => 10.0 / 100,
          )
          .run(),
    )
    .when(
      kind => kind.includes('範囲'),
      () =>
        match(Lenz.skill.description.get(memoria))
          .when(
            sentence => sentence.includes('特大ダメージ'),
            () => 11.0 / 100,
          )
          .when(
            sentence => sentence.includes('大ダメージ'),
            () => 10.0 / 100,
          )
          .when(
            sentence => sentence.includes('小ダメージ'),
            () => 7.0 / 100,
          )
          .when(
            sentence => sentence.includes('ダメージ'),
            () => 8.5 / 100,
          )
          .run(),
    )
    .otherwise(() => {
      throw new Error('Invalid kind');
    });

  const support = deck
    .map(
      memoria =>
        [Lenz.memoria.support.get(memoria), memoria.concentration] as const,
    )
    .map(([support, concentration]) => {
      const up = support.effects.find(effect => effect.type === 'DamageUp');
      if (!up) {
        return 0;
      }
      const level = _level(up.amount);
      const probability = _probability(support.probability, concentration);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return level * (probability + adx.get(memoria.element)!);
    })
    .reduce((acc, cur) => acc + cur, 1);

  const memoriaRate = skillRate * skillLevel;
  const counter =
    enableCounter && Lenz.skill.name.get(memoria).includes('カウンター')
      ? 1.5
      : 1.0;
  const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;

  return Math.floor(
    (memoria.kind.includes('通常')
      ? atk - (2 / 3) * opDef
      : spAtk - (2 / 3) * opSpDef) *
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
  calibration: number,
  skillLevel: number,
  range: number,
  memoria: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
  adx: Map<string, number>,
  { counter: enableCounter, stack }: EvaluateOptions,
):
  | {
      type: StatusKind;
      amount: number;
    }[]
  | undefined {
  if (!Lenz.skill.effects.get(memoria).some(effect => effect.type === 'buff')) {
    return undefined;
  }

  const supportLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };
  const normalLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };
  const specialLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };

  for (const memoria of deck.filter(
    memoria => memoria.skills.legendary !== undefined,
  )) {
    match(memoria.skills.legendary)
      .when(
        legendary => legendary?.raw.name.includes('火援'),
        () => {
          supportLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水援'),
        () => {
          supportLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風援'),
        () => {
          supportLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('火通'),
        () => {
          normalLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水通'),
        () => {
          normalLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風通'),
        () => {
          normalLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('火特'),
        () => {
          specialLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水特'),
        () => {
          specialLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風特'),
        () => {
          specialLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
      .otherwise(() => {});
  }

  const finalCalibration = match(memoria.kind)
    .with(
      P.union('通常単体', '通常範囲'),
      () => calibration * normalLegendary[memoria.element],
    )
    .with(
      P.union('特殊単体', '特殊範囲'),
      () => calibration * specialLegendary[memoria.element],
    )
    .with(
      P.union('支援', '妨害'),
      () => calibration * supportLegendary[memoria.element],
    )
    .with('回復', () => calibration)
    .exhaustive();

  const support =
    memoria.kind.includes('特殊') || memoria.kind.includes('通常')
      ? 1.0
      : deck
          .map(
            memoria =>
              [
                Lenz.memoria.support.get(memoria),
                memoria.concentration,
              ] as const,
          )
          .map(([support, concentration]) => {
            const up = support.effects.find(
              effect => effect.type === 'SupportUp',
            );
            if (!up) {
              return 0;
            }
            const level = _level(up.amount);
            const probability = _probability(
              support.probability,
              concentration,
            );
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            return level * (probability + adx.get(memoria.element)!);
          })
          .reduce((acc, cur) => acc + cur, 1);

  return Lenz.skill.effects
    .get(memoria)
    .filter(effect => effect.type === 'buff')
    .map(({ amount, status }) => {
      const counter =
        enableCounter && Lenz.skill.name.get(memoria).includes('カウンター')
          ? 1.5
          : 1.0;
      const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return match(status!)
        .with('ATK', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => NotApplicable) // ない
            .with('medium', () => 2.28 / 100)
            .with('large', () => 3.04 / 100)
            .with('extra-large', () => 3.8 / 100)
            .with('super-large', () => 4.27 / 100)
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              atk *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with('Sp.ATK', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => NotApplicable) // ない
            .with('medium', () => 2.28 / 100)
            .with('large', () => 3.04 / 100)
            .with('extra-large', () => 3.8 / 100)
            .with('super-large', () => 4.27 / 100)
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              spAtk *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with('DEF', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => 3.32 / 100)
            .with('medium', () => 4.27 / 100)
            .with('large', () => 4.75 / 100)
            .with('extra-large', () => 5.22 / 100)
            .with('super-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // TBD
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // TBD
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              def *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with('Sp.DEF', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => 3.32 / 100)
            .with('medium', () => 4.27 / 100)
            .with('large', () => 4.75 / 100)
            .with('extra-large', () => 5.22 / 100)
            .with('super-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              spDef *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with(
          P.union('Fire ATK', 'Water ATK', 'Wind ATK', 'Light ATK', 'Dark ATK'),
          () => {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const skillRate = match(amount!)
              .with('small', () => 3.25 / 100)
              .with('medium', () => 4.0 / 100)
              .with('large', () => 4.89 / 100)
              .with('extra-large', () => 5.51 / 100) // 戦場の一番星
              .with('super-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .with('ultra-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
          },
        )
        .with(
          P.union('Fire DEF', 'Water DEF', 'Wind DEF', 'Light DEF', 'Dark DEF'),
          () => {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const skillRate = match(amount!)
              .with('small', () => 4.74 / 100)
              .with('medium', () => 5.65 / 100)
              .with('large', () => 6.11 / 100)
              .with('extra-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .with('super-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .with('ultra-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
          },
        )
        .with('Life', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('medium', () => 0.45 / 100)
            .with('large', () => 0.7 / 100)
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
  calibration: number,
  skillLevel: number,
  range: number,
  memoria: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
  adx: Map<string, number>,
  { counter: enableCounter, stack }: EvaluateOptions,
):
  | {
      type: StatusKind;
      amount: number;
    }[]
  | undefined {
  if (
    !Lenz.skill.effects.get(memoria).some(effect => effect.type === 'debuff')
  ) {
    return undefined;
  }

  const supportLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };
  const normalLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };
  const specialLegendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };
  for (const memoria of deck.filter(
    memoria => memoria.skills.legendary !== undefined,
  )) {
    match(memoria.skills.legendary)
      .when(
        legendary => legendary?.raw.name.includes('火援'),
        () => {
          supportLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水援'),
        () => {
          supportLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風援'),
        () => {
          supportLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('火通'),
        () => {
          normalLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水通'),
        () => {
          normalLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風通'),
        () => {
          normalLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('火特'),
        () => {
          specialLegendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水特'),
        () => {
          specialLegendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風特'),
        () => {
          specialLegendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
      .otherwise(() => {});
  }

  const finalCalibration = match(memoria.kind)
    .with(
      P.union('通常単体', '通常範囲'),
      () => calibration * normalLegendary[memoria.element],
    )
    .with(
      P.union('特殊単体', '特殊範囲'),
      () => calibration * specialLegendary[memoria.element],
    )
    .with(
      P.union('支援', '妨害'),
      () => calibration * supportLegendary[memoria.element],
    )
    .with('回復', () => calibration)
    .exhaustive();

  const support =
    memoria.kind.includes('特殊') || memoria.kind.includes('通常')
      ? 1.0
      : deck
          .map(
            memoria =>
              [
                Lenz.memoria.support.get(memoria),
                memoria.concentration,
              ] as const,
          )
          .map(([support, concentration]) => {
            const up = support.effects.find(
              effect => effect.type === 'SupportUp',
            );
            if (!up) {
              return 0;
            }
            const level = _level(up.amount);
            const probability = _probability(
              support.probability,
              concentration,
            );
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            return level * (probability + adx.get(memoria.element)!);
          })
          .reduce((acc, cur) => acc + cur, 1);

  return Lenz.skill.effects
    .get(memoria)
    .filter(effect => effect.type === 'debuff')
    .map(({ amount, status }) => {
      const counter =
        enableCounter && Lenz.skill.name.get(memoria).includes('カウンター')
          ? 1.5
          : 1.0;
      const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return match(status!)
        .with('ATK', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => 2.5 / 100)
            .with('medium', () => 3.34 / 100)
            .with('large', () => 4.18 / 100)
            .with('extra-large', () => 4.71 / 100)
            .with('super-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              atk *
                memoriaRate *
                finalCalibration *
                support *
                range *
                (enableCounter &&
                Lenz.skill.name.get(memoria).includes('カウンター')
                  ? 1.5
                  : 1.0),
            ),
          };
        })
        .with('Sp.ATK', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => 2.5 / 100)
            .with('medium', () => 3.34 / 100)
            .with('large', () => 4.18 / 100)
            .with('extra-large', () => 4.71 / 100)
            .with('super-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              spAtk *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with('DEF', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => 3.65 / 100)
            .with('medium', () => 4.71 / 100)
            .with('large', () => 5.23 / 100)
            .with('extra-large', () => 5.75 / 100)
            .with('super-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              def *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with('Sp.DEF', () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const skillRate = match(amount!)
            .with('small', () => 3.65 / 100)
            .with('medium', () => 4.71 / 100)
            .with('large', () => 5.23 / 100)
            .with('extra-large', () => 5.75 / 100)
            .with('super-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .with('ultra-large', () =>
              ToBeDefined(Lenz.memoria.shortName.get(memoria)),
            ) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              spDef *
                memoriaRate *
                finalCalibration *
                support *
                range *
                counter *
                stackRate,
            ),
          };
        })
        .with(
          P.union('Fire ATK', 'Water ATK', 'Wind ATK', 'Light ATK', 'Dark ATK'),
          () => {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const skillRate = match(amount!)
              .with('small', () => 3.25 / 100)
              .with('medium', () => 4.0 / 100)
              .with('large', () => 4.89 / 100)
              .with('extra-large', () => 5.49 / 100)
              .with('super-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .with('ultra-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
          },
        )
        .with(
          P.union('Fire DEF', 'Water DEF', 'Wind DEF', 'Light DEF', 'Dark DEF'),
          () => {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const skillRate = match(amount!)
              .with('small', () => 4.74 / 100)
              .with('medium', () => 5.65 / 100)
              .with('large', () => 6.11 / 100)
              .with('extra-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .with('super-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .with('ultra-large', () =>
                ToBeDefined(Lenz.memoria.shortName.get(memoria)),
              ) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
          },
        )
        .with('Life', () => {
          throw new Error('Not implemented');
        })
        .exhaustive();
    });
}

// 回復量 = (DEF+Sp.DEF) × メモリア倍率 × 補正 × 乱数 × クリティカル
// 補正 = 補助スキル倍率 × 衣装倍率 × チャーム倍率 × (恩恵 + ノインヴェルト効果) × オーダー倍率
function recovery(
  dsd: number,
  calibration: number,
  skillLevel: number,
  range: number,
  memoria: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
  adx: Map<string, number>,
  { counter: enableCounter, stack }: EvaluateOptions,
): number | undefined {
  if (memoria.kind !== '回復') {
    return undefined;
  }
  const legendary = {
    火: 1,
    水: 1,
    風: 1,
    光: 1,
    闇: 1,
  };
  for (const memoria of deck.filter(
    memoria =>
      memoria.skills.legendary !== undefined && memoria.kind === '回復',
  )) {
    match(memoria.skills.legendary)
      .when(
        legendary => legendary?.raw.name.includes('火回'),
        () => {
          legendary.火 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('水回'),
        () => {
          legendary.水 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .when(
        legendary => legendary?.raw.name.includes('風回'),
        () => {
          legendary.風 +=
            memoria.skills.legendary?.skill.rates[memoria.concentration] || 0;
        },
      )
      .run();
  }

  const skillRate = match(Lenz.skill.description.get(memoria))
    .when(
      sentence => sentence.includes('特大回復'),
      () => 13.2 / 100,
    )
    .when(
      sentence => sentence.includes('大回復'),
      () => 9.35 / 100,
    )
    .when(
      sentence => sentence.includes('回復'),
      () => 7.7 / 100,
    )
    .run();

  const support = deck
    .map(
      memoria =>
        [Lenz.memoria.support.get(memoria), memoria.concentration] as const,
    )
    .map(([support, concentration]) => {
      const up = support.effects.find(effect => effect.type === 'RecoveryUp');
      if (!up) {
        return 0;
      }
      const level = _level(up.amount);
      const probability = _probability(support.probability, concentration);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return level * (probability + adx.get(memoria.element)!);
    })
    .reduce((acc, cur) => acc + cur, 1);

  const memoriaRate = skillRate * skillLevel;
  const counter =
    enableCounter && Lenz.skill.name.get(memoria).includes('カウンター')
      ? 1.5
      : 1.0;
  const stackRate = stack?.targets.includes(memoria.id) ? stack?.rate : 1.0;

  return Math.floor(
    dsd *
      memoriaRate *
      calibration *
      legendary[memoria.element] *
      support *
      range *
      counter *
      stackRate,
  );
}

function support(
  type: 'UP' | 'DOWN',
  [atk, spAtk, def, spDef]: [number, number, number, number],
  deck: MemoriaWithConcentration[],
  adx: Map<string, number>,
): Record<
  Exclude<
    StatusKind,
    'Light ATK' | 'Dark ATK' | 'Light DEF' | 'Dark DEF' | 'Life'
  >,
  number
> {
  const result: Record<
    Exclude<
      StatusKind,
      'Light ATK' | 'Dark ATK' | 'Light DEF' | 'Dark DEF' | 'Life'
    >,
    number
  > = {
    // biome-ignore lint/style/useNamingConvention: <explanation>
    ATK: 0,
    'Sp.ATK': 0,
    // biome-ignore lint/style/useNamingConvention: <explanation>
    DEF: 0,
    'Sp.DEF': 0,
    'Fire ATK': 0,
    'Water ATK': 0,
    'Wind ATK': 0,
    'Fire DEF': 0,
    'Water DEF': 0,
    'Wind DEF': 0,
  };
  const map = deck
    .flatMap(memoria => {
      return Lenz.support.effects
        .get(memoria)
        .map(
          effect => [memoria.concentration, memoria.element, effect] as const,
        );
    })
    .filter(([, , effect]) => effect.type === type)
    .map(([concentration, element, { amount, status }]) => {
      const probability =
        match(concentration)
          .with(0, () => 0.12)
          .with(1, () => 0.125)
          .with(2, () => 0.13)
          .with(3, () => 0.135)
          .with(4, () => 0.15)
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          .run() + adx.get(element)!;
      const skillLevel = match(concentration)
        .with(0, () => 1.35)
        .with(1, () => 1.375)
        .with(2, () => 1.4)
        .with(3, () => 1.425)
        .with(4, () => 1.5)
        .otherwise(() => 1.5);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return match(status!)
        .with('ATK', () => {
          const skillRate = match(amount)
            .with('medium', () => 1.0 / 100)
            .with('large', () => 1.5 / 100)
            .with('extra-large', () => 1.8 / 100)
            .with('super-large', () => 2.1 / 100) // 現状存在しない
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(atk * memoriaRate * probability),
          };
        })
        .with('Sp.ATK', () => {
          const skillRate = match(amount)
            .with('medium', () => 1.0 / 100)
            .with('large', () => 1.5 / 100)
            .with('extra-large', () => 1.8 / 100)
            .with('super-large', () => 2.1 / 100) // 現状存在しない
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(spAtk * memoriaRate * probability),
          };
        })
        .with('DEF', () => {
          const skillRate = match(amount)
            .with('medium', () => 1.0 / 100)
            .with('large', () => 1.5 / 100)
            .with('extra-large', () => 1.8 / 100)
            .with('super-large', () => 2.1 / 100) // 現状存在しない
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(def * memoriaRate * probability),
          };
        })
        .with('Sp.DEF', () => {
          const skillRate = match(amount)
            .with('medium', () => 1.0 / 100)
            .with('large', () => 1.5 / 100)
            .with('extra-large', () => 1.8 / 100)
            .with('super-large', () => 2.1 / 100) // 現状存在しない
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(spDef * memoriaRate * probability),
          };
        })
        .with(P.union('Fire ATK', 'Water ATK', 'Wind ATK'), () => {
          const skillRate = match(amount)
            .with('medium', () => 1.5 / 100)
            .with('large', () => 1.8 / 100)
            .with('extra-large', () => 2.1 / 100)
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              Math.floor((atk + spAtk) / 2) * memoriaRate * probability,
            ),
          };
        })
        .with(P.union('Fire DEF', 'Water DEF', 'Wind DEF'), () => {
          const skillRate = match(amount)
            .with('medium', () => 1.5 / 100)
            .with('large', () => 1.8 / 100)
            .with('extra-large', () => 2.1 / 100)
            .run();
          const memoriaRate = skillRate * skillLevel;
          return {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            type: status!,
            amount: Math.floor(
              Math.floor((def + spDef) / 2) * memoriaRate * probability,
            ),
          };
        })
        .exhaustive();
    });

  for (const { type, amount } of map) {
    result[type] += amount;
  }

  return result;
}
