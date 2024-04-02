import { Amount, StatusKind } from '@/parser/skill';

import { match } from 'ts-pattern';

type Trigger = 'Attack' | 'Assist' | 'Recovery' | 'Command';

type PossibleStatus = Exclude<
  StatusKind,
  'Life' | 'Light ATK' | 'Light DEF' | 'Dark ATK' | 'Dark DEF'
>;

export type SupportKind = {
  type:
    | 'DamageUp'
    | 'SupportUp'
    | 'RecoveryUp'
    | 'MatchPtUp'
    | 'MpCostDown'
    | 'RangeUp'
    | 'UP'
    | 'DOWN';
  amount: Amount;
  status?: PossibleStatus;
};

type Support = {
  trigger: Trigger;
  probability: Exclude<Amount, 'large' | 'extra-large' | 'super-large'>;
  effects: SupportKind[];
};

function parse_status(description: string): SupportKind[] {
  const first =
    /(敵|敵前衛1体|味方|味方前衛1体|自身)の(.+)を(.*アップ|.*ダウン)/;
  const _match = description.match(first);

  if (!_match) {
    return [];
  }

  const statuses = _match[2].split('と').flatMap((status) => {
    return match<string, PossibleStatus[]>(status)
      .with('ATK', () => ['ATK'])
      .with('DEF', () => ['DEF'])
      .with('Sp.ATK', () => ['Sp.ATK'])
      .with('Sp.DEF', () => ['Sp.DEF'])
      .with('火属性攻撃力', () => ['Fire ATK'])
      .with('水属性攻撃力', () => ['Water ATK'])
      .with('風属性攻撃力', () => ['Wind ATK'])
      .with('火属性防御力', () => ['Fire DEF'])
      .with('水属性防御力', () => ['Water DEF'])
      .with('風属性防御力', () => ['Wind DEF'])
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

  const [amount, type] = match<string, [Amount, 'UP' | 'DOWN']>(_match[3])
    .with('小アップ', () => ['small', 'UP'])
    .with('アップ', () => ['medium', 'UP'])
    .with('大アップ', () => ['large', 'UP'])
    .with('特大アップ', () => ['extra-large', 'UP'])
    .with('超特大アップ', () => ['super-large', 'UP'])
    .with('小ダウン', () => ['small', 'DOWN'])
    .with('ダウン', () => ['medium', 'DOWN'])
    .with('大ダウン', () => ['large', 'DOWN'])
    .with('特大ダウン', () => ['extra-large', 'DOWN'])
    .with('超特大ダウン', () => ['super-large', 'DOWN'])
    .run();

  return statuses.map((status) => {
    return {
      type,
      status,
      amount,
    };
  });
}

function parse_amount(amount: string): Amount {
  return match<string, Amount>(amount)
    .with('小アップ', () => 'small')
    .with('アップ', () => 'medium')
    .with('大アップ', () => 'large')
    .with('特大アップ', () => 'extra-large')
    .with('超特大アップ', () => 'super-large')
    .run();
}

function parse_damage(description: string): SupportKind[] {
  const damage = /攻撃ダメージを(.*アップ)させる/;
  const _match = description.match(damage);

  if (!_match) {
    return [];
  }

  return [{ type: 'DamageUp', amount: parse_amount(_match[1]) }];
}

function parse_assist(description: string): SupportKind[] {
  const assist = /支援\/妨害効果を(.*アップ)/;
  const _match = description.match(assist);

  if (!_match) {
    return [];
  }

  return [{ type: 'SupportUp', amount: parse_amount(_match[1]) }];
}

function parse_recovery(description: string): SupportKind[] {
  const recovery = /HPの回復量を(.*アップ)/;
  const _match = description.match(recovery);

  if (!_match) {
    return [];
  }

  return [{ type: 'RecoveryUp', amount: parse_amount(_match[1]) }];
}

function parse_match_pt(description: string): SupportKind[] {
  const matchPt = /自身のマッチPtの獲得量が(.*アップ)する/;
  const _match = description.match(matchPt);

  if (!_match) {
    return [];
  }

  const amount = match<string, Amount>(_match[1])
    .with('小アップ', () => 'small')
    .with('アップ', () => 'medium')
    .with('大アップ', () => 'large')
    .with('特大アップ', () => 'extra-large')
    .with('超特大アップ', () => 'super-large')
    .run();

  return [{ type: 'MatchPtUp', amount }];
}

function parse_mp_cost(description: string): SupportKind[] {
  const mpCost = /一定確率でMP消費を抑える/;
  const _match = description.match(mpCost);

  if (!_match) {
    return [];
  }

  return [{ type: 'MpCostDown', amount: 'medium' }];
}

function parse_range(description: string): SupportKind[] {
  const range = /効果対象範囲が(.+)される/;
  const _match = description.match(range);

  if (!_match) {
    return [];
  }

  return [{ type: 'RangeUp', amount: 'medium' }];
}

export function parse_support(name: string, description: string): Support {
  const trigger = match<string, Trigger>(name)
    .when(
      (name) => name.startsWith('攻:'),
      () => 'Attack',
    )
    .when(
      (name) => name.startsWith('援:'),
      () => 'Assist',
    )
    .when(
      (name) => name.startsWith('回:'),
      () => 'Recovery',
    )
    .when(
      (name) => name.startsWith('コ:'),
      () => 'Command',
    )
    .run();

  return {
    trigger,
    probability: match<
      string,
      Exclude<Amount, 'large' | 'extra-large' | 'super-large'>
    >(description)
      .when(
        (sentence) => sentence.includes('一定確率'),
        () => 'small',
      )
      .when(
        (sentence) => sentence.includes('中確率'),
        () => 'medium',
      )
      .run(),
    effects: description.split('。').flatMap((sentence) => {
      return [
        ...parse_damage(sentence),
        ...parse_assist(sentence),
        ...parse_recovery(sentence),
        ...parse_match_pt(sentence),
        ...parse_mp_cost(sentence),
        ...parse_range(sentence),
        ...parse_status(sentence),
      ];
    }),
  };
}
