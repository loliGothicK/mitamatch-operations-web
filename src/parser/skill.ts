import { either, option } from 'fp-ts';
import { fromNullable, type Option } from 'fp-ts/Option';
import { match, P } from 'ts-pattern';
import {
  parseAmount,
  parseStatus,
  type StatusKind,
  parseIntSafe, parseElement,
} from '@/parser/common';
import type { Amount } from '@/parser/common';
import { pipe } from 'fp-ts/function';
import { toValidated, type Validated } from '@/fp-ts-ext/Validated';
import { anyhow, type MitamaError, CallPath } from '@/error/error';
import {
  bind,
  Do,
  type Either,
  getApplicativeValidation,
  right,
} from 'fp-ts/Either';
import { getSemigroup } from 'fp-ts/Array';
import { sequenceS } from 'fp-ts/Apply';
import { separator, transposeArray } from '@/fp-ts-ext/function';

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
  readonly element: Elements;
  readonly kind: ElementalKind;
};

export type SkillKind =
  | Elemental
  | 'charge'
  | 'counter'
  | 's-counter'
  | 'heal'
  | 'recover';

export const stackKinds = ['meteor', 'barrier', 'eden', 'anima'] as const;
export const elementEffectKinds  = ['spread', 'minima', 'enhance'] as const;

export type DamageEffect = {
  readonly type: 'damage';
  readonly range: readonly [number, number];
  readonly amount: Amount;
};
export type BuffEffect = {
  readonly type: 'buff';
  readonly range: readonly [number, number];
  readonly amount: Amount;
  readonly status: StatusKind;
};
export type DebuffEffect = {
  readonly type: 'debuff';
  readonly range: readonly [number, number];
  readonly amount: Amount;
  readonly status: StatusKind;
};
export type HealEffect = {
  readonly type: 'heal';
  readonly range: readonly [number, number];
  readonly amount: Amount;
};
export type StackEffect = {
  readonly type: 'stack';
  readonly kind: (typeof stackKinds)[number];
  readonly rate: number;
  readonly times: number;
};
export type ElementEffect = {
  readonly type: 'element';
  readonly element: Elements;
  readonly kind: 'spread' | 'minima' | 'enhance';
}

export type SkillEffect =
  | DamageEffect
  | BuffEffect
  | DebuffEffect
  | HealEffect
  | StackEffect
  | ElementEffect;

export const isDamageEffect = (effect: SkillEffect): effect is DamageEffect =>
  effect.type === 'damage';
export const isBuffEffect = (effect: SkillEffect): effect is BuffEffect =>
  effect.type === 'buff';
export const isDebuffEffect = (effect: SkillEffect): effect is DebuffEffect =>
  effect.type === 'debuff';
export const isHealEffect = (effect: SkillEffect): effect is HealEffect =>
  effect.type === 'heal';
export const isStackEffect =
  (kind?: (typeof stackKinds)[number]) =>
  (effect: SkillEffect): effect is StackEffect => {
    return (
      effect.type === 'stack' && (kind === undefined || effect.kind === kind)
    );
  };
export const isElementEffect =
  (kind?: (typeof elementEffectKinds)[number]) =>
    (effect: SkillEffect): effect is StackEffect => {
      return (
        effect.type === 'element' && (kind === undefined || effect.kind === kind)
      );
    };
export const isNotStackOrElement = (
  effect: SkillEffect,
): effect is Exclude<SkillEffect, StackEffect | ElementEffect> => {
  return effect.type !== 'stack' && effect.type !== 'element';
};

export type Skill = {
  readonly raw: { readonly name: string; readonly description: string };
  readonly effects: readonly SkillEffect[];
  readonly kinds?: readonly SkillKind[];
};

const ap = getApplicativeValidation(getSemigroup<MitamaError>());

function parseRange(
  num: string,
  path: CallPath = CallPath.empty,
): Validated<MitamaError, readonly [number, number]> {
  return pipe(
    separator(
      num.split('～').map(n => parseIntSafe(n, path.join('parseRange'))),
    ),
    either.flatMap(range =>
      match(range)
        .when(
          r => r.length === 1,
          () => right([range[0], range[0]] as const),
        )
        .when(
          r => r.length === 2,
          () => right([range[0], range[1]] as const),
        )
        .otherwise(() =>
          toValidated(anyhow(path, num, "given text doesn't match range")),
        ),
    ),
  );
}

const ATK_DAMAGE = /敵(.+)体に(通常|特殊)(.*ダメージ)を与え/;
const ATK_EFF =
  /(?:、自身の|、敵の|、)(.+?)[をの]((?:超特大|極大|特大|大|小)?(?:アップ|ダウン))/;

function parseDamage(
  description: string,
  path: CallPath = CallPath.empty,
): Validated<MitamaError, readonly SkillEffect[]> {
  const joined = () => path.join('parseDamage');

  const toType = (buff: string): Either<MitamaError, 'buff' | 'debuff'> => {
    if (buff.includes('アップ')) {
      return right('buff' as const);
    }
    if (buff.includes('ダウン')) {
      return right('debuff' as const);
    }
    return anyhow(
      joined(),
      buff,
      "given text doesn't include 'buff' or 'debuff'",
    );
  };

  const statChanges = (
    range: readonly [number, number],
    description: string,
  ): Option<Validated<MitamaError, SkillEffect[]>> =>
    pipe(
      fromNullable(
        description.match(
          /(?:、自身の|、敵の|、)(.+?)[をの]((?:超特大|極大|特大|大|小)?(?:アップ|ダウン))/g,
        ),
      ),
      option.map(
        (matches): Validated<MitamaError, SkillEffect[]> =>
          separator(
            matches.flatMap(eff =>
              pipe(
                fromNullable(eff.match(ATK_EFF)),
                option.map(([, status, amount]) =>
                  pipe(
                    Do,
                    bind('status', () =>
                      separator(
                        status.split('と').map(s => parseStatus(s, joined())),
                      ),
                    ),
                    either.flatMap(({ status }) =>
                      separator(
                        status.map(stat =>
                          sequenceS(ap)({
                            type: toValidated(toType(amount)),
                            amount: toValidated(parseAmount(amount, joined())),
                            status: right(stat),
                            range: right(range),
                          }),
                        ),
                      ),
                    ),
                  ),
                ),
                option.getOrElse(() =>
                  toValidated(
                    anyhow(joined(), eff, "given text doesn't match ATK_EFF"),
                  ),
                ),
              ),
            ),
          ),
      ),
    );

  return pipe(
    Do,
    bind('damage', () =>
      pipe(
        fromNullable(description.match(ATK_DAMAGE)),
        option.map(([, range, , damage]) =>
          sequenceS(ap)({
            type: right('damage' as const),
            range: parseRange(range, path),
            amount: toValidated(parseAmount(damage, path)),
          }),
        ),
        option.getOrElse(() =>
          toValidated(
            anyhow(path, description, "given text doesn't match ATK_DAMAGE"),
          ),
        ),
      ),
    ),
    either.flatMap(({ damage }) =>
      pipe(
        transposeArray([statChanges(damage.range, description)]),
        option.map(seq =>
          pipe(
            separator(seq),
            either.map(effects => [damage as SkillEffect, ...effects]),
          ),
        ),
        option.getOrElse(
          (): Validated<MitamaError, SkillEffect[]> => right([]),
        ),
      ),
    ),
  );
}

const STAT_UP_OR_DOWN =
  /(?:味方|敵)(.+?)体の(.+?)を((?:超特大|極大|特大|大|小)?(?:アップ|ダウン))(?:、(.+?)を((?:超特大|極大|特大|大|小)?(?:アップ|ダウン)))?させる/;

const parseStatChanges = (
  type: 'buff' | 'debuff',
  range: string,
  status: string,
  eff: string,
  path: CallPath,
) => {
  return pipe(
    pipe(
      status
        .split('と')
        .map(s => parseStatus(s, path.join('parseStatChanges'))),
      separator,
    ),
    either.flatMap(stats =>
      separator(
        stats.map(stat =>
          sequenceS(ap)({
            type: right(type),
            range: parseRange(range, path.join('parseStatChanges')),
            amount: toValidated(
              parseAmount(eff, path.join('parseStatChanges')),
            ),
            status: right(stat),
          }),
        ),
      ),
    ),
  );
};

function parseBuffAndDebuff(
  type: 'buff' | 'debuff',
  description: string,
  path: CallPath = CallPath.empty,
): Validated<MitamaError, SkillEffect[]> {
  const joined = () => path.join('parseBuff');

  return pipe(
    fromNullable(description.match(STAT_UP_OR_DOWN)),
    option.map(matches =>
      match(matches)
        .when(
          _ => /(?:アップ|ダウン)、/g.test(description),
          ([, range, s1, e1, s2, e2]) =>
            separator([
              parseStatChanges(type, range, s1, e1, joined()),
              parseStatChanges(type, range, s2, e2, joined()),
            ]),
        )
        .otherwise(([, range, status, eff]) =>
          parseStatChanges(type, range, status, eff, joined()),
        ),
    ),
    option.getOrElse(() =>
      toValidated(
        anyhow(
          joined(),
          description,
          "given text doesn't match STAT_UP_OR_DOWN",
        ),
      ),
    ),
  );
}

function parseBuff(
  description: string,
  path: CallPath = CallPath.empty,
): Validated<MitamaError, SkillEffect[]> {
  return parseBuffAndDebuff('buff', description, path.join('parseBuff'));
}

function parseDebuff(
  description: string,
  path: CallPath = CallPath.empty,
): Validated<MitamaError, SkillEffect[]> {
  return parseBuffAndDebuff('debuff', description, path.join('parseDebuff'));
}

const RECOVERY = /味方(.+)体のHPを(.*?回復)/;
const RECOVERY_BUFF = /(ATK.*?|Sp\.ATK.*?|DEF.*?|Sp\.DEF.*?)を(.*?アップ)/;

const parseRecoveryBuff = (
  range: readonly [number, number],
  description: string,
  path: CallPath = CallPath.empty,
) => {
  const joined = () => path.join('parseRecoveryBuff');
  return pipe(
    fromNullable(description.match(RECOVERY_BUFF)),
    option.map(([, status, up]) =>
      pipe(
        status.split('と').map(s => parseStatus(s, joined())),
        separator,
        either.flatMap(
          (statuses): Validated<MitamaError, SkillEffect[]> =>
            pipe(
              statuses.map(stat =>
                sequenceS(ap)({
                  type: right('buff' as const),
                  range: right(range),
                  amount: toValidated(parseAmount(up, joined())),
                  status: right(stat),
                }),
              ),
              separator,
            ),
        ),
      ),
    ),
    option.getOrElse((): Validated<MitamaError, SkillEffect[]> => right([])),
  );
};

const parseHeal = (description: string, path: CallPath = CallPath.empty) => {
  const joined = () => path.join('parseHeal');
  return pipe(
    fromNullable(description.match(RECOVERY)),
    option.map(([, range, heal]) =>
      pipe(
        Do,
        bind('range', () => parseRange(range, joined())),
        bind('buff', ({ range }) =>
          parseRecoveryBuff(range, description, joined()),
        ),
        bind(
          'recovery',
          ({ range }): Validated<MitamaError, SkillEffect> =>
            sequenceS(ap)({
              type: right('heal' as const),
              range: right(range),
              amount: toValidated(parseAmount(heal, joined())),
            }),
        ),
        either.map(({ recovery, buff }) => [recovery, ...buff]),
      ),
    ),
    option.getOrElse(() =>
      toValidated(
        anyhow(joined(), description, "given text doesn't match RECOVERY"),
      ),
    ),
  );
};

const STACK_TYPE = {
  meteor: /「次の攻撃時にダメージが(?<rate>\d+)%アップするスタック」/,
  barrier:
    /「次の被ダメージ時に被ダメージを(?<rate>\d+)%ダウンさせるスタック」/,
  eden: /「次の回復時に回復効果が(?<rate>\d+)%アップするスタック」/,
  anima:
    /「次の支援\/妨害時に支援\/妨害効果が(?<rate>\d+)%アップするスタック」/,
};
const NUMBER_OF_STACK = /を(?<numberOf>\d)回蓄積/;

const parseStackEffect =
  (types: readonly (keyof typeof STACK_TYPE)[]) =>
  (
    description: string,
    path: CallPath = CallPath.empty,
  ): Validated<MitamaError, SkillEffect[]> => {
    const joined = () => path.join('parseStackEffect');
    const err = (msg: string): MitamaError => ({
      path: joined().toString(),
      target: description,
      msg,
    });
    return pipe(
      types.map(type =>
        pipe(
          description.match(STACK_TYPE[type]),
          either.fromNullable(err(`given text doesn't match ${type}`)),
          either.flatMap(match =>
            sequenceS(ap)({
              kind: right(type),
              rate: toValidated(
                pipe(
                  match?.groups?.rate,
                  either.fromNullable(err('`groups.rate` does not exists')),
                  either.flatMap(rate => parseIntSafe(rate, joined())),
                ),
              ),
              times: toValidated(
                pipe(
                  description.match(NUMBER_OF_STACK),
                  either.fromNullable(
                    err(`given text doesn't match ${NUMBER_OF_STACK}`),
                  ),
                  either.flatMap(match =>
                    pipe(
                      match?.groups?.numberOf,
                      either.fromNullable(
                        err('`groups.numberOf` does not exists'),
                      ),
                      either.flatMap(numberOf =>
                        parseIntSafe(numberOf, joined()),
                      ),
                    ),
                  ),
                ),
              ),
            }),
          ),
        ),
      ),
      separator,
      either.map(effects =>
        effects.map(eff => ({
          type: 'stack',
          ...eff,
        })),
      ),
    );
  };

function parseStack(
  { name, description }: { name: string; description: string },
  path: CallPath = CallPath.empty,
): Validated<MitamaError, SkillEffect[]> {
  const branch = (when: string) => path.join(`parseStack[${when}]`);
  return match(name)
    .when(
      name => name.includes('メテオ'),
      () => parseStackEffect(['meteor'])(description, branch('meteor')),
    )
    .when(
      name => name.includes('バリア'),
      () => parseStackEffect(['barrier'])(description, branch('barrier')),
    )
    .when(
      name => name.includes('エデン'),
      () => parseStackEffect(['eden'])(description, branch('eden')),
    )
    .when(
      name => name.includes('アニマ'),
      () => parseStackEffect(['anima'])(description, branch('anima')),
    )
    .when(
      name => name.includes('コメット'),
      () =>
        parseStackEffect(['meteor', 'barrier'])(description, branch('comet')),
    )
    .when(
      name => name.includes('エーテル'),
      () => parseStackEffect(['anima', 'meteor'])(description, branch('ether')),
    )
    .when(
      name => name.includes('ルミナス'),
      () =>
        parseStackEffect(['anima', 'barrier'])(description, branch('luminous')),
    )
    .otherwise(() => right([]));
}

const RESONANCE_EFFECT = /\[([火水風])響]/;

function parseElementEffect(
  { name }: { name: string; description: string },
  path: CallPath = CallPath.empty,
): Validated<MitamaError, SkillEffect[]>
{
  const parseResonanceType = (name: string): Either<MitamaError, ElementEffect['kind']> => {
    if (name.includes('ミニマ')) {
      return right('minima' as const);
    }
    if (name.includes('スプレッド')) {
      return right('spread' as const);
    }
    if (name.includes('エンハンス')) {
      return right('enhance' as const);
    }
    return anyhow(path.join('parseElementEffect.parseResonanceType'), name, "given text doesn't match resonance type");
  }

  return pipe(
    fromNullable(name.match(RESONANCE_EFFECT)),
    option.map(([, element]): Validated<MitamaError, SkillEffect[]> =>
      pipe(
        Do,
        bind('eff', () => sequenceS(ap)({
          type: right('element' as const),
          element: toValidated(parseElement(element, path.join('parseElementEffect'))),
          kind: toValidated(parseResonanceType(name)),
        })),
        either.map(({ eff }) => [eff]),
      )
    ),
    option.getOrElse((): Validated<MitamaError, SkillEffect[]> => right([])),
  );
}

const parseKinds = (name: string): Option<readonly SkillKind[]> => {
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

  const counter = match<string, Option<SkillKind>>(name)
    .when(
      name => name.includes('カウンター'),
      () => option.of('counter'),
    )
    .when(
      name => name.includes('Sカウンター'),
      () => option.of('s-counter'),
    )
    .otherwise(() => option.none);

  const charge = name.includes('チャージ')
    ? option.of('charge' as SkillKind)
    : option.none;
  const heal = name.includes('ヒール')
    ? option.of('heal' as SkillKind)
    : option.none;
  const recover = name.includes('リカバー')
    ? option.of('recover' as SkillKind)
    : option.none;

  return transposeArray([elemental, counter, charge, heal, recover]);
};

export const parseSkill = ({
  kind,
  skill,
}: {
  kind:
    | '通常単体'
    | '通常範囲'
    | '特殊単体'
    | '特殊範囲'
    | '支援'
    | '妨害'
    | '回復';
  skill: { name: string; description: string };
}): Validated<MitamaError, Skill> =>
  sequenceS(ap)({
    raw: right(skill),
    effects: pipe(
      match(kind)
        .with(P.union('通常単体', '通常範囲', '特殊単体', '特殊範囲'), () =>
          parseDamage(skill.description, new CallPath(['parseSkill'])),
        )
        .with('支援', () =>
          parseBuff(skill.description, new CallPath(['parseSkill'])),
        )
        .with('妨害', () =>
          parseDebuff(skill.description, new CallPath(['parseSkill'])),
        )
        .with('回復', () =>
          parseHeal(skill.description, new CallPath(['parseSkill'])),
        )
        .exhaustive(),
      either.flatMap(effects =>
        pipe(
          Do,
          either.bind("stack", () => parseStack(skill)),
          either.bind("resonance", () => parseElementEffect(skill)),
          either.map(({ stack, resonance }) => [...effects, ...stack, ...resonance]),
        ),
      ),
    ),
    kinds: right(
      option.getOrElse((): readonly SkillKind[] => [])(parseKinds(skill.name)),
    ),
  });
