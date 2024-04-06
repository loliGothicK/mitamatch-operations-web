import { z } from 'zod';

import costumeData from './costume.json';

const costumeSchema = z.object({
  id: z.number(),
  lily: z.string(),
  name: z.string(),
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

export type Costume = Omit<z.infer<typeof costumeSchema>, 'skills'> & {
  status: [number, number, number, number];
};

export const costumeList: Costume[] = costumeData.data.map((costume) => {
  costumeSchema.parse(costume);
  return {
    ...costume,
    status: skillsToStatus(costume.skills),
  };
});

function skillsToStatus(skills: string[]): [number, number, number, number] {
  const status = [0, 0, 0, 0] as [number, number, number, number];
  const regex = /(ATK|Sp\.ATK|DEF|Sp\.DEF)\+\d+/g;
  const stat = /(.+?)\+(\d+)/;
  skills
    .flatMap((skill) => skill.match(regex))
    .filter((skill) => skill !== null)
    .map((skill) => skill!.match(stat)!)
    .forEach(([, stat, value]) => {
      switch (stat) {
        case 'ATK':
          status[1] += parseInt(value);
          break;
        case 'Sp.ATK':
          status[3] += parseInt(value);
          break;
        case 'DEF':
          status[2] += parseInt(value);
          break;
        case 'Sp.DEF':
          status[0] += parseInt(value);
          break;
      }
    });
  return status;
}
