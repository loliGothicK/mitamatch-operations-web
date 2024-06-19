import { option } from 'fp-ts';
import type { Option } from 'fp-ts/Option';
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
export type SkillKind = Elemental | 'charge' | 'counter' | 'heal';

export const stackEffect = ['Meteor', 'Barrier', 'Eden', 'ANiMA'] as const;
export type StackEffect = (typeof stackEffect)[number];

export type SkillEffect = {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'stack';
  range?: [number, number];
  amount?: Amount;
  status?: StatusKind;
  stack?: StackEffect;
};

export type Skill = {
  raw: { name: string; description: string };
  effects: SkillEffect[];
  kinds?: SkillKind[];
};

function parseDamage(description: string): SkillEffect[] {
  const result: SkillEffect[] = [];
  const damage = /敵(.+)体に(通常|特殊)(.*ダメージ)を与え/;
  const _match = description.match(damage);

  if (!_match) {
    return result;
  }

  const range = (r => {
    if (r.length === 1) {
      return [r[0], r[0]] as [number, number];
    }
    return [r[0], r[1]] as [number, number];
  })(_match[1].split('～').map(n => Number.parseInt(n)));

  const amount = match<string, Amount>(_match[3])
    .with('小ダメージ', () => 'small')
    .with('ダメージ', () => 'medium')
    .with('大ダメージ', () => 'large')
    .with('特大ダメージ', () => 'extra-large')
    .with('超特大ダメージ', () => 'super-large')
    .run();

  result.push({ type: 'damage', range, amount });

  const buff = /自身の(.*?)を(.*?アップ)させる/;
  const debuff = /敵の(.*?)を(.*?ダウン)させる/;

  const buffMatch = description.match(buff);

  if (buffMatch) {
    const statuses = buffMatch[1].split('と').flatMap(s => {
      return match<string, StatusKind[]>(s)
        .with('ATK', () => ['ATK'])
        .with('Sp.ATK', () => ['Sp.ATK'])
        .with('DEF', () => ['DEF'])
        .with('Sp.DEF', () => ['Sp.DEF'])
        .with('火属性攻撃力', () => ['Fire ATK'])
        .with('水属性攻撃力', () => ['Water ATK'])
        .with('風属性攻撃力', () => ['Wind ATK'])
        .with('光属性攻撃力', () => ['Light ATK'])
        .with('闇属性攻撃力', () => ['Dark ATK'])
        .with('火属性防御力', () => ['Fire DEF'])
        .with('水属性防御力', () => ['Water DEF'])
        .with('風属性防御力', () => ['Wind DEF'])
        .with('光属性防御力', () => ['Light DEF'])
        .with('闇属性防御力', () => ['Dark DEF'])
        .with('火属性攻撃力・風属性攻撃力', () => ['Fire ATK', 'Wind ATK'])
        .with('火属性攻撃力・水属性攻撃力・風属性攻撃力', () => [
          'Fire ATK',
          'Water ATK',
          'Wind ATK',
        ])
        .with('火属性防御力・水属性防御力・風属性防御力', () => [
          'Fire DEF',
          'Water DEF',
          'Wind DEF',
        ])
        .run();
    });

    const debuffAmount = match<string, Amount>(buffMatch[2])
      .with('小アップ', () => 'small')
      .with('アップ', () => 'medium')
      .with('大アップ', () => 'large')
      .with('特大アップ', () => 'extra-large')
      .run();

    for (const status of statuses) {
      result.push({
        type: 'buff',
        range,
        amount: debuffAmount,
        status,
      });
    }
  }

  const debuffMatch = description.match(debuff);

  if (debuffMatch) {
    const statuses = debuffMatch[1].split('と').flatMap(s => {
      return match<string, StatusKind[]>(s)
        .with('ATK', () => ['ATK'])
        .with('Sp.ATK', () => ['Sp.ATK'])
        .with('DEF', () => ['DEF'])
        .with('Sp.DEF', () => ['Sp.DEF'])
        .with('火属性攻撃力', () => ['Fire ATK'])
        .with('水属性攻撃力', () => ['Water ATK'])
        .with('風属性攻撃力', () => ['Wind ATK'])
        .with('光属性攻撃力', () => ['Light ATK'])
        .with('闇属性攻撃力', () => ['Dark ATK'])
        .with('火属性防御力', () => ['Fire DEF'])
        .with('水属性防御力', () => ['Water DEF'])
        .with('風属性防御力', () => ['Wind DEF'])
        .with('光属性防御力', () => ['Light DEF'])
        .with('闇属性防御力', () => ['Dark DEF'])
        .with('火属性防御力・風属性防御力', () => ['Fire DEF', 'Wind DEF'])
        .with('火属性攻撃力・水属性攻撃力・風属性攻撃力', () => [
          'Fire ATK',
          'Water ATK',
          'Wind ATK',
        ])
        .with('火属性防御力・水属性防御力・風属性防御力', () => [
          'Fire DEF',
          'Water DEF',
          'Wind DEF',
        ])
        .run();
    });

    const debuffAmount = match<string, Amount>(debuffMatch[2])
      .with('小ダウン', () => 'small')
      .with('ダウン', () => 'medium')
      .with('大ダウン', () => 'large')
      .with('特大ダウン', () => 'extra-large')
      .run();

    for (const status of statuses) {
      result.push({
        type: 'debuff',
        range,
        amount: debuffAmount,
        status,
      });
    }
  }

  return result;
}

function parseBuff(description: string): SkillEffect[] {
  const buff = /味方(.+)体の(.+)を(.*?アップ)させる/;
  const _match = description.match(buff);

  if (!_match) {
    return [];
  }

  const range = (r => {
    if (r.length === 1) {
      return [r[0], r[0]] as [number, number];
    }
    return [r[0], r[1]] as [number, number];
  })(_match[1].split('～').map(n => Number.parseInt(n)));

  const status = _match[2].split('と').flatMap(s => {
    return match<string, StatusKind[]>(s)
      .with('ATK', () => ['ATK'])
      .with('DEF', () => ['DEF'])
      .with('Sp.ATK', () => ['Sp.ATK'])
      .with('Sp.DEF', () => ['Sp.DEF'])
      .with('最大HP', () => ['Life'])
      .with('火属性攻撃力', () => ['Fire ATK'])
      .with('水属性攻撃力', () => ['Water ATK'])
      .with('風属性攻撃力', () => ['Wind ATK'])
      .with('光属性攻撃力', () => ['Light ATK'])
      .with('闇属性攻撃力', () => ['Dark ATK'])
      .with('火属性防御力', () => ['Fire DEF'])
      .with('水属性防御力', () => ['Water DEF'])
      .with('風属性防御力', () => ['Wind DEF'])
      .with('光属性防御力', () => ['Light DEF'])
      .with('闇属性防御力', () => ['Dark DEF'])
      .with('火属性攻撃力・風属性攻撃力', () => ['Fire ATK', 'Wind ATK'])
      .with('火属性攻撃力・水属性攻撃力・風属性攻撃力', () => [
        'Fire ATK',
        'Water ATK',
        'Wind ATK',
      ])
      .run();
  });

  const amount = match<string, Amount>(_match[3])
    .with('小アップ', () => 'small')
    .with('アップ', () => 'medium')
    .with('大アップ', () => 'large')
    .with('特大アップ', () => 'extra-large')
    .with('超特大アップ', () => 'super-large')
    .run();

  return status.map(s => {
    return { type: 'buff', range, amount, status: s };
  });
}

function parseDebuff(description: string): SkillEffect[] {
  const debuff = /敵(.+)体の(.+)を(.*?ダウン)させる/;
  const _match = description.match(debuff);

  if (!_match) {
    return [];
  }

  const range = (r => {
    if (r.length === 1) {
      return [r[0], r[0]] as [number, number];
    }
    return [r[0], r[1]] as [number, number];
  })(_match[1].split('～').map(n => Number.parseInt(n)));

  const status = _match[2].split('と').flatMap(s => {
    return match<string, StatusKind[]>(s)
      .with('ATK', () => ['ATK'])
      .with('DEF', () => ['DEF'])
      .with('Sp.ATK', () => ['Sp.ATK'])
      .with('Sp.DEF', () => ['Sp.DEF'])
      .with('最大HP', () => ['Life'])
      .with('火属性攻撃力', () => ['Fire ATK'])
      .with('水属性攻撃力', () => ['Water ATK'])
      .with('風属性攻撃力', () => ['Wind ATK'])
      .with('光属性攻撃力', () => ['Light ATK'])
      .with('闇属性攻撃力', () => ['Dark ATK'])
      .with('火属性防御力', () => ['Fire DEF'])
      .with('水属性防御力', () => ['Water DEF'])
      .with('風属性防御力', () => ['Wind DEF'])
      .with('光属性防御力', () => ['Light DEF'])
      .with('闇属性防御力', () => ['Dark DEF'])
      .with('火属性防御力・風属性防御力', () => ['Fire DEF', 'Wind DEF'])
      .with('火属性攻撃力・風属性攻撃力', () => ['Fire ATK', 'Wind ATK'])
      .with('火属性攻撃力・水属性攻撃力・風属性攻撃力', () => [
        'Fire ATK',
        'Water ATK',
        'Wind ATK',
      ])
      .run();
  });

  const amount = match<string, Amount>(_match[3])
    .with('小ダウン', () => 'small')
    .with('ダウン', () => 'medium')
    .with('大ダウン', () => 'large')
    .with('特大ダウン', () => 'extra-large')
    .with('超特大ダウン', () => 'super-large')
    .run();

  return status.map(s => {
    return { type: 'debuff', range, amount, status: s };
  });
}

function parseHeal(description: string): SkillEffect[] {
  const result: SkillEffect[] = [];
  const heal = /味方(.+)体のHPを(.*?回復)/;
  const _match = description.match(heal);

  if (!_match) {
    return [];
  }

  const range = (r => {
    if (r.length === 1) {
      return [r[0], r[0]] as [number, number];
    }
    return [r[0], r[1]] as [number, number];
  })(_match[1].split('～').map(n => Number.parseInt(n)));

  const healAmount = match<string, Amount>(_match[2])
    .with('小回復', () => 'small')
    .with('回復', () => 'medium')
    .with('大回復', () => 'large')
    .with('特大回復', () => 'extra-large')
    .run();

  result.push({ type: 'heal', range, amount: healAmount });

  const buff = /(ATK.*?|Sp\.ATK.*?|DEF.*?|Sp\.DEF.*?)を(.*?アップ)/;

  const __match = description.match(buff);

  if (!__match) {
    return result;
  }

  const status = __match[1].split('と').flatMap(s => {
    return match<string, StatusKind[]>(s)
      .with('ATK', () => ['ATK'])
      .with('DEF', () => ['DEF'])
      .with('Sp.ATK', () => ['Sp.ATK'])
      .with('Sp.DEF', () => ['Sp.DEF'])
      .with('最大HP', () => ['Life'])
      .with('火属性攻撃力', () => ['Fire ATK'])
      .with('水属性攻撃力', () => ['Water ATK'])
      .with('風属性攻撃力', () => ['Wind ATK'])
      .with('光属性攻撃力', () => ['Light ATK'])
      .with('闇属性攻撃力', () => ['Dark ATK'])
      .with('火属性防御力', () => ['Fire DEF'])
      .with('水属性防御力', () => ['Water DEF'])
      .with('風属性防御力', () => ['Wind DEF'])
      .with('光属性防御力', () => ['Light DEF'])
      .with('闇属性防御力', () => ['Dark DEF'])
      .with('火属性防御力・風属性防御力', () => ['Fire DEF', 'Wind DEF'])
      .with('火属性攻撃力・水属性攻撃力・風属性攻撃力', () => [
        'Fire ATK',
        'Water ATK',
        'Wind ATK',
      ])
      .with('火属性防御力・水属性防御力・風属性防御力', () => [
        'Fire DEF',
        'Water DEF',
        'Wind DEF',
      ])
      .run();
  });

  const buffAmount = match<string, Amount>(__match[2])
    .with('小アップ', () => 'small')
    .with('アップ', () => 'medium')
    .with('大アップ', () => 'large')
    .with('特大アップ', () => 'extra-large')
    .run();

  return result.concat(
    status.map(stat => {
      return { type: 'buff', range, amount: buffAmount, status: stat };
    }),
  );
}

function parseStack(name: string): SkillEffect[] {
  return [
    {
      type: 'stack',
      stack: name.includes('アニマ')
        ? 'ANiMA'
        : name.includes('バリア')
          ? 'Barrier'
          : name.includes('エデン')
            ? 'Eden'
            : name.includes('メテオ')
              ? 'Meteor'
              : undefined,
    },
  ];
}

export function parseSkill(name: string, description: string): Skill {
  const elemental = match<string, Option<SkillKind>>(name)
    .when(
      name => name.startsWith('火：'),
      () => option.of({ element: 'Fire', kind: 'Stimulation' }),
    )
    .when(
      name => name.startsWith('水：'),
      () => option.of({ element: 'Water', kind: 'Stimulation' }),
    )
    .when(
      name => name.startsWith('風：'),
      () => option.of({ element: 'Wind', kind: 'Stimulation' }),
    )
    .when(
      name => name.startsWith('光：'),
      () => option.of({ element: 'Light', kind: 'Stimulation' }),
    )
    .when(
      name => name.startsWith('闇：'),
      () => option.of({ element: 'Dark', kind: 'Stimulation' }),
    )
    .when(
      name => name.startsWith('火拡：'),
      () => option.of({ element: 'Fire', kind: 'Spread' }),
    )
    .when(
      name => name.startsWith('水拡：'),
      () => option.of({ element: 'Water', kind: 'Spread' }),
    )
    .when(
      name => name.startsWith('風拡：'),
      () => option.of({ element: 'Wind', kind: 'Spread' }),
    )
    .when(
      name => name.startsWith('光拡：'),
      () => option.of({ element: 'Light', kind: 'Spread' }),
    )
    .when(
      name => name.startsWith('闇拡：'),
      () => option.of({ element: 'Dark', kind: 'Spread' }),
    )
    .when(
      name => name.startsWith('火強：'),
      () => option.of({ element: 'Fire', kind: 'Strengthen' }),
    )
    .when(
      name => name.startsWith('水強：'),
      () => option.of({ element: 'Water', kind: 'Strengthen' }),
    )
    .when(
      name => name.startsWith('風強：'),
      () => option.of({ element: 'Wind', kind: 'Strengthen' }),
    )
    .when(
      name => name.startsWith('光強：'),
      () => option.of({ element: 'Light', kind: 'Strengthen' }),
    )
    .when(
      name => name.startsWith('闇強：'),
      () => option.of({ element: 'Dark', kind: 'Strengthen' }),
    )
    .when(
      name => name.startsWith('火弱：'),
      () => option.of({ element: 'Fire', kind: 'Weaken' }),
    )
    .when(
      name => name.startsWith('水弱：'),
      () => option.of({ element: 'Water', kind: 'Weaken' }),
    )
    .when(
      name => name.startsWith('風弱：'),
      () => option.of({ element: 'Wind', kind: 'Weaken' }),
    )
    .when(
      name => name.startsWith('光弱：'),
      () => option.of({ element: 'Light', kind: 'Weaken' }),
    )
    .when(
      name => name.startsWith('闇弱：'),
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

  return {
    raw: { name, description },
    effects: [
      ...parseDamage(description),
      ...parseBuff(description),
      ...parseDebuff(description),
      ...parseHeal(description),
      ...parseStack(name),
    ],
    kinds: [elemental, counter, charge, heal]
      .filter(option.isSome)
      .map(o => o.value),
  } satisfies Skill;
}
