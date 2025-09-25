import { z } from 'zod';

import memoriaData from './memoria.json';
import { parseSkill, type Skill } from '@/parser/skill';
import { parseSupport, type Support } from '@/parser/support';
import { fromThrowable } from 'neverthrow';
import { getApplicativeValidation, isLeft, right } from 'fp-ts/Either';
import { getSemigroup } from 'fp-ts/Array';
import { fmtErr, type MitamaError } from '@/error/error';
import { sequenceS } from 'fp-ts/Apply';
import { type Legendary, parseLegendary } from '@/parser/legendary';
import { outdent } from 'outdent';
import { match } from 'ts-pattern';

const statusSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

const memoriaSchema = z.object({
  id: z.number().readonly(),
  link: z.string().readonly(),
  name: z.string().readonly(),
  full_name: z.string().readonly(),
  kind: z
    .enum([
      '通常単体',
      '通常範囲',
      '特殊単体',
      '特殊範囲',
      '支援',
      '妨害',
      '回復',
    ])
    .readonly(),
  element: z
    .enum(['火', '水', '風', '光', '闇'])
    .transform(element =>
      match(element)
        .with('火', () => 'Fire' as const)
        .with('水', () => 'Water' as const)
        .with('風', () => 'Wind' as const)
        .with('光', () => 'Light' as const)
        .with('闇', () => 'Dark' as const)
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
  skill: z
    .object({
      name: z.string().readonly(),
      description: z.string().readonly(),
    })
    .readonly(),
  support: z
    .object({
      name: z.string().readonly(),
      description: z.string().readonly(),
    })
    .readonly(),
  legendary_skill: z
    .object({
      name: z.string().readonly(),
      description: z
        .tuple([z.string(), z.string(), z.string(), z.string(), z.string()])
        .readonly(),
    })
    .optional()
    .readonly(),
  labels: z.array(z.enum(['legendary', 'ultimate'])).readonly(),
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
  'name' | 'full_name' | 'link' | 'skill' | 'support' | 'legendary_skill'
> & {
  name: {
    link: string;
    short: string;
    full: string;
  };
  skills: {
    skill: Skill;
    support: Support;
    legendary?: Legendary;
  };
};
export type MemoriaId = Memoria['id'];

export const isLegendary = (memoria: Memoria): boolean =>
  memoria.labels.includes('legendary');

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
  const { skill, support, legendary_skill, name, full_name, link, ...raw } =
    zodResult.value;
  const parseSkillsResult = sequenceS(ap)({
    skill: parseSkill({ kind: raw.kind, skill, name: full_name }),
    support: parseSupport(support),
    legendary: legendary_skill
      ? parseLegendary(legendary_skill)
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
    name: { link, short: name, full: full_name },
  };
});
