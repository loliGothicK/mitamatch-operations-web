import type { Amount, Probability, StatusKind } from '@/parser/skill';

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
  probability: Probability;
  effects: SupportKind[];
};

const STATUS =
  /(ATK.*?|DEF.*?|Sp\.ATK.*?|Sp\.DEF.*?|火属性.*?|水属性.*?|風属性.*?)を.*?(アップ|ダウン)/;

function parseStatus(description: string): SupportKind[] {
  const global =
    /(ATK|DEF|Sp\.ATK|Sp\.DEF|火属性|水属性|風属性).*?を.*?(アップ|ダウン)/g;
  const globalMatch = description.match(global);

  if (!globalMatch) {
    return [];
  }

  return globalMatch.flatMap(sentence => {
    const _match = sentence.match(STATUS);
    if (_match) {
      const statuses = _match[1].split('と').flatMap(status => {
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

      const [amount, type] = match<string, [Amount, 'UP' | 'DOWN']>(_match[2])
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

      return statuses.map(status => {
        return {
          type,
          status,
          amount,
        };
      });
    }
    return [];
  });
}

function parseAmount(amount: string): Amount {
  return match<string, Amount>(amount)
    .with('小アップ', () => 'small')
    .with('アップ', () => 'medium')
    .with('大アップ', () => 'large')
    .with('特大アップ', () => 'extra-large')
    .with('超特大アップ', () => 'super-large')
    .with('極大アップ', () => 'ultra-large')
    .run();
}

const DAMAGE = /攻撃ダメージを(.*アップ)させる/;

function parseDamage(description: string): SupportKind[] {
  const _match = description.match(DAMAGE);

  if (!_match) {
    return [];
  }

  return [{ type: 'DamageUp', amount: parseAmount(_match[1]) }];
}

const ASSIST = /支援\/妨害効果を(.*アップ)/;

function parseAssist(description: string): SupportKind[] {
  const _match = description.match(ASSIST);

  if (!_match) {
    return [];
  }

  return [{ type: 'SupportUp', amount: parseAmount(_match[1]) }];
}

const RECOVERY = /HPの回復量を(.*アップ)/;

function parseRecovery(description: string): SupportKind[] {
  const _match = description.match(RECOVERY);

  if (!_match) {
    return [];
  }

  return [{ type: 'RecoveryUp', amount: parseAmount(_match[1]) }];
}

const MATCH_PT = /自身のマッチPtの獲得量が(.*アップ)する/;

function parseMatchPt(description: string): SupportKind[] {
  const _match = description.match(MATCH_PT);

  if (!_match) {
    return [];
  }

  const amount = match<string, Amount>(_match[1])
    .with('小アップ', () => 'small')
    .with('アップ', () => 'medium')
    .with('大アップ', () => 'large')
    .with('特大アップ', () => 'extra-large')
    .with('超特大アップ', () => 'super-large')
    .with('極大アップ', () => 'ultra-large')
    .run();

  return [{ type: 'MatchPtUp', amount }];
}

const COST_DOWN = /一定確率でMP消費を抑える/;

function parseMpCost(description: string): SupportKind[] {
  const _match = description.match(COST_DOWN);

  if (!_match) {
    return [];
  }

  return [{ type: 'MpCostDown', amount: 'medium' }];
}

const RANGE = /効果対象範囲が(.+)される/;

function parseRange(description: string): SupportKind[] {
  const _match = description.match(RANGE);

  if (!_match) {
    return [];
  }

  return [{ type: 'RangeUp', amount: 'medium' }];
}

export function parseSupport(name: string, description: string): Support {
  const trigger = match<string, Trigger>(name)
    .when(
      name => name.startsWith('攻:'),
      () => 'Attack',
    )
    .when(
      name => name.startsWith('援:'),
      () => 'Assist',
    )
    .when(
      name => name.startsWith('回:'),
      () => 'Recovery',
    )
    .when(
      name => name.startsWith('コ:'),
      () => 'Command',
    )
    .run();

  return {
    trigger,
    probability: match<string, Probability>(description)
      .when(
        sentence => sentence.includes('一定確率'),
        () => 'low',
      )
      .when(
        sentence => sentence.includes('中確率'),
        () => 'medium',
      )
      .run(),
    effects: description.split('。').flatMap(sentence => {
      return [
        ...parseDamage(sentence),
        ...parseAssist(sentence),
        ...parseRecovery(sentence),
        ...parseMatchPt(sentence),
        ...parseMpCost(sentence),
        ...parseRange(sentence),
        ...parseStatus(sentence),
      ];
    }),
  };
}
