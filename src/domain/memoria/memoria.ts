import { z } from 'zod';

import memoriaData from './memoria.json';
import { parseSkill, type Skill } from '@/parser/skill';
import { parseAutoSkill, type AutoSkill } from '@/parser/autoSkill';
import { fromThrowable } from 'neverthrow';
import { getApplicativeValidation, isLeft, right } from 'fp-ts/Either';
import { getSemigroup } from 'fp-ts/Array';
import { fmtErr, type MitamaError } from '@/error/error';
import { sequenceS } from 'fp-ts/Apply';
import { type Legendary, parseLegendary } from '@/parser/legendary';
import { outdent } from 'outdent';
import { match } from 'ts-pattern';

const statusSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);
const skillSchema = z.object({
  name: z.string().readonly(),
  description: z.string().readonly(),
});

const memoriaSchema = z.object({
  id: z.number().readonly(),
  name: z.string().readonly(),
  cardType: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ])
    .transform(type =>
      match(type)
        .with(1, () => '通常単体' as const)
        .with(2, () => '通常範囲' as const)
        .with(3, () => '特殊単体' as const)
        .with(4, () => '特殊範囲' as const)
        .with(5, () => '支援' as const)
        .with(6, () => '妨害' as const)
        .with(7, () => '回復' as const)
        .exhaustive(),
    )
    .readonly(),
  attribute: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ])
    .transform(element =>
      match(element)
        .with(1, () => 'Fire' as const)
        .with(2, () => 'Water' as const)
        .with(3, () => 'Wind' as const)
        .with(4, () => 'Light' as const)
        .with(5, () => 'Dark' as const)
        .exhaustive(),
    )
    .readonly(),
  status: z
    .tuple([
      statusSchema,
      statusSchema,
      statusSchema,
      statusSchema,
      statusSchema,
    ])
    .readonly(),
  cost: z.number().readonly(),
  questSkill: skillSchema.readonly(),
  gvgSkill: skillSchema.readonly(),
  autoSkill: skillSchema.readonly(),
  labels: z
    .array(z.enum(['Legendary', 'Ultimate', 'SuperAwakening']))
    .readonly(),
  legendary_skill: z
    .tuple([skillSchema, skillSchema, skillSchema, skillSchema, skillSchema])
    .optional()
    .readonly(),
});

/**
 * This type alias `Memoria` represents a memoria object in the application.
 * It is inferred from the `memoriaSchema` which is a zod schema object.
 * The `memoriaSchema` defines the structure of a memoria object, which includes:
 * - id: a number representing the unique identifier of the memoria.
 * - link: a string representing the link associated with the memoria.
 * - name: a string representing the name of the memoria.
 * - full_name: a string representing the full name of the memoria.
 * - kind: an enum representing the kind of the memoria.
 * - element: an enum representing the element of the memoria.
 * - status: a tuple of five statusSchema objects representing the status of the memoria.
 * - cost: a number representing the cost of the memoria.
 * - skill: an object with 'name' and 'description' properties representing the skill of the memoria.
 * - support: an object with 'name' and 'description' properties representing the support of the memoria.
 * - legendary: an optional string representing the legendary status of the memoria.
 * - labels: an array of strings representing the labels of the memoria.
 */
type RawMemoria = z.infer<typeof memoriaSchema>;
export type Memoria = Omit<
  RawMemoria,
  'name' | 'questSkill' | 'gvgSkill' | 'autoSkill' | 'legendary_skill'
> & {
  name: {
    short: string;
    full: string;
  };
  skills: {
    questSkill: Skill;
    gvgSkill: Skill;
    autoSkill: AutoSkill;
    legendary?: Legendary;
  };
};
export type MemoriaId = Memoria['id'];
export type RawLegendarySkill = NonNullable<RawMemoria['legendary_skill']>;

export const memoriaList: Memoria[] = memoriaData.data.map(memoria => {
  const ap = getApplicativeValidation(getSemigroup<MitamaError>());
  const zodResult = fromThrowable(memoriaSchema.parse)(memoria);
  if (zodResult.isErr()) {
    throw new Error(outdent`
      Memoria parse failed with:
        source => ${memoria}
        error => ${zodResult.error}
    `);
  }
  const { questSkill, gvgSkill, autoSkill, legendary_skill, name, ...raw } =
    zodResult.value;
  const parseSkillsResult = sequenceS(ap)({
    questSkill: parseSkill({
      cardType: raw.cardType,
      skill: questSkill,
      memoriaName: name,
    }),
    gvgSkill: parseSkill({
      cardType: raw.cardType,
      skill: gvgSkill,
      memoriaName: name,
    }),
    autoSkill: parseAutoSkill({ memoriaName: name, autoSkill }),
    legendary: legendary_skill
      ? parseLegendary(legendary_skill, name)
      : right(undefined),
  });
  if (isLeft(parseSkillsResult)) {
    throw new Error(
      `Memoria skill or support skill parse failed: ${fmtErr(parseSkillsResult.left)}`,
    );
  }
  return {
    ...raw,
    skills: { ...parseSkillsResult.right },
    name: { short: name, full: name },
  };
});
