import { option } from 'fp-ts';
import { getOrElse, map } from 'fp-ts/lib/Option';
import { Option } from 'fp-ts/Option';
import { match } from 'ts-pattern';

export const statusKind = [
  'ATK',
  'DEF',
  'Sp.ATK',
  'Sp.DEF',
  'Life',
  'Fire ATK',
  'Fire DEF',
  'Water ATK',
  'Water DEF',
  'Wind ATK',
  'Wind DEF',
  'Light ATK',
  'Light DEF',
  'Dark ATK',
  'Dark DEF',
] as const;
export type StatusKind = (typeof statusKind)[number];

export const elements = ['Fire', 'Water', 'Wind', 'Light', 'Dark'] as const;
export type Elements = (typeof elements)[number];

export const elementalKind = [
  'Stimulation',
  'Spread',
  'Strengthen',
  'Weaken',
] as const;
export type ElementalKind = (typeof elementalKind)[number];

export type Elemental = {
  element: Elements;
  kind: ElementalKind;
};
export type Amount =
  | 'small'
  | 'medium'
  | 'large'
  | 'extra-large'
  | 'super-large';
export type Status = {
  upDown: 'UP' | 'DOWN';
  status: StatusKind;
};
export type SkillKind = Status | Elemental | 'charge' | 'counter' | 'heal';
type BuffKind = 'Power' | 'Guard' | 'Might' | 'Defer' | 'Life';

export type Skill = {
  name: string;
  description: string;
  upDown: 'UP' | 'DOWN';
  status: StatusKind[];
  amount: Amount;
  effects: SkillKind[];
};

export function parse_skill(name: string, description: string): Skill {
  const elemental = match<string, Option<SkillKind>>(name)
    .when(
      (name) => name.startsWith('火：'),
      () => option.of({ element: 'Fire', kind: 'Stimulation' }),
    )
    .when(
      (name) => name.startsWith('水：'),
      () => option.of({ element: 'Water', kind: 'Stimulation' }),
    )
    .when(
      (name) => name.startsWith('風：'),
      () => option.of({ element: 'Wind', kind: 'Stimulation' }),
    )
    .when(
      (name) => name.startsWith('光：'),
      () => option.of({ element: 'Light', kind: 'Stimulation' }),
    )
    .when(
      (name) => name.startsWith('闇：'),
      () => option.of({ element: 'Dark', kind: 'Stimulation' }),
    )
    .when(
      (name) => name.startsWith('火拡：'),
      () => option.of({ element: 'Fire', kind: 'Spread' }),
    )
    .when(
      (name) => name.startsWith('水拡：'),
      () => option.of({ element: 'Water', kind: 'Spread' }),
    )
    .when(
      (name) => name.startsWith('風拡：'),
      () => option.of({ element: 'Wind', kind: 'Spread' }),
    )
    .when(
      (name) => name.startsWith('光拡：'),
      () => option.of({ element: 'Light', kind: 'Spread' }),
    )
    .when(
      (name) => name.startsWith('闇拡：'),
      () => option.of({ element: 'Dark', kind: 'Spread' }),
    )
    .when(
      (name) => name.startsWith('火強：'),
      () => option.of({ element: 'Fire', kind: 'Strengthen' }),
    )
    .when(
      (name) => name.startsWith('水強：'),
      () => option.of({ element: 'Water', kind: 'Strengthen' }),
    )
    .when(
      (name) => name.startsWith('風強：'),
      () => option.of({ element: 'Wind', kind: 'Strengthen' }),
    )
    .when(
      (name) => name.startsWith('光強：'),
      () => option.of({ element: 'Light', kind: 'Strengthen' }),
    )
    .when(
      (name) => name.startsWith('闇強：'),
      () => option.of({ element: 'Dark', kind: 'Strengthen' }),
    )
    .when(
      (name) => name.startsWith('火弱：'),
      () => option.of({ element: 'Fire', kind: 'Weaken' }),
    )
    .when(
      (name) => name.startsWith('水弱：'),
      () => option.of({ element: 'Water', kind: 'Weaken' }),
    )
    .when(
      (name) => name.startsWith('風弱：'),
      () => option.of({ element: 'Wind', kind: 'Weaken' }),
    )
    .when(
      (name) => name.startsWith('光弱：'),
      () => option.of({ element: 'Light', kind: 'Weaken' }),
    )
    .when(
      (name) => name.startsWith('闇弱：'),
      () => option.of({ element: 'Dark', kind: 'Weaken' }),
    )
    .otherwise(() => option.none);

  const counter = name.includes('カウンター')
    ? option.of('counter' as SkillKind)
    : option.none;
  const charge = name.includes('チャージ')
    ? option.of('charge' as SkillKind)
    : option.none;
  const heal = name.includes('ヒール')
    ? option.of('heal' as SkillKind)
    : option.none;

  const amount = match<string, Amount>(description)
    .when(
      (description) => description.includes('小'),
      () => 'small',
    )
    .when(
      (description) => description.includes('大'),
      () => 'large',
    )
    .when(
      (description) => description.includes('特大'),
      () => 'extra-large',
    )
    .when(
      (description) => description.includes('超特大'),
      () => 'super-large',
    )
    .otherwise(() => 'medium');

  const upDown = description.includes('ダウン') ? 'DOWN' : 'UP';

  const buffType = name.includes('W') ? 'W' : name.includes('Sp') ? 'Sp' : 'N';
  const buffKind = match<string, BuffKind[]>(name)
    .when(
      (name) => name.includes('ライフ'),
      () => (name.includes('ガード') ? ['Guard', 'Life'] : ['Life']),
    )
    .when(
      (name) => name.includes('パワー'),
      () => ['Power'],
    )
    .when(
      (name) => name.includes('ガード'),
      () => ['Guard'],
    )
    .when(
      (name) => name.includes('マイト'),
      () => ['Might'],
    )
    .when(
      (name) => name.includes('ディファー'),
      () => ['Defer'],
    )
    .otherwise(() => []);

  const element = match<string, Option<StatusKind[]>>(name)
    .when(
      () => name.includes('[火防]'),
      () => option.of(['Fire DEF']),
    )
    .when(
      () => name.includes('[水防]'),
      () => option.of(['Water DEF']),
    )
    .when(
      () => name.includes('[風防]'),
      () => option.of(['Wind DEF']),
    )
    .when(
      () => name.includes('[火攻]'),
      () => option.of(['Fire ATK']),
    )
    .when(
      () => name.includes('[水攻]'),
      () => option.of(['Water ATK']),
    )
    .when(
      () => name.includes('[風攻]'),
      () => option.of(['Wind ATK']),
    )
    .when(
      () => name.includes('[風攻水防]'),
      () => option.of(['Wind ATK', 'Water DEF']),
    )
    .when(
      () => name.includes('[火攻風防]'),
      () => option.of(['Fire ATK', 'Wind DEF']),
    )
    .when(
      () => name.includes('[水攻火防]'),
      () => option.of(['Water ATK', 'Fire DEF']),
    )
    .when(
      () => name.includes('[風攻火防]'),
      () => option.of(['Wind ATK', 'Fire DEF']),
    )
    .when(
      () => name.includes('ファイアパワー'),
      () => option.of(['Fire ATK']),
    )
    .when(
      () => name.includes('ウォーターパワー'),
      () => option.of(['Water ATK']),
    )
    .when(
      () => name.includes('ウィンドパワー'),
      () => option.of(['Wind ATK']),
    )
    .when(
      () => name.includes('ライトパワー'),
      () => option.of(['Light ATK']),
    )
    .when(
      () => name.includes('ダークパワー'),
      () => option.of(['Dark ATK']),
    )
    .when(
      () => name.includes('ファイアガード'),
      () => option.of(['Fire DEF']),
    )
    .when(
      () => name.includes('ウォーターガード'),
      () => option.of(['Water DEF']),
    )
    .when(
      () => name.includes('ウィンドガード'),
      () => option.of(['Wind DEF']),
    )
    .when(
      () => name.includes('ライトガード'),
      () => option.of(['Light DEF']),
    )
    .when(
      () => name.includes('ダークガード'),
      () => option.of(['Dark DEF']),
    )
    .when(
      () => name.includes('トライパワー'),
      () => option.of(['Fire ATK', 'Water ATK', 'Wind ATK']),
    )
    .when(
      () => name.includes('トライガード'),
      () => option.of(['Fire DEF', 'Water DEF', 'Wind DEF']),
    )
    .otherwise(() => option.none);

  const effects = [elemental, counter, charge, heal]
    .filter(option.isSome)
    .map((o) => o.value);

  const status = [
    ...buffKind.flatMap((kind) => {
      return match<BuffKind, StatusKind[]>(kind)
        .with('Power', () =>
          match<'W' | 'Sp' | 'N', StatusKind[]>(buffType)
            .with('N', () => ['ATK'])
            .with('Sp', () => ['Sp.ATK'])
            .with('W', () => ['ATK', 'Sp.ATK'])
            .exhaustive(),
        )
        .with('Guard', () =>
          match<'W' | 'Sp' | 'N', StatusKind[]>(buffType)
            .with('N', () => ['DEF'])
            .with('Sp', () => ['Sp.DEF'])
            .with('W', () => ['DEF', 'Sp.DEF'])
            .exhaustive(),
        )
        .with('Might', () =>
          match<'W' | 'Sp' | 'N', StatusKind[]>(buffType)
            .with('Sp', (): StatusKind[] => {
              if (name.includes('攻') && name.includes('防')) {
                return [];
              } else if (name.includes('攻')) {
                return ['Sp.DEF'];
              } else if (name.includes('防')) {
                return ['Sp.ATK'];
              } else {
                return ['Sp.ATK', 'Sp.DEF'];
              }
            })
            .otherwise((): StatusKind[] => {
              if (name.includes('攻') && name.includes('防')) {
                return [];
              } else if (name.includes('攻')) {
                return ['DEF'];
              } else if (name.includes('防')) {
                return ['ATK'];
              } else {
                return ['ATK', 'DEF'];
              }
            }),
        )
        .with('Defer', () =>
          match<'W' | 'Sp' | 'N', StatusKind[]>(buffType)
            .with('Sp', () => ['ATK', 'Sp.DEF'])
            .otherwise(() => ['Sp.ATK', 'DEF']),
        )
        .with('Life', () => ['Life'])
        .exhaustive();
    }),
    ...getOrElse<StatusKind[]>(() => [])(
      map((kind: StatusKind[]) => kind)(element),
    ),
  ];

  return {
    name,
    description,
    upDown,
    status,
    amount,
    effects,
  } satisfies Skill;
}
