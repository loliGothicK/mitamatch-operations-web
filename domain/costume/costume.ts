import { z } from 'zod';

import costumeData from './costume.json';

export const costumeSchema = z.object({
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

export type Costume = z.infer<typeof costumeSchema>;

export const costumeList = costumeData.data.map((costume) =>
  costumeSchema.parse(costume),
);
