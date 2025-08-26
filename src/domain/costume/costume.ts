import type { OmitProperties } from 'ts-essentials';
import { z } from 'zod';

import costumeData from './costume.json';

const atomicAdxSchema = z.object({ name: z.string(), description: z.string() });
const adxSchema = z.tuple([atomicAdxSchema, atomicAdxSchema, atomicAdxSchema]);

const costumeSchema = z.object({
  id: z.number().readonly(),
  lily: z.string().readonly(),
  name: z.string().readonly(),
  type: z.string().readonly(),
  rare: z
    .object({
      name: z.string().readonly(),
      description: z.string().readonly(),
    })
    .readonly(),
  ex: z
    .object({
      up: z
        .object({
          name: z.string().readonly(),
          description: z.string().readonly(),
        })
        .readonly(),
      down: z
        .object({
          name: z.string().readonly(),
          description: z.string().readonly(),
        })
        .optional()
        .nullable()
        .readonly(),
    })
    .optional()
    .nullable()
    .readonly(),
  adx: z
    .tuple([adxSchema, adxSchema, adxSchema, adxSchema])
    .optional()
    .nullable()
    .readonly(),
  skills: z.array(z.string()).readonly(),
});

/**
 * This type alias `Costume` represents a costume object in the application.
 * It is inferred from the `costumeSchema` which is a zod schema object, with the 'skills' property omitted.
 * The `costumeSchema` defines the structure of a costume object, which includes:
 * - id: a number representing the unique identifier of the costume.
 * - lily: a string representing the lily associated with the costume.
 * - name: a string representing the name of the costume.
 * - type: a string representing the type of the costume.
 * - rare: an object with 'name' and 'description' properties representing the rarity of the costume.
 * - ex: an optional object with 'name' and 'description' properties representing the extra information of the costume.
 * - status: a tuple of four numbers representing the status of the costume ([Atk, Sp.ATK, DEF, Sp.DEF]).
 */
export type Costume = OmitProperties<
  z.infer<typeof costumeSchema>,
  'skills'
> & {
  readonly status: readonly [number, number, number, number];
};

export const costumeList: Costume[] = costumeData.data.map(costume => {
  const parsed = costumeSchema.parse(costume);
  return {
    ...parsed,
    status: skillsToStatus(parsed.skills),
  };
});

function skillsToStatus(
  skills: readonly string[],
): readonly [number, number, number, number] {
  const status = [0, 0, 0, 0] as [number, number, number, number];
  const regex = /(ATK|Sp\.ATK|DEF|Sp\.DEF)\+\d+/g;
  const statRegex = /^(.+)\+(\d+)$/;

  for (const [, stat, value] of skills
    .filter(skill => skill.startsWith('固有'))
    .flatMap(skill => {
      const match = skill.match(regex);
      return match === null ? [] : match;
    })
    // biome-ignore lint/style/noNonNullAssertion: should be fine
    .map(skill => skill.match(statRegex)!)) {
    switch (stat) {
      case 'ATK': {
        status[0] += Number.parseInt(value, 10);
        break;
      }
      case 'Sp.ATK': {
        status[1] += Number.parseInt(value, 10);
        break;
      }
      case 'DEF': {
        status[2] += Number.parseInt(value, 10);
        break;
      }
      case 'Sp.DEF': {
        status[3] += Number.parseInt(value, 10);
        break;
      }
      default:
        break;
    }
  }
  return status;
}
