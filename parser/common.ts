import { match, P } from 'ts-pattern';
import { Applicative, type Either, fromPredicate, right } from 'fp-ts/Either';
import { anyhow, type MitamaError, CallPath } from '@/error/error';
import type { Elements } from '@/parser/skill';
import { traverseWithIndex } from 'fp-ts/Array';
import { toValidated, type Validated } from '@/fp-ts-ext/Validated';

export const parseSequence =
  <T>(
    parser: (s: string, path: CallPath) => Either<MitamaError, T>,
    delimiter: string,
  ) =>
  (seq: string, path: CallPath = CallPath.empty): Validated<MitamaError, T[]> =>
    traverseWithIndex(Applicative)((index: number, s: string) =>
      toValidated(parser(s, path.join(`parseSeq.${index}`))),
    )(seq.split(delimiter));

export const parseIntSafe = (
  num: string,
  path: CallPath = CallPath.empty,
): Either<MitamaError, number> => {
  return fromPredicate(
    (int: number) => !Number.isNaN(int),
    () => ({
      path: path.toString(),
      target: num,
      msg: "given text doesn't match number",
    }),
  )(Number.parseInt(num));
};

export const parseFloatSafe = (
  num: string,
  path: CallPath = CallPath.empty,
): Either<MitamaError, number> => {
  return fromPredicate(
    (int: number) => !Number.isNaN(int),
    () => ({
      path: path.join('parseFloat').toString(),
      target: num,
      msg: "given text doesn't match number",
    }),
  )(Number.parseFloat(num));
};

export const parseElement = (
  element: string,
  path: CallPath = CallPath.empty,
): Either<MitamaError, Elements> =>
  match<string, Either<MitamaError, Elements>>(element)
    .with('火', () => right('Fire'))
    .with('水', () => right('Water'))
    .with('風', () => right('Wind'))
    .with('光', () => right('Light'))
    .with('闇', () => right('Dark'))
    .otherwise(src =>
      anyhow(
        path.join('parseElement'),
        src,
        "given text doesn't match any element",
      ),
    );

export type Amount =
  | 'small' // 小アップ
  | 'medium' // アップ
  | 'large' // 大アップ
  | 'extra-large' // 特大アップ
  | 'super-large' // 超特大アップ
  | 'ultra-large'; // 極大アップ

export const parseAmount = (amount: string, path: CallPath = CallPath.empty) =>
  match<string, Either<MitamaError, Amount>>(amount)
    .with(P.union('小アップ', '小ダウン', '小ダメージ', '小回復'), () =>
      right('small'),
    )
    .with(P.union('アップ', 'ダウン', 'ダメージ', '回復'), () =>
      right('medium'),
    )
    .with(P.union('大アップ', '大ダウン', '大ダメージ', '大回復'), () =>
      right('large'),
    )
    .with(P.union('特大アップ', '特大ダウン', '特大ダメージ', '特大回復'), () =>
      right('extra-large'),
    )
    .with(
      P.union('超特大アップ', '超特大ダウン', '超特大ダメージ', '超特大回復'),
      () => right('super-large'),
    )
    .with(P.union('極大アップ', '極大ダウン', '極大ダメージ', '極大回復'), () =>
      right('ultra-large'),
    )
    .otherwise(src =>
      anyhow(
        path.join('parseAmount'),
        src,
        "given text doesn't match any amount",
      ),
    );

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

export const parseStatus = (status: string, path: CallPath = CallPath.empty) =>
  match<string, Either<MitamaError, StatusKind[]>>(status)
    .with('ATK', () => right(['ATK']))
    .with('DEF', () => right(['DEF']))
    .with('Sp.ATK', () => right(['Sp.ATK']))
    .with('Sp.DEF', () => right(['Sp.DEF']))
    .with('最大HP', () => right(['Life']))
    .with('火属性攻撃力', () => right(['Fire ATK']))
    .with('水属性攻撃力', () => right(['Water ATK']))
    .with('風属性攻撃力', () => right(['Wind ATK']))
    .with('光属性攻撃力', () => right(['Light ATK']))
    .with('闇属性攻撃力', () => right(['Dark ATK']))
    .with('火属性防御力', () => right(['Fire DEF']))
    .with('水属性防御力', () => right(['Water DEF']))
    .with('風属性防御力', () => right(['Wind DEF']))
    .with('光属性防御力', () => right(['Light DEF']))
    .with('闇属性防御力', () => right(['Dark DEF']))
    .with('火属性攻撃力・風属性攻撃力', () => right(['Fire ATK', 'Wind ATK']))
    .with('火属性防御力・風属性防御力', () => right(['Fire DEF', 'Wind DEF']))
    .with('水属性攻撃力・風属性攻撃力', () => right(['Water ATK', 'Wind ATK']))
    .with('水属性防御力・風属性防御力', () => right(['Water DEF', 'Wind DEF']))
    .with('火属性攻撃力・水属性攻撃力・風属性攻撃力', () =>
      right(['Fire ATK', 'Water ATK', 'Wind ATK']),
    )
    .with('火属性防御力・水属性防御力・風属性防御力', () =>
      right(['Fire DEF', 'Water DEF', 'Wind DEF']),
    )
    .otherwise(src =>
      anyhow(
        path.join('parseStatus'),
        src,
        "given text doesn't match any status",
      ),
    );
