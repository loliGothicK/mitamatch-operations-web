import type { Elements } from '@/parser/skill';
import type { Trigger } from '@/parser/support';
import { toValidated, type Validated } from '@/fp-ts-ext/Validated';
import { anyhow, type ParserError, CallPath } from '@/parser/error';
import { pipe } from 'fp-ts/function';
import { either } from 'fp-ts';
import { separator } from '@/fp-ts-ext/function';
import { getApplicativeValidation, right } from 'fp-ts/Either';
import { getSemigroup } from 'fp-ts/Array';
import { sequenceS } from 'fp-ts/Apply';
import { match, P } from 'ts-pattern';
import { parseFloatSafe } from '@/parser/common';

export type LegendarySkill = {
  readonly element: Elements;
  readonly trigger: Trigger;
  readonly rates: readonly [number, number, number, number, number];
};
export type Legendary = {
  readonly raw: {
    readonly name: string;
    readonly description: readonly [string, string, string, string, string];
  };
  readonly skill: LegendarySkill;
};

const LEGENDAEY_SKILL = /(.+?)属性の(.+?時)に.+?を(\d+?.*?\d*?)%アップさせる。/;

const parseElement = (element: string, path: CallPath = CallPath.empty) =>
  match<string, Validated<ParserError, Elements>>(element)
    .with('火', () => right('Fire'))
    .with('水', () => right('Water'))
    .with('風', () => right('Wind'))
    .otherwise(() =>
      toValidated(
        anyhow(
          path.join('parseElement'),
          element,
          'given text does not match any element',
        ),
      ),
    );

const parseTrigger = (trigger: string, path: CallPath = CallPath.empty) =>
  match<string, Validated<ParserError, Trigger>>(trigger)
    .with(P.union('通常攻撃時', '特殊攻撃時'), () => right('Attack'))
    .with('支援/妨害メモリア使用時', () => right('Assist'))
    .with('回復メモリア使用時', () => right('Recovery'))
    .otherwise(() =>
      toValidated(
        anyhow(
          path.join('parseTrigger'),
          trigger,
          'given text does not match any trigger',
        ),
      ),
    );

export function parseLegendary({
  name,
  description,
}: {
  readonly name: string;
  readonly description: readonly [string, string, string, string, string];
}): Validated<ParserError, Legendary> {
  const ap = getApplicativeValidation(getSemigroup<ParserError>());
  const path = new CallPath(['parseLegendary']);
  const toEither = (target: string) =>
    either.fromNullable<ParserError>({
      path: path.toString(),
      target,
      msg: 'given text does not match LEGENDAEY_SKILL',
    });

  return pipe(
    description.map(skill =>
      pipe(
        skill.match(LEGENDAEY_SKILL),
        toEither(skill),
        either.flatMap(([, element, trigger, rate]) =>
          sequenceS(ap)({
            element: parseElement(element, path),
            trigger: parseTrigger(trigger, path),
            rate: toValidated(parseFloatSafe(rate, path)),
          }),
        ),
      ),
    ),
    separator,
    either.map(skills => ({
      raw: {
        name,
        description,
      },
      skill: {
        element: skills[0].element,
        trigger: skills[0].trigger,
        rates: skills.map(skill => skill.rate) as unknown as readonly [
          number,
          number,
          number,
          number,
          number,
        ],
      },
    })),
  );
}
