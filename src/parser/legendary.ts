import type { Attribute } from '@/parser/skill';
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
  readonly attributes: Attribute[];
  readonly trigger: LegendarySkillTrigger;
  readonly rates: readonly [number, number, number, number, number];
};
export type Legendary = {
  readonly raw: RawLegendarySkill;
  readonly skill: LegendarySkill;
};

const LEGENDAEY_SKILL = /(.+?)属性の(.+?時)に.+?を(\d+?.*?\d*?)%アップさせる。/;

const parseAttribute = (
  element: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
) =>
  match<string, Validated<MitamaError, Attribute>>(element)
    .with('火', () => right('Fire'))
    .with('水', () => right('Water'))
    .with('風', () => right('Wind'))
    .otherwise(() =>
      toValidated(
        anyhow(element, 'given text does not match any attribute', {
          ...meta,
          path: meta.path.join('parseAttribute'),
        }),
      ),
    );

const parseTrigger = (
  trigger: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
) =>
  match<string, Validated<MitamaError, LegendarySkillTrigger>>(trigger)
    .with('通常攻撃時', () => right('Attack/Physical'))
    .with('特殊攻撃時', () => right('Attack/Magical'))
    .with('支援/妨害メモリア使用時', () => right('Assist'))
    .with('回復メモリア使用時', () => right('Recovery'))
    .otherwise(() =>
      toValidated(
        anyhow(trigger, 'given text does not match any trigger', {
          ...meta,
          path: meta.path.join('parseTrigger'),
        }),
      ),
    );

export function parseLegendary(
  skills: RawLegendarySkill,
  memoriaName: string,
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
        either.flatMap(([, attributes, trigger, rate]) =>
          sequenceS(ap)({
            attributes: separator(
              attributes
                .split('/')
                .map(attribute =>
                  parseAttribute(attribute, { path, memoriaName }),
                ),
            ),
            trigger: parseTrigger(trigger, { path, memoriaName }),
            rate: toValidated(parseFloatSafe(rate, { path, memoriaName })),
          }),
        ),
      ),
    ),
    separator,
    either.map(parsed => ({
      raw: skills,
      skill: {
        attributes: parsed[0].attributes,
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
