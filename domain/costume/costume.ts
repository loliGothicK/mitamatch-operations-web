import type { OmitProperties } from 'ts-essentials';
import { z } from 'zod';

import costumeData from './costume.json';

const costumeSchema = z.object({
  id: z.number(),
  lily: z.string(),
  name: z.string(),
  type: z.string(),
  rare: z.object({
    name: z.string(),
    description: z.string(),
  }),
  ex: z
    .object({
      name: z.string(),
      description: z.string(),
    })
    .optional()
    .nullable(),
  skills: z.array(z.string()),
});

export type Costume = OmitProperties<
  z.infer<typeof costumeSchema>,
  'skills'
> & {
  status: [number, number, number, number];
};

export const costumeList: Costume[] = costumeData.data.map(costume => {
  costumeSchema.parse(costume);
  return {
    ...costume,
    status: skillsToStatus(costume.skills),
  };
});

function skillsToStatus(skills: string[]): [number, number, number, number] {
  const status = [0, 0, 0, 0] as [number, number, number, number];
  const regex = /(ATK|Sp\.ATK|DEF|Sp\.DEF)\+\d+/g;
  const statRegex = /^(.+)\+(\d+)$/;

  for (const [, stat, value] of skills
    .flatMap(skill => {
      const match = skill.match(regex);
      return match === null ? [] : match;
    })
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    .map(skill => skill.match(statRegex)!)) {
    switch (stat) {
      case 'ATK': {
        status[0] += Number.parseInt(value);
        break;
      }
      case 'Sp.ATK': {
        status[1] += Number.parseInt(value);
        break;
      }
      case 'DEF': {
        status[2] += Number.parseInt(value);
        break;
      }
      case 'Sp.DEF': {
        status[3] += Number.parseInt(value);
        break;
      }
    }
  }
  return status;
}
