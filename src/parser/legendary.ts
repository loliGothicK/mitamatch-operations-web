import type { Elements } from '@/parser/skill';
import type { Trigger } from '@/parser/autoSkill';
import { toValidated, type Validated } from '@/fp-ts-ext/Validated';
import { anyhow, type MitamaError, CallPath } from '@/error/error';
import { pipe } from 'fp-ts/function';
import { either } from 'fp-ts';
import { separator } from '@/fp-ts-ext/function';
import { getApplicativeValidation, right } from 'fp-ts/Either';
import { getSemigroup } from 'fp-ts/Array';
import { sequenceS } from 'fp-ts/Apply';
import { match } from 'ts-pattern';
import { parseFloatSafe } from '@/parser/common';
import type { RawLegendarySkill } from '@/domain/memoria/memoria';

export type LegendarySkillTrigger =
  | Exclude<Trigger, 'Attack'>
  | 'Attack/Physical'
  | 'Attack/Magical';

export type LegendarySkill = {
  readonly attribute: Elements;
  readonly trigger: LegendarySkillTrigger;
  readonly rates: readonly [number, number, number, number, number];
};
export type Legendary = {
  readonly raw: RawLegendarySkill;
  readonly skill: LegendarySkill;
};

const LEGENDAEY_SKILL = /(.+?)属性の(.+?時)に.+?を(\d+?.*?\d*?)%アップさせる。/;

const parseElement = (element: string, path: CallPath = CallPath.empty) =>
  match<string, Validated<MitamaError, Elements>>(element)
    .with('火', () => right('Fire'))
    .with('水', () => right('Water'))
    .with('風', () => right('Wind'))
    .otherwise(() =>
      toValidated(
        anyhow(element, 'given text does not match any element', {
          path: path.join('parseElement'),
        }),
      ),
    );

const parseTrigger = (trigger: string, path: CallPath = CallPath.empty) =>
  match<string, Validated<MitamaError, LegendarySkillTrigger>>(trigger)
    .with('通常攻撃時', () => right('Attack/Physical'))
    .with('特殊攻撃時', () => right('Attack/Magical'))
    .with('支援/妨害メモリア使用時', () => right('Assist'))
    .with('回復メモリア使用時', () => right('Recovery'))
    .otherwise(() =>
      toValidated(
        anyhow(trigger, 'given text does not match any trigger', {
          path: path.join('parseTrigger'),
        }),
      ),
    );

export function parseLegendary(
  skills: RawLegendarySkill,
): Validated<MitamaError, Legendary> {
  const ap = getApplicativeValidation(getSemigroup<MitamaError>());
  const path = new CallPath(['parseLegendary']);
  const toEither = (target: string) =>
    either.fromNullable<MitamaError>({
      target,
      msg: 'given text does not match LEGENDAEY_SKILL',
      meta: {
        path: path.toString(),
      },
    });

  return pipe(
    skills.map(skill =>
      pipe(
        skill.description.match(LEGENDAEY_SKILL),
        toEither(skill.description),
        either.flatMap(([, element, trigger, rate]) =>
          sequenceS(ap)({
            attribute: parseElement(element, path),
            trigger: parseTrigger(trigger, path),
            rate: toValidated(parseFloatSafe(rate, path)),
          }),
        ),
      ),
    ),
    separator,
    either.map(parsed => ({
      raw: skills,
      skill: {
        attribute: parsed[0].attribute,
        trigger: parsed[0].trigger,
        rates: parsed.map(skill => skill.rate) as unknown as readonly [
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
