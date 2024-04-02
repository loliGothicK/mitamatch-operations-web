import { Charm } from '@/domain/charm/charm';
import { Costume } from '@/domain/costume/costume';
import { MemoriaWithConcentration } from '@/jotai/memoriaAtoms';
import { parse_skill, StatusKind } from '@/parser/skill';
import { parse_support } from '@/parser/support';

import { match, P } from 'ts-pattern';

function parse_ability(description?: string): Map<string, number> {
  const result = new Map<string, number>([
    ['火', 1.0],
    ['水', 1.0],
    ['風', 1.0],
    ['光', 1.0],
    ['闇', 1.0],
  ]);
  if (!description) return result;
  const ability =
    /メモリア使用時、それが(.+)属性メモリアの場合、さらにメモリアスキル効果UP\+(\d+)%/;
  const _match = description.match(ability);
  if (!_match) return result;
  _match[1].split('/').forEach((element) => {
    result.set(element, 1.0 + Number(_match[2]) / 100);
  });
  return result;
}

function parse_costume(description?: string): Map<string, number> {
  const result = new Map<string, number>([
    ['火', 1.0],
    ['水', 1.0],
    ['風', 1.0],
    ['光', 1.0],
    ['闇', 1.0],
  ]);
  if (!description) return result;
  const costume = /自身が使用する(.+)属性メモリアのスキル効果(\d+)%UP/;
  const _match = description.match(costume);
  if (!_match) return result;
  result.set(_match[1], 1.0 + Number(_match[2]) / 100);
  return result;
}

export function evaluate(
  deck: MemoriaWithConcentration[],
  charm?: Charm,
  costume?: Costume,
): {
  memoria: MemoriaWithConcentration;
  expected: {
    damage?: number;
    buff?: {
      type: StatusKind;
      amount: number;
    }[];
    debuff?: {
      type: StatusKind;
      amount: number;
    }[];
    recovery?: number;
  };
}[] {
  const themeRate = new Map<string, number>([
    ['火', 1.1],
    ['水', 1.1],
    ['風', 1.1],
    ['光', 1.0],
    ['闇', 1.0],
  ]);
  const graceRate = 1.1;
  const [atk, spAtk, def, spDef] = deck.reduce(
    ([atk, spAtk, def, spDef], cur) => [
      atk + cur.status[cur.concentration || 4][0],
      spAtk + cur.status[cur.concentration || 4][1],
      def + cur.status[cur.concentration || 4][2],
      spDef + cur.status[cur.concentration || 4][3],
    ],
    charm?.status || [0, 0, 0, 0],
  );
  const charmRate = 1.1;
  const charmEx = parse_ability(charm?.ability);
  const costumeRate = 1.15;
  const costumeEx = parse_costume(costume?.ex?.description);

  return deck.map((memoria) => {
    const skill = parse_skill(memoria.skill.name, memoria.skill.description);

    const skillLevel = match(memoria.concentration)
      .with(0, () => 1.35)
      .with(1, () => 1.375)
      .with(2, () => 1.4)
      .with(3, () => 1.425)
      .with(4, () => 1.5)
      .run();

    const range = match(skill.effects[0].range)
      .with([1, 1], () => 1)
      .with([1, 2], () => 1.5)
      .with([1, 3], () => 2)
      .with([2, 2], () => 2)
      .with([2, 3], () => 2.5)
      .run();

    const calibration =
      charmRate *
      charmEx.get(memoria.element)! *
      costumeRate *
      costumeEx.get(memoria.element)! *
      graceRate *
      themeRate.get(memoria.element)!;
    return {
      memoria,
      expected: {
        buff: buff(
          [atk, spAtk, def, spDef],
          calibration,
          skillLevel,
          range,
          memoria,
          deck,
        ),
        debuff: debuff(
          [atk, spAtk, def, spDef],
          calibration,
          skillLevel,
          range,
          memoria,
          deck,
        ),
        recovery: recovery(
          def + spDef,
          calibration,
          skillLevel,
          range,
          memoria,
          deck,
        ),
      },
    };
  });
}

function buff(
  [atk, spAtk, def, spDef]: [number, number, number, number],
  calibration: number,
  skillLevel: number,
  range: number,
  memoria: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
):
  | {
      type: StatusKind;
      amount: number;
    }[]
  | undefined {
  const skill = parse_skill(memoria.skill.name, memoria.skill.description);
  if (!skill.effects.some((effect) => effect.type === 'buff')) return undefined;

  const support = deck
    .map(
      (memoria) =>
        [
          parse_support(memoria.support.name, memoria.support.description),
          memoria.concentration || 4,
        ] as const,
    )
    .map(([support, concentration]) => {
      const up = support.effects.find((effect) => effect.type === 'SupportUp');
      if (!up) return 0;
      const level = match(up.amount)
        .with('small', () => 1.01)
        .with('medium', () => 1.15)
        .with('large', () => 1.18)
        .with('extra-large', () => 1.21)
        .with('super-large', () => 1.24)
        .exhaustive();
      const probability = match(support.probability)
        .with('small', () => {
          if (concentration === 0) return 0.12;
          if (concentration === 1) return 0.125;
          if (concentration === 2) return 0.13;
          if (concentration === 3) return 0.135;
          if (concentration === 4) return 0.15;
          throw new Error('Invalid concentration');
        })
        .with('medium', () => {
          if (concentration === 0) return 0.18;
          if (concentration === 1) return 0.1875;
          if (concentration === 2) return 0.195;
          if (concentration === 3) return 0.2025;
          if (concentration === 4) return 0.225;
          throw new Error('Invalid concentration');
        })
        .exhaustive();
      return level * probability;
    })
    .reduce((acc, cur) => acc + cur, 0);

  return skill.effects
    .filter((effect) => effect.type === 'buff')
    .map(({ amount, status }) => {
      return match(status!)
        .with('ATK', () => {
          const skillRate = match(amount)
            .with('small', () => 2.28 / 100)
            .with('medium', () => 3.04 / 100)
            .with('large', () => 3.8 / 100)
            .with('extra-large', () => 4.27 / 100)
            .with('super-large', () => 4.74 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              atk * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with('Sp.ATK', () => {
          const skillRate = match(amount)
            .with('small', () => 2.28 / 100)
            .with('medium', () => 3.04 / 100)
            .with('large', () => 3.8 / 100)
            .with('extra-large', () => 4.27 / 100)
            .with('super-large', () => 4.74 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spAtk * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with('DEF', () => {
          const skillRate = match(amount)
            .with('small', () => 3.32 / 100)
            .with('medium', () => 4.27 / 100)
            .with('large', () => 4.75 / 100)
            .with('extra-large', () => 5.22 / 100)
            .with('super-large', () => 5.69 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              def * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with('Sp.DEF', () => {
          const skillRate = match(amount)
            .with('small', () => 3.32 / 100)
            .with('medium', () => 4.27 / 100)
            .with('large', () => 4.75 / 100)
            .with('extra-large', () => 5.22 / 100)
            .with('super-large', () => 5.69 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spDef * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with(
          P.union('Fire ATK', 'Water ATK', 'Wind ATK', 'Light ATK', 'Dark ATK'),
          () => {
            const skillRate = match(amount)
              .with('small', () => 3.25 / 100)
              .with('medium', () => 4.0 / 100)
              .with('large', () => 4.89 / 100)
              .with('extra-large', () => 5.78 / 100) // 現状存在しない
              .with('super-large', () => 6.67 / 100) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              type: status!,
              amount: Math.floor(
                Math.floor((atk + spAtk) / 2) *
                  memoriaRate *
                  calibration *
                  support *
                  range,
              ),
            };
          },
        )
        .with(
          P.union('Fire DEF', 'Water DEF', 'Wind DEF', 'Light DEF', 'Dark DEF'),
          () => {
            const skillRate = match(amount)
              .with('small', () => 4.74 / 100)
              .with('medium', () => 5.65 / 100)
              .with('large', () => 6.11 / 100)
              .with('extra-large', () => 6.57 / 100) // 現状存在しない
              .with('super-large', () => 7.03 / 100) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              type: status!,
              amount: Math.floor(
                Math.floor((def + spDef) / 2) *
                  memoriaRate *
                  calibration *
                  support *
                  range,
              ),
            };
          },
        )
        .with('Life', () => {
          const skillRate = 0.45 / 100;
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              Math.floor((def + spDef) / 2) *
                memoriaRate *
                calibration *
                support *
                range,
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
):
  | {
      type: StatusKind;
      amount: number;
    }[]
  | undefined {
  const skill = parse_skill(memoria.skill.name, memoria.skill.description);
  if (!skill.effects.some((effect) => effect.type === 'debuff'))
    return undefined;

  const support = deck
    .map(
      (memoria) =>
        [
          parse_support(memoria.support.name, memoria.support.description),
          memoria.concentration || 4,
        ] as const,
    )
    .map(([support, concentration]) => {
      const up = support.effects.find((effect) => effect.type === 'SupportUp');
      if (!up) return 0;
      const level = match(up.amount)
        .with('small', () => 1.01)
        .with('medium', () => 1.15)
        .with('large', () => 1.18)
        .with('extra-large', () => 1.21)
        .with('super-large', () => 1.24)
        .exhaustive();
      const probability = match(support.probability)
        .with('small', () => {
          if (concentration === 0) return 0.12;
          if (concentration === 1) return 0.125;
          if (concentration === 2) return 0.13;
          if (concentration === 3) return 0.135;
          if (concentration === 4) return 0.15;
          throw new Error('Invalid concentration');
        })
        .with('medium', () => {
          if (concentration === 0) return 0.18;
          if (concentration === 1) return 0.1875;
          if (concentration === 2) return 0.195;
          if (concentration === 3) return 0.2025;
          if (concentration === 4) return 0.225;
          throw new Error('Invalid concentration');
        })
        .exhaustive();
      return level * probability;
    })
    .reduce((acc, cur) => acc + cur, 0);

  return skill.effects
    .filter((effect) => effect.type === 'debuff')
    .map(({ amount, status }) => {
      return match(status!)
        .with('ATK', () => {
          const skillRate = match(amount)
            .with('small', () => 2.5 / 100)
            .with('medium', () => 3.34 / 100)
            .with('large', () => 4.18 / 100)
            .with('extra-large', () => 4.71 / 100)
            .with('super-large', () => 5.24 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              atk * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with('Sp.ATK', () => {
          const skillRate = match(amount)
            .with('small', () => 2.5 / 100)
            .with('medium', () => 3.34 / 100)
            .with('large', () => 4.18 / 100)
            .with('extra-large', () => 4.71 / 100)
            .with('super-large', () => 5.24 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spAtk * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with('DEF', () => {
          const skillRate = match(amount)
            .with('small', () => 3.65 / 100)
            .with('medium', () => 4.71 / 100)
            .with('large', () => 5.23 / 100)
            .with('extra-large', () => 5.75 / 100)
            .with('super-large', () => 6.27 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              def * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with('Sp.DEF', () => {
          const skillRate = match(amount)
            .with('small', () => 3.65 / 100)
            .with('medium', () => 4.71 / 100)
            .with('large', () => 5.23 / 100)
            .with('extra-large', () => 5.75 / 100)
            .with('super-large', () => 6.27 / 100) // 現状存在しない
            .exhaustive();
          const memoriaRate = skillRate * skillLevel;
          return {
            type: status!,
            amount: Math.floor(
              spDef * memoriaRate * calibration * support * range,
            ),
          };
        })
        .with(
          P.union('Fire ATK', 'Water ATK', 'Wind ATK', 'Light ATK', 'Dark ATK'),
          () => {
            const skillRate = match(amount)
              .with('small', () => 3.25 / 100)
              .with('medium', () => 4.0 / 100)
              .with('large', () => 4.89 / 100)
              .with('extra-large', () => 5.78 / 100) // 現状存在しない
              .with('super-large', () => 6.67 / 100) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              type: status!,
              amount: Math.floor(
                Math.floor((atk + spAtk) / 2) *
                  memoriaRate *
                  calibration *
                  support *
                  range,
              ),
            };
          },
        )
        .with(
          P.union('Fire DEF', 'Water DEF', 'Wind DEF', 'Light DEF', 'Dark DEF'),
          () => {
            const skillRate = match(amount)
              .with('small', () => 4.74 / 100)
              .with('medium', () => 5.65 / 100)
              .with('large', () => 6.11 / 100)
              .with('extra-large', () => 6.57 / 100) // 現状存在しない
              .with('super-large', () => 7.03 / 100) // 現状存在しない
              .exhaustive();
            const memoriaRate = skillRate * skillLevel;
            return {
              type: status!,
              amount: Math.floor(
                Math.floor((def + spDef) / 2) *
                  memoriaRate *
                  calibration *
                  support *
                  range,
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
): number | undefined {
  if (memoria.kind !== '回復') return undefined;
  const skillRate = match(memoria.skill.description)
    .when(
      (sentence) => sentence.includes('特大回復'),
      () => 13.2 / 100,
    )
    .when(
      (sentence) => sentence.includes('大回復'),
      () => 9.35 / 100,
    )
    .when(
      (sentence) => sentence.includes('回復'),
      () => 7.7 / 100,
    )
    .run();
  const support = deck
    .map(
      (memoria) =>
        [
          parse_support(memoria.support.name, memoria.support.description),
          memoria.concentration || 4,
        ] as const,
    )
    .map(([support, concentration]) => {
      const up = support.effects.find((effect) => effect.type === 'RecoveryUp');
      if (!up) return 0;
      const level = match(up.amount)
        .with('small', () => 1.01)
        .with('medium', () => 1.15)
        .with('large', () => 1.18)
        .with('extra-large', () => 1.21)
        .with('super-large', () => 1.24)
        .exhaustive();
      const probability = match(support.probability)
        .with('small', () => {
          if (concentration === 0) return 0.12;
          if (concentration === 1) return 0.125;
          if (concentration === 2) return 0.13;
          if (concentration === 3) return 0.135;
          if (concentration === 4) return 0.15;
          throw new Error('Invalid concentration');
        })
        .with('medium', () => {
          if (concentration === 0) return 0.18;
          if (concentration === 1) return 0.1875;
          if (concentration === 2) return 0.195;
          if (concentration === 3) return 0.2025;
          if (concentration === 4) return 0.225;
          throw new Error('Invalid concentration');
        })
        .exhaustive();
      return level * probability;
    })
    .reduce((acc, cur) => acc + cur, 0);

  const memoriaRate = skillRate * skillLevel;
  return Math.floor(dsd * memoriaRate * calibration * support * range);
}
